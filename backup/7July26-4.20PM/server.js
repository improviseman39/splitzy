import express from 'express'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg
const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.use(express.json())

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

pool.connect((err) => {
  if (err) {
    console.error('❌ Error:', err.message)
  } else {
    console.log('✅ Connected to splitzy_db!')
  }
})

// GET all users
app.get('/api/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY id')
  res.json(result.rows)
})

// ADD new user
app.post('/api/users', async (req, res) => {
  const { name, email, avatar } = req.body
  const result = await pool.query(
    'INSERT INTO users (name, email, avatar) VALUES ($1, $2, $3) RETURNING *',
    [name, email, avatar]
  )
  res.json(result.rows[0])
})

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

// ADD new bill with items
app.post('/api/bills', async (req, res) => {
  const { title, total, tax, tip, currency, items } = req.body
  const billResult = await pool.query(
    'INSERT INTO bills (title, total, tax, tip, currency, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [title, total, tax, tip, currency || 'AUD', 1]
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

// GET bill split summary
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

const PORT = 4003
app.listen(PORT, () => {
  console.log(`✅ Splitzy backend running on http://localhost:${PORT}`)
})