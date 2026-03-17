/**
 * Bulk Controller
 * Xử lý requests cho Bulk Risk Evaluation
 */

import path from 'path';
import fs from 'fs';
import { BulkService } from '../services/bulk.service.js';
import { DatabaseService } from '../services/database.service.js';

const bulkService = new BulkService();

export class BulkController {
  /**
   * POST /api/bulk/upload
   * Upload CSV file
   */
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const fileInfo = await bulkService.saveUploadedFile(req.file);
      
      // Parse and store CSV data to database
      await bulkService.parseAndStoreCsvData(fileInfo.uid, fileInfo.filename);
      
      res.json({
        success: true,
        data: fileInfo
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bulk/preview
   * Preview CSV data
   */
  async previewCsv(req, res, next) {
    try {
      const { uid, filename } = req.body;

      if (!uid || !filename) {
        return res.status(400).json({
          success: false,
          error: 'Missing uid or filename'
        });
      }

      const preview = await bulkService.parseCsvSample(
        path.join(process.cwd(), 'storage', 'app', uid, filename)
      );

      res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/bulk/evaluate
   * Run batch evaluation
   */
  async evaluate(req, res, next) {
    try {
      const { uid, filename } = req.body;

      if (!uid || !filename) {
        return res.status(400).json({
          success: false,
          error: 'Missing uid or filename'
        });
      }

      const result = await bulkService.runBatchInference(uid, filename);

      // Return full results as before
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bulk/template
   * Get CSV template
   */
  async getTemplate(req, res, next) {
    try {
      const template = bulkService.getTemplate();
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bulk/download/:uid/:filename
   * Download result file
   */
  async downloadResult(req, res, next) {
    try {
      const { uid, filename } = req.params;
      const filePath = path.join(
        process.cwd(),
        '..',
        'storage',
        'app',
        'uploads',
        uid,
        filename  // filename already includes result_ prefix
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      res.download(filePath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bulk/companies/:uid
   * Get company data from database
   */
  async getCompanies(req, res, next) {
    try {
      const { uid } = req.params;
      const { 
        symbol, 
        year, 
        quarter, 
        riskLevel, 
        sortBy = 'symbol', 
        sortOrder = 'asc',
        limit = 100,
        offset = 0
      } = req.query;

      const dbPath = path.join(process.cwd(), '..', 'storage', 'app', 'uploads', uid, 'database.db');
      
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({
          success: false,
          error: 'Database not found'
        });
      }

      const dbService = new DatabaseService(dbPath);
      await dbService.initialize();

      const companies = await dbService.getCompanyData(uid, symbol, year, {
        quarter,
        riskLevel,
        sortBy,
        sortOrder,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      await dbService.close();

      res.json({
        success: true,
        data: companies
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bulk/indicators/:uid/:companyId
   * Get financial indicators for a company
   */
  async getIndicators(req, res, next) {
    try {
      const { uid, companyId } = req.params;
      const dbPath = path.join(process.cwd(), '..', 'storage', 'app', 'uploads', uid, 'database.db');
      
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({
          success: false,
          error: 'Database not found'
        });
      }

      const dbService = new DatabaseService(dbPath);
      await dbService.initialize();

      const indicators = await dbService.getFinancialIndicators(companyId);
      
      await dbService.close();

      res.json({
        success: true,
        data: indicators
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bulk/rules/:uid/:companyId
   * Get rule results for a company
   */
  async getRuleResults(req, res, next) {
    try {
      const { uid, companyId } = req.params;
      const dbPath = path.join(process.cwd(), '..', 'storage', 'app', 'uploads', uid, 'database.db');
      
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({
          success: false,
          error: 'Database not found'
        });
      }

      const dbService = new DatabaseService(dbPath);
      await dbService.initialize();

      const [indicatorResults, compositeResults] = await Promise.all([
        dbService.getRiskSignalRuleResults(companyId),
        dbService.getRiskLabelRuleResults(companyId)
      ]);
      
      await dbService.close();

      res.json({
        success: true,
        data: {
          indicatorResults,
          compositeResults
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bulk/stats/:uid
   * Get database statistics
   */
  async getStatistics(req, res, next) {
    try {
      const { uid } = req.params;
      const dbPath = path.join(process.cwd(), '..', 'storage', 'app', 'uploads', uid, 'database.db');
      
      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({
          success: false,
          error: 'Database not found'
        });
      }

      const dbService = new DatabaseService(dbPath);
      await dbService.initialize();

      const stats = await dbService.getStatistics(uid);
      
      await dbService.close();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
