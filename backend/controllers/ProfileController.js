import pool from '../config/db.js';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadBufferToR2, createSignedR2DownloadUrl } from '../services/r2Service.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../public/uploads/avatars');

// Helper to get display URL for avatar
const getAvatarDisplayUrl = (avatarUrl) => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('r2://')) {
    try {
      const key = avatarUrl.split('/').slice(3).join('/');
      return createSignedR2DownloadUrl({ key });
    } catch (error) {
      console.error('Error creating signed R2 URL:', error);
      return null;
    }
  }
  return avatarUrl;
};

// Get current user's profile with full user data
export const getFullUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user and profile data in one go if possible, or separate
    const result = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT 
          u.user_id, u.username, u.email, u.role, u.expertise_level, u.reputation_score, u.created_at,
          p.profile_id, p.full_name, p.bio, p.avatar_url, p.updated_at
        FROM Users u
        LEFT JOIN User_Profiles p ON u.user_id = p.user_id
        WHERE u.user_id = @user_id
      `);

    const data = result.recordset[0];
    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get specializations
    const specsResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT s.name
        FROM Specializations s
        JOIN User_Specializations us ON s.specialization_id = us.specialization_id
        WHERE us.user_id = @user_id
      `);
    
    const specializations = specsResult.recordset.map(s => s.name);

    // Process avatar URL
    const avatar_url = getAvatarDisplayUrl(data.avatar_url);

    res.json({
      user: {
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        role: data.role,
        expertise_level: data.expertise_level,
        reputation_score: data.reputation_score,
        created_at: data.created_at
      },
      profile: {
        profile_id: data.profile_id,
        full_name: data.full_name,
        bio: data.bio,
        avatar_url: avatar_url,
        raw_avatar_url: data.avatar_url, // Keep the original r2:// path if needed
        specializations,
        updated_at: data.updated_at
      }
    });
  } catch (error) {
    console.error('Get full user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update current user's profile
export const updateFullUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { full_name, bio, specializations } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Upsert profile
      const existingProfile = await transaction.request()
        .input('user_id', sql.INT, userId)
        .query('SELECT profile_id FROM User_Profiles WHERE user_id = @user_id');

      if (existingProfile.recordset.length === 0) {
        await transaction.request()
          .input('user_id', sql.INT, userId)
          .input('full_name', sql.NVARCHAR, full_name || null)
          .input('bio', sql.NVARCHAR, bio || null)
          .query('INSERT INTO User_Profiles (user_id, full_name, bio) VALUES (@user_id, @full_name, @bio)');
      } else {
        await transaction.request()
          .input('user_id', sql.INT, userId)
          .input('full_name', sql.NVARCHAR, full_name || null)
          .input('bio', sql.NVARCHAR, bio || null)
          .query(`
            UPDATE User_Profiles 
            SET full_name = @full_name, 
                bio = @bio, 
                updated_at = GETDATE() 
            WHERE user_id = @user_id
          `);
      }

      // Handle specializations
      if (Array.isArray(specializations)) {
        // Clear existing
        await transaction.request()
          .input('user_id', sql.INT, userId)
          .query('DELETE FROM User_Specializations WHERE user_id = @user_id');

        // Add new
        for (const specName of specializations) {
          if (!specName || typeof specName !== 'string') continue;
          
          let specResult = await transaction.request()
            .input('name', sql.NVARCHAR, specName.trim())
            .query('SELECT specialization_id FROM Specializations WHERE name = @name');

          let specId = specResult.recordset[0]?.specialization_id;

          if (!specId) {
            const insertSpec = await transaction.request()
              .input('name', sql.NVARCHAR, specName.trim())
              .query('INSERT INTO Specializations (name) OUTPUT INSERTED.specialization_id VALUES (@name)');
            specId = insertSpec.recordset[0].specialization_id;
          }

          await transaction.request()
            .input('user_id', sql.INT, userId)
            .input('specialization_id', sql.INT, specId)
            .query('INSERT INTO User_Specializations (user_id, specialization_id) VALUES (@user_id, @specialization_id)');
        }
      }

      await transaction.commit();

      // Return updated user data for frontend context sync
      const updatedUserResult = await pool.request()
        .input('user_id', sql.INT, userId)
        .query('SELECT user_id, username, email, role, expertise_level, reputation_score FROM Users WHERE user_id = @user_id');
      
      res.json({ 
        message: 'Profile updated successfully',
        user: updatedUserResult.recordset[0]
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Update full profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload avatar image
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { croppedImage } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!croppedImage) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const matches = croppedImage.match(/^data:image\/(\w+);base64,(.*)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const extension = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `avatars/${userId}_${Date.now()}.${extension}`;

    let storagePath;
    let isR2 = false;

    try {
      // Try R2 upload
      const r2Result = await uploadBufferToR2({
        buffer,
        key: filename,
        contentType: `image/${extension}`,
      });
      storagePath = r2Result.storagePath;
      isR2 = true;
    } catch (r2Error) {
      console.warn('R2 upload failed, falling back to local storage:', r2Error.message);
      
      // Fallback to local
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFilename = `avatar_${userId}_${Date.now()}.${extension}`;
      const filePath = path.join(uploadsDir, localFilename);
      fs.writeFileSync(filePath, buffer);
      storagePath = `/uploads/avatars/${localFilename}`;
    }

    // Update database
    await pool.request()
      .input('user_id', sql.INT, userId)
      .input('avatar_url', sql.NVARCHAR, storagePath)
      .query(`
        IF EXISTS (SELECT 1 FROM User_Profiles WHERE user_id = @user_id)
          UPDATE User_Profiles SET avatar_url = @avatar_url, updated_at = GETDATE() WHERE user_id = @user_id
        ELSE
          INSERT INTO User_Profiles (user_id, avatar_url) VALUES (@user_id, @avatar_url)
      `);

    // Return display URL
    const displayUrl = isR2 ? createSignedR2DownloadUrl({ key: filename }) : storagePath;

    res.json({ 
      message: 'Avatar uploaded successfully', 
      path: displayUrl,
      rawPath: storagePath 
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update user's expertise level (admin only)
export const updateUserExpertise = async (req, res) => {
  try {
    const { userId, expertise_level } = req.body;

    if (!userId || !expertise_level) {
      return res.status(400).json({ error: 'User ID and expertise level are required' });
    }

    // Validate expertise level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (!validLevels.includes(expertise_level)) {
      return res.status(400).json({ error: 'Invalid expertise level' });
    }

    // Update user's expertise level
    await pool.request()
      .input('user_id', sql.INT, userId)
      .input('expertise_level', sql.NVARCHAR, expertise_level)
      .query('UPDATE Users SET expertise_level = @expertise_level WHERE user_id = @user_id');

    res.json({ message: 'Expertise level updated successfully' });
  } catch (error) {
    console.error('Update expertise error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

