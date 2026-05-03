import pool from '../config/db.js';
import sql from 'mssql';

// Get user's activity feed
export const getActivityFeed = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's recent submissions
    const submissionsResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
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
      `);

    // Get user's recent badges/achievements (from specializations)
    const specializationsResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT s.name as specialization, GETDATE() AS assigned_at
        FROM User_Specializations us
        JOIN Specializations s ON us.specialization_id = s.specialization_id
        WHERE us.user_id = @user_id
      `);

    // Format activity items
    const activityItems = [];

    // Add submissions to activity
    submissionsResult.recordset.forEach(sub => {
      activityItems.push({
        type: 'submission',
        msg: `Analysis completed: ${sub.title || 'Untitled'}`,
        time: new Date(sub.submitted_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        color: '#22C55E',
        data: sub
      });
    });

    // Add specializations to activity
    specializationsResult.recordset.forEach(spec => {
      activityItems.push({
        type: 'badge',
        msg: `Earned: ${spec.specialization}`,
        time: new Date(spec.assigned_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        color: '#F59E0B',
        data: spec
      });
    });

    // Sort by time (most recent first) and limit to 8 items
    activityItems.sort((a, b) => new Date(b.time) - new Date(a.time));
    const items = activityItems.slice(0, 8);

    // If no activity, return placeholder items
    if (items.length === 0) {
      items.push(
        { type: 'placeholder', msg: 'No submissions yet', time: 'Join now', color: '#475569' },
        { type: 'placeholder', msg: 'No reviews completed', time: 'Start reviewing', color: '#475569' },
        { type: 'placeholder', msg: 'No badges earned', time: 'Achieve milestones', color: '#475569' }
      );
    }

    res.json({ items });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's reputation and rank info
export const getAnalystReputation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's current stats
    const userResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT
          u.reputation_score,
          u.expertise_level,
          u.role,
          u.created_at,
          COUNT(s.submission_id) as total_submissions,
          COUNT(CASE WHEN s.status = 'Published' THEN 1 END) as published_submissions
        FROM Users u
        LEFT JOIN Analysis_Submissions s ON u.user_id = s.author_id AND s.status <> 'Archived'
        WHERE u.user_id = @user_id
        GROUP BY u.reputation_score, u.expertise_level, u.role, u.created_at
      `);

    const userStats = userResult.recordset[0] || null;

    if (!userStats) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get actual rank among all active users
    const rankResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT COUNT(*) + 1 AS rank
        FROM Users
        WHERE reputation_score > (SELECT reputation_score FROM Users WHERE user_id = @user_id)
          AND is_active = 1
      `);

    const currentScore = userStats.reputation_score || 0;
    const rank = rankResult.recordset[0]?.rank || 1;

    // Calculate XP needed for next rank (500 XP per rank level)
    const rankLevel = Math.floor(currentScore / 500);
    const nextRankScore = (rankLevel + 1) * 500;
    const xpUntilNextRank = Math.max(0, nextRankScore - currentScore);
    const progressPercent = Math.min(100, Math.round(((currentScore % 500) / 500) * 100));

    // Get user's specializations as badges
    const specsResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT s.name
        FROM Specializations s
        JOIN User_Specializations us ON s.specialization_id = us.specialization_id
        WHERE us.user_id = @user_id
      `);

    const badges = specsResult.recordset.map(s => s.name);

    // Default badges if none
    if (badges.length === 0) {
      badges.push('Beginner Analyst', 'New Member', 'Learning');
    }

    res.json({
      reputation_score: currentScore,
      total_submissions: userStats.total_submissions || 0,
      published_submissions: userStats.published_submissions || 0,
      expertise_level: userStats.expertise_level || 'Beginner',
      rank,
      rank_level: rankLevel,
      xp_until_next_rank: xpUntilNextRank,
      progress_percent: progressPercent,
      badges: badges.slice(0, 5)
    });
  } catch (error) {
    console.error('Get analyst reputation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
