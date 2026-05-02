import pool from '../config/db.js';

async function retrieveLeaderboard() {
  const result = await pool.query`
    SELECT TOP 10
      u.username,
      u.reputation_score,
      p.avatar_url
    FROM Users u
    JOIN User_Profiles p ON u.user_id = p.user_id
    ORDER BY u.reputation_score DESC;
  `;
  return result.recordset;
}

async function retrieveUserPosition(userId) {
  const result = await pool.query`
    SELECT
      u.username,
      u.reputation_score,
      p.avatar_url,
      (
        SELECT COUNT(*) + 1
        FROM Users u2
        WHERE u2.reputation_score > u.reputation_score
          AND u2.is_active = 1
      ) AS position
    FROM Users u
    JOIN User_Profiles p ON u.user_id = p.user_id
    WHERE u.user_id = ${userId}
      AND u.is_active = 1;
  `;
  return result.recordset[0] ?? null;
}

function validateInput(input) {
  const validTimeSpan = ["all-time", "monthly", "weekly"];
  return validTimeSpan.includes(input) ? 1 : 0;
}

export const getLeaderboard = async (req, res) => {
  try {
    // if (!validateInput(req.body.timeSpan)) {
    //   return res.status(400).json({ error: "Bad Request" });
    // }
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
    const userId = req.user?.id;
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
