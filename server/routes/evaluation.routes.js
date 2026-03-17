/**
 * Evaluation Routes
 */

import express from 'express';
import { EvaluationController } from '../controllers/evaluation.controller.js';

const router = express.Router();
const controller = new EvaluationController();

// Log all API calls
router.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const bodyInfo = req.method === 'POST' ? JSON.stringify(req.body) : '';
  console.log(`[${timestamp}] 🌐 ${req.method} ${req.originalUrl} ${bodyInfo}`);
  next();
});

/**
 * GET /api/evaluation/tickers
 */
router.get('/tickers', (req, res, next) => controller.getTickers(req, res, next));

/**
 * GET /api/evaluation/current-period
 */
router.get('/current-period', (req, res, next) => controller.getCurrentPeriod(req, res, next));

/**
 * GET /api/evaluation/indicator-rules
 */
router.get('/indicator-rules', (req, res, next) => controller.getIndicatorRules(req, res, next));

/**
 * GET /api/evaluation/composite-rules
 */
router.get('/composite-rules', (req, res, next) => controller.getCompositeRules(req, res, next));

/**
 * POST /api/evaluation/load-financial-data
 * Step 1: Load raw financial data + company type
 */
router.post('/load-financial-data', (req, res, next) => controller.loadFinancialData(req, res, next));

/**
 * POST /api/evaluation/calculate-indicators
 * Step 2: Calculate financial indicators
 */
router.post('/calculate-indicators', (req, res, next) => controller.calculateIndicators(req, res, next));

/**
 * POST /api/evaluation/evaluate-risk
 * Step 3: Evaluate risk + composite + inference
 */
router.post('/evaluate-risk', (req, res, next) => controller.evaluateRisk(req, res, next));

/**
 * POST /api/evaluation/evaluate
 * Legacy: Full evaluation in one call
 */
router.post('/evaluate', (req, res, next) => controller.evaluate(req, res, next));

export default router;
