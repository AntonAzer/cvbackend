const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;

function publicUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    createdAt: row.created_at
  };
}

async function signup(req, res) {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await pool.query('select id from users where email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `insert into users (full_name, email, password_hash)
       values ($1, $2, $3)
       returning id, full_name, email, created_at`,
      [fullName.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken({ sub: user.id, email: user.email });

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ error: 'Something went wrong during signup' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await pool.query('select * from users where email = $1', [email.toLowerCase().trim()]);
    const user = result.rows[0];

    // Compare against a dummy hash even if the user doesn't exist, so response
    // timing doesn't reveal whether an email is registered.
    const hashToCheck = user ? user.password_hash : '$2a$12$C6UzMDM.H6dfI/f/IKcEeO0h/Uub1hZ6a4S5B2F6y2t.j3ZzXqK2q';
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ sub: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
}

async function me(req, res) {
  try {
    const result = await pool.query(
      'select id, full_name, email, created_at from users where id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// NOTE: this is intentionally a stub. A real "forgot password" flow needs:
//  1. a password_reset_tokens table (token hash + expiry),
//  2. an email provider (Resend/SendGrid/Postmark/etc, or Supabase Auth's
//     built-in email if you migrate auth there) to actually deliver the link,
//  3. a second endpoint that verifies the token and sets a new password_hash.
// It always returns the same message regardless of whether the email exists,
// so this endpoint can't be used to enumerate registered accounts.
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
}

module.exports = { signup, login, me, forgotPassword };
