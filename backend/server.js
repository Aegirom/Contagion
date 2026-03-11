import express from "express";
import submissionsRoutes from "./routes/Submissions.js";

const app = express();

app.use(express.json());

//attach route files
app.use("/submissions", submissionsRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

