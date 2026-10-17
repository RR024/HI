import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';
import {
  ROLES, ATTENDANCE_STATUSES, PAYMENT_STATUSES,
  todayStr, isValidDate, validateStaff, isStrongEnoughPassword,
} from './util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';
const app = express();
const PORT = process.env.PORT || 5000;

// ---- Secrets: never fall back to a value that is committed to the repo ----
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (IS_PROD) {
    console.error('FATAL: JWT_SECRET must be set (min 32 chars) when NODE_ENV=production.');
    process.exit(1);
  }
  JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('WARNING: JWT_SECRET not set. Using a random one for this run; logins will reset on restart.');
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || '12h';

// ---- Security middleware ----
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false })); // SPA bundle uses inline styles; tighten if you add a CSP

// CORS: same-origin by default. Set CORS_ORIGIN="https://a.com,https://b.com" if the UI is hosted elsewhere.
const allowedOrigins = (process.env.CORS_ORIGIN || (IS_PROD ? '' : 'http://localhost:5173')).split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api', apiLimiter);

// Initialize SQLite DB
initDatabase();

// ---- Helpers ----
/** Log the real error server-side, return a generic message to the client. */
function serverError(res, error, context = 'Request failed') {
  console.error(`${context}:`, error);
  return res.status(500).json({ error: 'Internal server error' });
}

function audit(req, action, entity, entityId, detail) {
  try {
    db.prepare('INSERT INTO audit_log (user_id, username, action, entity, entity_id, detail) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user?.id ?? null, req.user?.username ?? null, action, entity, entityId != null ? String(entityId) : null, detail ? JSON.stringify(detail) : null);
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// ==========================================
// AUTH & RBAC MIDDLEWARE
// ==========================================
// The token only proves identity. Role, status and staff link are re-read from the DB on every
// request, so demoting/deactivating a user takes effect immediately.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  req.user = null;
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, payload) => {
    if (!err && payload?.id) {
      try {
        const row = db.prepare('SELECT id, username, email, name, role, staff_id, status FROM users WHERE id = ?').get(payload.id);
        if (row && row.status === 'Active') req.user = row;
      } catch (e) {
        console.error('Auth lookup failed:', e);
      }
    }
    next();
  });
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }
  // A Worker login that isn't linked to a staff record has no data it may see.
  if (req.user.role === 'Worker' && !req.user.staff_id) {
    return res.status(403).json({ error: 'Your worker account is not linked to a staff record. Contact an administrator.' });
  }
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please login.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Your role (${req.user.role}) does not have permission for this operation. Required: ${allowedRoles.join(' or ')}`
      });
    }
    next();
  };
}

// Used to burn the same CPU time when a username doesn't exist.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(8).toString('hex'), 10);

const isWorker = (req) => req.user && req.user.role === 'Worker';

app.use(authenticateToken);

// ==========================================
// 0. AUTHENTICATION & USER MANAGEMENT API
// ==========================================

// Login endpoint
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ error: 'Username/Email and Password are required' });
    }

    const user = db.prepare(`
      SELECT * FROM users
      WHERE (username = ? OR email = ?) AND status = 'Active'
    `).get(username.trim(), username.trim());

    // Same message + a bcrypt compare either way, so usernames can't be enumerated.
    const validPassword = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !validPassword) {
      return res.status(401).json({ error: 'Invalid username or password, or account is inactive' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      staff_id: user.staff_id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { algorithm: 'HS256', expiresIn: JWT_EXPIRY });

    res.json({
      token,
      user: tokenPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    return serverError(res, error);
  }
});

// Current User Profile endpoint
app.get('/api/auth/me', (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required. Please login.' });
    res.json(req.user);
  } catch (error) {
    return serverError(res, error);
  }
});

// Get all users (Admin only)
app.get('/api/auth/users', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.email, u.name, u.role, u.staff_id, u.status, u.created_at,
             s.name as linked_staff_name, s.staff_code as linked_staff_code
      FROM users u
      LEFT JOIN staff s ON u.staff_id = s.id
      ORDER BY u.id ASC
    `).all();
    res.json(users);
  } catch (error) {
    return serverError(res, error);
  }
});

// Create new user (Admin only)
app.post('/api/auth/users', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const { username, email, password, name, role, staff_id } = req.body || {};
    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ error: 'Username, Email, Password, Name, and Role are required' });
    }
    if (!ROLES.includes(role)) return res.status(400).json({ error: `Role must be one of: ${ROLES.join(', ')}` });
    if (!isStrongEnoughPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/^[a-z0-9._-]{3,32}$/i.test(String(username).trim())) return res.status(400).json({ error: 'Username must be 3-32 characters (letters, numbers, . _ -)' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email).trim())) return res.status(400).json({ error: 'Email address is invalid' });
    if (role === 'Worker' && !toId(staff_id)) return res.status(400).json({ error: 'Worker accounts must be linked to a staff record' });
    if (staff_id && !db.prepare('SELECT 1 FROM staff WHERE id = ?').get(staff_id)) return res.status(400).json({ error: 'Linked staff record does not exist' });

    const hash = bcrypt.hashSync(password, 12);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, name, role, staff_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Active')
    `);

    const result = stmt.run(username.trim().toLowerCase(), email.trim().toLowerCase(), hash, name.trim(), role, staff_id || null);
    const created = db.prepare('SELECT id, username, email, name, role, staff_id, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    audit(req, 'create', 'user', created.id, { username: created.username, role: created.role });
    res.status(201).json(created);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username or Email already exists in the system' });
    }
    return serverError(res, error);
  }
});

// Update user (Admin only)
app.put('/api/auth/users/:id', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const { name, email, role, staff_id, status, password } = req.body || {};
    const id = toId(req.params.id);
    const existing = id && db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'User not found' });
    if (!name || !email || !ROLES.includes(role)) return res.status(400).json({ error: `Name, email and a valid role (${ROLES.join(', ')}) are required` });
    if (status && !['Active', 'Inactive'].includes(status)) return res.status(400).json({ error: 'Status must be Active or Inactive' });
    if (password && password.trim() && !isStrongEnoughPassword(password.trim())) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (role === 'Worker' && !toId(staff_id)) return res.status(400).json({ error: 'Worker accounts must be linked to a staff record' });
    if (staff_id && !db.prepare('SELECT 1 FROM staff WHERE id = ?').get(staff_id)) return res.status(400).json({ error: 'Linked staff record does not exist' });

    // Never allow the system to end up with no active admin.
    const losingAdmin = existing.role === 'Admin' && existing.status === 'Active' && (role !== 'Admin' || (status || 'Active') !== 'Active');
    if (losingAdmin) {
      const { n } = db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'Admin' AND status = 'Active' AND id != ?").get(id);
      if (n === 0) return res.status(400).json({ error: 'Cannot demote or deactivate the last active admin' });
    }

    if (password && password.trim()) {
      const hash = bcrypt.hashSync(password.trim(), 12);
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, role = ?, staff_id = ?, status = ?, password_hash = ?
        WHERE id = ?
      `).run(name, email.trim().toLowerCase(), role, staff_id || null, status || 'Active', hash, id);
    } else {
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, role = ?, staff_id = ?, status = ?
        WHERE id = ?
      `).run(name, email.trim().toLowerCase(), role, staff_id || null, status || 'Active', id);
    }

    const updated = db.prepare('SELECT id, username, email, name, role, staff_id, status, created_at FROM users WHERE id = ?').get(id);
    audit(req, 'update', 'user', id, { role, status: status || 'Active', passwordChanged: !!(password && password.trim()) });
    res.json(updated);
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists in the system' });
    }
    return serverError(res, error);
  }
});

// Delete user (Admin only)
app.delete('/api/auth/users/:id', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const id = toId(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own logged-in admin account!' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    audit(req, 'delete', 'user', id);
    res.json({ success: true, message: 'User account deleted' });
  } catch (error) {
    return serverError(res, error);
  }
});

// ==========================================
// 1. STAFF CRUD & DETAILS API
// ==========================================

// Get all staff
app.get('/api/staff', requireAuth, (req, res) => {
  try {
    const { search, status, marital_status, role } = req.query;
    let query = `SELECT * FROM staff WHERE 1=1`;
    const params = [];

    // If logged in as worker, restrict to own record if staff_id is linked
    if (isWorker(req)) {
      query += ` AND id = ?`;
      params.push(req.user.staff_id);
    }

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (marital_status && marital_status !== 'all') {
      query += ` AND marital_status = ?`;
      params.push(marital_status);
    }
    if (role && role !== 'all') {
      query += ` AND role = ?`;
      params.push(role);
    }
    if (search) {
      query += ` AND (name LIKE ? OR staff_code LIKE ? OR phone LIKE ? OR aadhaar_num LIKE ? OR esi_num LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ` ORDER BY id DESC`;
    const { limit, offset } = req.query;
    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500), Math.max(parseInt(offset, 10) || 0, 0));
    }
    const staffMembers = db.prepare(query).all(...params);
    res.json(staffMembers);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return serverError(res, error);
  }
});

// Get single staff by ID
app.get('/api/staff/:id', requireAuth, (req, res) => {
  try {
    // If worker, allow only own ID
    if (isWorker(req) && Number(req.params.id) !== Number(req.user.staff_id)) {
      return res.status(403).json({ error: 'Access Denied: Workers can only view their own profile' });
    }

    const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const recentWages = db.prepare(`
      SELECT w.*, j.title as job_title, j.unit_name
      FROM daily_wages w
      LEFT JOIN job_types j ON w.job_type_id = j.id
      WHERE w.staff_id = ?
      ORDER BY w.wage_date DESC
      LIMIT 10
    `).all(req.params.id);

    const recentAttendance = db.prepare(`
      SELECT * FROM attendance
      WHERE staff_id = ?
      ORDER BY date DESC
      LIMIT 15
    `).all(req.params.id);

    const activeAdvances = db.prepare(`
      SELECT * FROM advances
      WHERE staff_id = ? AND status != 'Recovered'
      ORDER BY request_date DESC
    `).all(req.params.id);

    const totalEarned = db.prepare(`
      SELECT COALESCE(SUM(net_wage), 0) as total_earned,
             COALESCE(SUM(CASE WHEN payment_status = 'Pending' THEN net_wage ELSE 0 END), 0) as total_pending
      FROM daily_wages
      WHERE staff_id = ?
    `).get(req.params.id);

    res.json({
      staff,
      recentWages,
      recentAttendance,
      activeAdvances,
      stats: totalEarned
    });
  } catch (error) {
    return serverError(res, error);
  }
});

// Create new Staff member (Admin, Supervisor, Accountant)
app.post('/api/staff', requireAuth, requireRole(['Admin', 'Supervisor', 'Accountant']), (req, res) => {
  try {
    const {
      name, gender, age, dob, address, phone, aadhaar_num,
      marital_status, spouse_name, spouse_phone, spouse_occupation,
      father_name, mother_name, parent_phone, parent_address,
      doj, role, wage_type, daily_rate,
      bank_name, account_num, ifsc_code, branch_name,
      esi_num, pf_num, status
    } = req.body;

    const check = validateStaff(req.body);
    if (check.error) return res.status(400).json({ error: check.error });
    const v = check.value;

    // Derive the next code from the highest existing code, not row count/id, so codes stay unique.
    const lastCode = db.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(staff_code, 5) AS INTEGER)), 0) as n FROM staff").get();
    const staff_code = `STF-${String((lastCode ? lastCode.n : 0) + 1).padStart(3, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO staff (
        staff_code, name, gender, age, dob, address, phone, aadhaar_num,
        marital_status, spouse_name, spouse_phone, spouse_occupation,
        father_name, mother_name, parent_phone, parent_address,
        doj, role, wage_type, daily_rate,
        bank_name, account_num, ifsc_code, branch_name,
        esi_num, pf_num, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    const result = stmt.run(
      staff_code,
      v.name,
      v.gender,
      v.age,
      v.dob,
      v.address,
      v.phone,
      v.aadhaar_num,
      marital_status,
      marital_status === 'Married' ? (spouse_name || '') : null,
      marital_status === 'Married' ? (spouse_phone || '') : null,
      marital_status === 'Married' ? (spouse_occupation || '') : null,
      marital_status !== 'Married' ? (father_name || '') : null,
      marital_status !== 'Married' ? (mother_name || '') : null,
      marital_status !== 'Married' ? (parent_phone || '') : null,
      marital_status !== 'Married' ? (parent_address || '') : null,
      doj,
      role || 'Worker',
      wage_type || 'Piece Rate',
      v.daily_rate,
      bank_name.trim(),
      v.account_num,
      v.ifsc_code,
      branch_name ? branch_name.trim() : 'Main Branch',
      esi_num ? esi_num.trim() : null,
      pf_num ? pf_num.trim() : null,
      status || 'Active'
    );

    const newStaff = db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid);
    audit(req, 'create', 'staff', newStaff.id, { staff_code: newStaff.staff_code });
    res.status(201).json(newStaff);
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: staff.aadhaar_num')) {
      return res.status(400).json({ error: 'A staff member with this Aadhaar Number already exists!' });
    }
    return serverError(res, error);
  }
});

// Update Staff
app.put('/api/staff/:id', requireAuth, requireRole(['Admin', 'Supervisor', 'Accountant']), (req, res) => {
  try {
    const {
      name, gender, age, dob, address, phone, aadhaar_num,
      marital_status, spouse_name, spouse_phone, spouse_occupation,
      father_name, mother_name, parent_phone, parent_address,
      doj, role, wage_type, daily_rate,
      bank_name, account_num, ifsc_code, branch_name,
      esi_num, pf_num, status
    } = req.body;

    const sid = toId(req.params.id);
    if (!sid || !db.prepare('SELECT 1 FROM staff WHERE id = ?').get(sid)) return res.status(404).json({ error: 'Staff member not found' });
    const check = validateStaff(req.body);
    if (check.error) return res.status(400).json({ error: check.error });
    const v = check.value;

    const stmt = db.prepare(`
      UPDATE staff SET
        name = ?, gender = ?, age = ?, dob = ?, address = ?, phone = ?, aadhaar_num = ?,
        marital_status = ?,
        spouse_name = ?, spouse_phone = ?, spouse_occupation = ?,
        father_name = ?, mother_name = ?, parent_phone = ?, parent_address = ?,
        doj = ?, role = ?, wage_type = ?, daily_rate = ?,
        bank_name = ?, account_num = ?, ifsc_code = ?, branch_name = ?,
        esi_num = ?, pf_num = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      v.name, v.gender, v.age, v.dob, v.address, v.phone, v.aadhaar_num,
      marital_status,
      marital_status === 'Married' ? spouse_name : null,
      marital_status === 'Married' ? spouse_phone : null,
      marital_status === 'Married' ? spouse_occupation : null,
      marital_status !== 'Married' ? father_name : null,
      marital_status !== 'Married' ? mother_name : null,
      marital_status !== 'Married' ? parent_phone : null,
      marital_status !== 'Married' ? parent_address : null,
      doj, role, wage_type, v.daily_rate,
      bank_name, v.account_num, v.ifsc_code, branch_name,
      esi_num, pf_num, status || 'Active',
      sid
    );

    const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(sid);
    audit(req, 'update', 'staff', sid);
    res.json(updated);
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: staff.aadhaar_num')) {
      return res.status(400).json({ error: 'A staff member with this Aadhaar Number already exists!' });
    }
    return serverError(res, error);
  }
});

// Delete Staff (Admin only)
app.delete('/api/staff/:id', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const sid = toId(req.params.id);
    if (!sid || !db.prepare('SELECT 1 FROM staff WHERE id = ?').get(sid)) return res.status(404).json({ error: 'Staff member not found' });

    const history = db.prepare(`
      SELECT (SELECT COUNT(*) FROM daily_wages WHERE staff_id = ?) +
             (SELECT COUNT(*) FROM attendance WHERE staff_id = ?) +
             (SELECT COUNT(*) FROM advances WHERE staff_id = ?) AS n
    `).get(sid, sid, sid).n;

    if (history > 0) {
      // Payroll records must be kept: deactivate instead of cascading the delete.
      db.transaction(() => {
        db.prepare("UPDATE staff SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(sid);
        db.prepare("UPDATE users SET status = 'Inactive' WHERE staff_id = ?").run(sid);
      })();
      audit(req, 'deactivate', 'staff', sid, { reason: 'has payroll history' });
      return res.json({ success: true, deactivated: true, message: 'Staff has payroll/attendance history, so the record was marked Inactive instead of being deleted.' });
    }

    db.prepare('DELETE FROM staff WHERE id = ?').run(sid);
    audit(req, 'delete', 'staff', sid);
    res.json({ success: true, deleted: true, message: 'Staff deleted successfully' });
  } catch (error) {
    return serverError(res, error);
  }
});

// ==========================================
// 2. JOB TYPES / WORK DEFINITIONS (Piece-rate)
// ==========================================

app.get('/api/jobs', requireAuth, (req, res) => {
  try {
    const jobs = db.prepare('SELECT * FROM job_types ORDER BY id ASC').all();
    res.json(jobs);
  } catch (error) {
    return serverError(res, error);
  }
});

app.post('/api/jobs', requireAuth, requireRole(['Admin', 'Supervisor']), (req, res) => {
  try {
    const { title, description, category, rate_amount, unit_quantity, unit_name } = req.body;
    if (!title || !rate_amount || !unit_quantity || !unit_name) {
      return res.status(400).json({ error: 'Title, Rate Amount, Unit Quantity, and Unit Name are required' });
    }
    if (!(Number(rate_amount) > 0) || !(Number(unit_quantity) > 0)) {
      return res.status(400).json({ error: 'Rate Amount and Unit Quantity must be greater than zero' });
    }

    const last = db.prepare('SELECT COALESCE(MAX(id), 0) as max_id FROM job_types').get();
    const code = `JOB-${100 + ((last ? last.max_id : 0) + 1)}`;

    const stmt = db.prepare(`
      INSERT INTO job_types (code, title, description, category, rate_amount, unit_quantity, unit_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(code, title, description || '', category || 'General', Number(rate_amount), Number(unit_quantity), unit_name);
    const created = db.prepare('SELECT * FROM job_types WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error) {
    return serverError(res, error);
  }
});

app.put('/api/jobs/:id', requireAuth, requireRole(['Admin', 'Supervisor']), (req, res) => {
  try {
    const { title, description, category, rate_amount, unit_quantity, unit_name, status } = req.body;
    if (!title || !(Number(rate_amount) > 0) || !(Number(unit_quantity) > 0) || !unit_name) {
      return res.status(400).json({ error: 'Title, Unit Name, and a Rate/Unit Quantity greater than zero are required' });
    }
    db.prepare(`
      UPDATE job_types
      SET title = ?, description = ?, category = ?, rate_amount = ?, unit_quantity = ?, unit_name = ?, status = ?
      WHERE id = ?
    `).run(title, description, category, Number(rate_amount), Number(unit_quantity), unit_name, status || 'Active', req.params.id);

    const updated = db.prepare('SELECT * FROM job_types WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    return serverError(res, error);
  }
});

app.delete('/api/jobs/:id', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM job_types WHERE id = ?').run(req.params.id);
    audit(req, 'delete', 'job_type', req.params.id);
    res.json({ success: true, message: 'Job type removed' });
  } catch (error) {
    return serverError(res, error);
  }
});

// ==========================================
// 3. ATTENDANCE API
// ==========================================

app.get('/api/attendance', requireAuth, (req, res) => {
  try {
    const date = req.query.date || todayStr();
    if (!isValidDate(date)) return res.status(400).json({ error: 'Invalid date' });
    let query = `
      SELECT s.id as staff_id, s.staff_code, s.name, s.role, s.status as staff_status,
             a.id as attendance_id, a.date, a.status as attendance_status, a.overtime_hours, a.shift, a.notes
      FROM staff s
      LEFT JOIN attendance a ON s.id = a.staff_id AND a.date = ?
      WHERE s.status != 'Inactive'
    `;
    const params = [date];

    // If worker, only their attendance
    if (isWorker(req)) {
      query += ` AND s.id = ?`;
      params.push(req.user.staff_id);
    }

    query += ` ORDER BY s.id ASC`;
    const rows = db.prepare(query).all(...params);

    res.json({ date, records: rows });
  } catch (error) {
    return serverError(res, error);
  }
});

app.post('/api/attendance/bulk', requireAuth, requireRole(['Admin', 'Supervisor']), (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }
    if (!isValidDate(date)) return res.status(400).json({ error: 'Invalid date' });
    if (date > todayStr()) return res.status(400).json({ error: 'Attendance cannot be marked for a future date' });
    const knownStaff = new Set(db.prepare('SELECT id FROM staff').all().map((r) => r.id));
    for (const rec of records) {
      if (!knownStaff.has(Number(rec.staff_id))) return res.status(400).json({ error: `Unknown staff id: ${rec.staff_id}` });
      if (rec.status && !ATTENDANCE_STATUSES.includes(rec.status)) return res.status(400).json({ error: `Invalid attendance status: ${rec.status}` });
      const ot = Number(rec.overtime_hours) || 0;
      if (ot < 0 || ot > 24) return res.status(400).json({ error: 'Overtime hours must be between 0 and 24' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO attendance (staff_id, date, status, overtime_hours, shift, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(staff_id, date) DO UPDATE SET
        status = excluded.status,
        overtime_hours = excluded.overtime_hours,
        shift = excluded.shift,
        notes = excluded.notes
    `);

    const transaction = db.transaction((recs) => {
      for (const rec of recs) {
        upsertStmt.run(
          rec.staff_id,
          date,
          rec.status || 'Present',
          Number(rec.overtime_hours) || 0,
          rec.shift || 'Day Shift',
          rec.notes || ''
        );
      }
    });

    transaction(records);
    audit(req, 'bulk_save', 'attendance', date, { count: records.length });
    res.json({ success: true, message: `Attendance saved for ${records.length} staff members on ${date}` });
  } catch (error) {
    return serverError(res, error);
  }
});

// ==========================================
// 4. DAILY WAGES & WORK TRACKING API
// ==========================================

app.get('/api/wages', requireAuth, (req, res) => {
  try {
    const { date, startDate, endDate, staff_id, status, job_type_id } = req.query;
    let query = `
      SELECT w.*, s.name as staff_name, s.staff_code, s.phone as staff_phone, s.role as staff_role,
             s.bank_name, s.account_num, s.ifsc_code, s.esi_num,
             j.title as job_title, j.unit_name, j.category as job_category
      FROM daily_wages w
      JOIN staff s ON w.staff_id = s.id
      LEFT JOIN job_types j ON w.job_type_id = j.id
      WHERE 1=1
    `;
    const params = [];

    // Worker restricted access
    if (isWorker(req)) {
      query += ` AND w.staff_id = ?`;
      params.push(req.user.staff_id);
    } else if (staff_id && staff_id !== 'all') {
      query += ` AND w.staff_id = ?`;
      params.push(staff_id);
    }

    if (date) {
      query += ` AND w.wage_date = ?`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND w.wage_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    if (status && status !== 'all') {
      query += ` AND w.payment_status = ?`;
      params.push(status);
    }

    if (job_type_id && job_type_id !== 'all') {
      query += ` AND w.job_type_id = ?`;
      params.push(job_type_id);
    }

    query += ` ORDER BY w.wage_date DESC, w.id DESC`;
    const { limit, offset } = req.query;
    if (limit) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000), Math.max(parseInt(offset, 10) || 0, 0));
    }
    const wages = db.prepare(query).all(...params);
    res.json(wages);
  } catch (error) {
    return serverError(res, error);
  }
});

app.post('/api/wages', requireAuth, requireRole(['Admin', 'Supervisor', 'Accountant']), (req, res) => {
  try {
    const {
      wage_date, staff_id, job_type_id, work_description,
      units_completed, overtime_amount, bonus_amount, deductions,
      payment_status, payment_mode, notes
    } = req.body;

    if (!wage_date || !staff_id || !work_description) {
      return res.status(400).json({ error: 'Date, Staff ID, and Work Description are required' });
    }
    if (!isValidDate(wage_date)) return res.status(400).json({ error: 'Invalid wage date' });
    if (!db.prepare('SELECT 1 FROM staff WHERE id = ?').get(staff_id)) return res.status(400).json({ error: 'Staff member does not exist' });
    if (payment_status && !PAYMENT_STATUSES.includes(payment_status)) return res.status(400).json({ error: 'Invalid payment status' });
    for (const [label, val] of [['Units', units_completed], ['Overtime', overtime_amount], ['Bonus', bonus_amount], ['Deductions', deductions]]) {
      if (val !== undefined && val !== null && val !== '' && !(Number(val) >= 0)) return res.status(400).json({ error: `${label} must be a non-negative number` });
    }

    let rate_snapshot = 'Custom Rate';
    let rate_per_single_unit = 0;
    let base_amount = 0;

    if (job_type_id) {
      const job = db.prepare('SELECT * FROM job_types WHERE id = ?').get(job_type_id);
      if (job) {
        rate_snapshot = `₹${job.rate_amount} per ${job.unit_quantity} ${job.unit_name}`;
        rate_per_single_unit = job.rate_amount / job.unit_quantity;
        base_amount = (Number(units_completed) || 0) * rate_per_single_unit;
      }
    } else {
      base_amount = Number(req.body.base_amount) || 0;
      rate_snapshot = `₹${base_amount} Fixed`;
      rate_per_single_unit = base_amount;
    }

    const ot = Number(overtime_amount) || 0;
    const bonus = Number(bonus_amount) || 0;
    const ded = Number(deductions) || 0;
    const gross = base_amount + ot + bonus;
    if (ded > gross) {
      return res.status(400).json({ error: `Deductions (${ded}) exceed total earnings (${gross.toFixed(2)}). Reduce the deduction or record the excess as an advance recovery.` });
    }
    const net_wage = gross - ded;

    // Block accidental double-submits of the exact same entry.
    const dup = db.prepare(`
      SELECT id FROM daily_wages
      WHERE staff_id = ? AND wage_date = ? AND COALESCE(job_type_id, 0) = COALESCE(?, 0)
        AND work_description = ? AND units_completed = ? AND net_wage = ?
    `).get(staff_id, wage_date, job_type_id || null, work_description, Number(units_completed) || 0, net_wage);
    if (dup && !req.body.allow_duplicate) {
      return res.status(409).json({ error: 'An identical wage entry already exists for this worker and date. Resubmit with allow_duplicate if this is intentional.' });
    }

    const stmt = db.prepare(`
      INSERT INTO daily_wages (
        wage_date, staff_id, job_type_id, work_description,
        units_completed, rate_snapshot, rate_per_single_unit,
        base_amount, overtime_amount, bonus_amount, deductions, net_wage,
        payment_status, payment_mode, payment_date, notes
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    const result = stmt.run(
      wage_date,
      staff_id,
      job_type_id || null,
      work_description,
      Number(units_completed) || 0,
      rate_snapshot,
      rate_per_single_unit,
      base_amount,
      ot,
      bonus,
      ded,
      net_wage,
      payment_status || 'Pending',
      payment_mode || 'Cash',
      payment_status === 'Paid' ? todayStr() : null,
      notes || ''
    );

    const created = db.prepare(`
      SELECT w.*, s.name as staff_name, s.staff_code, j.title as job_title
      FROM daily_wages w
      JOIN staff s ON w.staff_id = s.id
      LEFT JOIN job_types j ON w.job_type_id = j.id
      WHERE w.id = ?
    `).get(result.lastInsertRowid);

    audit(req, 'create', 'wage', created.id, { staff_id, net_wage });
    res.status(201).json(created);
  } catch (error) {
    return serverError(res, error);
  }
});

app.put('/api/wages/:id', requireAuth, requireRole(['Admin', 'Supervisor', 'Accountant']), (req, res) => {
  try {
    const {
      wage_date, staff_id, job_type_id, work_description,
      units_completed, base_amount, overtime_amount, bonus_amount, deductions,
      payment_status, payment_mode, notes
    } = req.body;

    const wid = toId(req.params.id);
    const existing = wid && db.prepare('SELECT * FROM daily_wages WHERE id = ?').get(wid);
    if (!existing) return res.status(404).json({ error: 'Wage record not found' });
    if (existing.payment_status === 'Paid' && req.user.role !== 'Admin' && req.user.role !== 'Accountant') {
      return res.status(403).json({ error: 'Paid wage records can only be edited by an Admin or Accountant' });
    }
    if (!wage_date || !isValidDate(wage_date) || !staff_id || !work_description) {
      return res.status(400).json({ error: 'A valid date, staff and work description are required' });
    }
    if (payment_status && !PAYMENT_STATUSES.includes(payment_status)) return res.status(400).json({ error: 'Invalid payment status' });
    for (const [label, val] of [['Units', units_completed], ['Overtime', overtime_amount], ['Bonus', bonus_amount], ['Deductions', deductions], ['Base amount', base_amount]]) {
      if (val !== undefined && val !== null && val !== '' && !(Number(val) >= 0)) return res.status(400).json({ error: `${label} must be a non-negative number` });
    }

    // Keep the rate that was in force when the wage was recorded unless the job itself was changed.
    let rate_snapshot = existing.rate_snapshot;
    let rate_per_single_unit = existing.rate_per_single_unit;
    let calculatedBase = Number(base_amount) || 0;

    if (job_type_id) {
      if (Number(job_type_id) === Number(existing.job_type_id)) {
        calculatedBase = (Number(units_completed) || 0) * existing.rate_per_single_unit;
      } else {
        const job = db.prepare('SELECT * FROM job_types WHERE id = ?').get(job_type_id);
        if (!job) return res.status(400).json({ error: 'Job type does not exist' });
        rate_snapshot = `₹${job.rate_amount} per ${job.unit_quantity} ${job.unit_name}`;
        rate_per_single_unit = job.rate_amount / job.unit_quantity;
        calculatedBase = (Number(units_completed) || 0) * rate_per_single_unit;
      }
    } else {
      rate_snapshot = `₹${calculatedBase} Fixed`;
      rate_per_single_unit = calculatedBase;
    }

    const ot = Number(overtime_amount) || 0;
    const bonus = Number(bonus_amount) || 0;
    const ded = Number(deductions) || 0;
    const gross = calculatedBase + ot + bonus;
    if (ded > gross) {
      return res.status(400).json({ error: `Deductions (${ded}) exceed total earnings (${gross.toFixed(2)}).` });
    }
    const net_wage = gross - ded;
    const newStatus = payment_status || existing.payment_status;
    const paymentDate = newStatus === 'Paid' ? (existing.payment_date || todayStr()) : null;

    db.prepare(`
      UPDATE daily_wages SET
        wage_date = ?, staff_id = ?, job_type_id = ?, work_description = ?,
        units_completed = ?, rate_snapshot = ?, rate_per_single_unit = ?,
        base_amount = ?, overtime_amount = ?, bonus_amount = ?, deductions = ?, net_wage = ?,
        payment_status = ?, payment_mode = ?, payment_date = ?, notes = ?
      WHERE id = ?
    `).run(
      wage_date, staff_id, job_type_id || null, work_description,
      Number(units_completed) || 0, rate_snapshot, rate_per_single_unit,
      calculatedBase, ot, bonus, ded, net_wage,
      newStatus, payment_mode || existing.payment_mode, paymentDate, notes ?? existing.notes,
      wid
    );

    audit(req, 'update', 'wage', wid, { from: { net_wage: existing.net_wage, status: existing.payment_status }, to: { net_wage, status: newStatus } });
    const updated = db.prepare('SELECT * FROM daily_wages WHERE id = ?').get(wid);
    res.json(updated);
  } catch (error) {
    return serverError(res, error);
  }
});

app.patch('/api/wages/:id/status', requireAuth, requireRole(['Admin', 'Accountant']), (req, res) => {
  try {
    const { payment_status, payment_mode } = req.body || {};
    if (!PAYMENT_STATUSES.includes(payment_status)) return res.status(400).json({ error: 'Invalid payment status' });
    const wid = toId(req.params.id);
    if (!wid || !db.prepare('SELECT 1 FROM daily_wages WHERE id = ?').get(wid)) return res.status(404).json({ error: 'Wage record not found' });
    db.prepare(`
      UPDATE daily_wages
      SET payment_status = ?, payment_mode = ?, payment_date = ?
      WHERE id = ?
    `).run(payment_status, payment_mode || 'Cash', payment_status === 'Paid' ? todayStr() : null, wid);
    audit(req, 'status', 'wage', wid, { payment_status, payment_mode });

    res.json({ success: true, payment_status });
  } catch (error) {
    return serverError(res, error);
  }
});

app.delete('/api/wages/:id', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const old = db.prepare('SELECT * FROM daily_wages WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM daily_wages WHERE id = ?').run(req.params.id);
    audit(req, 'delete', 'wage', req.params.id, old ? { staff_id: old.staff_id, wage_date: old.wage_date, net_wage: old.net_wage } : null);
    res.json({ success: true, message: 'Wage record deleted' });
  } catch (error) {
    return serverError(res, error);
  }
});

// ==========================================
// 5. ADVANCES & RECOVERIES API
// ==========================================

app.get('/api/advances', requireAuth, (req, res) => {
  try {
    let query = `
      SELECT a.*, s.name as staff_name, s.staff_code, s.phone
      FROM advances a
      JOIN staff s ON a.staff_id = s.id
    `;
    const params = [];
    if (isWorker(req)) {
      query += ` WHERE a.staff_id = ?`;
      params.push(req.user.staff_id);
    }
    query += ` ORDER BY a.request_date DESC`;
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    return serverError(res, error);
  }
});

app.post('/api/advances', requireAuth, requireRole(['Admin', 'Supervisor', 'Accountant']), (req, res) => {
  try {
    const { staff_id, request_date, amount, reason } = req.body;
    if (!staff_id || !amount) {
      return res.status(400).json({ error: 'Staff and amount are required' });
    }
    if (!(Number(amount) > 0)) return res.status(400).json({ error: 'Amount must be greater than zero' });
    if (!db.prepare('SELECT 1 FROM staff WHERE id = ?').get(staff_id)) return res.status(400).json({ error: 'Staff member does not exist' });
    if (request_date && !isValidDate(request_date)) return res.status(400).json({ error: 'Invalid request date' });
    const stmt = db.prepare(`
      INSERT INTO advances (staff_id, request_date, amount, reason, status)
      VALUES (?, ?, ?, ?, 'Active')
    `);
    const result = stmt.run(staff_id, request_date || todayStr(), Number(amount), reason || '');
    const advance = db.prepare('SELECT * FROM advances WHERE id = ?').get(result.lastInsertRowid);
    audit(req, 'create', 'advance', advance.id, { staff_id, amount: Number(amount) });
    res.status(201).json(advance);
  } catch (error) {
    return serverError(res, error);
  }
});

// Record a (partial) recovery against an advance. Status moves Active -> Partially Recovered -> Recovered.
app.patch('/api/advances/:id/recover', requireAuth, requireRole(['Admin', 'Accountant']), (req, res) => {
  try {
    const id = toId(req.params.id);
    const adv = id && db.prepare('SELECT * FROM advances WHERE id = ?').get(id);
    if (!adv) return res.status(404).json({ error: 'Advance not found' });
    const amt = Number(req.body?.amount);
    if (!(amt > 0)) return res.status(400).json({ error: 'Recovery amount must be greater than zero' });
    const outstanding = adv.amount - adv.recovered_amount;
    if (amt > outstanding + 0.005) return res.status(400).json({ error: `Recovery exceeds outstanding balance (${outstanding.toFixed(2)})` });
    const recovered = Math.min(adv.amount, adv.recovered_amount + amt);
    const status = recovered >= adv.amount - 0.005 ? 'Recovered' : 'Partially Recovered';
    db.prepare('UPDATE advances SET recovered_amount = ?, status = ? WHERE id = ?').run(recovered, status, id);
    audit(req, 'recover', 'advance', id, { amount: amt, recovered, status });
    res.json(db.prepare('SELECT * FROM advances WHERE id = ?').get(id));
  } catch (error) {
    return serverError(res, error);
  }
});

app.delete('/api/advances/:id', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM advances WHERE id = ?').run(req.params.id);
    audit(req, 'delete', 'advance', req.params.id);
    res.json({ success: true });
  } catch (error) {
    return serverError(res, error);
  }
});

// ==========================================
// 6. DASHBOARD & OVERVIEW STATS API
// ==========================================

app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  try {
    const today = todayStr();
    // Workers only ever see figures about themselves.
    const sid = isWorker(req) ? req.user.staff_id : null;
    const scope = (col) => (sid ? ` AND ${col} = ${Number(sid)}` : '');

    const totalStaff = sid
      ? 1
      : db.prepare("SELECT COUNT(*) as count FROM staff WHERE status = 'Active'").get().count;

    const todayAttendance = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'Half Day' THEN 1 END) as half_day_count,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN COALESCE(overtime_hours, 0) > 0 THEN 1 END) as overtime_count
      FROM attendance
      WHERE date = ?${scope('staff_id')}
    `).get(today);

    const todayWages = db.prepare(`
      SELECT
        COALESCE(SUM(net_wage), 0) as total_amount,
        COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN net_wage ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN payment_status != 'Paid' THEN net_wage ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(units_completed), 0) as total_units_completed,
        COUNT(*) as total_entries
      FROM daily_wages
      WHERE wage_date = ?${scope('staff_id')}
    `).get(today);

    const last7DaysTrend = db.prepare(`
      SELECT
        wage_date,
        COALESCE(SUM(net_wage), 0) as total_wage,
        COALESCE(SUM(units_completed), 0) as total_units,
        COUNT(DISTINCT staff_id) as active_workers
      FROM daily_wages
      WHERE wage_date >= date(?, '-6 days') AND wage_date <= ?${scope('staff_id')}
      GROUP BY wage_date
      ORDER BY wage_date ASC
    `).all(today, today);

    const jobDistribution = db.prepare(`
      SELECT
        j.category,
        j.title,
        COALESCE(SUM(w.net_wage), 0) as total_wages,
        COALESCE(SUM(w.units_completed), 0) as total_units,
        COUNT(w.id) as task_count
      FROM daily_wages w
      JOIN job_types j ON w.job_type_id = j.id
      WHERE 1=1${scope('w.staff_id')}
      GROUP BY j.id
      ORDER BY total_wages DESC
      LIMIT 6
    `).all();

    const recentActivity = db.prepare(`
      SELECT w.*, s.name as staff_name, s.staff_code, j.title as job_title, j.unit_name
      FROM daily_wages w
      JOIN staff s ON w.staff_id = s.id
      LEFT JOIN job_types j ON w.job_type_id = j.id
      WHERE 1=1${scope('w.staff_id')}
      ORDER BY w.id DESC
      LIMIT 6
    `).all();

    res.json({
      today,
      totalStaff,
      attendance: todayAttendance,
      wages: todayWages,
      trend: last7DaysTrend,
      jobDistribution,
      recentActivity
    });
  } catch (error) {
    return serverError(res, error, 'Error fetching dashboard stats');
  }
});

// ==========================================
// 7. COMPANY SETTINGS API
// ==========================================

app.get('/api/settings', requireAuth, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
    res.json(settings);
  } catch (error) {
    return serverError(res, error);
  }
});

app.put('/api/settings', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const { company_name, tagline, address, phone, email, gstin, esi_code, currency_symbol, standard_working_hours } = req.body || {};
    if (!company_name || !String(company_name).trim()) return res.status(400).json({ error: 'Company name is required' });
    db.prepare(`
      UPDATE company_settings SET
        company_name = ?, tagline = ?, address = ?, phone = ?, email = ?,
        gstin = ?, esi_code = ?, currency_symbol = ?, standard_working_hours = ?
      WHERE id = 1
    `).run(
      company_name, tagline, address, phone, email,
      gstin, esi_code, currency_symbol || '₹', Number(standard_working_hours) || 8
    );
    const updated = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
    audit(req, 'update', 'settings', 1);
    res.json(updated);
  } catch (error) {
    return serverError(res, error);
  }
});

// ==========================================
// 8. AUDIT LOG (Admin only, read-only)
// ==========================================
app.get('/api/audit', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    res.json(db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset));
  } catch (error) {
    return serverError(res, error);
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Unknown API routes -> JSON 404 (never fall through to the SPA)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// In production the same process serves the built frontend, so one service is enough to deploy.
const distDir = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// Last-resort handler (bad JSON bodies, thrown errors)
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
  if (err?.status === 413) return res.status(413).json({ error: 'Request body too large' });
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend Server with RBAC running on port ${PORT}`);
});
