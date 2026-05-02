import pool from '../config/db.js'

async function fetchAllSubmissions() {
  try {
    const result = await pool.query`SELECT * FROM Analysis_Submissions`;
    return result.recordset;
  }
  catch (err) {
    console.log("Failed to fetch Submissions: ", err);
    return [];
  }
}

async function fetchUserSubmissions(userId) {
  try {
    const result = await pool.query`SELECT * FROM Analysis_Submissions WHERE author_id = ${userId}`;
    return result.recordset;
  }
  catch (err) {
    console.log("Failed to fetch user submissions: ", err);
    return [];
  }
}

async function fetchUserStats(userId) {
  try {
    // Get total submissions count
    const totalResult = await pool.query`SELECT COUNT(*) AS total FROM Analysis_Submissions WHERE author_id = ${userId}`;

    // Get completed submissions count
    const completedResult = await pool.query`SELECT COUNT(*) AS completed FROM Analysis_Submissions WHERE author_id = ${userId} AND status = 'Published'`;

    // Get pending submissions count
    const pendingResult = await pool.query`SELECT COUNT(*) AS pending FROM Analysis_Submissions WHERE author_id = ${userId} AND status IN ('Draft', 'Pending')`;

    return {
      total_submissions: totalResult.recordset[0]?.total || 0,
      published_submissions: completedResult.recordset[0]?.completed || 0,
      pending_submissions: pendingResult.recordset[0]?.pending || 0
    };
  }
  catch (err) {
    console.log("Failed to fetch user stats: ", err);
    return { total_submissions: 0, published_submissions: 0, pending_submissions: 0 };
  }
}

export const getAllSubmissions = async (req, res) => {
  try {
    const data = await fetchAllSubmissions();
    console.log("All submissions fetched:", data.length);
    res.json(data);
  }
  catch (err) {
    console.log("Failed to get Submissions: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = await fetchUserSubmissions(userId);
    console.log(`Submissions fetched for user ${userId}:`, data.length);
    res.json(data);
  }
  catch (err) {
    console.log("Failed to get user Submissions: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await fetchUserStats(userId);
    res.json(stats);
  }
  catch (err) {
    console.log("Failed to get user stats: ", err);
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


