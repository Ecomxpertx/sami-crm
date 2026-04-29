const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'data', 'crm.json');

// ── Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── DB helpers ─────────────────────────────────────────
function loadDB() {
  try {
    if (!fs.existsSync(DB)) return { accs: [], team: [], costs: [] };
    return JSON.parse(fs.readFileSync(DB, 'utf8'));
  } catch(e) { return { accs: [], team: [], costs: [] }; }
}

function saveDB(data) {
  if (!fs.existsSync(path.dirname(DB))) fs.mkdirSync(path.dirname(DB), { recursive: true });
  const backup = DB + '.bak';
  if (fs.existsSync(DB)) fs.copyFileSync(DB, backup);
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// ── API Routes ─────────────────────────────────────────

// Load everything
app.get('/api/data', (req, res) => {
  res.json(loadDB());
});

// Save everything
app.post('/api/data', (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.accs)) return res.status(400).json({ error: 'Invalid data' });
    saveDB(data);
    res.json({ ok: true, saved: new Date().toISOString() });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Single account update (for fast inline changes like status)
app.patch('/api/acc/:id', (req, res) => {
  try {
    const db  = loadDB();
    const id  = parseInt(req.params.id);
    const idx = db.accs.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Account not found' });
    db.accs[idx] = Object.assign({}, db.accs[idx], req.body, { id });
    saveDB(db);
    res.json({ ok: true, acc: db.accs[idx] });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete account
app.delete('/api/acc/:id', (req, res) => {
  try {
    const db  = loadDB();
    const id  = parseInt(req.params.id);
    db.accs   = db.accs.filter(a => a.id !== id);
    saveDB(db);
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Backup endpoint
app.get('/api/backup', (req, res) => {
  const data = loadDB();
  res.setHeader('Content-Disposition', `attachment; filename="SamiCRM_${new Date().toISOString().split('T')[0]}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

// Health check
app.get('/api/health', (req, res) => {
  const db = loadDB();
  res.json({ 
    ok: true, 
    accounts: db.accs.length,
    team: db.team.length,
    uptime: Math.floor(process.uptime()) + 's',
    saved: fs.existsSync(DB) ? fs.statSync(DB).mtime : null
  });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  let localIP = 'localhost';
  for (const n of Object.values(nets)) {
    for (const net of n) {
      if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
    }
  }
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║       Sami Agency CRM - Running        ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Local:   http://localhost:${PORT}         ║`);
  console.log(`║  Network: http://${localIP}:${PORT}      ║`);
  console.log('╠════════════════════════════════════════╣');
  console.log('║  Share the Network URL with your team  ║');
  console.log('║  Press Ctrl+C to stop                  ║');
  console.log('╚════════════════════════════════════════╝\n');
});
