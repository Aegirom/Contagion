import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import sql from 'mssql';

// hashing ka cost factor
const SALT_ROUNDS = 12;

// naya user create kro with password hashing
export const createUser = async (userData) => {
  const { username, email, password } = userData;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.request()
    .input('username', sql.NVARCHAR, username)
    .input('email', sql.NVARCHAR, email)
    .input('password_hash', sql.NVARCHAR, hashedPassword)
    .input('role', sql.NVARCHAR, 'Analyst')
    .query('INSERT INTO Users (username, email, password_hash, role) OUTPUT INSERTED * VALUES (@username, @email, @password_hash, @role)');
  return result.recordset[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.request()
    .input('email', sql.NVARCHAR, email)
    .query('SELECT TOP 1 * FROM Users WHERE email = @email');
  return result.recordset[0] || null;
};

export const findUserById = async (userId) => {
  const result = await pool.request()
    .input('user_id', sql.INT, userId)
    .query('SELECT user_id, username, email, role, expertise_level, reputation_score FROM Users WHERE user_id = @user_id');
  return result.recordset[0] || null;
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
