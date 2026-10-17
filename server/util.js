// Shared helpers: timezone-aware dates, validation, constants.

export const TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';
export const ROLES = ['Admin', 'Supervisor', 'Accountant', 'Worker'];
export const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Half Day', 'Overtime', 'Paid Leave'];
export const PAYMENT_STATUSES = ['Pending', 'Paid', 'Partially Paid'];

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's date (YYYY-MM-DD) in the business timezone, NOT UTC. */
export function todayStr(date = new Date()) {
  return fmt.format(date);
}

/** Add n days to a YYYY-MM-DD string. */
export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

export function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

/** Exact age in whole years from a YYYY-MM-DD DOB. */
export function calcAge(dob, today = todayStr()) {
  const [by, bm, bd] = dob.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

const digits = (v) => String(v ?? '').replace(/\D/g, '');

/**
 * Validates and normalises the staff payload. Returns { error } or { value }.
 * `partial` is unused for now; PUT sends the full record like POST does.
 */
export function validateStaff(body) {
  const b = body || {};
  const required = ['name', 'gender', 'dob', 'address', 'phone', 'aadhaar_num', 'marital_status', 'doj', 'bank_name', 'account_num', 'ifsc_code'];
  for (const k of required) {
    if (b[k] === undefined || b[k] === null || String(b[k]).trim() === '') {
      return { error: 'Please provide all mandatory fields (Name, Gender, DOB, Address, Phone, Aadhaar, Marital Status, DOJ, Bank Details)' };
    }
  }
  if (!['Male', 'Female', 'Other'].includes(b.gender)) return { error: 'Gender must be Male, Female or Other' };
  if (!['Single', 'Married', 'Divorced', 'Widowed'].includes(b.marital_status)) return { error: 'Invalid marital status' };
  if (!isValidDate(b.dob) || !isValidDate(b.doj)) return { error: 'DOB and Date of Joining must be valid dates (YYYY-MM-DD)' };
  if (b.dob > todayStr()) return { error: 'Date of birth cannot be in the future' };
  const age = calcAge(b.dob);
  if (age < 14 || age > 100) return { error: 'Date of birth gives an invalid age (must be 14-100)' };

  const phone = digits(b.phone);
  if (phone.length !== 10) return { error: 'Phone number must be exactly 10 digits' };
  const aadhaar = digits(b.aadhaar_num);
  if (aadhaar.length !== 12) return { error: 'Aadhaar number must be exactly 12 digits' };
  const ifsc = String(b.ifsc_code).trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return { error: 'IFSC code is invalid (expected format: ABCD0XXXXXX)' };
  const account = String(b.account_num).replace(/\s/g, '');
  if (!/^\d{6,20}$/.test(account)) return { error: 'Account number must be 6-20 digits' };

  const rate = Number(b.daily_rate ?? 0);
  if (!Number.isFinite(rate) || rate < 0) return { error: 'Daily rate must be a non-negative number' };
  if (b.status && !['Active', 'Inactive', 'On Leave'].includes(b.status)) return { error: 'Invalid staff status' };

  return {
    value: {
      ...b,
      name: String(b.name).trim(),
      address: String(b.address).trim(),
      phone,
      // keep the human-friendly "XXXX XXXX XXXX" format
      aadhaar_num: aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3'),
      ifsc_code: ifsc,
      account_num: account,
      age,
      daily_rate: rate,
    },
  };
}

export function isStrongEnoughPassword(p) {
  return typeof p === 'string' && p.length >= 8 && p.length <= 128;
}
