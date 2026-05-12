import pool from "../config/db.js";
import sql from "mssql";
import {
  get as cacheGet,
  set as cacheSet,
  TTL,
} from "../services/cacheService.js";

// Get user's activity feed
export const getActivityFeed = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cacheKey = `dashboard:activity:${userId}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    // Get user's recent submissions and specializations in parallel
    const [submissionsResult, specializationsResult] = await Promise.all([
      pool.request().input("user_id", sql.INT, userId).query(`
          SELECT TOP 5
            s.submission_id,
            s.title,
            s.status,
            s.submitted_at,
            s.template_type
          FROM Analysis_Submissions s
          WHERE s.author_id = @user_id
            AND s.status <> 'Archived'
          ORDER BY s.submitted_at DESC
        `),
      pool.request().input("user_id", sql.INT, userId).query(`
          SELECT s.name AS specialization, GETDATE() AS assigned_at
          FROM User_Specializations us
          JOIN Specializations s ON us.specialization_id = s.specialization_id
          WHERE us.user_id = @user_id
        `),
    ]);

    // Build activity items, keeping raw date for sorting
    const activityItems = [];

    submissionsResult.recordset.forEach((sub) => {
      const rawDate = new Date(sub.submitted_at);
      activityItems.push({
        type: "submission",
        msg: `Analysis completed: ${sub.title || "Untitled"}`,
        time: rawDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        _rawDate: rawDate,
        color: "#22C55E",
        data: sub,
      });
    });

    specializationsResult.recordset.forEach((spec) => {
      const rawDate = new Date(spec.assigned_at);
      activityItems.push({
        type: "badge",
        msg: `Earned: ${spec.specialization}`,
        time: rawDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        _rawDate: rawDate,
        color: "#F59E0B",
        data: spec,
      });
    });

    // Sort by raw date (most recent first), then strip the internal field
    activityItems.sort((a, b) => b._rawDate - a._rawDate);
    const items = activityItems
      .slice(0, 8)
      .map(({ _rawDate, ...item }) => item);

    // If no activity, return placeholder items
    if (items.length === 0) {
      items.push(
        {
          type: "placeholder",
          msg: "No submissions yet",
          time: "Join now",
          color: "#475569",
        },
        {
          type: "placeholder",
          msg: "No reviews completed",
          time: "Start reviewing",
          color: "#475569",
        },
        {
          type: "placeholder",
          msg: "No badges earned",
          time: "Achieve milestones",
          color: "#475569",
        },
      );
    }

    const response = { items };
    cacheSet(cacheKey, response, TTL.ACTIVITY_FEED);
    res.json(response);
  } catch (error) {
    console.error("Get activity feed error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get user's reputation and rank info
export const getAnalystReputation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cacheKey = `dashboard:reputation:${userId}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const [userResult, rankResult, specsResult] = await Promise.all([
      pool.request().input("user_id", sql.INT, userId).query(`
          SELECT
            u.reputation_score,
            u.expertise_level,
            u.role,
            u.created_at,
            (SELECT COUNT(*) FROM Analysis_Submissions s WHERE s.author_id = @user_id AND s.status <> 'Archived') AS total_submissions,
            (SELECT COUNT(*) FROM Analysis_Submissions s WHERE s.author_id = @user_id AND s.status = 'Published') AS published_submissions
          FROM Users u
          WHERE u.user_id = @user_id
        `),
      pool.request().input("user_id", sql.INT, userId).query(`
          SELECT COUNT(*) + 1 AS rank
          FROM Users
          WHERE reputation_score > (SELECT reputation_score FROM Users WHERE user_id = @user_id)
            AND is_active = 1
        `),
      pool.request().input("user_id", sql.INT, userId).query(`
          SELECT s.name
          FROM Specializations s
          JOIN User_Specializations us ON s.specialization_id = us.specialization_id
          WHERE us.user_id = @user_id
        `),
    ]);

    const userStats = userResult.recordset[0] || null;

    if (!userStats) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentScore = userStats.reputation_score || 0;
    const rank = rankResult.recordset[0]?.rank || 1;

    // Calculate XP needed for next rank (500 XP per rank level)
    const rankLevel = Math.floor(currentScore / 500);
    const nextRankScore = (rankLevel + 1) * 500;
    const xpUntilNextRank = Math.max(0, nextRankScore - currentScore);
    const progressPercent = Math.min(
      100,
      Math.round(((currentScore % 500) / 500) * 100),
    );

    const badges = specsResult.recordset.map((s) => s.name);

    // Default badges if none
    if (badges.length === 0) {
      badges.push("Beginner Analyst", "New Member", "Learning");
    }

    const response = {
      reputation_score: currentScore,
      total_submissions: userStats.total_submissions || 0,
      published_submissions: userStats.published_submissions || 0,
      expertise_level: userStats.expertise_level || "Beginner",
      rank,
      rank_level: rankLevel,
      xp_until_next_rank: xpUntilNextRank,
      progress_percent: progressPercent,
      badges: badges.slice(0, 5),
    };

    cacheSet(cacheKey, response, TTL.ANALYST_REPUTATION);
    res.json(response);
  } catch (error) {
    console.error("Get analyst reputation error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
