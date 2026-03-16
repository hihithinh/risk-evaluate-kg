/**
 * Bulk Controller
 * Xử lý requests cho Bulk Risk Evaluation
 */

import { BulkService } from '../services/bulk.service.js';

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
        require('path').join(process.cwd(), 'storage', 'app', uid, filename)
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
      const filePath = require('path').join(
        process.cwd(),
        'storage',
        'app',
        uid,
        `result_${filename}`
      );

      if (!require('fs').existsSync(filePath)) {
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
}
