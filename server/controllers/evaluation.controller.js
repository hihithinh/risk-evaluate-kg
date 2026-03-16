/**
 * Evaluation Controller
 * Xử lý requests cho Single Company Risk Evaluation
 */

import { EvaluationService } from '../services/evaluation.service.js';

const evaluationService = new EvaluationService();

export class EvaluationController {
  /**
   * POST /api/evaluation/load-financial-data
   * Step 1: Load financial data
   */
  async loadFinancialData(req, res) {
    try {
      const { symbol, year, quarter } = req.body;

      if (!symbol || !year || !quarter) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: symbol, year, quarter'
        });
      }

      const result = await evaluationService.loadFinancialData(symbol, year, quarter);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/evaluation/calculate-indicators
   * Step 2: Calculate indicators
   */
  async calculateIndicators(req, res) {
    try {
      const { symbol, year, quarter } = req.body;

      if (!symbol || !year || !quarter) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: symbol, year, quarter'
        });
      }

      const result = await evaluationService.calculateIndicators(symbol, year, quarter);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/evaluation/evaluate-risk
   * Step 3: Evaluate risk
   */
  async evaluateRisk(req, res) {
    try {
      const { symbol, year, quarter } = req.body;

      if (!symbol || !year || !quarter) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: symbol, year, quarter'
        });
      }

      const result = await evaluationService.evaluateRisk(symbol, year, quarter);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/evaluation/evaluate
   * Evaluate single company (legacy - full evaluation)
   */
  async evaluate(req, res) {
    try {
      const { symbol, year, quarter } = req.body;

      if (!symbol || !year || !quarter) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: symbol, year, quarter'
        });
      }

      const result = await evaluationService.evaluateCompany(symbol, year, quarter);

      if (!result.success) {
        return res.status(500).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/evaluation/tickers
   * Get available tickers
   */
  async getTickers(req, res, next) {
    try {
      const tickers = await evaluationService.getAvailableTickers();
      
      res.json({
        success: true,
        data: tickers
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/evaluation/current-period
   * Get current quarter and year
   */
  async getCurrentPeriod(req, res, next) {
    try {
      const period = evaluationService.getCurrentPeriod();
      
      res.json({
        success: true,
        data: period
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/evaluation/indicator-rules
   * Get indicator rules for risk scoring
   */
  async getIndicatorRules(req, res, next) {
    try {
      const rules = await evaluationService.getIndicatorRules();
      
      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      next(error);
    }
  }
}
