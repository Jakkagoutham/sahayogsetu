const express = require('express');
const cors = require('cors');
require('dotenv').config();

const problemsRouter = require('./src/routes/problems');
const solutionsRouter = require('./src/routes/solutions');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all frontend origins (default Vite port 5173, etc.)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SahayogSetu Backend API',
    version: '1.0.0-sih-prototype',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/problems', problemsRouter);
app.use('/api/solutions', solutionsRouter);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SahayogSetu Server running on http://localhost:${PORT}`);
  console.log(`📡 Groq AI Engine active: llama-3.1-8b-instant`);
  console.log(`📊 SIH 6-Parameter Weightage Matrix ready`);
  console.log(`====================================================`);
});
