/**
 * Bulk Evaluation Service
 * Xử lý logic đánh giá rủi ro cho nhiều công ty
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getUserDirectory, getUserUploadPath, getUserResultPath } from '../../src/configs/storage.config.js';
import { BatchInferenceEngine } from '../../src/batch/BatchInferenceEngine.js';

export class BulkService {
  constructor() {
    this.configDir = path.join(process.cwd().replace('/server', ''), 'rules');
  }

  /**
   * Save uploaded CSV file
   */
  async saveUploadedFile(file) {
    const uid = uuidv4();
    const userDir = getUserDirectory(uid);

    // Ensure user directory exists
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const uploadPath = getUserUploadPath(uid, file.originalname);
    fs.writeFileSync(uploadPath, file.buffer);

    return {
      uid,
      filename: file.originalname,
      path: uploadPath,
      size: file.size
    };
  }

  /**
   * Parse CSV and return sample data
   */
  async parseCsvSample(filePath, rows = 10) {
    const csv = await import('csv-parser');
    const { default: csvParser } = csv;
    
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          if (results.length < rows) {
            results.push(data);
          }
        })
        .on('end', () => {
          resolve({
            sample: results,
            columns: results.length > 0 ? Object.keys(results[0]) : [],
            totalRows: results.length
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Run batch inference
   */
  async runBatchInference(uid, filename) {
    const uploadPath = getUserUploadPath(uid, filename);
    const resultPath = getUserResultPath(uid, filename);

    const engine = new BatchInferenceEngine(this.configDir);

    // Run full pipeline
    const results = await engine.runBatchPipeline(uploadPath, {
      runStatisticalValidation: true,
      runRiskInference: true,
      outputDir: path.dirname(resultPath)
    });

    // Save results to CSV
    await this._saveResultsToCsv(results, resultPath);

    return {
      uid,
      resultPath,
      results
    };
  }

  /**
   * Save results to CSV
   */
  async _saveResultsToCsv(results, outputPath) {
    const { createObjectCsvWriter } = await import('csv-writer');
    
    if (!results.riskResults || results.riskResults.length === 0) {
      throw new Error('No results to save');
    }

    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'ticker', title: 'Ticker' },
        { id: 'year', title: 'Year' },
        { id: 'quarter', title: 'Quarter' },
        { id: 'risk_level', title: 'Risk Level' },
        { id: 'risk_score', title: 'Risk Score' },
        { id: 'total_points', title: 'Total Points' },
        { id: 'max_points', title: 'Max Points' }
      ]
    });

    const records = results.riskResults.map(r => ({
      ticker: r.ticker,
      year: r.year,
      quarter: r.quarter,
      risk_level: r.final_score?.risk_level || 'Unknown',
      risk_score: r.final_score?.risk_score || 0,
      total_points: r.final_score?.total_risk_points || 0,
      max_points: r.final_score?.max_total_points || 0
    }));

    await csvWriter.writeRecords(records);
  }

  /**
   * Get CSV template
   */
  getTemplate() {
    return {
      filename: 'bulk_evaluation_template.csv',
      headers: ['symbol', 'report', 'ticker', 'yearReport', 'lengthReport', 'Revenue', 'Assets', 'Liabilities'],
      description: 'Template for bulk risk evaluation',
      requiredFields: ['symbol', 'report', 'ticker', 'yearReport', 'lengthReport'],
      sampleData: [
        {
          symbol: 'ACB',
          report: 'income_statement',
          ticker: 'ACB',
          yearReport: 2024,
          lengthReport: 4,
          Revenue: 1000000,
          Assets: 5000000,
          Liabilities: 3000000
        }
      ]
    };
  }
}
