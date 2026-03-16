/**
 * Data Crawler - Node.js Wrapper
 * Wrapper cho Python vnstock crawler
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';
import { FinancialDataCache } from '../cache/FinancialDataCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DataCrawler {
  constructor(options = {}) {
    this.pythonScript = path.join(__dirname, 'financial_data_crawler.py');
    this.symbols = options.symbols || null;
    this.period = options.period || 'quarter';
    this.outputDir = options.outputDir || null;
    this.filename = options.filename || 'raw_financial_data.csv';
    this.cache = new FinancialDataCache();
    this.useCache = options.useCache !== false; // Default true
  }

  /**
   * Fetch data cho single symbol với cache
   * @param {string} symbol 
   * @param {number} year 
   * @param {number} quarter 
   * @returns {Promise<Object>} Financial data
   */
  async fetchSingleSymbol(symbol, year, quarter) {
    // Check cache first
    if (this.useCache) {
      const cached = this.cache.get(symbol, year, quarter);
      if (cached) {
        return { ...cached, from_cache: true };
      }
    }

    console.log(`📡 Fetching fresh data for ${symbol} Q${quarter}/${year}...`);

    // Set year/quarter for this crawl
    this.year = year;
    this.quarter = quarter;

    // Fetch from API
    try {
      const data = await this.crawlSingleSymbol(symbol, year, quarter);
      
      // Only cache if fetch successful
      if (data && this.useCache) {
        this.cache.set(symbol, year, quarter, data);
      }
      
      return { ...data, from_cache: false };
    } catch (error) {
      console.error(`❌ Failed to fetch ${symbol} Q${quarter}/${year}:`, error.message);
      throw error;
    }
  }

  /**
   * Crawl single symbol (internal - no cache)
   */
  async crawlSingleSymbol(symbol, year, quarter) {
    // Set options for single symbol
    this.symbols = [symbol];
    this.period = 'quarter';
    this.year = year;
    this.quarter = quarter;
    
    // Crawl and get result directly
    const result = await this.crawl();
    
    if (!result.success) {
      throw new Error(result.error || 'Crawl failed');
    }
    
    // Return JSON data directly from Python stdout
    console.log('🐍 Python returned JSON data directly');
    console.log('🔍 Data keys:', Object.keys(result.data || {}).length);
    console.log('🔍 Sample values:', Object.entries(result.data || {}).slice(0, 3));
    
    return result.data || {};
  }

  /**
   * Parse CSV file to JSON
   */
  parseCSV(csvPath) {
    try {
      const results = {};
      
      console.log(`📁 Parsing CSV file: ${csvPath}`);
      
      return new Promise((resolve, reject) => {
        // Check if file exists
        if (!fs.existsSync(csvPath)) {
          console.error(`❌ CSV file not found: ${csvPath}`);
          reject(new Error(`CSV file not found: ${csvPath}`));
          return;
        }
        
        // Check file size
        const stats = fs.statSync(csvPath);
        console.log(`📊 CSV file size: ${stats.size} bytes`);
        
        let rowCount = 0;
        
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on('data', (row) => {
            rowCount++;
            console.log(`📝 CSV Row ${rowCount}:`, Object.keys(row).length, 'columns');
            
            // Convert CSV row to key-value pairs
            Object.entries(row).forEach(([key, value]) => {
              if (key && key.trim()) {
                results[key.trim()] = value;
              }
            });
          })
          .on('end', () => {
            console.log(`✅ CSV parsing completed. Rows: ${rowCount}, Fields: ${Object.keys(results).length}`);
            console.log(`🔍 Sample fields:`, Object.keys(results).slice(0, 5));
            console.log(`🔍 Sample values:`, Object.entries(results).slice(0, 3));
            resolve(results);
          })
          .on('error', (error) => {
            console.error('❌ CSV parsing error:', error);
            reject(error);
          });
      });
    } catch (error) {
      console.error('❌ Failed to parse CSV:', error);
      throw error;
    }
  }

  /**
   * Chạy crawler
   */
  async crawl() {
    return new Promise((resolve, reject) => {
      console.log('\n🚀 Starting Financial Data Crawler...');
      console.log(`Period: ${this.period}`);
      if (this.symbols) {
        console.log(`Symbols: ${this.symbols.join(', ')}`);
      }

      // Build command arguments
      const args = [this.pythonScript];
      
      if (this.symbols) {
        args.push('--symbols', ...this.symbols);
      }
      
      args.push('--period', this.period);
      
      // Add year and quarter if specified
      if (this.year) {
        args.push('--year', this.year.toString());
      }
      
      if (this.quarter) {
        args.push('--quarter', this.quarter.toString());
      }
      
      if (this.outputDir) {
        args.push('--output', this.outputDir);
      }
      
      args.push('--filename', this.filename);
      
      // Add stats JSON output
      const statsFile = path.join(__dirname, 'crawler_stats.json');
      args.push('--stats-json', statsFile);

      // Use venv Python
      const venvPython = path.join(__dirname, '..', '..', 'venv', 'bin', 'python3');
      
      // Spawn Python process
      const python = spawn(venvPython, args, {
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      // Capture stdout
      python.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      // Capture stderr
      python.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });

      // Handle completion
      python.on('close', (code) => {
        if (code === 0) {
          // Parse JSON from stdout for single symbol
          let data = null;
          
          if (this.symbols && this.symbols.length === 1) {
            try {
              // Extract JSON from stdout (multi-line JSON)
              const lines = stdout.trim().split('\n');
              
              // Find the start of JSON (line with "{")
              let jsonStartIndex = -1;
              let jsonEndIndex = -1;
              
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('🐍 OUTPUTTING JSON DATA FOR SINGLE SYMBOL')) {
                  jsonStartIndex = i + 1; // Next line after the marker
                  break;
                }
              }
              
              if (jsonStartIndex >= 0) {
                // Extract all lines from start to end
                const jsonLines = [];
                let braceCount = 0;
                let foundFirstBrace = false;
                
                for (let i = jsonStartIndex; i < lines.length; i++) {
                  const line = lines[i];
                  jsonLines.push(line);
                  
                  // Count braces to find end of JSON
                  for (const char of line) {
                    if (char === '{') {
                      braceCount++;
                      foundFirstBrace = true;
                    }
                    if (char === '}') braceCount--;
                  }
                  
                  // End when we found first brace and count back to 0
                  if (foundFirstBrace && braceCount === 0) {
                    jsonEndIndex = i;
                    break;
                  }
                }
                
                console.log(`🔍 JSON extraction: start=${jsonStartIndex}, end=${jsonEndIndex}, lines=${jsonLines.length}, braceCount=${braceCount}`);
                
                if (jsonEndIndex >= jsonStartIndex) {
                  const jsonString = jsonLines.join('\n');
                  console.log('🔍 Attempting to parse JSON...');
                  try {
                    data = JSON.parse(jsonString);
                    console.log('✅ Parsed multi-line JSON from Python stdout');
                    console.log(`🔍 JSON lines: ${jsonLines.length}, keys: ${Object.keys(data).length}`);
                  } catch (parseError) {
                    console.error('❌ JSON parse error:', parseError.message);
                    console.log('🔍 JSON string preview:', jsonString.substring(0, 500) + '...');
                    
                    // Fallback: read JSON file
                    console.log('🔄 Fallback: reading JSON file...');
                    try {
                      const jsonFile = path.join(this.outputDir || path.join(__dirname, '..', '..', 'temp'), `${this.symbols[0]}_Q${this.quarter}_${this.year}.json`);
                      if (fs.existsSync(jsonFile)) {
                        const fileContent = fs.readFileSync(jsonFile, 'utf-8');
                        data = JSON.parse(fileContent);
                        console.log('✅ Fallback: parsed JSON from file');
                        console.log(`🔍 File keys: ${Object.keys(data).length}`);
                      } else {
                        console.warn('⚠️ JSON file not found:', jsonFile);
                      }
                    } catch (fileError) {
                      console.error('❌ Fallback file read error:', fileError.message);
                    }
                  }
                } else {
                  console.warn('⚠️ Could not find JSON end - braceCount never reached 0');
                  
                  // Fallback: read JSON file
                  console.log('🔄 Fallback: reading JSON file...');
                  try {
                    const jsonFile = path.join(this.outputDir || path.join(__dirname, '..', '..', 'temp'), `${this.symbols[0]}_Q${this.quarter}_${this.year}.json`);
                    if (fs.existsSync(jsonFile)) {
                      const fileContent = fs.readFileSync(jsonFile, 'utf-8');
                      data = JSON.parse(fileContent);
                      console.log('✅ Fallback: parsed JSON from file');
                      console.log(`🔍 File keys: ${Object.keys(data).length}`);
                    } else {
                      console.warn('⚠️ JSON file not found:', jsonFile);
                    }
                  } catch (fileError) {
                    console.error('❌ Fallback file read error:', fileError.message);
                  }
                }
              }
            } catch (error) {
              console.warn('⚠️ Could not parse JSON from stdout:', error.message);
              
              // Re-declare variables for debug
              const stdoutLines = stdout.trim().split('\n');
              let markerIdx = -1;
              
              for (let i = 0; i < stdoutLines.length; i++) {
                if (stdoutLines[i].includes('🐍 OUTPUTTING JSON DATA FOR SINGLE SYMBOL')) {
                  markerIdx = i + 1;
                  break;
                }
              }
              
              console.log('🔍 Total stdout lines:', stdoutLines.length);
              console.log('🔍 Marker line index:', markerIdx);
              console.log('🔍 Last 10 lines of stdout:');
              stdoutLines.slice(-10).forEach((line, i) => {
                console.log(`  ${stdoutLines.length - 10 + i}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
              });
              
              // Try to find any JSON-like content
              const jsonLines = stdoutLines.filter(line => line.includes('{') || line.includes('"'));
              console.log('🔍 JSON-like lines:', jsonLines.length);
              jsonLines.slice(-5).forEach((line, i) => {
                console.log(`  JSON ${i}: ${line}`);
              });
            }
          }
          
          // Read stats file for multiple symbols
          let stats = null;
          try {
            if (fs.existsSync(statsFile)) {
              stats = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
              fs.unlinkSync(statsFile); // Clean up
            }
          } catch (error) {
            console.warn('⚠️ Could not read stats file:', error.message);
          }

          resolve({
            success: true,
            code: code,
            data: data, // JSON data for single symbol
            stats: stats,
            stdout: stdout,
            stderr: stderr
          });
        } else {
          reject({
            success: false,
            code: code,
            error: `Python process exited with code ${code}`,
            stdout: stdout,
            stderr: stderr
          });
        }
      });

      // Handle errors
      python.on('error', (error) => {
        reject({
          success: false,
          error: error.message,
          stdout: stdout,
          stderr: stderr
        });
      });
    });
  }

  /**
   * Crawl với custom symbols
   */
  async crawlSymbols(symbols, period = 'quarter') {
    this.symbols = symbols;
    this.period = period;
    return this.crawl();
  }

  /**
   * Crawl tất cả symbols mặc định
   */
  async crawlAll(period = 'quarter') {
    this.symbols = null; // Use default symbols
    this.period = period;
    return this.crawl();
  }

  /**
   * Test crawler với một vài symbols
   */
  async test() {
    console.log('\n🧪 Testing crawler with 3 symbols...');
    this.symbols = ['ACB', 'VCB', 'HPG'];
    this.period = 'quarter';
    return this.crawl();
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const crawler = new DataCrawler();

  try {
    switch (command) {
      case 'test':
        await crawler.test();
        break;

      case 'crawl':
        const symbols = args.slice(1);
        if (symbols.length > 0) {
          await crawler.crawlSymbols(symbols);
        } else {
          await crawler.crawlAll();
        }
        break;

      case 'help':
      default:
        console.log(`
Financial Data Crawler - Node.js Wrapper

Usage:
  node DataCrawler.js test              - Test with 3 symbols (ACB, VCB, HPG)
  node DataCrawler.js crawl             - Crawl all default symbols
  node DataCrawler.js crawl ACB VCB HPG - Crawl specific symbols

Examples:
  node DataCrawler.js test
  node DataCrawler.js crawl
  node DataCrawler.js crawl ACB VCB CTG MBB TCB
        `);
        break;
    }
  } catch (error) {
    console.error('\n❌ Crawler failed:', error.error || error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
