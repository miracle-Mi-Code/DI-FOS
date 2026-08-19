require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const documentsRoutes = require('./routes/documentsRoutes');
const submissionsRoutes = require('./routes/submissionsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Express Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Uploaded Files Statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Digital File Opening System (DFOS) API',
    timestamp: new Date().toISOString(),
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 DFOS Backend API running on port ${PORT}`);
  console.log(`📡 Base URL: http://localhost:${PORT}/api`);
  console.log(`📁 Local Storage Directory: ${path.join(__dirname, '../uploads')}`);
  console.log(`======================================================\n`);
});
