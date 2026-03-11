const express = require("express");

const submissionsRoutes = require("./routes/Submissions.js");

const app = express();

app.use(express.json());

//attach route files
app.use("/submissions", submissionsRoutes);

app.listen(3000, () => {
  console.log("Epstein's server running on port 3000");
});

