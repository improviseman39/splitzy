import express from 'express'
import pg from 'pg'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

dotenv.config()

const { Pool } = pg
const app = express()
const JWT_SECRET = process.env.JWT_SECRET

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

app.use(express.json({ limit: '10mb' }))

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false }
})

pool.connect((err) => {
  if (err) {
    console.error('❌ Error:', err.message)
  } else {
    console.log('✅ Connected to splitzy_db!')
  }
})

// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════

// REGISTER — creates your login account (only needs to be run once)
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const existing = await pool.query('SELECT id FROM accounts WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'An account with this email already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const result = await pool.query(
    'INSERT INTO accounts (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash]
  )
  res.json({ message: 'Account created', account: result.rows[0] })
})

// LOGIN — step 1: check email + password
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const result = await pool.query('SELECT * FROM accounts WHERE email = $1', [email])
  const account = result.rows[0]

  if (!account) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await bcrypt.compare(password, account.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const tempToken = jwt.sign(
    { accountId: account.id, purpose: account.totp_enabled ? 'verify-2fa' : 'setup-2fa' },
    JWT_SECRET,
    { expiresIn: '10m' }
  )

  res.json({
    step: account.totp_enabled ? 'verify-2fa' : 'setup-2fa',
    tempToken
  })
})

// 2FA SETUP — first time only: generates the QR code to scan
app.post('/api/auth/setup-2fa', async (req, res) => {
  const { tempToken } = req.body
  let payload
  try {
    payload = jwt.verify(tempToken, JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' })
  }
  if (payload.purpose !== 'setup-2fa') {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const account = (await pool.query(
    'SELECT * FROM accounts WHERE id = $1', [payload.accountId]
  )).rows[0]

  const secret = authenticator.generateSecret()
  await pool.query('UPDATE accounts SET totp_secret = $1 WHERE id = $2', [secret, account.id])

  const otpauth = authenticator.keyuri(account.email, 'Splitzy', secret)
  const qrCode = await QRCode.toDataURL(otpauth)

  res.json({ qrCode, secret })
})

// 2FA SETUP CONFIRM — verify the first code typed from the authenticator app
app.post('/api/auth/verify-2fa-setup', async (req, res) => {
  const { tempToken, code } = req.body
  let payload
  try {
    payload = jwt.verify(tempToken, JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' })
  }
  if (payload.purpose !== 'setup-2fa') {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const account = (await pool.query(
    'SELECT * FROM accounts WHERE id = $1', [payload.accountId]
  )).rows[0]

  const valid = authenticator.verify({ token: code, secret: account.totp_secret })
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect code, please try again' })
  }

  await pool.query('UPDATE accounts SET totp_enabled = true WHERE id = $1', [account.id])

  const token = jwt.sign({ accountId: account.id, purpose: 'session' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

// 2FA VERIFY — regular login, step 2: check the 6-digit code
app.post('/api/auth/verify-2fa', async (req, res) => {
  const { tempToken, code } = req.body
  let payload
  try {
    payload = jwt.verify(tempToken, JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' })
  }
  if (payload.purpose !== 'verify-2fa') {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const account = (await pool.query(
    'SELECT * FROM accounts WHERE id = $1', [payload.accountId]
  )).rows[0]

  const valid = authenticator.verify({ token: code, secret: account.totp_secret })
  if (!valid) {
    return res.status(401).json({ error: 'Incorrect code, please try again' })
  }

  const token = jwt.sign({ accountId: account.id, purpose: 'session' }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

// Middleware — protects routes that require a logged-in session
function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Not logged in' })
  const token = header.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.purpose !== 'session') throw new Error('bad purpose')
    req.accountId = payload.accountId
    next()
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' })
  }
}

// GET current logged-in account (used by Settings page)
app.get('/api/auth/me', authenticate, async (req, res) => {
  const account = (await pool.query(
    'SELECT id, email FROM accounts WHERE id = $1', [req.accountId]
  )).rows[0]
  res.json(account)
})

// RESET 2FA — clears the current secret so next login re-triggers QR setup
app.post('/api/auth/reset-2fa', authenticate, async (req, res) => {
  await pool.query(
    'UPDATE accounts SET totp_secret = NULL, totp_enabled = false WHERE id = $1',
    [req.accountId]
  )
  res.json({ message: '2FA reset. Please log in again to set it up.' })
})

// CHANGE PASSWORD — requires the current password to confirm it's really you
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  const account = (await pool.query(
    'SELECT * FROM accounts WHERE id = $1', [req.accountId]
  )).rows[0]

  const valid = await bcrypt.compare(currentPassword, account.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await pool.query('UPDATE accounts SET password_hash = $1 WHERE id = $2', [newHash, account.id])

  res.json({ message: 'Password changed' })
})

// ══════════════════════════════════════
// USERS  (this is your Friends list — unrelated to login accounts)
// ══════════════════════════════════════

// GET all users
app.get('/api/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY id')
  res.json(result.rows)
})

// ADD new user (with phone)
app.post('/api/users', async (req, res) => {
  const { name, email, avatar, phone } = req.body
  const result = await pool.query(
    'INSERT INTO users (name, email, avatar, phone) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, avatar, phone || null]
  )
  res.json(result.rows[0])
})

// ══════════════════════════════════════
// BILLS
// ══════════════════════════════════════

// GET all bills
app.get('/api/bills', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM bills ORDER BY created_at DESC'
  )
  res.json(result.rows)
})

// GET single bill with items and shares
app.get('/api/bills/:id', async (req, res) => {
  const bill = await pool.query(
    'SELECT * FROM bills WHERE id = $1',
    [req.params.id]
  )
  const items = await pool.query(
    'SELECT * FROM bill_items WHERE bill_id = $1',
    [req.params.id]
  )
  const shares = await pool.query(
    `SELECT item_shares.*, users.name, users.avatar
     FROM item_shares
     JOIN users ON users.id = item_shares.user_id
     WHERE item_id IN (
       SELECT id FROM bill_items WHERE bill_id = $1
     )`,
    [req.params.id]
  )
  res.json({
    bill: bill.rows[0],
    items: items.rows,
    shares: shares.rows
  })
})

// ADD new bill with items and photo
app.post('/api/bills', async (req, res) => {
  const { title, total, tax, tip, currency, items, photo } = req.body
  const billResult = await pool.query(
    'INSERT INTO bills (title, total, tax, tip, currency, created_by, photo) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [title, total, tax, tip, currency || 'AUD', 1, photo || null]
  )
  const bill = billResult.rows[0]
  for (const item of items) {
    const itemResult = await pool.query(
      'INSERT INTO bill_items (bill_id, name, price) VALUES ($1,$2,$3) RETURNING *',
      [bill.id, item.name, item.price]
    )
    if (item.sharedBy && item.sharedBy.length > 0) {
      for (const userId of item.sharedBy) {
        await pool.query(
          'INSERT INTO item_shares (item_id, user_id) VALUES ($1,$2)',
          [itemResult.rows[0].id, userId]
        )
      }
    }
  }
  res.json(bill)
})

// EDIT existing bill
app.put('/api/bills/:id', async (req, res) => {
  const { title, total, tax, tip, currency, items, photo } = req.body

  await pool.query(
    'UPDATE bills SET title=$1, total=$2, tax=$3, tip=$4, currency=$5, photo=$6 WHERE id=$7',
    [title, total, tax, tip, currency, photo || null, req.params.id]
  )

  const oldItems = await pool.query(
    'SELECT id FROM bill_items WHERE bill_id = $1',
    [req.params.id]
  )
  for (const item of oldItems.rows) {
    await pool.query(
      'DELETE FROM item_shares WHERE item_id = $1',
      [item.id]
    )
  }

  await pool.query(
    'DELETE FROM bill_items WHERE bill_id = $1',
    [req.params.id]
  )

  for (const item of items) {
    const itemResult = await pool.query(
      'INSERT INTO bill_items (bill_id, name, price) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, item.name, item.price]
    )
    if (item.sharedBy && item.sharedBy.length > 0) {
      for (const userId of item.sharedBy) {
        await pool.query(
          'INSERT INTO item_shares (item_id, user_id) VALUES ($1,$2)',
          [itemResult.rows[0].id, userId]
        )
      }
    }
  }

  const result = await pool.query(
    'SELECT * FROM bills WHERE id = $1',
    [req.params.id]
  )
  res.json(result.rows[0])
})

// DELETE bill
app.delete('/api/bills/:id', async (req, res) => {
  const items = await pool.query(
    'SELECT id FROM bill_items WHERE bill_id = $1',
    [req.params.id]
  )
  for (const item of items.rows) {
    await pool.query(
      'DELETE FROM item_shares WHERE item_id = $1',
      [item.id]
    )
  }
  await pool.query(
    'DELETE FROM bill_items WHERE bill_id = $1',
    [req.params.id]
  )
  await pool.query(
    'DELETE FROM bills WHERE id = $1',
    [req.params.id]
  )
  res.json({ message: 'Deleted' })
})

// ══════════════════════════════════════
// HOUSEHOLD EXPENSES
// ══════════════════════════════════════

// GET all household expenses (most recent first)
app.get('/api/household', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM household_expenses ORDER BY expense_date DESC, id DESC'
  )
  res.json(result.rows)
})

// ADD new household expense
app.post('/api/household', authenticate, async (req, res) => {
  const { title, category, amount, expense_date, notes } = req.body
  if (!title || !amount) {
    return res.status(400).json({ error: 'Title and amount are required' })
  }
  const result = await pool.query(
    `INSERT INTO household_expenses (title, category, amount, expense_date, notes)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5) RETURNING *`,
    [title, category || 'Other', amount, expense_date || null, notes || null]
  )
  res.json(result.rows[0])
})

// EDIT existing household expense
app.put('/api/household/:id', authenticate, async (req, res) => {
  const { title, category, amount, expense_date, notes } = req.body
  const result = await pool.query(
    `UPDATE household_expenses
     SET title=$1, category=$2, amount=$3, expense_date=$4, notes=$5
     WHERE id=$6 RETURNING *`,
    [title, category, amount, expense_date, notes || null, req.params.id]
  )
  res.json(result.rows[0])
})

// DELETE household expense
app.delete('/api/household/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM household_expenses WHERE id = $1', [req.params.id])
  res.json({ message: 'Deleted' })
})

// GET household summary — total this month + breakdown by category
app.get('/api/household/summary', authenticate, async (req, res) => {
  const monthTotal = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM household_expenses
     WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)`
  )
  const byCategory = await pool.query(
    `SELECT category, SUM(amount) as total FROM household_expenses
     WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)
     GROUP BY category ORDER BY total DESC`
  )
  res.json({
    monthTotal: monthTotal.rows[0].total,
    byCategory: byCategory.rows
  })
})

// ══════════════════════════════════════
// TRAVEL — TRIPS
// ══════════════════════════════════════

// GET all trips (most recent first)
app.get('/api/trips', authenticate, async (req, res) => {
  const result = await pool.query('SELECT * FROM trips ORDER BY created_at DESC')
  res.json(result.rows)
})

// GET single trip with its expenses + total spent
app.get('/api/trips/:id', authenticate, async (req, res) => {
  const trip = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id])
  const expenses = await pool.query(
    'SELECT * FROM trip_expenses WHERE trip_id = $1 ORDER BY expense_date DESC, id DESC',
    [req.params.id]
  )
  const total = expenses.rows.reduce((s, e) => s + parseFloat(e.amount), 0)
  res.json({
    trip: trip.rows[0],
    expenses: expenses.rows,
    total: total.toFixed(2)
  })
})

// ADD new trip
app.post('/api/trips', authenticate, async (req, res) => {
  const { name, destination, start_date, end_date, currency } = req.body
  if (!name) return res.status(400).json({ error: 'Trip name is required' })
  const result = await pool.query(
    `INSERT INTO trips (name, destination, start_date, end_date, currency)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, destination || null, start_date || null, end_date || null, currency || 'AUD']
  )
  res.json(result.rows[0])
})

// EDIT trip
app.put('/api/trips/:id', authenticate, async (req, res) => {
  const { name, destination, start_date, end_date, currency } = req.body
  const result = await pool.query(
    `UPDATE trips SET name=$1, destination=$2, start_date=$3, end_date=$4, currency=$5
     WHERE id=$6 RETURNING *`,
    [name, destination || null, start_date || null, end_date || null, currency, req.params.id]
  )
  res.json(result.rows[0])
})

// DELETE trip (cascades to its expenses automatically)
app.delete('/api/trips/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM trips WHERE id = $1', [req.params.id])
  res.json({ message: 'Deleted' })
})

// ══════════════════════════════════════
// TRAVEL — TRIP EXPENSES
// ══════════════════════════════════════

// ADD expense to a trip
app.post('/api/trips/:tripId/expenses', authenticate, async (req, res) => {
  const { title, category, amount, expense_date, notes } = req.body
  if (!title || !amount) {
    return res.status(400).json({ error: 'Title and amount are required' })
  }
  const result = await pool.query(
    `INSERT INTO trip_expenses (trip_id, title, category, amount, expense_date, notes)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6) RETURNING *`,
    [req.params.tripId, title, category || 'Other', amount, expense_date || null, notes || null]
  )
  res.json(result.rows[0])
})

// EDIT trip expense
app.put('/api/trip-expenses/:id', authenticate, async (req, res) => {
  const { title, category, amount, expense_date, notes } = req.body
  const result = await pool.query(
    `UPDATE trip_expenses SET title=$1, category=$2, amount=$3, expense_date=$4, notes=$5
     WHERE id=$6 RETURNING *`,
    [title, category, amount, expense_date, notes || null, req.params.id]
  )
  res.json(result.rows[0])
})

// DELETE trip expense
app.delete('/api/trip-expenses/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM trip_expenses WHERE id = $1', [req.params.id])
  res.json({ message: 'Deleted' })
})

// ══════════════════════════════════════
// LOANS & DEBTS
// ══════════════════════════════════════

// GET all loans (active ones first)
app.get('/api/loans', authenticate, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM loans ORDER BY status ASC, created_at DESC"
  )
  res.json(result.rows)
})

// GET total still owed across active loans
app.get('/api/loans-summary', authenticate, async (req, res) => {
  const result = await pool.query(
    "SELECT COALESCE(SUM(current_balance), 0) as total FROM loans WHERE status = 'active'"
  )
  res.json({ totalOwed: result.rows[0].total })
})

// GET single loan with its payment history
app.get('/api/loans/:id', authenticate, async (req, res) => {
  const loan = await pool.query('SELECT * FROM loans WHERE id = $1', [req.params.id])
  const payments = await pool.query(
    'SELECT * FROM loan_payments WHERE loan_id = $1 ORDER BY payment_date DESC, id DESC',
    [req.params.id]
  )
  res.json({ loan: loan.rows[0], payments: payments.rows })
})

// ADD new loan
app.post('/api/loans', authenticate, async (req, res) => {
  const {
    name, lender, loan_type, principal_amount, current_balance,
    interest_rate, minimum_payment, due_day, start_date, notes
  } = req.body
  if (!name || !principal_amount) {
    return res.status(400).json({ error: 'Name and principal amount are required' })
  }
  const result = await pool.query(
    `INSERT INTO loans
      (name, lender, loan_type, principal_amount, current_balance, interest_rate, minimum_payment, due_day, start_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      name, lender || null, loan_type || 'Other', principal_amount,
      current_balance ?? principal_amount, interest_rate || null,
      minimum_payment || null, due_day || null, start_date || null, notes || null
    ]
  )
  res.json(result.rows[0])
})

// EDIT loan
app.put('/api/loans/:id', authenticate, async (req, res) => {
  const {
    name, lender, loan_type, principal_amount, current_balance,
    interest_rate, minimum_payment, due_day, start_date, status, notes
  } = req.body
  const result = await pool.query(
    `UPDATE loans SET
      name=$1, lender=$2, loan_type=$3, principal_amount=$4, current_balance=$5,
      interest_rate=$6, minimum_payment=$7, due_day=$8, start_date=$9, status=$10, notes=$11
     WHERE id=$12 RETURNING *`,
    [
      name, lender || null, loan_type, principal_amount, current_balance,
      interest_rate || null, minimum_payment || null, due_day || null,
      start_date || null, status || 'active', notes || null, req.params.id
    ]
  )
  res.json(result.rows[0])
})

// DELETE loan (cascades to its payments automatically)
app.delete('/api/loans/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM loans WHERE id = $1', [req.params.id])
  res.json({ message: 'Deleted' })
})

// LOG a payment — automatically reduces the loan's current_balance,
// and marks it paid_off if the balance hits zero
app.post('/api/loans/:id/payments', authenticate, async (req, res) => {
  const { amount, payment_date, notes } = req.body
  if (!amount) return res.status(400).json({ error: 'Amount is required' })

  const payment = await pool.query(
    `INSERT INTO loan_payments (loan_id, amount, payment_date, notes)
     VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4) RETURNING *`,
    [req.params.id, amount, payment_date || null, notes || null]
  )

  const updated = await pool.query(
    'UPDATE loans SET current_balance = GREATEST(current_balance - $1, 0) WHERE id = $2 RETURNING *',
    [amount, req.params.id]
  )

  if (parseFloat(updated.rows[0].current_balance) <= 0) {
    await pool.query("UPDATE loans SET status = 'paid_off' WHERE id = $1", [req.params.id])
  }

  res.json(payment.rows[0])
})

// DELETE a payment — reverses it back onto the loan's balance
app.delete('/api/loan-payments/:id', authenticate, async (req, res) => {
  const existing = await pool.query('SELECT * FROM loan_payments WHERE id = $1', [req.params.id])
  if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found' })
  const p = existing.rows[0]

  await pool.query('DELETE FROM loan_payments WHERE id = $1', [req.params.id])
  await pool.query(
    "UPDATE loans SET current_balance = current_balance + $1, status = 'active' WHERE id = $2",
    [p.amount, p.loan_id]
  )
  res.json({ message: 'Deleted' })
})

// ══════════════════════════════════════
// SHOPPING — LIST ITEMS + HOME SUPPLIES
// ══════════════════════════════════════

// GET all shopping items (both list items and tracked supplies)
app.get('/api/shopping', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM shopping_items ORDER BY is_purchased ASC, created_at DESC'
  )
  res.json(result.rows)
})

// ADD new shopping item (list item or tracked supply)
app.post('/api/shopping', authenticate, async (req, res) => {
  const { name, item_type, quantity, stock_level, reorder_at, notes } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const result = await pool.query(
    `INSERT INTO shopping_items (name, item_type, quantity, stock_level, reorder_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      name, item_type || 'list', quantity || 1,
      stock_level ?? null, reorder_at ?? null, notes || null
    ]
  )
  res.json(result.rows[0])
})

// EDIT shopping item — also used to toggle purchased, or adjust stock level
app.put('/api/shopping/:id', authenticate, async (req, res) => {
  const { name, item_type, quantity, stock_level, reorder_at, is_purchased, notes } = req.body
  const result = await pool.query(
    `UPDATE shopping_items SET
      name=$1, item_type=$2, quantity=$3, stock_level=$4, reorder_at=$5, is_purchased=$6, notes=$7
     WHERE id=$8 RETURNING *`,
    [name, item_type, quantity, stock_level, reorder_at, is_purchased, notes || null, req.params.id]
  )
  res.json(result.rows[0])
})

// DELETE shopping item
app.delete('/api/shopping/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM shopping_items WHERE id = $1', [req.params.id])
  res.json({ message: 'Deleted' })
})

// ══════════════════════════════════════
// BILLS & REMINDERS
// ══════════════════════════════════════

// GET all bills/reminders (soonest due first)
app.get('/api/bills-reminders', authenticate, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM bills_reminders ORDER BY is_paid ASC, due_date ASC'
  )
  res.json(result.rows)
})

// GET upcoming — unpaid items due within the next 30 days (for Home/dashboard use later)
app.get('/api/bills-reminders/upcoming', authenticate, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM bills_reminders
     WHERE is_paid = false AND due_date <= CURRENT_DATE + INTERVAL '30 days'
     ORDER BY due_date ASC`
  )
  res.json(result.rows)
})

// ADD new bill/reminder
app.post('/api/bills-reminders', authenticate, async (req, res) => {
  const { title, category, amount, due_date, recurrence, notes } = req.body
  if (!title || !due_date) {
    return res.status(400).json({ error: 'Title and due date are required' })
  }
  const result = await pool.query(
    `INSERT INTO bills_reminders (title, category, amount, due_date, recurrence, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, category || 'Other', amount || null, due_date, recurrence || 'none', notes || null]
  )
  res.json(result.rows[0])
})

// EDIT bill/reminder
app.put('/api/bills-reminders/:id', authenticate, async (req, res) => {
  const { title, category, amount, due_date, recurrence, is_paid, notes } = req.body
  const result = await pool.query(
    `UPDATE bills_reminders SET
      title=$1, category=$2, amount=$3, due_date=$4, recurrence=$5, is_paid=$6, notes=$7
     WHERE id=$8 RETURNING *`,
    [title, category, amount || null, due_date, recurrence, is_paid, notes || null, req.params.id]
  )
  res.json(result.rows[0])
})

// DELETE bill/reminder
app.delete('/api/bills-reminders/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM bills_reminders WHERE id = $1', [req.params.id])
  res.json({ message: 'Deleted' })
})

// MARK PAID — one-off reminders just get checked off.
// Recurring bills roll their due_date forward to the next cycle instead.
app.post('/api/bills-reminders/:id/mark-paid', authenticate, async (req, res) => {
  const existing = (await pool.query(
    'SELECT * FROM bills_reminders WHERE id = $1', [req.params.id]
  )).rows[0]
  if (!existing) return res.status(404).json({ error: 'Not found' })

  if (existing.recurrence === 'none') {
    const result = await pool.query(
      'UPDATE bills_reminders SET is_paid = true WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    return res.json(result.rows[0])
  }

  const intervalMap = { weekly: '7 days', monthly: '1 month', quarterly: '3 months', yearly: '1 year' }
  const interval = intervalMap[existing.recurrence] || '1 month'
  const result = await pool.query(
    `UPDATE bills_reminders SET due_date = due_date + INTERVAL '${interval}', is_paid = false
     WHERE id = $1 RETURNING *`,
    [req.params.id]
  )
  res.json(result.rows[0])
})

// ══════════════════════════════════════
// REPORTS — aggregates spending across Household, Travel, and Loan payments
// ══════════════════════════════════════

// GET this month's totals, split by category
app.get('/api/reports/summary', authenticate, async (req, res) => {
  const household = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM household_expenses
     WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)`
  )
  const travel = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM trip_expenses
     WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)`
  )
  const loans = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM loan_payments
     WHERE date_trunc('month', payment_date) = date_trunc('month', CURRENT_DATE)`
  )

  const householdTotal = parseFloat(household.rows[0].total)
  const travelTotal = parseFloat(travel.rows[0].total)
  const loansTotal = parseFloat(loans.rows[0].total)

  res.json({
    overallTotal: (householdTotal + travelTotal + loansTotal).toFixed(2),
    household: householdTotal.toFixed(2),
    travel: travelTotal.toFixed(2),
    loanPayments: loansTotal.toFixed(2)
  })
})

// GET recent activity — a combined, chronological feed across all spending sources
app.get('/api/reports/history', authenticate, async (req, res) => {
  const limit = parseInt(req.query.limit) || 25
  const result = await pool.query(
    `SELECT 'household' as source, title, category, amount, expense_date as date
       FROM household_expenses
     UNION ALL
     SELECT 'travel' as source, te.title, t.name as category, te.amount, te.expense_date as date
       FROM trip_expenses te JOIN trips t ON t.id = te.trip_id
     UNION ALL
     SELECT 'loan' as source, l.name as title, 'Loan Payment' as category, lp.amount, lp.payment_date as date
       FROM loan_payments lp JOIN loans l ON l.id = lp.loan_id
     ORDER BY date DESC
     LIMIT $1`,
    [limit]
  )
  res.json(result.rows)
})

// ══════════════════════════════════════
// SPLIT SUMMARY
// ══════════════════════════════════════

app.get('/api/bills/:id/summary', async (req, res) => {
  const shares = await pool.query(
    `SELECT
      u.id, u.name, u.avatar,
      SUM(bi.price / share_counts.cnt) as subtotal
     FROM item_shares is2
     JOIN users u ON u.id = is2.user_id
     JOIN bill_items bi ON bi.id = is2.item_id
     JOIN (
       SELECT item_id, COUNT(*) as cnt
       FROM item_shares GROUP BY item_id
     ) share_counts ON share_counts.item_id = is2.item_id
     WHERE bi.bill_id = $1
     GROUP BY u.id, u.name, u.avatar`,
    [req.params.id]
  )
  const bill = await pool.query(
    'SELECT * FROM bills WHERE id = $1',
    [req.params.id]
  )
  const b = bill.rows[0]
  const totalItems = shares.rows.reduce(
    (s, r) => s + parseFloat(r.subtotal), 0
  )
  const result = shares.rows.map(r => {
    const sub = parseFloat(r.subtotal)
    const ratio = totalItems > 0 ? sub / totalItems : 0
    const tax = parseFloat(b.tax) * ratio
    const tip = parseFloat(b.tip) * ratio
    return {
      ...r,
      subtotal: sub.toFixed(2),
      tax: tax.toFixed(2),
      tip: tip.toFixed(2),
      total: (sub + tax + tip).toFixed(2)
    }
  })
  res.json(result)
})

// ══════════════════════════════════════
// START SERVER
// project1 = 4001
// project2 = 4002
// splitzy  = 4003
// ══════════════════════════════════════
const PORT = process.env.PORT || 4003
app.listen(PORT, () => {
  console.log(`✅ Splitzy backend running on port ${PORT}`)
})
