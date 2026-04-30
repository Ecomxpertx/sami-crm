const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const crmSchema = new mongoose.Schema({
  key:   { type: String, default: 'main' },
  accs:  { type: Array,  default: [] },
  team:  { type: Array,  default: [] },
  costs: { type: Array,  default: [] },
}, { timestamps: true });

const CRM = mongoose.model('CRM', crmSchema);

let USE_MONGO = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.log('No MONGODB_URI - using local storage'); return false; }
  try { await mongoose.connect(uri); console.log('MongoDB connected'); return true; }
  catch(e) { console.error('MongoDB failed:', e.message); return false; }
}

const LOCAL_DB = path.join(__dirname, 'data', 'crm.json');
function localLoad() {
  try { if (!fs.existsSync(LOCAL_DB)) return {accs:[],team:[],costs:[]}; return JSON.parse(fs.readFileSync(LOCAL_DB,'utf8')); }
  catch(e) { return {accs:[],team:[],costs:[]}; }
}
function localSave(data) {
  const dir = path.dirname(LOCAL_DB);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(LOCAL_DB, JSON.stringify(data,null,2));
}

async function loadData() {
  if (USE_MONGO) { let doc=await CRM.findOne({key:'main'}); if(!doc)doc=await CRM.create({key:'main'}); return {accs:doc.accs,team:doc.team,costs:doc.costs}; }
  return localLoad();
}
async function saveData(data) {
  if (USE_MONGO) { await CRM.findOneAndUpdate({key:'main'},{accs:data.accs,team:data.team,costs:data.costs},{upsert:true,new:true}); }
  else { localSave(data); }
}

app.get('/api/data', async (req,res) => { try{res.json(await loadData());}catch(e){res.status(500).json({error:e.message});} });
app.post('/api/data', async (req,res) => { try{const d=req.body;if(!d||!Array.isArray(d.accs))return res.status(400).json({error:'Invalid'});await saveData(d);res.json({ok:true});}catch(e){res.status(500).json({error:e.message});} });
app.get('/api/backup', async (req,res) => { try{const d=await loadData();res.setHeader('Content-Disposition',`attachment; filename="SamiCRM.json"`);res.json(d);}catch(e){res.status(500).json({error:e.message});} });
app.get('/api/health', async (req,res) => { try{const d=await loadData();res.json({ok:true,storage:USE_MONGO?'MongoDB':'Local',accounts:d.accs.length});}catch(e){res.status(500).json({error:e.message});} });
app.get('*', (req,res) => { res.sendFile(path.join(__dirname,'public','index.html')); });

async function start() {
  USE_MONGO = await connectDB();
  app.listen(PORT, '0.0.0.0', () => console.log(`Sami CRM running on port ${PORT} - Storage: ${USE_MONGO?'MongoDB':'Local'}`));
}
start();
