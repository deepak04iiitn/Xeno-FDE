import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './utils/database.js';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenants.js';
import ingestionRoutes from './routes/ingestion.js';
import insightsRoutes from './routes/insights.js';
import { startScheduler } from './utils/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Webhook endpoint needs raw body for HMAC verification
app.use('/api/ingestion/webhook', express.raw({ type: 'application/json' }));

// JSON parser for all other routes
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Xeno FDE Service is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/insights', insightsRoutes);

// Initializing the database and starting the server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Starting the scheduler for periodic data sync
    startScheduler();
    console.log('Scheduler started');
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
