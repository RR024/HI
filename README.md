# WorkPulse Pro - Daily Staff, Attendance & Piece-Rate Wages Management System

A comprehensive, production-ready full-stack web application designed for companies to manage **staff records with conditional family details (Spouse/Parents)**, **daily attendance & overtime**, **piece-rate work definitions (e.g., ₹100 per 100 kg)**, **daily wage calculations**, **bank disbursements**, and **statutory ESI compliance**.

---

## 🌟 Key Features & Requirements Covered

### 0. 🔐 Role-Based Access Control (RBAC) Login System
* **Enterprise Authentication with JWT & Bcrypt Password Hashing**:
  * **Role-Based Permissions**: UI tabs, API endpoints, and data views adapt dynamically based on the authenticated user's role.
* **Pre-Configured Demo Accounts (1-Click Demo Login in UI)**:
  | Role | Username | Password | Access Scope & Permissions |
  |---|---|---|---|
  | 👑 **Admin** | `admin` | `admin123` | **Full unrestricted access**: Staff CRUD & delete, Job schemes, Attendance, Daily wages, Payouts, Payslips, Bank & ESI exports, Company settings, and User management. |
  | 👔 **Supervisor** | `supervisor` | `super123` | **Floor operations**: View & add staff, mark daily attendance & overtime, log daily piece-rate wages, simulate rates. |
  | 💼 **Accountant** | `accountant` | `account123` | **Payroll & finance**: View staff, settle daily wages (Paid/Pending), generate worker payslips, export Bank NEFT & ESI statements. |
  | 👷 **Worker** | `ramesh` | `ramesh123` | **Self-service portal**: View own bio-data & ID card, view personal attendance logs, track piece-rate earnings, and print monthly payslips. |
* **User Administration (Admin Only)**:
  * Create new user accounts, assign roles (`Admin`, `Supervisor`, `Accountant`, `Worker`), link worker logins to Staff Master records, reset passwords, and toggle account statuses.
* **Personal & KYC Details**:
  * Full Name, Gender, Age (auto-calculated from DOB), Date of Birth (DOB).
  * 10-Digit Phone Number & 12-Digit formatted Aadhaar UID.
  * Residential Address.
* **Dynamic Conditional Family Details**:
  * 💍 **If Married (Yes)**: Dynamically requests **Spouse Name**, **Spouse Phone**, and **Spouse Occupation**.
  * 👨‍👩‍👧 **If Single / Unmarried (No)**: Dynamically requests **Father's Name**, **Mother's Name**, **Parent Contact Phone**, and **Parent Address**.
* **Employment & Statutory Details**:
  * Date of Joining (DOJ), Designation / Role, Wage Scheme (Piece-rate / Daily Wage / Monthly).
  * **Bank Account Details**: Bank Name, Account Number, IFSC Code, Branch Name (for direct wage credit).
  * **Statutory Compliance**: ESI Number (Employee State Insurance) & PF Number.
  * **Printable Worker Bio-Data / ID Card View**.
  * **Export Staff Directory to Excel (.xlsx)** with 1 click.

---

### 2. 💼 Work & Job Rates Master (Piece-Rate Scheme)
* Configurable piece-rate catalog for different job operations:
  * Example: **"Raw Material Unloading" ➔ ₹100 per 100 kg** (Effective ₹1.00 / kg).
  * Example: **"Cotton Bale Sorting" ➔ ₹150 per 100 kg** (Effective ₹1.50 / kg).
  * Example: **"50kg Bag Stitching" ➔ ₹12 per bag**.
  * Example: **"Scrap Metal Sorting" ➔ ₹80 per 100 kg**.
* **Live Interactive Rate Simulator**: Enter any volume (e.g., 250 kg) to test and verify the formula before task logging.
* Full CRUD (Add / Edit / Remove job schemes with categories).

---

### 3. 📅 Daily Attendance & Shift Register
* Daily attendance tracking with 1-click **"Mark All Present"** / **"Mark All Absent"**.
* Per-worker status: **Present**, **Half Day**, **Absent**, **Paid Leave**.
* **Overtime Hours Tracking** (e.g., 1.5 hrs, 2 hrs) & Shift timing (Day / Night / General Shift).
* Remarks & Attendance notes.

---

### 4. 💵 Daily Wages & Work Tracker
* Instant daily work logger:
  * Select Worker ➔ Select Job Scheme ➔ Enter Volume (e.g., 350 kg) ➔ Instant formula calculation:
    $$\text{Base Wage} = 350\text{ kg} \times \frac{₹100}{100\text{ kg}} = ₹350.00$$
  * Add **Overtime (₹)**, **Bonus/Incentive (₹)**, Deduct **Advances/Loans (₹)**.
  * Auto-calculated **Net Wage**.
* **1-Click Settlement**: Toggle between **Paid** and **Pending** status.
* Payment modes: Cash, Bank Transfer (NEFT/IMPS), UPI, Cheque.
* Search by worker, date filter, job filter, and payment status filter.

---

### 5. 📑 Payslips, Bank Statements & Statutory Reports
* **Printable Worker Wage Slip / Payslip**: Formal printable slip with company header, worker details, KYC Aadhaar, bank details, itemized daily work logs, overtime additions, advance deductions, and signature lines.
* **Bank NEFT Transfer Advice**: Export ready-to-upload payroll statement with beneficiary account numbers, IFSC codes, and net wage totals in Excel.
* **ESI Monthly Contribution Register**: Computes statutory 0.75% employee and 3.25% employer ESI remittances with Excel export.

---

### 6. 📊 Executive Dashboard & Analytics
* Summary KPI cards: Total Staff, Today's Attendance %, Today's Total Wages, Today's Output Volume.
* 7-Day Wage Disbursement & Production Volume Trend Bar Chart.
* Work category breakdown & recent wage activity feed.

---

## 🚀 Running the Project

### Quick Start:
```bash
# Start both Backend API Server and Frontend Client concurrently
npm run dev
```

* **Frontend UI**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:5000`
* **SQLite Database**: Stored automatically in `server/database.sqlite` (pre-seeded with sample workers, attendance logs, and piece-rate records).

---

## 🛠️ Tech Stack
* **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, xlsx, date-fns
* **Backend**: Node.js, Express.js REST API, SQLite (`better-sqlite3` with WAL mode & Foreign Keys)
