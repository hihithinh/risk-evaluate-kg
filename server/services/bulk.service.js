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

import { getUserDirectory, getUserUploadPath, getUserResultPath, getUserDatabasePath, ensureUserDirectory } from '../../src/configs/storage.config.js';
import { BatchInferenceEngine } from '../../src/batch/BatchInferenceEngine.js';
import { DatabaseService } from './database.service.js';

export class BulkService {
  constructor() {
    this.configDir = path.join(process.cwd().replace('/server', ''), 'rules');
  }

  /**
   * Save uploaded CSV file
   */
  async saveUploadedFile(file) {
    const uid = uuidv4();
    const userDir = ensureUserDirectory(uid);

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
   * Parse and store CSV data to database (called after upload)
   */
  async parseAndStoreCsvData(uid, filename) {
    const uploadPath = getUserUploadPath(uid, filename);
    const dbPath = getUserDatabasePath(uid);

    // Initialize database
    const dbService = new DatabaseService(dbPath);
    await dbService.initialize();

    try {
      // Check if file exists
      if (!fs.existsSync(uploadPath)) {
        console.error('❌ File does not exist:', uploadPath);
        throw new Error(`File not found: ${uploadPath}`);
      }
      
      const csv = await import('csv-parser');
      const { default: csvParser } = csv;
      
      return new Promise((resolve, reject) => {
        const results = [];
        const stream = fs.createReadStream(uploadPath)
          .pipe(csvParser())
          .on('data', (data) => {
            results.push(data);
          })
          .on('end', async () => {
            try {
              // Store each row to database
              for (const row of results) {
                // Extract quarter from lengthReport or calculate it
                let quarter = null;
                if (row.lengthReport) {
                  quarter = parseInt(row.lengthReport);
                }
                
                const companyData = {
                  symbol: row.symbol,
                  ticker: row.ticker,
                  report: row.report,
                  yearReport: parseInt(row.yearReport),
                  quarter: quarter,
                  lengthReport: parseInt(row.lengthReport)
                };

                // Store company basic info
                const companyId = await dbService.storeCompanyData(uid, companyData);
                
                // Store financial indicators
                const indicators = {};
                Object.keys(row).forEach(key => {
                  if (typeof row[key] === 'number' && !isNaN(row[key]) &&
                      !['symbol', 'ticker', 'report', 'yearReport', 'lengthReport'].includes(key)) {
                    indicators[key] = row[key];
                  }
                });
                
                if (Object.keys(indicators).length > 0) {
                  await dbService.storeFinancialIndicators(companyId, indicators);
                }
              }
              
              await dbService.close();
              resolve({
                totalRows: results.length,
                message: 'CSV data stored successfully'
              });
            } catch (error) {
              console.error('❌ Error storing CSV data:', error);
              await dbService.close();
              reject(error);
            }
          })
          .on('error', (error) => {
            console.error('❌ Error parsing CSV:', error);
            reject(error);
          });
      });
    } catch (error) {
      await dbService.close();
      throw error;
    }
  }

  /**
   * Parse CSV and return sample data
   */
  async parseCsvSample(filePath, rows = 10) {
    // Check if file exists before reading
    if (!fs.existsSync(filePath)) {
      console.error('❌ File does not exist:', filePath);
      throw new Error(`File not found: ${filePath}`);
    }
    
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
        .on('error', (error) => {
          console.error('❌ Error parsing CSV:', error);
          reject(error);
        });
    });
  }

  /**
   * Run batch inference
   */
  async runBatchInference(uid, filename) {
    const uploadPath = getUserUploadPath(uid, filename);
    const resultPath = getUserResultPath(uid, filename);
    const dbPath = getUserDatabasePath(uid);

    // Initialize database
    const dbService = new DatabaseService(dbPath);
    await dbService.initialize();

    const engine = new BatchInferenceEngine(this.configDir);

    // Run full pipeline
    const results = await engine.runBatchPipeline(uploadPath, {
      runStatisticalValidation: true,
      runRiskInference: true,
      outputDir: path.dirname(resultPath)
    });

    // Store data in database
    await this._storeResultsInDatabase(dbService, uid, results);

    // Save results to CSV (for backward compatibility)
    await this._saveResultsToCsv(results, resultPath);

    await dbService.close();

    // Return results directly (frontend expects the pipeline results, not wrapper)
    return results;
  }

  /**
   * Save results to CSV
   */
  async _saveResultsToCsv(results, outputPath) {
    const { createObjectCsvWriter } = await import('csv-writer');
    
    if (!results.risk_inference) {
      throw new Error('No results to save');
    }
    
    if (results.risk_inference.length === 0) {
      throw new Error('No results to save');
    }

    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        // Basic info
        { id: 'ticker', title: 'Ticker' },
        { id: 'year', title: 'Year' },
        { id: 'quarter', title: 'Quarter' },
        { id: 'companyType', title: 'Company Type' },
        
        // Indicators (12 indicators)
        { id: 'A1', title: 'A1' },
        { id: 'A2', title: 'A2' },
        { id: 'A3', title: 'A3' },
        { id: 'B1', title: 'B1' },
        { id: 'B2', title: 'B2' },
        { id: 'B3', title: 'B3' },
        { id: 'C1', title: 'C1' },
        { id: 'C2', title: 'C2' },
        { id: 'C3', title: 'C3' },
        { id: 'D1', title: 'D1' },
        { id: 'D2', title: 'D2' },
        { id: 'D3', title: 'D3' },
        
        // Risk signals for each indicator
        { id: 'A1_risk_signal', title: 'A1 Risk Signal' },
        { id: 'A1_risk_level', title: 'A1 Risk Level' },
        { id: 'A1_risk_points', title: 'A1 Risk Points' },
        { id: 'A2_risk_signal', title: 'A2 Risk Signal' },
        { id: 'A2_risk_level', title: 'A2 Risk Level' },
        { id: 'A2_risk_points', title: 'A2 Risk Points' },
        { id: 'A3_risk_signal', title: 'A3 Risk Signal' },
        { id: 'A3_risk_level', title: 'A3 Risk Level' },
        { id: 'A3_risk_points', title: 'A3 Risk Points' },
        { id: 'B1_risk_signal', title: 'B1 Risk Signal' },
        { id: 'B1_risk_level', title: 'B1 Risk Level' },
        { id: 'B1_risk_points', title: 'B1 Risk Points' },
        { id: 'B2_risk_signal', title: 'B2 Risk Signal' },
        { id: 'B2_risk_level', title: 'B2 Risk Level' },
        { id: 'B2_risk_points', title: 'B2 Risk Points' },
        { id: 'B3_risk_signal', title: 'B3 Risk Signal' },
        { id: 'B3_risk_level', title: 'B3 Risk Level' },
        { id: 'B3_risk_points', title: 'B3 Risk Points' },
        { id: 'C1_risk_signal', title: 'C1 Risk Signal' },
        { id: 'C1_risk_level', title: 'C1 Risk Level' },
        { id: 'C1_risk_points', title: 'C1 Risk Points' },
        { id: 'C2_risk_signal', title: 'C2 Risk Signal' },
        { id: 'C2_risk_level', title: 'C2 Risk Level' },
        { id: 'C2_risk_points', title: 'C2 Risk Points' },
        { id: 'C3_risk_signal', title: 'C3 Risk Signal' },
        { id: 'C3_risk_level', title: 'C3 Risk Level' },
        { id: 'C3_risk_points', title: 'C3 Risk Points' },
        { id: 'D1_risk_signal', title: 'D1 Risk Signal' },
        { id: 'D1_risk_level', title: 'D1 Risk Level' },
        { id: 'D1_risk_points', title: 'D1 Risk Points' },
        { id: 'D2_risk_signal', title: 'D2 Risk Signal' },
        { id: 'D2_risk_level', title: 'D2 Risk Level' },
        { id: 'D2_risk_points', title: 'D2 Risk Points' },
        { id: 'D3_risk_signal', title: 'D3 Risk Signal' },
        { id: 'D3_risk_level', title: 'D3 Risk Level' },
        { id: 'D3_risk_points', title: 'D3 Risk Points' },
        
        // Final risk assessment
        { id: 'risk_label', title: 'Risk Label' },
        { id: 'risk_label_points', title: 'Risk Label Points' },
        { id: 'max_possible_points', title: 'Max Possible Points' }
      ]
    });

    // Try to get the actual array
    let riskResults = results.risk_inference;
    if (riskResults && riskResults._all_results) {
      riskResults = riskResults._all_results; // Use all results for CSV
    } else if (riskResults && riskResults.summary && riskResults.summary.results) {
      riskResults = riskResults.summary.results;
    } else if (riskResults && riskResults.results) {
      riskResults = riskResults.results;
    }
    
    if (!Array.isArray(riskResults)) {
      console.error('❌ riskResults is not an array:', typeof riskResults);
      throw new Error('Invalid results structure: risk_inference is not an array');
    }
    
    const records = riskResults.map(r => {
      // Extract all indicators from r.indicators object
      const indicators = r.indicators || {};
      
      // Extract all risk signals and evaluations
      const riskSignals = {};
      const riskLevels = {};
      const riskPoints = {};
      
      // Check if evaluations exist and have data
      if (r.evaluations && typeof r.evaluations === 'object') {
        for (const evaluation of Object.values(r.evaluations)) {
          if (evaluation && typeof evaluation === 'object' && evaluation.indicator) {
            const indicator = evaluation.indicator;
            riskSignals[`${indicator}_risk_signal`] = evaluation.explanation || '';
            riskLevels[`${indicator}_risk_level`] = evaluation.risk_level || '';
            riskPoints[`${indicator}_risk_points`] = evaluation.risk_point || 0;
          }
        }
      }
      
      return {
        // Basic info
        ticker: r.ticker,
        year: r.year,
        quarter: r.quarter,
        companyType: r.companyType || 'Unknown',
        
        // All indicators from indicators object
        ...indicators,
        
        // Risk signals for each indicator
        ...riskSignals,
        ...riskLevels,
        ...riskPoints,
        
        // Final risk assessment
        risk_label: r.final_score?.risk_level || 'Unknown',
        risk_label_points: r.final_score?.total_risk_points || 0,
        max_possible_points: r.final_score?.max_total_points || 0
      };
    });

    await csvWriter.writeRecords(records);
  }

  /**
   * Update evaluation results in SQLite database (companies already stored during upload)
   */
  async _storeResultsInDatabase(dbService, uid, results) {
    try {
      // Update companies with evaluation results
      // Use _all_results for database storage (not just the 10 preview results)
      const allResults = results.risk_inference?._all_results || results.risk_inference?.results || [];
      
      if (allResults.length > 0) {
        console.log(`🔍 Processing ${allResults.length} risk inference results`);
        
        for (const result of allResults) {
          // Find corresponding company by symbol, year, quarter
          const company = await dbService.getCompanyByKey(uid, result.ticker, result.year, result.quarter);
          if (company) {
            
            // Update company with evaluation results
            if (result.final_score) {
              console.log(`🔍 Updating company evaluation:`, result.final_score);
              await dbService.updateCompanyEvaluation(uid, result.ticker, result.year, result.quarter, {
                risk_level: result.final_score.risk_level,
                risk_score: result.final_score.risk_score,
                total_risk_points: result.final_score.total_risk_points,
                max_total_points: result.final_score.max_total_points
              });
              console.log(`✅ Company evaluation updated`);
            } else {
              console.warn(`⚠️ No final_score for company: ${result.ticker} ${result.year} Q${result.quarter}`);
              console.log('🔍 Result keys:', Object.keys(result));
            }
            
            // Store risk signal rule results
            if (result.indicator_results) {
              await dbService.storeRiskSignalRuleResults(company.id, result.indicator_results);
            }
            
            // Store risk label rule results
            if (result.composite_results) {
              await dbService.storeRiskLabelRuleResults(company.id, result.composite_results);
            }
            
            // Store final risk assessment (for detailed reporting)
            if (result.final_score) {
              console.log(`🔍 Storing risk assessment for: ${result.ticker} ${result.year} Q${result.quarter}`);
              await dbService.storeRiskAssessment(
                uid, 
                result.ticker, 
                result.year, 
                result.quarter, 
                result.final_score
              );
              console.log(`✅ Risk assessment stored`);
            }
          } else {
            console.warn(`⚠️ Company not found in database: ${result.ticker} ${result.year} Q${result.quarter}`);
          }
        }
        
        console.log(`✅ Database update completed`);
      } else {
        console.warn(`⚠️ No risk_inference results found`);
        console.log('🔍 Results keys:', Object.keys(results));
      }

      // Evaluation results updated successfully
    } catch (error) {
      console.error('❌ Error updating evaluation results in database:', error);
      throw error;
    }
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
