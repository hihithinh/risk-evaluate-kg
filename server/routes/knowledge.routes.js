/**
 * Knowledge Routes
 */

import express from 'express';
import { KnowledgeController } from '../controllers/knowledge.controller.js';

const router = express.Router();
const controller = new KnowledgeController();

// Get rule types
router.get('/types', (req, res, next) => controller.getRuleTypes(req, res, next));

// Get knowledge graph
router.get('/graph', (req, res, next) => controller.getKnowledgeGraph(req, res, next));

// Get rules by type
router.get('/rules/:type', (req, res, next) => controller.getRules(req, res, next));

// Save rules
router.post('/rules/:type', (req, res, next) => controller.saveRules(req, res, next));

// Restore default rules
router.post('/rules/:type/restore', (req, res, next) => controller.restoreDefault(req, res, next));

export default router;
