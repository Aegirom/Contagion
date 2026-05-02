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
          t.type_name as template_type
        FROM Submissions s
        LEFT JOIN Templates t ON s.template_id = t.template_id
        WHERE s.user_id = @user_id
        ORDER BY s.submitted_at DESC
      `);

    // Get user's recent reviews
    const reviewsResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT TOP 5
          r.review_id,
          r.score,
          r.comments,
          r.created_at,
          s.title as submission_title
        FROM Reviews r
        LEFT JOIN Submissions s ON r.submission_id = s.submission_id
        WHERE r.user_id = @user_id
        ORDER BY r.created_at DESC
      `);

    // Get user's recent badges/achievements (from specializations)
    const specializationsResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT s.name as specialization, us.assigned_at
        FROM User_Specializations us
        JOIN Specializations s ON us.specialization_id = s.specialization_id
        WHERE us.user_id = @user_id
        ORDER BY us.assigned_at DESC
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

    // Add reviews to activity
    reviewsResult.recordset.forEach(review => {
      activityItems.push({
        type: 'review',
        msg: `Review completed: ${review.submission_title || 'Submission'}`,
        time: new Date(review.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        color: '#8B5CF6',
        data: review
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
        LEFT JOIN Submissions s ON u.user_id = s.user_id
        WHERE u.user_id = @user_id
        GROUP BY u.reputation_score, u.expertise_level, u.role, u.created_at
      `);

    const userStats = userResult.recordset[0] || null;

    if (!userStats) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get rank among all users (simplified - just based on reputation)
    const rankResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .input('reputation_score', sql.INT, userStats.reputation_score || 0)
      .query(`
        SELECT
          COUNT(*) + 1 as rank,
          (SELECT reputation_score FROM Users WHERE reputation_score > @reputation_score) as next_rank_score
        FROM Users
        WHERE reputation_score > @reputation_score
      `);

    // Calculate XP needed for next rank (placeholder logic)
    const currentScore = userStats.reputation_score || 0;
    const nextRankScore = currentScore + 500; // Simple linear scaling
    const xpUntilNextRank = Math.max(0, nextRankScore - currentScore);
    const progressPercent = Math.min(100, Math.round((currentScore / nextRankScore) * 100));

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
      rank: 42, // Simplified - in production would use the actual rank
      xp_until_next_rank: xpUntilNextRank,
      progress_percent: progressPercent,
      badges: badges.slice(0, 5)
    });
  } catch (error) {
    console.error('Get analyst reputation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's quick actions menu
export const getQuickActions = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Return available actions based on user status
    res.json([
      { label: 'Submit Analysis', action: 'submit', icon: 'upload', enabled: true },
      { label: 'View Leaderboard', action: 'leaderboard', icon: 'star', enabled: true },
      { label: 'Pending Reviews', action: 'reviews', icon: 'clock', enabled: true },
      { label: 'Export Data', action: 'export', icon: 'download', enabled: true }
    ]);
  } catch (error) {
    console.error('Get quick actions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
