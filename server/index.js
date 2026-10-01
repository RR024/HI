import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'workpulse_super_secret_rbac_jwt_key_2026';

app.use(cors());
app.use(express.json());

// Initialize SQLite DB
initDatabase();

// ==========================================
// AUTH & RBAC MIDDLEWARE
// ==========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token, allow for public or fallback, but assign null user
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
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

app.use(authenticateToken);

// ==========================================
// 0. AUTHENTICATION & USER MANAGEMENT API
// ==========================================

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username/Email and Password are required' });
    }

    const user = db.prepare(`
      SELECT * FROM users
      WHERE (username = ? OR email = ?) AND status = 'Active'
    `).get(username.trim(), username.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or account is inactive' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      staff_id: user.staff_id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: tokenPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Current User Profile endpoint
app.get('/api/auth/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, name, role, staff_id, status FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// Create new user (Admin only)
app.post('/api/auth/users', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const { username, email, password, name, role, staff_id } = req.body;
    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ error: 'Username, Email, Password, Name, and Role are required' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, name, role, staff_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Active')
    `);

    const result = stmt.run(username.trim().toLowerCase(), email.trim().toLowerCase(), hash, name.trim(), role, staff_id || null);
    const created = db.prepare('SELECT id, username, email, name, role, staff_id, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Username or Email already exists in the system' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update user (Admin only)
app.put('/api/auth/users/:id', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    const { name, email, role, staff_id, status, password } = req.body;
    
    if (password && password.trim()) {
      const hash = bcrypt.hashSync(password.trim(), 10);
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, role = ?, staff_id = ?, status = ?, password_hash = ?
        WHERE id = ?
      `).run(name, email, role, staff_id || null, status || 'Active', hash, req.params.id);
    } else {
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, role = ?, staff_id = ?, status = ?
        WHERE id = ?
      `).run(name, email, role, staff_id || null, status || 'Active', req.params.id);
    }

    const updated = db.prepare('SELECT id, username, email, name, role, staff_id, status, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (Admin only)
app.delete('/api/auth/users/:id', requireAuth, requireRole(['Admin']), (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own logged-in admin account!' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'User account deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 1. STAFF CRUD & DETAILS API
// ==========================================

// Get all staff
app.get('/api/staff', (req, res) => {
  try {
    const { search, status, marital_status, role } = req.query;
    let query = `SELECT * FROM staff WHERE 1=1`;
    const params = [];

    // If logged in as worker, restrict to own record if staff_id is linked
    if (req.user && req.user.role === 'Worker' && req.user.staff_id) {
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
    const staffMembers = db.prepare(query).all(...params);
    res.json(staffMembers);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single staff by ID
app.get('/api/staff/:id', (req, res) => {
  try {
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
    res.status(500).json({ error: error.message });
  }
});

// Create new Staff member (Admin, Supervisor, Accountant)
app.post('/api/staff', (req, res) => {
  try {
    const {
      name, gender, age, dob, address, phone, aadhaar_num,
      marital_status, spouse_name, spouse_phone, spouse_occupation,
      father_name, mother_name, parent_phone, parent_address,
      doj, role, wage_type, daily_rate,
      bank_name, account_num, ifsc_code, branch_name,
      esi_num, pf_num, status
    } = req.body;

    if (!name || !gender || !dob || !address || !phone || !aadhaar_num || !marital_status || !doj || !bank_name || !account_num || !ifsc_code) {
      return res.status(400).json({ error: 'Please provide all mandatory fields (Name, Gender, DOB, Address, Phone, Aadhaar, Marital Status, DOJ, Bank Details)' });
    }

    const lastStaff = db.prepare('SELECT id FROM staff ORDER BY id DESC LIMIT 1').get();
    const nextNum = (lastStaff ? lastStaff.id : 0) + 1;
    const staff_code = `STF-${String(nextNum).padStart(3, '0')}`;

    let calculatedAge = age;
    if (!calculatedAge && dob) {
      const birth = new Date(dob);
      const diff = Date.now() - birth.getTime();
      calculatedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

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
      name.trim(),
      gender,
      calculatedAge || 25,
      dob,
      address.trim(),
      phone.trim(),
      aadhaar_num.trim(),
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
      daily_rate || 0,
      bank_name.trim(),
      account_num.trim(),
      ifsc_code.trim().toUpperCase(),
      branch_name ? branch_name.trim() : 'Main Branch',
      esi_num ? esi_num.trim() : null,
      pf_num ? pf_num.trim() : null,
      status || 'Active'
    );

    const newStaff = db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newStaff);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed: staff.aadhaar_num')) {
      return res.status(400).json({ error: 'A staff member with this Aadhaar Number already exists!' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update Staff
app.put('/api/staff/:id', (req, res) => {
  try {
    const {
      name, gender, age, dob, address, phone, aadhaar_num,
      marital_status, spouse_name, spouse_phone, spouse_occupation,
      father_name, mother_name, parent_phone, parent_address,
      doj, role, wage_type, daily_rate,
      bank_name, account_num, ifsc_code, branch_name,
      esi_num, pf_num, status
    } = req.body;

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
      name, gender, age, dob, address, phone, aadhaar_num,
      marital_status,
      marital_status === 'Married' ? spouse_name : null,
      marital_status === 'Married' ? spouse_phone : null,
      marital_status === 'Married' ? spouse_occupation : null,
      marital_status !== 'Married' ? father_name : null,
      marital_status !== 'Married' ? mother_name : null,
      marital_status !== 'Married' ? parent_phone : null,
      marital_status !== 'Married' ? parent_address : null,
      doj, role, wage_type, daily_rate || 0,
      bank_name, account_num, ifsc_code.toUpperCase(), branch_name,
      esi_num, pf_num, status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Staff (Admin only)
app.delete('/api/staff/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. JOB TYPES / WORK DEFINITIONS (Piece-rate)
// ==========================================

app.get('/api/jobs', (req, res) => {
  try {
    const jobs = db.prepare('SELECT * FROM job_types ORDER BY id ASC').all();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', (req, res) => {
  try {
    const { title, description, category, rate_amount, unit_quantity, unit_name } = req.body;
    if (!title || !rate_amount || !unit_quantity || !unit_name) {
      return res.status(400).json({ error: 'Title, Rate Amount, Unit Quantity, and Unit Name are required' });
    }

    const last = db.prepare('SELECT id FROM job_types ORDER BY id DESC LIMIT 1').get();
    const code = `JOB-${100 + ((last ? last.id : 0) + 1)}`;

    const stmt = db.prepare(`
      INSERT INTO job_types (code, title, description, category, rate_amount, unit_quantity, unit_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(code, title, description || '', category || 'General', Number(rate_amount), Number(unit_quantity), unit_name);
    const created = db.prepare('SELECT * FROM job_types WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id', (req, res) => {
  try {
    const { title, description, category, rate_amount, unit_quantity, unit_name, status } = req.body;
    db.prepare(`
      UPDATE job_types
      SET title = ?, description = ?, category = ?, rate_amount = ?, unit_quantity = ?, unit_name = ?, status = ?
      WHERE id = ?
    `).run(title, description, category, Number(rate_amount), Number(unit_quantity), unit_name, status || 'Active', req.params.id);

    const updated = db.prepare('SELECT * FROM job_types WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/jobs/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM job_types WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Job type removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. ATTENDANCE API
// ==========================================

app.get('/api/attendance', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    let query = `
      SELECT s.id as staff_id, s.staff_code, s.name, s.role, s.status as staff_status,
             a.id as attendance_id, a.date, a.status as attendance_status, a.overtime_hours, a.shift, a.notes
      FROM staff s
      LEFT JOIN attendance a ON s.id = a.staff_id AND a.date = ?
      WHERE s.status != 'Inactive'
    `;
    const params = [date];

    // If worker, only their attendance
    if (req.user && req.user.role === 'Worker' && req.user.staff_id) {
      query += ` AND s.id = ?`;
      params.push(req.user.staff_id);
    }

    query += ` ORDER BY s.id ASC`;
    const rows = db.prepare(query).all(...params);

    res.json({ date, records: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/bulk', (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and records array are required' });
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
    res.json({ success: true, message: `Attendance saved for ${records.length} staff members on ${date}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. DAILY WAGES & WORK TRACKING API
// ==========================================

app.get('/api/wages', (req, res) => {
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
    if (req.user && req.user.role === 'Worker' && req.user.staff_id) {
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
    const wages = db.prepare(query).all(...params);
    res.json(wages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wages', (req, res) => {
  try {
    const {
      wage_date, staff_id, job_type_id, work_description,
      units_completed, overtime_amount, bonus_amount, deductions,
      payment_status, payment_mode, notes
    } = req.body;

    if (!wage_date || !staff_id || !work_description) {
      return res.status(400).json({ error: 'Date, Staff ID, and Work Description are required' });
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
    const net_wage = Math.max(0, base_amount + ot + bonus - ded);

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
      payment_status === 'Paid' ? wage_date : null,
      notes || ''
    );

    const created = db.prepare(`
      SELECT w.*, s.name as staff_name, s.staff_code, j.title as job_title
      FROM daily_wages w
      JOIN staff s ON w.staff_id = s.id
      LEFT JOIN job_types j ON w.job_type_id = j.id
      WHERE w.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/wages/:id', (req, res) => {
  try {
    const {
      wage_date, staff_id, job_type_id, work_description,
      units_completed, base_amount, overtime_amount, bonus_amount, deductions,
      payment_status, payment_mode, notes
    } = req.body;

    let rate_snapshot = req.body.rate_snapshot;
    let rate_per_single_unit = req.body.rate_per_single_unit || 0;
    let calculatedBase = Number(base_amount) || 0;

    if (job_type_id) {
      const job = db.prepare('SELECT * FROM job_types WHERE id = ?').get(job_type_id);
      if (job) {
        rate_snapshot = `₹${job.rate_amount} per ${job.unit_quantity} ${job.unit_name}`;
        rate_per_single_unit = job.rate_amount / job.unit_quantity;
        calculatedBase = (Number(units_completed) || 0) * rate_per_single_unit;
      }
    }

    const ot = Number(overtime_amount) || 0;
    const bonus = Number(bonus_amount) || 0;
    const ded = Number(deductions) || 0;
    const net_wage = Math.max(0, calculatedBase + ot + bonus - ded);

    db.prepare(`
      UPDATE daily_wages SET
        wage_date = ?, staff_id = ?, job_type_id = ?, work_description = ?,
        units_completed = ?, rate_snapshot = ?, rate_per_single_unit = ?,
        base_amount = ?, overtime_amount = ?, bonus_amount = ?, deductions = ?, net_wage = ?,
        payment_status = ?, payment_mode = ?, notes = ?
      WHERE id = ?
    `).run(
      wage_date, staff_id, job_type_id || null, work_description,
      Number(units_completed) || 0, rate_snapshot, rate_per_single_unit,
      calculatedBase, ot, bonus, ded, net_wage,
      payment_status, payment_mode, notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM daily_wages WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/wages/:id/status', (req, res) => {
  try {
    const { payment_status, payment_mode } = req.body;
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE daily_wages
      SET payment_status = ?, payment_mode = ?, payment_date = ?
      WHERE id = ?
    `).run(payment_status, payment_mode || 'Cash', payment_status === 'Paid' ? today : null, req.params.id);

    res.json({ success: true, payment_status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/wages/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM daily_wages WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Wage record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. ADVANCES & RECOVERIES API
// ==========================================

app.get('/api/advances', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.*, s.name as staff_name, s.staff_code, s.phone
      FROM advances a
      JOIN staff s ON a.staff_id = s.id
      ORDER BY a.request_date DESC
    `).all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/advances', (req, res) => {
  try {
    const { staff_id, request_date, amount, reason } = req.body;
    if (!staff_id || !amount) {
      return res.status(400).json({ error: 'Staff and amount are required' });
    }
    const stmt = db.prepare(`
      INSERT INTO advances (staff_id, request_date, amount, reason, status)
      VALUES (?, ?, ?, ?, 'Active')
    `);
    const result = stmt.run(staff_id, request_date || new Date().toISOString().split('T')[0], Number(amount), reason || '');
    const advance = db.prepare('SELECT * FROM advances WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(advance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. DASHBOARD & OVERVIEW STATS API
// ==========================================

app.get('/api/dashboard/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const totalStaff = db.prepare("SELECT COUNT(*) as count FROM staff WHERE status = 'Active'").get().count;

    const todayAttendance = db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'Half Day' THEN 1 END) as half_day_count,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'Overtime' THEN 1 END) as overtime_count
      FROM attendance
      WHERE date = ?
    `).get(today);

    const todayWages = db.prepare(`
      SELECT 
        COALESCE(SUM(net_wage), 0) as total_amount,
        COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN net_wage ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN payment_status = 'Pending' THEN net_wage ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(units_completed), 0) as total_units_completed,
        COUNT(*) as total_entries
      FROM daily_wages
      WHERE wage_date = ?
    `).get(today);

    const last7DaysTrend = db.prepare(`
      SELECT 
        wage_date,
        COALESCE(SUM(net_wage), 0) as total_wage,
        COALESCE(SUM(units_completed), 0) as total_units,
        COUNT(DISTINCT staff_id) as active_workers
      FROM daily_wages
      WHERE wage_date >= date(?, '-6 days')
      GROUP BY wage_date
      ORDER BY wage_date ASC
    `).all(today);

    const jobDistribution = db.prepare(`
      SELECT 
        j.category,
        j.title,
        COALESCE(SUM(w.net_wage), 0) as total_wages,
        COALESCE(SUM(w.units_completed), 0) as total_units,
        COUNT(w.id) as task_count
      FROM daily_wages w
      JOIN job_types j ON w.job_type_id = j.id
      GROUP BY j.id
      ORDER BY total_wages DESC
      LIMIT 6
    `).all();

    const recentActivity = db.prepare(`
      SELECT w.*, s.name as staff_name, s.staff_code, j.title as job_title, j.unit_name
      FROM daily_wages w
      JOIN staff s ON w.staff_id = s.id
      LEFT JOIN job_types j ON w.job_type_id = j.id
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
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 7. COMPANY SETTINGS API
// ==========================================

app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const { company_name, tagline, address, phone, email, gstin, esi_code, currency_symbol, standard_working_hours } = req.body;
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
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server with RBAC running on port ${PORT}`);
});
