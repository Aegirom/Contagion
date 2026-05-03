import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import sql from 'mssql';

// hashing ka cost factor
const SALT_ROUNDS = 12;

// naya user create kro with password hashing
export const createUser = async (userData) => {
  if (!pool) throw new Error('Database not connected');
  const { username, email, password } = userData;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await pool.request()
    .input('username', sql.NVARCHAR, username)
    .input('email', sql.NVARCHAR, email)
    .input('password_hash', sql.NVARCHAR, hashedPassword)
    .input('role', sql.NVARCHAR, 'Analyst')
    .input('is_active', sql.BIT, 0)
    .query('INSERT INTO Users (username, email, password_hash, role, is_active) VALUES (@username, @email, @password_hash, @role, @is_active)');

  const result = await pool.request()
    .input('email', sql.NVARCHAR, email)
    .query('SELECT TOP 1 user_id, username, email, role, is_active FROM Users WHERE email = @email');

  return result.recordset[0];
};

export const findUserByEmail = async (email) => {
  if (!pool) throw new Error('Database not connected');
  const result = await pool.request()
    .input('email', sql.NVARCHAR, email)
    .query('SELECT TOP 1 * FROM Users WHERE email = @email');
  return result.recordset[0] || null;
};

export const findUserById = async (userId) => {
  if (!pool) throw new Error('Database not connected');
  const result = await pool.request()
    .input('user_id', sql.INT, userId)
    .query('SELECT user_id, username, email, role, expertise_level, reputation_score FROM Users WHERE user_id = @user_id');
  return result.recordset[0] || null;
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Update user password (for password reset)
export const updatePassword = async (userId, newPassword) => {
  if (!pool) throw new Error('Database not connected');
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.request()
    .input('user_id', sql.INT, userId)
    .input('password_hash', sql.NVARCHAR, hashedPassword)
    .query('UPDATE Users SET password_hash = @password_hash WHERE user_id = @user_id');
  return true;
};

// Verify user email (set is_active to true)
export const verifyUserEmail = async (userId) => {
  if (!pool) throw new Error('Database not connected');
  await pool.request()
    .input('user_id', sql.INT, userId)
    .query('UPDATE Users SET is_active = 1 WHERE user_id = @user_id');
  return true;
};

// Check if user is active
export const isUserActive = async (userId) => {
  if (!pool) throw new Error('Database not connected');
  const result = await pool.request()
    .input('user_id', sql.INT, userId)
    .query('SELECT TOP 1 is_active FROM Users WHERE user_id = @user_id');
  return result.recordset[0]?.is_active === 1 || result.recordset[0]?.is_active === true;
};
