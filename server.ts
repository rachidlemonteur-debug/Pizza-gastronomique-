import express from 'express';
import { createServer as createViteServer } from 'vite';
import * as path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin with default credentials (ADC) if possible
if (!admin.apps?.length) {
  try {
    admin.initializeApp();
    console.log("Firebase Admin Initialized automatically via ADC");
  } catch (e) {
    console.error("Failed to initialize Firebase Admin automatically. Provide service account key if running locally.", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite development mode compatibility
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Use your frontend URL here in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

  // Body Parsing
  app.use(express.json({ limit: '1mb' })); // Limit body size to prevent payload too large attacks

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Trop de requêtes, veuillez réessayer plus tard." }
  });

  // Apply rate limiter to all API routes
  app.use('/api/', apiLimiter);

  // API Route example
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', adminReady: admin.apps.length > 0 });
  });

  // Verify Admin Middleware
  const requireSuperAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized credentials' });
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken.email === 'beidoufadimatou1998@gmail.com') {
         // Auto-allow owner
         (req as any).user = decodedToken;
         return next();
      }
      
      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'super_admin' || decodedToken.admin === true) {
         (req as any).user = decodedToken;
         return next();
      }
      res.status(403).json({ error: 'Forbidden. Super Admin required.' });
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  };

  app.delete('/api/admin/users/:uid', requireSuperAdmin, async (req, res) => {
    try {
      const uid = req.params.uid;
      // Prevent deleting self unless we really want it, but let's just do it
      await admin.auth().deleteUser(uid);
      // We also delete from firestore right after
      await admin.firestore().collection('users').doc(uid).delete();
      res.json({ status: 'ok', msg: `User ${uid} deleted entirely.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/backup', requireSuperAdmin, async (req, res) => {
    try {
      const db = admin.firestore();
      const collections = await db.listCollections();
      const backup: any = {};
      const limit = parseInt(req.query.limit as string) || 500;
      
      for (const col of collections) {
         const snap = await col.limit(limit).get();
         backup[col.id] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=gastro_backup_' + new Date().toISOString().split('T')[0] + '.json');
      res.send(JSON.stringify(backup, null, 2));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
