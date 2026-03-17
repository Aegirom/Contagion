import pool from '../config/db.js'

async function fetchSubmissions(userId) {
  try {
    const result = await pool.query`SELECT * FROM Analysis_Submissions`;
    return result.recordset;
  }
  catch (err) {
    console.log("Failed to fetch Submissions: ", err);
    return 0;
  }
}

export const getAllSubmissions = async (req, res) => {
  try {
    const userId = 0;
    const data = await fetchSubmissions(userId);
    console.log(data);
    res.json([{ id: 1, name: "Example submission" }]);
  }
  catch (err) {
    console.log("Failed to get Submissions: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const postSubmission = async (req, res) => {
  try {
    console.log(req.body);
    const { author_id, artifact_id, title, content, status, version, template_type } = req.body;

    if (!author_id || !title || !content) {
      return res.status(400).json({ error: "Required fields missing" })
    }

    try {
      await pool.query`
      INSERT INTO Analysis_Submissions(author_id, artifact_id, title, content, status, version, template_type)
      VALUES (${author_id}, ${artifact_id}, ${title}, ${content}, ${status}, ${version}, ${template_type})
      `;
      res.status(201).json({ message: "Submission Created" });
    }
    catch (dbErr) {
      console.error("Failed to post submission: ", dbErr);
      res.status(500).json({ error: "DB constraint violated" });
    }

  }
  catch (err) {
    console.log("Failed to post submission:", err);
    res.status(400).json({ error: "Bad Request" });
  }
}


