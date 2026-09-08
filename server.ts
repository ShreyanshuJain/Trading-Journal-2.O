import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Configure Cloudinary from environment variables
const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.VITE_CLOUDINARY_CLOUD_NAME ||
  '';

const CLOUDINARY_API_KEY =
  process.env.CLOUDINARY_API_KEY || '';

const CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET || '';

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded trade pictures statically
app.use('/uploads', express.static(UPLOADS_DIR));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const rawMongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || '';
const MONGODB_URI = rawMongoUri.trim();
let dbClient: MongoClient | null = null;
let db: Db | null = null;

async function initMongoDB() {
  if (!MONGODB_URI || (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://'))) {
    console.log('No valid MongoDB URI configured. Running with file-backed local persistence (data_store.json).');
    return;
  }
  try {
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    db = dbClient.db('trading_journal');
    console.log('Successfully connected to MongoDB!');
  } catch (err: any) {
    console.warn('Could not connect to MongoDB, falling back to local file persistence:', err.message || err);
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
    cloudinary: {
      cloudName: CLOUDINARY_CLOUD_NAME || 'Not configured',
      configured: Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_SECRET),
    },
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
    },
    timestamp: new Date().toISOString(),
  });
});

// Secure Backend Gemini AI Endpoint (Server-Side Only)
app.post('/api/ai/trade-review', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini AI is not configured. Set GEMINI_API_KEY in your environment variables.',
      });
    }

    const { trade, prompt } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt || `Please review this trade setup and provide concise trading psychology and risk management insights: ${JSON.stringify(trade)}`,
    });

    return res.json({ success: true, text: response.text });
  } catch (err: any) {
    console.error('Gemini AI processing error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Failed to process AI review' });
  }
});

// Helper to save base64/buffer image to local uploads folder
function saveImageLocally(imageData: string, customPrefix = 'trade_pic'): { url: string; filename: string } {
  const matches = imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  let ext = 'png';
  let buffer: Buffer;

  if (matches && matches.length === 3) {
    ext = matches[1] === 'svg+xml' ? 'svg' : matches[1] === 'jpeg' ? 'jpg' : matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // If it's a raw base64 string without data prefix
    try {
      buffer = Buffer.from(imageData, 'base64');
    } catch {
      buffer = Buffer.from(imageData, 'utf-8');
    }
  }

  const filename = `${customPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return { url: `/uploads/${filename}`, filename };
}

// Universal Image Upload Endpoint
app.post('/api/upload', async (req, res) => {
  try {
    const { image, cloudName, apiKey, apiSecret, folder } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const cName = cloudName || CLOUDINARY_CLOUD_NAME;
    const k = apiKey || CLOUDINARY_API_KEY;
    const s = apiSecret || CLOUDINARY_API_SECRET;

    // 1. If Cloudinary credentials are provided, attempt Cloudinary upload
    if (cName && s) {
      try {
        const activeConfig = {
          cloud_name: cName,
          api_key: k,
          api_secret: s,
          secure: true,
        };

        const result = await cloudinary.uploader.upload(image, {
          ...activeConfig,
          folder: folder || 'trading_journal',
          resource_type: 'auto',
        });

        const optimizedUrl = cloudinary.url(result.public_id, {
          ...activeConfig,
          fetch_format: 'auto',
          quality: 'auto',
        });

        return res.json({
          success: true,
          provider: 'cloudinary',
          url: result.secure_url || result.url,
          optimizedUrl: optimizedUrl || result.secure_url,
          publicId: result.public_id,
        });
      } catch (cloudErr: any) {
        console.warn('Cloudinary upload warning, using local file storage fallback:', cloudErr.message || cloudErr);
      }
    }

    // 2. Local File Storage Fallback (Always works instantly without credentials)
    const { url, filename } = saveImageLocally(image, 'chart');
    return res.json({
      success: true,
      provider: 'local',
      url,
      optimizedUrl: url,
      filename,
    });
  } catch (err: any) {
    console.error('Universal upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload image' });
  }
});

// Cloudinary Image Upload Endpoint (with Local Fallback)
app.post('/api/upload/cloudinary', async (req, res) => {
  try {
    const { image, cloudName, apiKey, apiSecret, publicId, folder } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const cName = cloudName || CLOUDINARY_CLOUD_NAME;
    const k = apiKey || CLOUDINARY_API_KEY;
    const s = apiSecret || CLOUDINARY_API_SECRET;

    if (cName && s) {
      const activeConfig = {
        cloud_name: cName,
        api_key: k,
        api_secret: s,
        secure: true,
      };

      const result = await cloudinary.uploader.upload(image, {
        ...activeConfig,
        folder: folder || 'trading_journal',
        public_id: publicId,
        resource_type: 'auto',
      });

      const optimizedUrl = cloudinary.url(result.public_id, {
        ...activeConfig,
        fetch_format: 'auto',
        quality: 'auto',
      });

      return res.json({
        success: true,
        provider: 'cloudinary',
        url: result.secure_url || result.url,
        optimizedUrl: optimizedUrl || result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      });
    }

    // Fallback to local server image storage
    const { url, filename } = saveImageLocally(image, 'chart');
    return res.json({
      success: true,
      provider: 'local',
      url,
      optimizedUrl: url,
      filename,
    });
  } catch (err: any) {
    console.warn('Cloudinary server upload error, saving locally:', err.message || err);
    try {
      const { url, filename } = saveImageLocally(req.body.image, 'chart');
      return res.json({
        success: true,
        provider: 'local_fallback',
        url,
        optimizedUrl: url,
        filename,
      });
    } catch (saveErr: any) {
      return res.status(500).json({
        error: err.message || 'Failed to upload image to Cloudinary',
        details: err,
      });
    }
  }
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

    // Always persist to local file store as indestructible baseline backup
    saveLocalData({ trades, accounts, strategies, tags, settings, updatedAt: new Date().toISOString() });

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
      return res.json({ success: true, storage: 'MongoDB + Local File Backup' });
    }

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

    // Always update in data_store.json
    const local = readLocalData() || { trades: [], accounts: [], strategies: [], tags: [], settings: null };
    const currentTrades: any[] = Array.isArray(local.trades) ? local.trades : [];
    const filtered = currentTrades.filter((t: any) => t.id !== trade.id);
    local.trades = [trade, ...filtered];
    local.updatedAt = new Date().toISOString();
    saveLocalData(local);

    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save trade' });
  }
});

app.put('/api/trades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const trade = { ...req.body, id };
    if (db) {
      await db.collection('trades').updateOne({ _id: id as any }, { $set: trade }, { upsert: true });
    }

    const local = readLocalData() || { trades: [], accounts: [], strategies: [], tags: [], settings: null };
    const currentTrades: any[] = Array.isArray(local.trades) ? local.trades : [];
    const filtered = currentTrades.filter((t: any) => t.id !== id);
    local.trades = [trade, ...filtered];
    local.updatedAt = new Date().toISOString();
    saveLocalData(local);

    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update trade' });
  }
});

app.delete('/api/trades/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection('trades').deleteOne({ _id: id as any });
    }

    // Always delete in data_store.json
    const local = readLocalData();
    if (local && Array.isArray(local.trades)) {
      local.trades = local.trades.filter((t: any) => t.id !== id);
      local.updatedAt = new Date().toISOString();
      saveLocalData(local);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trade' });
  }
});

// Single Account Operations
app.post('/api/accounts', async (req, res) => {
  try {
    const account = req.body;
    if (db) {
      await db.collection('accounts').updateOne({ _id: account.id as any }, { $set: account }, { upsert: true });
    }

    const local = readLocalData() || { trades: [], accounts: [], strategies: [], tags: [], settings: null };
    const currentAccounts: any[] = Array.isArray(local.accounts) ? local.accounts : [];
    const filtered = currentAccounts.filter((a: any) => a.id !== account.id);
    local.accounts = [...filtered, account];
    local.updatedAt = new Date().toISOString();
    saveLocalData(local);

    res.json({ success: true, account });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save account' });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (db) {
      await db.collection('accounts').deleteOne({ _id: id as any });
    }

    const local = readLocalData();
    if (local && Array.isArray(local.accounts)) {
      local.accounts = local.accounts.filter((a: any) => a.id !== id);
      local.updatedAt = new Date().toISOString();
      saveLocalData(local);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trading Journal Express + Vite Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
