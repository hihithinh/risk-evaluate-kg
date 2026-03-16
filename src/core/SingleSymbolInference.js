/**
 * Single Symbol Inference
 * Nhập mã, quý, năm → Xuất risk evaluation
 * Dành cho UI: user nhập form → get kết quả ngay
 */

import { DataCrawler } from '../crawler/DataCrawler.js';
import { InferenceEngine } from './InferenceEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SingleSymbolInference {
  constructor() {
    this.configDir = path.join(__dirname, '..', '..', 'rules');
    this.tempDataDir = path.join(__dirname, '..', 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDataDir)) {
      fs.mkdirSync(this.tempDataDir, { recursive: true });
    }
  }

  /**
   * Infer risk cho một symbol cụ thể
   * 
   * @param {string} symbol - Mã chứng khoán (VD: ACB, VCB, HPG)
   * @param {number} year - Năm (VD: 2024, 2025)
   * @param {number} quarter - Quý (1, 2, 3, 4)
   * @returns {Promise<Object>} Risk evaluation result
   */
  async infer(symbol, year, quarter) {
    console.log('\n' + '='.repeat(80));
    console.log(`SINGLE SYMBOL INFERENCE: ${symbol} Q${quarter}/${year}`);
    console.log('='.repeat(80));

    try {
      // Step 1: Crawl data cho symbol này
      console.log('\n📡 Step 1: Crawling financial data...');
      const crawlResult = await this._crawlSymbol(symbol);
      
      if (!crawlResult.success) {
        throw new Error(`Failed to crawl data for ${symbol}: ${crawlResult.error}`);
      }

      // Step 2: Run inference
      console.log('\n🔮 Step 2: Running inference...');
      const inferenceResult = await this._runInference(symbol, year, quarter);

      // Step 3: Clean up temp files
      this._cleanup();

      console.log('\n' + '='.repeat(80));
      console.log('✅ INFERENCE COMPLETED');
      console.log('='.repeat(80));

      return {
        success: true,
        symbol: symbol,
        year: year,
        quarter: quarter,
        result: inferenceResult
      };

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      this._cleanup();
      
      return {
        success: false,
        symbol: symbol,
        year: year,
        quarter: quarter,
        error: error.message
      };
    }
  }

  /**
   * Crawl data cho một symbol và trả về raw data
   * Public method cho Step 1 - SỬ DỤNG CACHE
   */
  async crawlSymbolData(symbol, year, quarter) {
    const crawler = new DataCrawler({
      symbols: [symbol],
      period: 'quarter',
      outputDir: this.tempDataDir,
      useCache: true // Enable cache
    });

    try {
      // Use fetchSingleSymbol to get data with correct year/quarter
      console.log(`📡 Fetching data for ${symbol} Q${quarter}/${year}...`);
      
      const rawData = await crawler.fetchSingleSymbol(symbol, year, quarter);
      
      console.log(`✅ Data fetched for ${symbol} Q${quarter}/${year}:`, Object.keys(rawData).length, 'fields');
      
      return {
        success: true,
        raw_data: rawData,
        company_type: this._detectCompanyType(symbol),
        from_cache: rawData.from_cache || false
      };
    } catch (error) {
      console.error(`❌ Failed to fetch ${symbol} Q${quarter}/${year}:`, error.message);
      return {
        success: false,
        error: error.error || error.message
      };
    }
  }

  /**
   * Crawl data cho một symbol (internal)
   */
  async _crawlSymbol(symbol) {
    const tempFilename = `temp_${symbol}_${Date.now()}.csv`;
    
    const crawler = new DataCrawler({
      symbols: [symbol],
      period: 'quarter',
      outputDir: this.tempDataDir,
      filename: tempFilename
    });

    try {
      const result = await crawler.crawl();
      
      return {
        success: true,
        filename: tempFilename,
        stats: result.stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.error || error.message
      };
    }
  }

  /**
   * Parse CSV to JSON
   */
  _parseCSV(csvPath) {
    try {
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.trim().split('\n');
      
      if (lines.length < 2) return {};
      
      const headers = lines[0].split(',');
      const values = lines[1].split(',');
      
      const data = {};
      headers.forEach((header, i) => {
        data[header.trim()] = values[i]?.trim() || '';
      });
      
      return data;
    } catch (error) {
      console.error('CSV parse error:', error);
      return {};
    }
  }

  /**
   * Detect company type based on symbol
   */
  _detectCompanyType(symbol) {
    const banks = ['ACB', 'BID', 'CTG', 'HDB', 'MBB', 'STB', 'TCB', 'TPB', 'VCB', 'VIB', 'VPB'];
    const securities = ['VCI', 'SSI', 'VND', 'BSI', 'SHS', 'FTS', 'MBS', 'BVS'];
    
    if (banks.includes(symbol.toUpperCase())) return 'BANK';
    if (securities.includes(symbol.toUpperCase())) return 'SECURITIES';
    return 'REGULAR';
  }

  /**
   * Run inference trên data đã crawl
   */
  async _runInference(symbol, year, quarter) {
    // Find the temp file
    const files = fs.readdirSync(this.tempDataDir);
    const tempFile = files.find(f => f.startsWith(`temp_${symbol}_`));
    
    if (!tempFile) {
      throw new Error('Temp data file not found');
    }

    const rawDataPath = path.join(this.tempDataDir, tempFile);

    // Create inference engine
    const engine = new InferenceEngine(this.configDir);

    // Run inference
    const result = await engine.inferSingleCompany(
      rawDataPath,
      symbol,
      year,
      quarter
    );

    return result;
  }

  /**
   * Clean up temp files
   */
  _cleanup() {
    try {
      const files = fs.readdirSync(this.tempDataDir);
      for (const file of files) {
        if (file.startsWith('temp_')) {
          fs.unlinkSync(path.join(this.tempDataDir, file));
        }
      }
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }

  /**
   * Format kết quả cho UI
   */
  formatForUI(result) {
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    const data = result.result;

    return {
      success: true,
      company: {
        symbol: result.symbol,
        year: result.year,
        quarter: result.quarter
      },
      risk_assessment: {
        risk_level: data.final_score?.risk_level || 'Unknown',
        risk_score: data.final_score?.risk_score 
          ? (data.final_score.risk_score * 100).toFixed(2) + '%'
          : 'N/A',
        total_points: data.final_score?.total_risk_points || 0,
        max_points: data.final_score?.max_total_points || 0
      },
      indicators: this._formatIndicators(data.indicators, data.evaluations),
      composite_risks: data.composite_risks || [],
      inference_stats: data.inference_stats || {}
    };
  }

  /**
   * Format indicators cho UI
   */
  _formatIndicators(indicators, evaluations) {
    const formatted = [];

    for (const [key, value] of Object.entries(indicators || {})) {
      const evaluation = evaluations?.[key];
      
      formatted.push({
        code: key,
        value: value !== null ? value.toFixed(4) : 'N/A',
        risk_level: evaluation?.risk_level || 'Unknown',
        risk_point: evaluation?.risk_point || 0,
        explanation: evaluation?.explanation || ''
      });
    }

    return formatted;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
Single Symbol Inference - CLI

Usage:
  node SingleSymbolInference.js <SYMBOL> <YEAR> <QUARTER>

Examples:
  node SingleSymbolInference.js ACB 2024 4
  node SingleSymbolInference.js VCB 2025 1
  node SingleSymbolInference.js HPG 2024 3

This will:
  1. Crawl financial data for the symbol
  2. Run full inference pipeline
  3. Output risk evaluation result
    `);
    process.exit(1);
  }

  const [symbol, year, quarter] = args;

  const inference = new SingleSymbolInference();
  const result = await inference.infer(
    symbol.toUpperCase(),
    parseInt(year),
    parseInt(quarter)
  );

  // Format for UI
  const uiResult = inference.formatForUI(result);

  // Print formatted result
  console.log('\n' + '='.repeat(80));
  console.log('FORMATTED RESULT FOR UI');
  console.log('='.repeat(80));
  console.log(JSON.stringify(uiResult, null, 2));

  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
