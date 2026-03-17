/**
 * Bulk Routes
 */

import express from 'express';
import multer from 'multer';
import { BulkController } from '../controllers/bulk.controller.js';

const router = express.Router();
const controller = new BulkController();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Get template
router.get('/template', (req, res, next) => controller.getTemplate(req, res, next));

// Upload file
router.post('/upload', upload.single('file'), (req, res, next) => controller.uploadFile(req, res, next));

// Preview CSV
router.post('/preview', (req, res, next) => controller.previewCsv(req, res, next));

// Evaluate
router.post('/evaluate', (req, res, next) => controller.evaluate(req, res, next));

// Download result
router.get('/download/:uid/:filename', (req, res, next) => controller.downloadResult(req, res, next));

// Get companies
router.get('/companies/:uid', (req, res, next) => controller.getCompanies(req, res, next));

// Get financial indicators
router.get('/indicators/:uid/:companyId', (req, res, next) => controller.getIndicators(req, res, next));

// Get rule results
router.get('/rules/:uid/:companyId', (req, res, next) => controller.getRuleResults(req, res, next));

// Get statistics
router.get('/stats/:uid', (req, res, next) => controller.getStatistics(req, res, next));

export default router;
