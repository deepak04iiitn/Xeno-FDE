import { getPool } from '../utils/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

export async function signUp(req, res) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getPool();

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const [result] = await db.execute(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name || null]
    );

    const token = generateToken(result.insertId, email);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.insertId,
        email,
        name,
      },
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function signIn(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getPool();

    // Find user
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      message: 'Sign in successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProfile(req, res) {
  try {
    const db = getPool();
    const [users] = await db.execute('SELECT id, email, name, created_at FROM users WHERE id = ?', [
      req.user.userId,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

