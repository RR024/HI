import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Users & RBAC table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Worker', -- 'Admin', 'Supervisor', 'Accountant', 'Worker'
      staff_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Inactive'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
    );
  `);

  // 2. Staff table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      age INTEGER NOT NULL,
      dob TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      aadhaar_num TEXT NOT NULL UNIQUE,
      marital_status TEXT NOT NULL, -- 'Married' | 'Single' | 'Divorced' | 'Widowed'
      
      -- If Married -> Spouse details
      spouse_name TEXT,
      spouse_phone TEXT,
      spouse_occupation TEXT,
      
      -- If Single / Unmarried -> Parents details
      father_name TEXT,
      mother_name TEXT,
      parent_phone TEXT,
      parent_address TEXT,
      
      -- Employment & Financial details
      doj TEXT NOT NULL, -- Date of Joining
      role TEXT NOT NULL DEFAULT 'Worker',
      wage_type TEXT NOT NULL DEFAULT 'Piece Rate',
      daily_rate REAL DEFAULT 0,
      
      -- Bank Details
      bank_name TEXT NOT NULL,
      account_num TEXT NOT NULL,
      ifsc_code TEXT NOT NULL,
      branch_name TEXT NOT NULL,
      
      -- Regulatory
      esi_num TEXT,
      pf_num TEXT,
      
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Job / Work Types Master
    CREATE TABLE IF NOT EXISTS job_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'General',
      rate_amount REAL NOT NULL,
      unit_quantity REAL NOT NULL,
      unit_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Daily Attendance table
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      overtime_hours REAL DEFAULT 0,
      shift TEXT DEFAULT 'Day Shift',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      UNIQUE(staff_id, date)
    );

    -- 5. Daily Wages & Work Tracking table
    CREATE TABLE IF NOT EXISTS daily_wages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wage_date TEXT NOT NULL,
      staff_id INTEGER NOT NULL,
      job_type_id INTEGER,
      work_description TEXT NOT NULL,
      units_completed REAL NOT NULL DEFAULT 0,
      rate_snapshot TEXT,
      rate_per_single_unit REAL NOT NULL DEFAULT 0,
      base_amount REAL NOT NULL DEFAULT 0,
      overtime_amount REAL DEFAULT 0,
      bonus_amount REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_wage REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      payment_mode TEXT DEFAULT 'Cash',
      payment_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (job_type_id) REFERENCES job_types(id) ON DELETE SET NULL
    );

    -- 6. Advance / Loan Ledger
    CREATE TABLE IF NOT EXISTS advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      request_date TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'Active',
      recovered_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    -- 7. Company Settings
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL,
      tagline TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      gstin TEXT,
      esi_code TEXT,
      currency_symbol TEXT DEFAULT '₹',
      standard_working_hours REAL DEFAULT 8
    );
  `);

  // Initialize company settings default if empty
  const hasSettings = db.prepare('SELECT COUNT(*) as count FROM company_settings').get();
  if (hasSettings.count === 0) {
    db.prepare(`
      INSERT INTO company_settings (id, company_name, tagline, address, phone, email, gstin, esi_code, currency_symbol, standard_working_hours)
      VALUES (1, 'Apex Agro & Industrial Works Pvt Ltd', 'Daily Production, Piece-Rate & Payroll System', 'Plot 42, Industrial Growth Center, Phase 2, Coimbatore, Tamil Nadu - 641001', '+91 98450 12345', 'operations@apexindustries.in', '33AAAAA0000A1Z5', 'ESI-54000987650001001', '₹', 8)
    `).run();
  }

  // Seed default Users & sample data
  seedInitialData();
}

function seedInitialData() {
  // 1. Seed Users for RBAC if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    console.log('Seeding RBAC Users...');
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, name, role, staff_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Active')
    `);

    const salt = bcrypt.genSaltSync(10);

    // 1. Admin: admin / admin123
    insertUser.run('admin', 'admin@apexindustries.in', bcrypt.hashSync('admin123', salt), 'Rajesh V. (System Admin)', 'Admin', null);
    
    // 2. Supervisor: supervisor / super123
    insertUser.run('supervisor', 'supervisor@apexindustries.in', bcrypt.hashSync('super123', salt), 'Senthil Nathan (Floor Lead)', 'Supervisor', null);
    
    // 3. Accountant: accountant / account123
    insertUser.run('accountant', 'accounts@apexindustries.in', bcrypt.hashSync('account123', salt), 'Pooja Sharma (Accounts)', 'Accountant', null);
    
    // 4. Worker: ramesh / ramesh123 (linked to Staff 1)
    insertUser.run('ramesh', 'ramesh@apexindustries.in', bcrypt.hashSync('ramesh123', salt), 'Ramesh Kumar (Worker)', 'Worker', 1);

    console.log('RBAC users seeded successfully.');
  }

  // 2. Seed Work / Job Types if empty
  const jobCount = db.prepare('SELECT COUNT(*) as count FROM job_types').get();
  if (jobCount.count === 0) {
    const insertJob = db.prepare(`
      INSERT INTO job_types (code, title, description, category, rate_amount, unit_quantity, unit_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const jobs = [
      ['JOB-101', 'Raw Material Unloading & Stacking', 'Manual unloading from trucks and pallet stacking (100 Rs per 100 kg)', 'Loading', 100, 100, 'kg'],
      ['JOB-102', 'Cotton Bale Sorting & Grading', 'Inspecting staple length and sorting grade-A bales (150 Rs per 100 kg)', 'Processing', 150, 100, 'kg'],
      ['JOB-103', '50kg Bag Stitching & Sealing', 'Stitching and tagging heavy duty packaging bags (12 Rs per bag)', 'Packaging', 12, 1, 'bags'],
      ['JOB-104', 'Scrap Metal Sorting & Cleaning', 'Sorting high purity iron scrap chunks (80 Rs per 100 kg)', 'Sorting', 80, 100, 'kg'],
      ['JOB-105', 'Conveyor Belt Loading Shift', 'Daily fixed loading shift assistance (450 Rs per 8-hour shift)', 'General', 450, 1, 'shifts'],
      ['JOB-106', 'Finished Box Palletizing', 'Loading finished carton boxes onto wooden pallets (40 Rs per 10 boxes)', 'Packaging', 40, 10, 'boxes']
    ];

    for (const job of jobs) {
      insertJob.run(...job);
    }
  }

  // 3. Seed Staff Members if empty
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get();
  if (staffCount.count === 0) {
    const insertStaff = db.prepare(`
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

    const staffList = [
      [
        'STF-001', 'Ramesh Kumar', 'Male', 34, '1992-05-14',
        '14/B Gandhi Nagar, Pollachi Road, Coimbatore', '9842112345', '4521 8890 1234',
        'Married', 'Sunita Devi', '9842112346', 'Homemaker',
        null, null, null, null,
        '2022-03-15', 'Senior Loader', 'Piece Rate', 450,
        'State Bank of India', '30981245678', 'SBIN0001234', 'Pollachi Main Branch',
        'ESI-310045678912', 'PF-TN/CBE/0045612/01', 'Active'
      ],
      [
        'STF-002', 'Murugan V.', 'Male', 24, '2002-09-20',
        '78 Anna Street, Singanallur, Coimbatore', '9789054321', '6734 9912 8765',
        'Single', null, null, null,
        'Velusamy K.', 'Kamalam V.', '9789054320', '78 Anna Street, Singanallur',
        '2023-06-01', 'Sorting Worker', 'Piece Rate', 400,
        'Canara Bank', '12450100087654', 'CNRB0001245', 'Singanallur Branch',
        'ESI-310045678913', 'PF-TN/CBE/0045612/02', 'Active'
      ],
      [
        'STF-003', 'Lakshmi Priya', 'Female', 29, '1997-11-08',
        '23 Bharathi Street, Peelamedu, Coimbatore', '9443219876', '8912 3456 7890',
        'Married', 'Karthik Raja', '9443219875', 'Electrician',
        null, null, null, null,
        '2021-08-10', 'Packaging Operator', 'Piece Rate', 420,
        'HDFC Bank', '50100234567891', 'HDFC0000456', 'Peelamedu Branch',
        'ESI-310045678914', 'PF-TN/CBE/0045612/03', 'Active'
      ],
      [
        'STF-004', 'Suresh Babu', 'Male', 22, '2004-02-18',
        '55 Mariamman Kovil Street, Kurichi, Coimbatore', '9952044332', '3456 7890 1234',
        'Single', null, null, null,
        'Babu Rao', 'Meenakshi B.', '9952044330', '55 Mariamman Kovil St, Kurichi',
        '2024-01-15', 'Material Handler', 'Piece Rate', 380,
        'Indian Bank', '65432198701', 'IDIB000K123', 'Kurichi Industrial Estate',
        'ESI-310045678915', 'PF-TN/CBE/0045612/04', 'Active'
      ],
      [
        'STF-005', 'Anand Raj', 'Male', 38, '1988-12-04',
        '102 Thillai Nagar, PN Pudur, Coimbatore', '9894077665', '7890 1234 5678',
        'Married', 'Revathi Anand', '9894077660', 'Tailor',
        null, null, null, null,
        '2020-02-01', 'Shift Supervisor', 'Daily Wage', 550,
        'Bank of Baroda', '45890100012345', 'BARB0COIMBA', 'PN Pudur Branch',
        'ESI-310045678916', 'PF-TN/CBE/0045612/05', 'Active'
      ],
      [
        'STF-006', 'Kavitha Devi', 'Female', 21, '2005-04-12',
        '9 Cross Road, Sundarapuram, Coimbatore', '9629088771', '2345 6789 0123',
        'Single', null, null, null,
        'Dharmalingam P.', 'Parvathi D.', '9629088770', '9 Cross Road, Sundarapuram',
        '2024-04-10', 'Bag Stitcher', 'Piece Rate', 400,
        'Punjab National Bank', '18900015000234', 'PUNB0189000', 'Sundarapuram Branch',
        'ESI-310045678917', 'PF-TN/CBE/0045612/06', 'Active'
      ]
    ];

    for (const s of staffList) {
      insertStaff.run(...s);
    }
  }

  // 4. Seed Attendance and Wages if empty
  const wageCount = db.prepare('SELECT COUNT(*) as count FROM daily_wages').get();
  if (wageCount.count === 0) {
    const today = new Date().toISOString().split('T')[0];
    const d1 = new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0];
    const d2 = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];

    const insertAttendance = db.prepare(`
      INSERT INTO attendance (staff_id, date, status, overtime_hours, shift, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const dates = [d2, d1, today];
    for (const d of dates) {
      insertAttendance.run(1, d, 'Present', d === today ? 2 : 0, 'Day Shift', 'On time');
      insertAttendance.run(2, d, 'Present', 0, 'Day Shift', 'Morning slot');
      insertAttendance.run(3, d, 'Present', 1, 'Day Shift', 'Pack unit 2');
      insertAttendance.run(4, d, d === d1 ? 'Half Day' : 'Present', 0, 'Day Shift', '');
      insertAttendance.run(5, d, 'Present', 2, 'General Shift', 'Floor lead');
      insertAttendance.run(6, d, d === d2 ? 'Absent' : 'Present', 0, 'Day Shift', '');
    }

    const insertWage = db.prepare(`
      INSERT INTO daily_wages (
        wage_date, staff_id, job_type_id, work_description,
        units_completed, rate_snapshot, rate_per_single_unit,
        base_amount, overtime_amount, bonus_amount, deductions, net_wage,
        payment_status, payment_mode, notes
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    insertWage.run(today, 1, 1, 'Unloaded 3 trucks of raw goods (350 kg)', 350, '₹100 per 100 kg', 1.00, 350, 100, 20, 0, 470, 'Paid', 'Cash', 'Cleared in evening');
    insertWage.run(today, 2, 2, 'Graded 280 kg of cotton bales', 280, '₹150 per 100 kg', 1.50, 420, 0, 0, 50, 370, 'Pending', 'Bank Transfer', 'Advance deduction of ₹50 applied');
    insertWage.run(today, 3, 3, 'Stitched 45 bags with batch tags', 45, '₹12 per 1 bag', 12.00, 540, 50, 0, 0, 590, 'Paid', 'UPI', 'UPI ref: 9081239845');
    insertWage.run(today, 4, 4, 'Sorted scrap iron yard section B (500 kg)', 500, '₹80 per 100 kg', 0.80, 400, 0, 0, 0, 400, 'Pending', 'Cash', '');
    insertWage.run(today, 6, 3, 'Stitched and palletized 35 bags', 35, '₹12 per 1 bag', 12.00, 420, 0, 0, 0, 420, 'Paid', 'Cash', 'Paid after shift');

    insertWage.run(d1, 1, 1, 'Unloaded 400 kg lorry stock', 400, '₹100 per 100 kg', 1.00, 400, 0, 0, 0, 400, 'Paid', 'Cash', 'Completed');
    insertWage.run(d1, 2, 2, 'Graded 300 kg cotton', 300, '₹150 per 100 kg', 1.50, 450, 0, 0, 0, 450, 'Paid', 'Cash', 'Completed');
    insertWage.run(d1, 3, 3, 'Stitched 50 bags', 50, '₹12 per 1 bag', 12.00, 600, 0, 0, 0, 600, 'Paid', 'UPI', 'Completed');
  }
}

export default db;
