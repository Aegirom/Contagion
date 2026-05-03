import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import submissionsRoutes from "./routes/Submissions.js";
import leaderboardRoutes from "./routes/Leaderboard.js";
import authRoutes from "./routes/Auth.js";
import dashboardRoutes from "./routes/Dashboard.js";
import sandboxRoutes from "./routes/Sandbox.js";
import artifactRoutes from "./routes/Artifacts.js";
import postsRoutes from "./routes/Posts.js";
import notificationRoutes from "./routes/Notifications.js";
import path from "path";
import { fileURLToPath } from "url";
import { protect } from "./routes/Auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
  max: 100,
  skip: (req) => {
    if (req.path.startsWith("/auth")) return true;
    if (req.path.startsWith("/notifications")) return true;
    return false;
  },
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

app.use("/auth", authLimiter);

//attach route files
app.use("/submissions", submissionsRoutes);
app.use("/auth", authRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/sandbox", sandboxRoutes);
app.use("/artifacts", artifactRoutes);
app.use("/posts", postsRoutes);
app.use("/notifications", notificationRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
