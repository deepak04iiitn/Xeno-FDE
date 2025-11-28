import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if(!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  
  if(!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

export async function getUserById(userId) {
  const db = getPool();
  const [rows] = await db.execute('SELECT id, email, name FROM users WHERE id = ?', [userId]);
  return rows[0] || null;
}

