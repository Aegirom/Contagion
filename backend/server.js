import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import submissionsRoutes from "./routes/Submissions.js";
import leaderboardRoutes from "./routes/Leaderboard.js";
import authRoutes from "./routes/Auth.js";
import dashboardRoutes from "./routes/Dashboard.js";
import sandboxRoutes from "./routes/Sandbox.js";
import artifactRoutes from "./routes/Artifacts.js";
import postsRoutes from "./routes/Posts.js";
import notificationRoutes from "./routes/Notifications.js";
import adminRoutes from "./routes/Admin.js";
import aiEvaluationRoutes from "./routes/AiEvaluation.js";
import path from "path";
import { fileURLToPath } from "url";
import { protect } from "./routes/Auth.js";
import { recreatePool } from "./config/db.js";
import logger from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection", { error: reason });
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { message: error.message, stack: error.stack });
  process.exit(1);
});

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
      frameSrc: ["https://challenges.cloudflare.com"],
      imgSrc: ["'self'", "https://*.r2.cloudflarestorage.com", "https://*.eu-north-1.r2.cloudflarestorage.com", "data:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
}));

// CORS with explicit options - must not use * with credentials
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));

// Serve uploaded avatars
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "public", "uploads")),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: (req) => {
    if (req.path.startsWith("/auth")) return true;
    if (req.path.startsWith("/notifications")) return true;
    if (req.path.startsWith("/sandbox")) return true;
    if (req.path.startsWith("/posts")) return true;
    if (req.method === "GET") return true;
    return false;
  },
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use("/auth", authLimiter);

// Per-route rate limiters (must be before route mounting)
const perRouteLimits = {
  sandboxEvaluate: rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many sandbox evaluations, please try again later' } }),
  postSubmission: rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: { error: 'Too many submissions, please try again later' } }),
  uploadArtifact: rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Too many uploads, please try again later' } }),
};

app.use('/sandbox/evaluate', perRouteLimits.sandboxEvaluate);
app.use('/submissions/post', perRouteLimits.postSubmission);
app.use('/artifacts/upload', perRouteLimits.uploadArtifact);

//attach route files
app.use("/submissions", submissionsRoutes);
app.use("/auth", authRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/sandbox", sandboxRoutes);
app.use("/artifacts", artifactRoutes);
app.use("/posts", postsRoutes);
app.use("/notifications", notificationRoutes);
app.use("/admin", adminRoutes);
app.use("/ai-evaluations", aiEvaluationRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
