import pool from '../config/db.js';

async function retrieveLeaderboard() {
  const result = await pool.query`
  SELECT TOP 10 u.username, u.reputation_score, p.avatar_url
  FROM USERS u
  JOIN USER_PROFILES p
  ON u.user_id = p.user_id
  ORDER BY u.reputation_score DESC;
  `;

  return result.recordset;
}

function validateInput(input) {
  const validTimeSpan = ["all-time", "monthly", "weekly"];
  if (validTimeSpan.includes(input)) {
    return 1; //true if valid
  }
  return 0; //false if invalid
}

export const getLeaderboard = async (req, res) => {
  try {
    // if (!validateInput(req.body.timeSpan)) {
    //   res.status(400).json({ error: "Bad Request" });
    // }
    //at this point the incoming request is cleansed
    const result = await retrieveLeaderboard();
    console.log(result);
    res.status(200).json(result);
  }
  catch (err) {
    console.error("Unable to retrieve leaderboard: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
