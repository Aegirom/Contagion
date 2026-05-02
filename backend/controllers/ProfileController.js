import pool from '../config/db.js';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../public/uploads/avatars');

// Get current user's profile with full user data
export const getFullUserProfile = async (req, res) => {
  try {
    console.log('=== GET PROFILE DEBUG ===');
    console.log('req.user:', req.user);
    const userId = req.user?.userId;
    if (!userId) {
      console.log('ERROR: No userId in req.user');
      return res.status(401).json({ error: 'Unauthorized - No userId' });
    }

    // Get user data
    const userResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query('SELECT user_id, username, email, role, expertise_level, reputation_score, created_at FROM Users WHERE user_id = @user_id');

    const user = userResult.recordset[0] || null;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get profile data
    const profileResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query('SELECT profile_id, full_name, bio, avatar_url, updated_at FROM User_Profiles WHERE user_id = @user_id');

    const profile = profileResult.recordset[0] || {};

    // Get specializations for user
    const specsResult = await pool.request()
      .input('user_id', sql.INT, userId)
      .query(`
        SELECT s.specialization_id, s.name
        FROM Specializations s
        JOIN User_Specializations us ON s.specialization_id = us.specialization_id
        WHERE us.user_id = @user_id
      `);
    const specializations = specsResult.recordset;

    res.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        expertise_level: user.expertise_level,
        reputation_score: user.reputation_score,
        created_at: user.created_at
      },
      profile: {
        ...profile,
        specializations: specializations.map(s => s.name)
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
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('req.user:', req.user);
    console.log('req.headers.authorization:', req.headers.authorization ? 'present' : 'missing');
    const userId = req.user?.userId;
    const { full_name, bio, avatar_url, specializations } = req.body;
    console.log('Request body:', JSON.stringify({ full_name, bio, avatar_url, specializations }));

    if (!userId) {
      console.log('ERROR: No userId in req.user');
      return res.status(401).json({ error: 'Unauthorized - No userId' });
    }

    // Start transaction for consistency
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if profile exists
      const existingProfile = await transaction.request()
        .input('user_id', sql.INT, userId)
        .query('SELECT profile_id FROM User_Profiles WHERE user_id = @user_id');

      if (existingProfile.recordset.length === 0) {
        // Create new profile
        await transaction.request()
          .input('user_id', sql.INT, userId)
          .input('full_name', sql.NVARCHAR, full_name || null)
          .input('bio', sql.NVARCHAR, bio || null)
          .input('avatar_url', sql.NVARCHAR, avatar_url || null)
          .query('INSERT INTO User_Profiles (user_id, full_name, bio, avatar_url) VALUES (@user_id, @full_name, @bio, @avatar_url)');
      } else {
        // Update existing profile
        await transaction.request()
          .input('user_id', sql.INT, userId)
          .input('full_name', sql.NVARCHAR, full_name || null)
          .input('bio', sql.NVARCHAR, bio || null)
          .input('avatar_url', sql.NVARCHAR, avatar_url || null)
          .query('UPDATE User_Profiles SET full_name = ISNULL(@full_name, full_name), bio = ISNULL(@bio, bio), avatar_url = ISNULL(@avatar_url, avatar_url), updated_at = GETDATE() WHERE user_id = @user_id');
      }

      // Handle specializations if provided
      if (Array.isArray(specializations) && specializations.length > 0) {
        // Clear existing specializations
        await transaction.request()
          .input('user_id', sql.INT, userId)
          .query('DELETE FROM User_Specializations WHERE user_id = @user_id');

        // Add new specializations
        for (const specName of specializations) {
          // Check if specialization exists
          let specResult = await transaction.request()
            .input('name', sql.NVARCHAR, specName)
            .query('SELECT specialization_id FROM Specializations WHERE name = @name');

          let specId = specResult.recordset[0]?.specialization_id;

          if (!specId) {
            // Create new specialization
            await transaction.request()
              .input('name', sql.NVARCHAR, specName)
              .query('INSERT INTO Specializations (name) VALUES (@name)');

            specResult = await transaction.request()
              .input('name', sql.NVARCHAR, specName)
              .query('SELECT specialization_id FROM Specializations WHERE name = @name');
            specId = specResult.recordset[0]?.specialization_id;
          }

          // Link user to specialization
          await transaction.request()
            .input('user_id', sql.INT, userId)
            .input('specialization_id', sql.INT, specId)
            .query('INSERT INTO User_Specializations (user_id, specialization_id) VALUES (@user_id, @specialization_id)');
        }
      }

      await transaction.commit();

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Update full profile error:', error);
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

// Upload avatar image
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { avatar_url, croppedImage } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // If cropped image is provided (base64), save it to server storage
    if (croppedImage) {
      // Extract image extension from base64 data URL
      const matches = croppedImage.match(/^data:image\/(\w+);base64,(.*)$/);
      if (matches) {
        const extension = matches[1];
        const base64Data = matches[2];

        // Generate unique filename
        const filename = `avatar_${userId}_${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, filename);
        const uploadPath = `/uploads/avatars/${filename}`;

        // Save the image file
        const imageData = base64Data.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, imageData, 'base64');

        // Update profile with avatar path
        await pool.request()
          .input('user_id', sql.INT, userId)
          .input('avatar_url', sql.NVARCHAR, uploadPath)
          .query('UPDATE User_Profiles SET avatar_url = @avatar_url, updated_at = GETDATE() WHERE user_id = @user_id');

        res.json({ message: 'Avatar uploaded successfully', path: uploadPath });
      } else {
        res.status(400).json({ error: 'Invalid image format' });
      }
    } else if (avatar_url) {
      // Just store URL
      await pool.request()
        .input('user_id', sql.INT, userId)
        .input('avatar_url', sql.NVARCHAR, avatar_url)
        .query('UPDATE User_Profiles SET avatar_url = @avatar_url, updated_at = GETDATE() WHERE user_id = @user_id');
      res.json({ message: 'Avatar updated successfully', path: avatar_url });
    } else {
      res.status(400).json({ error: 'No avatar data provided' });
    }
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
