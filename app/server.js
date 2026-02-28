const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'three_tier_app',
  waitForConnections: true,
  connectionLimit: 10,
});

// ---- Health Check (ALB uses this) ----
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// ---- Initialize DB table ----
app.get('/init', async (req, res) => {
  try {
    await pool.query(`
      CREATE DATABASE IF NOT EXISTS three_tier_app
    `);
    await pool.query(`USE three_tier_app`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    res.json({ message: 'Database initialized successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- CRUD Routes ----

// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new item
app.post('/api/items', async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO items (name, description) VALUES (?, ?)',
      [name, description]
    );
    res.status(201).json({ id: result.insertId, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Server Info (useful for seeing which EC2 instance is responding) ----
app.get('/api/info', (req, res) => {
  res.json({
    instance: process.env.HOSTNAME || 'unknown',
    timestamp: new Date().toISOString(),
    tier: 'application'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});