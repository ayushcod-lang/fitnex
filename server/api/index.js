const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const authRoutes = require('../routes/auth');
const profileRoutes = require('../routes/profile');
const workoutRoutes = require('../routes/workouts');
const dietRoutes = require('../routes/diet');
const progressRoutes = require('../routes/progress');

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || '*').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Diagnostic: List available Gemini models
app.get('/api/debug-models', async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const result = await genAI.listModels();
    res.json({ models: result.models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/env-check', (req, res) => {
  const keys = Object.keys(process.env).filter(key =>
    key.startsWith('MONGO') ||
    key.startsWith('GEMINI') ||
    key.startsWith('FIREBASE') ||
    key.startsWith('JWT')
  );
  res.json({ keys });
});

// Serverless MongoDB Connection Middleware
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected');
    next();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date(), dbState: mongoose.connection.readyState }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/progress', progressRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
