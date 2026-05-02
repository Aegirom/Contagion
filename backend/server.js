import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import submissionsRoutes from "./routes/Submissions.js";
import leaderboardRoutes from "./routes/Leaderboard.js";
import authRoutes from "./routes/Auth.js";
import dashboardRoutes from "./routes/Dashboard.js";
import sandboxRoutes from "./routes/Sandbox.js";
import artifactRoutes from "./routes/Artifacts.js";
import path from "path";
import { fileURLToPath } from "url";
import { protect } from "./routes/Auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS with explicit options - must not use * with credentials
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));

// Proxy R2 images
app.get("/avatar/*key", async (req, res) => {
  try {
    const { createSignedR2DownloadUrl } =
      await import("./services/r2Service.js");
    const signedUrl = createSignedR2DownloadUrl({
      key: req.params.key,
      expiresSeconds: 300,
    });
    const response = await fetch(signedUrl);
    if (!response.ok) return res.status(response.status).end();
    res.set(
      "Content-Type",
      response.headers.get("content-type") || "image/jpeg",
    );
    res.set("Cache-Control", "public, max-age=300");
    response.body.pipe(res);
  } catch (err) {
    res.status(500).end();
  }
});
// Serve uploaded avatars
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

//attach route files
app.use("/submissions", submissionsRoutes);
app.use("/auth", authRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/sandbox", sandboxRoutes);
app.use("/artifacts", artifactRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
