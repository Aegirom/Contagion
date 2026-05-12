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
      (SELECT COUNT(*) + 1 FROM Users WHERE reputation_score > u.reputation_score AND is_active = 1) AS position
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

export const getLeaderboard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id;

    const [leaderboard, position] = await Promise.all([
      retrieveLeaderboard(),
      userId ? retrieveUserPosition(userId) : Promise.resolve(null),
    ]);

    res.status(200).json({ leaderboard, position });
  } catch (err) {
    console.error("Unable to retrieve leaderboard: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMyLeaderboardPosition = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const position = await retrieveUserPosition(userId);
    res.status(200).json({ position });
  } catch (err) {
    console.error("Unable to retrieve user position: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
