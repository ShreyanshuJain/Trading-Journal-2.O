import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || '';
let dbClient: MongoClient | null = null;
let db: Db | null = null;

async function initMongoDB() {
  if (!MONGODB_URI) {
    console.log('No MONGODB_URI configured. Running with file-backed local persistence.');
    return;
  }
  try {
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    db = dbClient.db('trading_journal');
    console.log('Successfully connected to MongoDB!');
  } catch (err) {
    console.error('Failed to connect to MongoDB, falling back to local file persistence:', err);
  }
}

// Local File Store Fallback Helper
const DATA_FILE = path.join(process.cwd(), 'data_store.json');

function readLocalData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local data file:', err);
  }
  return null;
}

function saveLocalData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing local data file:', err);
  }
}

// API Routes

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: db ? 'MongoDB' : 'Local File Persistence',
    timestamp: new Date().toISOString(),
  });
});

// GET all journal data (trades, accounts, strategies, tags, settings)
app.get('/api/data', async (req, res) => {
  try {
    if (db) {
      const trades = await db.collection('trades').find({}).toArray();
      const accounts = await db.collection('accounts').find({}).toArray();
      const strategies = await db.collection('strategies').find({}).toArray();
      const tags = await db.collection('tags').find({}).toArray();
      const settingsDoc = await db.collection('settings').findOne({ _id: 'user_settings' as any });

      return res.json({
        trades: trades.map(({ _id, ...t }) => t),
        accounts: accounts.map(({ _id, ...a }) => a),
        strategies: strategies.map(({ _id, ...s }) => s),
        tags: tags.map(({ _id, ...tg }) => tg),
        settings: settingsDoc ? (({ _id, ...st }) => st)(settingsDoc) : null,
      });
    }

    const localData = readLocalData();
    res.json(localData || {});
  } catch (err) {
    console.error('API /api/data error:', err);
    res.status(500).json({ error: 'Failed to fetch journal data' });
  }
});

// SAVE all journal data (bulk sync)
app.post('/api/data/sync', async (req, res) => {
  try {
    const { trades, accounts, strategies, tags, settings } = req.body;

    if (db) {
      if (Array.isArray(trades)) {
        await db.collection('trades').deleteMany({});
        if (trades.length > 0) {
          await db.collection('trades').insertMany(trades.map((t) => ({ ...t, _id: t.id })));
        }
      }
      if (Array.isArray(accounts)) {
        await db.collection('accounts').deleteMany({});
        if (accounts.length > 0) {
          await db.collection('accounts').insertMany(accounts.map((a) => ({ ...a, _id: a.id })));
        }
      }
      if (Array.isArray(strategies)) {
        await db.collection('strategies').deleteMany({});
        if (strategies.length > 0) {
          await db.collection('strategies').insertMany(strategies.map((s) => ({ ...s, _id: s.id })));
        }
      }
      if (Array.isArray(tags)) {
        await db.collection('tags').deleteMany({});
        if (tags.length > 0) {
          await db.collection('tags').insertMany(tags.map((tg) => ({ ...tg, _id: tg.id })));
        }
      }
      if (settings) {
        await db
          .collection('settings')
          .updateOne({ _id: 'user_settings' as any }, { $set: settings }, { upsert: true });
      }
      return res.json({ success: true, storage: 'MongoDB' });
    }

    saveLocalData({ trades, accounts, strategies, tags, settings, updatedAt: new Date().toISOString() });
    res.json({ success: true, storage: 'Local File Persistence' });
  } catch (err) {
    console.error('API /api/data/sync error:', err);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Single Trade Operations
app.post('/api/trades', async (req, res) => {
  try {
    const trade = req.body;
    if (db) {
      await db.collection('trades').updateOne({ _id: trade.id as any }, { $set: trade }, { upsert: true });
    }
    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save trade' });
  }
});

app.delete('/api/trades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection('trades').deleteOne({ _id: id as any });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trade' });
  }
});

async function startServer() {
  await initMongoDB();

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trading Journal Express + Vite Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
