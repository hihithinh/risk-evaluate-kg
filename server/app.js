/**
 * Express Server - Risk Evaluation System
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureStorageDirectories } from '../src/configs/storage.config.js';

// Routes
import knowledgeRoutes from './routes/knowledge.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';
import bulkRoutes from './routes/bulk.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure storage directories exist
ensureStorageDirectories();

// Static files
app.use('/storage', express.static(path.join(__dirname, '..', 'storage')));

// Routes
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/bulk', bulkRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   - Knowledge Management: http://localhost:${PORT}/api/knowledge`);
  console.log(`   - Single Evaluation: http://localhost:${PORT}/api/evaluation`);
  console.log(`   - Bulk Evaluation: http://localhost:${PORT}/api/bulk`);
});

export default app;
