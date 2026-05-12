import sql from 'mssql';
import pool from '../config/db.js';
import { awardApprovalXp } from '../services/reputationService.js';

export async function getAdminStats(req, res) {
  try {
    const totalUsers = await pool.request().query('SELECT COUNT(*) AS count FROM Users');
    const activeUsers = await pool.request().query("SELECT COUNT(*) AS count FROM Users WHERE is_active = 1");
    const suspendedUsers = await pool.request().query("SELECT COUNT(*) AS count FROM Users WHERE is_active = 0");
    const totalSubmissions = await pool.request().query("SELECT COUNT(*) AS count FROM Analysis_Submissions");
    const publishedSubmissions = await pool.request().query("SELECT COUNT(*) AS count FROM Analysis_Submissions WHERE status = 'Published'");
    const pendingSubmissions = await pool.request().query("SELECT COUNT(*) AS count FROM Analysis_Submissions WHERE status = 'Pending'");
    const totalComments = await pool.request().query('SELECT COUNT(*) AS count FROM Post_Comments');
    const totalArtifacts = await pool.request().query('SELECT COUNT(*) AS count FROM Malware_Artifacts');

    res.json({
      total_users: totalUsers.recordset[0].count,
      active_users: activeUsers.recordset[0].count,
      suspended_users: suspendedUsers.recordset[0].count,
      total_submissions: totalSubmissions.recordset[0].count,
      published_submissions: publishedSubmissions.recordset[0].count,
      pending_submissions: pendingSubmissions.recordset[0].count,
      total_comments: totalComments.recordset[0].count,
      total_artifacts: totalArtifacts.recordset[0].count,
    });
  } catch (err) {
    console.error('[Admin] getAdminStats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
}

export async function getAllUsers(req, res) {
  try {
    console.log('[Admin] Fetching all users...');
    const result = await pool.request().query(`
      SELECT 
        u.user_id, u.username, u.email, u.role, u.is_active, u.expertise_level,
        u.reputation_score, u.created_at, u.last_login,
        p.full_name, p.bio, p.avatar_url
      FROM Users u
      LEFT JOIN User_Profiles p ON p.user_id = u.user_id
      ORDER BY u.created_at DESC
    `);
    console.log(`[Admin] Fetched ${result.recordset.length} users`);
    res.json(result.recordset);
  } catch (err) {
    console.error('[Admin] getAllUsers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const validRoles = ['Analyst', 'Moderator', 'Administrator'];

    console.log(`[Admin] Updating role for user ${userId} to ${role}`);

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Analyst, Moderator, or Administrator' });
    }

    const result = await pool.request()
      .input('user_id', sql.INT, parseInt(userId))
      .input('role', sql.NVARCHAR(50), role)
      .query('UPDATE Users SET role = @role OUTPUT INSERTED.user_id, INSERTED.role, INSERTED.username WHERE user_id = @user_id');

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] Role updated: ${result.recordset[0].username} -> ${role}`);
    res.json({ message: 'Role updated', user: result.recordset[0] });
  } catch (err) {
    console.error('[Admin] updateUserRole error:', err.message);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

export async function suspendUser(req, res) {
  try {
    const { userId } = req.params;

    console.log(`[Admin] Suspending user ${userId}`);

    const result = await pool.request()
      .input('user_id', sql.INT, parseInt(userId))
      .query('UPDATE Users SET is_active = 0 OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.is_active WHERE user_id = @user_id');

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] User suspended: ${result.recordset[0].username}`);
    res.json({ message: 'User suspended', user: result.recordset[0] });
  } catch (err) {
    console.error('[Admin] suspendUser error:', err.message);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
}

export async function unsuspendUser(req, res) {
  try {
    const { userId } = req.params;

    console.log(`[Admin] Unsuspending user ${userId}`);

    const result = await pool.request()
      .input('user_id', sql.INT, parseInt(userId))
      .query('UPDATE Users SET is_active = 1 OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.is_active WHERE user_id = @user_id');

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] User unsuspended: ${result.recordset[0].username}`);
    res.json({ message: 'User unsuspended', user: result.recordset[0] });
  } catch (err) {
    console.error('[Admin] unsuspendUser error:', err.message);
    res.status(500).json({ error: 'Failed to unsuspend user' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    const uid = parseInt(userId);

    console.log(`[Admin] Deleting user ${uid}...`);

    const userCheck = await pool.request()
      .input('user_id', sql.INT, uid)
      .query('SELECT user_id, username FROM Users WHERE user_id = @user_id');

    if (!userCheck.recordset[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const username = userCheck.recordset[0].username;

    await pool.request().input('user_id', sql.INT, uid).query('DELETE FROM Notifications WHERE user_id = @user_id');
    await pool.request().input('user_id', sql.INT, uid).query('DELETE FROM User_Specializations WHERE user_id = @user_id');
    await pool.request().input('user_id', sql.INT, uid).query('DELETE FROM Post_Saves WHERE user_id = @user_id');
    await pool.request().input('user_id', sql.INT, uid).query('DELETE FROM Post_Shares WHERE user_id = @user_id');
    await pool.request().input('user_id', sql.INT, uid).query('DELETE FROM Post_Likes WHERE user_id = @user_id');
    await pool.request().input('user_id', sql.INT, uid).query('DELETE FROM Post_Comments WHERE user_id = @user_id');
    await pool.request().input('user_id', sql.INT, uid).query('DELETE FROM Peer_Reviews WHERE reviewer_id = @user_id');

    const deleted = await pool.request()
      .input('user_id', sql.INT, uid)
      .query('DELETE FROM Users WHERE user_id = @user_id OUTPUT DELETED.user_id, DELETED.username');

    if (!deleted.recordset[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] User deleted: ${username}`);
    res.json({ message: 'User and all associated data deleted', user: deleted.recordset[0] });
  } catch (err) {
    console.error('[Admin] deleteUser error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

export async function getPendingSubmissions(req, res) {
  try {
    const result = await pool.request().query(`
      SELECT 
        s.submission_id, s.title, s.status, s.template_type, s.submitted_at,
        u.user_id, u.username, u.email, u.role
      FROM Analysis_Submissions s
      INNER JOIN Users u ON u.user_id = s.author_id
      WHERE s.status = 'Pending'
      ORDER BY s.submitted_at ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('[Admin] getPendingSubmissions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending submissions' });
  }
}

export async function moderateSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be approve or reject' });
    }

    const newStatus = action === 'approve' ? 'Published' : 'Rejected';

    const result = await pool.request()
      .input('submission_id', sql.INT, parseInt(submissionId))
      .input('status', sql.NVARCHAR(20), newStatus)
      .query(`
        UPDATE Analysis_Submissions SET status = @status, updated_at = GETDATE()
        OUTPUT INSERTED.submission_id, INSERTED.status, INSERTED.title, INSERTED.author_id
        WHERE submission_id = @submission_id AND status = 'Pending'
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Submission not found or not pending' });
    }

    const { author_id, title } = result.recordset[0];

    if (action === 'approve') {
      await awardApprovalXp(author_id);
    }

    // Send notification to author
    const notifMessage = action === 'approve'
      ? `Your analysis "${title}" has been approved and published`
      : `Your analysis "${title}" has been rejected${reason ? `: ${reason}` : ''}`;

    await pool.request()
      .input('user_id', sql.INT, author_id)
      .input('type', sql.NVARCHAR(50), 'moderation')
      .input('message', sql.NVARCHAR(500), notifMessage)
      .input('actor_username', sql.NVARCHAR(100), req.user?.username || 'System')
      .input('related_submission_id', sql.INT, parseInt(submissionId))
      .query(`
        INSERT INTO Notifications (user_id, type, message, actor_username, related_submission_id, is_read)
        VALUES (@user_id, @type, @message, @actor_username, @related_submission_id, 0)
      `);

    console.log(`[Admin] Submission ${submissionId} ${action}d`);
    res.json({ message: `Submission ${action}d`, submission: result.recordset[0] });
  } catch (err) {
    console.error('[Admin] moderateSubmission error:', err.message);
    res.status(500).json({ error: 'Failed to moderate submission' });
  }
}

export async function forceDeleteSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const sid = parseInt(submissionId);

    console.log(`[Admin] Force deleting submission ${sid}...`);

    const subCheck = await pool.request()
      .input('submission_id', sql.INT, sid)
      .query('SELECT submission_id, title, author_id FROM Analysis_Submissions WHERE submission_id = @submission_id');

    if (!subCheck.recordset[0]) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    await pool.request().input('submission_id', sql.INT, sid).query('DELETE FROM Notifications WHERE related_submission_id = @submission_id');
    await pool.request().input('submission_id', sql.INT, sid).query('DELETE FROM Post_Saves WHERE submission_id = @submission_id');
    await pool.request().input('submission_id', sql.INT, sid).query('DELETE FROM Post_Shares WHERE submission_id = @submission_id');
    await pool.request().input('submission_id', sql.INT, sid).query('DELETE FROM Post_Likes WHERE submission_id = @submission_id');
    await pool.request().input('submission_id', sql.INT, sid).query('DELETE FROM Post_Comments WHERE submission_id = @submission_id');
    await pool.request().input('submission_id', sql.INT, sid).query('DELETE FROM Peer_Reviews WHERE submission_id = @submission_id');
    await pool.request().input('submission_id', sql.INT, sid).query('DELETE FROM AI_Evaluations WHERE submission_id = @submission_id');
    await pool.request().input('submission_id', sql.INT, sid).query('DELETE FROM Sandbox_Executions WHERE submission_id = @submission_id');

    const deleted = await pool.request()
      .input('submission_id', sql.INT, sid)
      .query('DELETE FROM Analysis_Submissions OUTPUT DELETED.submission_id, DELETED.title WHERE submission_id = @submission_id');

    console.log(`[Admin] Submission deleted: ${deleted.recordset[0]?.title}`);
    res.json({ message: 'Submission permanently deleted', submission: deleted.recordset[0] });
  } catch (err) {
    console.error('[Admin] forceDeleteSubmission error:', err.message);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
}

export async function getAllSubmissionsAdmin(req, res) {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        s.submission_id, s.title, s.status, s.template_type, s.submitted_at, s.updated_at,
        u.user_id, u.username, u.email, u.role,
        ISNULL(lc.like_count, 0) AS like_count,
        ISNULL(cc.comment_count, 0) AS comment_count
      FROM Analysis_Submissions s
      INNER JOIN Users u ON u.user_id = s.author_id
      LEFT JOIN (SELECT submission_id, COUNT(*) AS like_count FROM Post_Likes GROUP BY submission_id) lc ON lc.submission_id = s.submission_id
      LEFT JOIN (SELECT submission_id, COUNT(*) AS comment_count FROM Post_Comments GROUP BY submission_id) cc ON cc.submission_id = s.submission_id
    `;

    const request = pool.request();

    if (status && status !== 'all') {
      query += ' WHERE s.status = @status';
      request.input('status', sql.NVARCHAR(20), status);
    }

    query += ' ORDER BY s.updated_at DESC';

    const result = await request.query(query);
    console.log(`[Admin] Fetched ${result.recordset.length} submissions (filter: ${status || 'all'})`);
    res.json(result.recordset);
  } catch (err) {
    console.error('[Admin] getAllSubmissionsAdmin error:', err.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

export async function getRecentActivity(req, res) {
  try {
    const result = await pool.request().query(`
      SELECT TOP 50
        n.notification_id, n.type, n.message, n.actor_username, n.is_read, n.created_at,
        u.username AS target_username
      FROM Notifications n
      LEFT JOIN Users u ON u.user_id = n.user_id
      ORDER BY n.created_at DESC
    `);
    console.log(`[Admin] Fetched ${result.recordset.length} activity items`);
    res.json(result.recordset);
  } catch (err) {
    console.error('[Admin] getRecentActivity error:', err.message);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
}

export async function getModerationStats(req, res) {
  try {
    const pendingCount = await pool.request().query("SELECT COUNT(*) AS count FROM Analysis_Submissions WHERE status = 'Pending'");
    const rejectedCount = await pool.request().query("SELECT COUNT(*) AS count FROM Analysis_Submissions WHERE status = 'Rejected'");
    const publishedCount = await pool.request().query("SELECT COUNT(*) AS count FROM Analysis_Submissions WHERE status = 'Published'");
    const totalComments = await pool.request().query('SELECT COUNT(*) AS count FROM Post_Comments');

    res.json({
      pending_submissions: pendingCount.recordset[0].count,
      rejected_submissions: rejectedCount.recordset[0].count,
      published_submissions: publishedCount.recordset[0].count,
      total_comments: totalComments.recordset[0].count,
    });
  } catch (err) {
    console.error('[Admin] getModerationStats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch moderation statistics' });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const { userId } = req.params;
    const { username, email, role } = req.body;
    const validRoles = ['Analyst', 'Moderator', 'Administrator'];

    console.log(`[Admin] Updating profile for user ${userId}: username=${username}, email=${email}, role=${role}`);

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Analyst, Moderator, or Administrator' });
    }

    if (username) {
      const existing = await pool.request()
        .input('username', sql.NVARCHAR(50), username)
        .input('user_id', sql.INT, parseInt(userId))
        .query('SELECT user_id FROM Users WHERE username = @username AND user_id != @user_id');
      if (existing.recordset.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    if (email) {
      const existing = await pool.request()
        .input('email', sql.NVARCHAR(150), email)
        .input('user_id', sql.INT, parseInt(userId))
        .query('SELECT user_id FROM Users WHERE email = @email AND user_id != @user_id');
      if (existing.recordset.length > 0) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    const fields = [];
    const request = pool.request();
    request.input('user_id', sql.INT, parseInt(userId));
    if (username) { fields.push('username = @username'); request.input('username', sql.NVARCHAR(50), username); }
    if (email) { fields.push('email = @email'); request.input('email', sql.NVARCHAR(150), email); }
    if (role) { fields.push('role = @role'); request.input('role', sql.NVARCHAR(50), role); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await request.query(`
      UPDATE Users SET ${fields.join(', ')}
      OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.email, INSERTED.role
      WHERE user_id = @user_id
    `);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] Profile updated: ${result.recordset[0].username}`);
    res.json({ message: 'User profile updated', user: result.recordset[0] });
  } catch (err) {
    console.error('[Admin] updateUserProfile error:', err.message);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
}

export async function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    console.log(`[Admin] Deleting comment ${commentId}`);
    const result = await pool.request()
      .input('comment_id', sql.INT, parseInt(commentId))
      .query('DELETE FROM Post_Comments OUTPUT DELETED.comment_id WHERE comment_id = @comment_id');
    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    console.log(`[Admin] Comment deleted: ${result.recordset[0].comment_id}`);
    res.json({ message: 'Comment deleted', comment_id: result.recordset[0].comment_id });
  } catch (err) {
    console.error('[Admin] deleteComment error:', err.message);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

export async function deletePeerReview(req, res) {
  try {
    const { reviewId } = req.params;
    console.log(`[Admin] Deleting peer review ${reviewId}`);
    const result = await pool.request()
      .input('review_id', sql.INT, parseInt(reviewId))
      .query('DELETE FROM Peer_Reviews OUTPUT DELETED.review_id WHERE review_id = @review_id');
    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Review not found' });
    }
    console.log(`[Admin] Peer review deleted: ${result.recordset[0].review_id}`);
    res.json({ message: 'Peer review deleted', review_id: result.recordset[0].review_id });
  } catch (err) {
    console.error('[Admin] deletePeerReview error:', err.message);
    res.status(500).json({ error: 'Failed to delete peer review' });
  }
}

export async function getAllComments(req, res) {
  try {
    const result = await pool.request().query(`
      SELECT 
        c.comment_id, c.content, c.created_at,
        c.submission_id, c.user_id,
        s.title AS submission_title,
        u.username
      FROM Post_Comments c
      INNER JOIN Analysis_Submissions s ON s.submission_id = c.submission_id
      INNER JOIN Users u ON u.user_id = c.user_id
      ORDER BY c.created_at DESC
    `);
    console.log(`[Admin] Fetched ${result.recordset.length} comments`);
    res.json(result.recordset);
  } catch (err) {
    console.error('[Admin] getAllComments error:', err.message);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
}
