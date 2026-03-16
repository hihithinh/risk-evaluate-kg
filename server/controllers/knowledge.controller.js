/**
 * Knowledge Controller
 * Xử lý requests cho Knowledge Management
 */

import { KnowledgeService } from '../services/knowledge.service.js';

const knowledgeService = new KnowledgeService();

export class KnowledgeController {
  /**
   * GET /api/knowledge/rules/:type
   * Load rules by type
   */
  async getRules(req, res, next) {
    try {
      const { type } = req.params;
      const result = await knowledgeService.loadRules(type);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/knowledge/rules/:type
   * Save custom rules
   */
  async saveRules(req, res, next) {
    try {
      const { type } = req.params;
      const { rules } = req.body;

      if (!rules) {
        return res.status(400).json({
          success: false,
          error: 'Rules data is required'
        });
      }

      const result = await knowledgeService.saveRules(type, rules);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/knowledge/rules/:type/restore
   * Restore default rules
   */
  async restoreDefault(req, res, next) {
    try {
      const { type } = req.params;
      const result = await knowledgeService.restoreDefault(type);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/knowledge/graph
   * Get knowledge graph for visualization
   */
  async getKnowledgeGraph(req, res, next) {
    try {
      const graph = await knowledgeService.buildKnowledgeGraph();
      
      res.json({
        success: true,
        data: graph
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/knowledge/types
   * Get all rule types
   */
  async getRuleTypes(req, res, next) {
    try {
      const types = await knowledgeService.getAllRuleTypes();
      
      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      next(error);
    }
  }
}
