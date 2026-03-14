import express from "express";
import cors from "cors";
import submissionsRoutes from "./routes/Submissions.js";
import  authRoutes  from "./routes/Auth.js";
const app = express();

app.use(cors());
app.use(express.json());

//attach route files
app.use("/submissions", submissionsRoutes);
app.use("/auth", authRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

