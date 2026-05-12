import pool from "../config/db.js";
import { convertR2ToHttpUrl } from "../services/r2Service.js";

async function retrieveLeaderboard() {
  const result = await pool.query`
    SELECT TOP 10
      u.username,
      u.role,
      u.reputation_score,
      p.avatar_url
    FROM Users u
    LEFT JOIN User_Profiles p ON u.user_id = p.user_id
    WHERE u.is_active = 1
    ORDER BY u.reputation_score DESC;
  `;
  return result.recordset.map((user) => ({
    ...user,
    avatar_url: convertR2ToHttpUrl(user.avatar_url),
  }));
}

async function retrieveUserPosition(userId) {
  const result = await pool.query`
    SELECT 
      u.username,
      u.role,
      u.reputation_score,
      p.avatar_url,
      DENSE_RANK() OVER (ORDER BY u.reputation_score DESC) AS position
    FROM Users u
    LEFT JOIN User_Profiles p ON u.user_id = p.user_id
    WHERE u.user_id = ${userId} AND u.is_active = 1
  `;
  const row = result.recordset[0] ?? null;
  if (row) {
    row.avatar_url = convertR2ToHttpUrl(row.avatar_url);
  }
  return row;
}

function validateInput(input) {
  const validTimeSpan = ["all-time", "monthly", "weekly"];
  return validTimeSpan.includes(input) ? 1 : 0;
}

export const getLeaderboard = async (req, res) => {
  try {
    const result = await retrieveLeaderboard();
    console.log(result);
    res.status(200).json(result);
  } catch (err) {
    console.error("Unable to retrieve leaderboard: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMyLeaderboardPosition = async (req, res) => {
  try {
    const userId = req.user?.userId;
    console.log("userId: ", userId);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const row = await retrieveUserPosition(userId);
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(row);
  } catch (err) {
    console.error("Unable to retrieve user position: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
