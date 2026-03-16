/**
 * Financial Data Cache
 * Lưu trữ financial data vào SQLite để tránh fetch lại
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FinancialDataCache {
  constructor() {
    const cacheDir = path.join(__dirname, '..', '..', 'storage', 'cache');
    
    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const dbPath = path.join(cacheDir, 'financial_data.db');
    this.db = new Database(dbPath);
    
    this.initDatabase();
  }

  initDatabase() {
    // Create table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS financial_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        year INTEGER NOT NULL,
        quarter INTEGER NOT NULL,
        data TEXT NOT NULL,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(symbol, year, quarter)
      )
    `);
    
    // Create index for faster lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_symbol_year_quarter 
      ON financial_data(symbol, year, quarter)
    `);
  }

  /**
   * Get cached data
   * @param {string} symbol 
   * @param {number} year 
   * @param {number} quarter 
   * @returns {Object|null} Cached data or null if not found/expired
   */
  get(symbol, year, quarter) {
    try {
      const stmt = this.db.prepare(`
        SELECT data, fetched_at 
        FROM financial_data 
        WHERE symbol = ? AND year = ? AND quarter = ?
      `);
      
      const row = stmt.get(symbol.toUpperCase(), year, quarter);
      
      if (!row) {
        return null;
      }
      
      // Check if data is older than 30 days
      const fetchedAt = new Date(row.fetched_at);
      const now = new Date();
      const daysDiff = (now - fetchedAt) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        console.log(`📦 Cache expired for ${symbol} Q${quarter}/${year} (${daysDiff.toFixed(0)} days old)`);
        return null;
      }
      
      console.log(`✅ Cache hit for ${symbol} Q${quarter}/${year}`);
      return JSON.parse(row.data);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Save data to cache
   * @param {string} symbol 
   * @param {number} year 
   * @param {number} quarter 
   * @param {Object} data 
   */
  set(symbol, year, quarter, data) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO financial_data (symbol, year, quarter, data, fetched_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(symbol.toUpperCase(), year, quarter, JSON.stringify(data));
      console.log(`💾 Cached data for ${symbol} Q${quarter}/${year}`);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Clear cache for specific symbol/period
   */
  clear(symbol, year, quarter) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM financial_data 
        WHERE symbol = ? AND year = ? AND quarter = ?
      `);
      
      stmt.run(symbol.toUpperCase(), year, quarter);
      console.log(`🗑️ Cleared cache for ${symbol} Q${quarter}/${year}`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Clear all cache for a symbol
   */
  clearSymbol(symbol) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM financial_data 
        WHERE symbol = ?
      `);
      
      stmt.run(symbol.toUpperCase());
      console.log(`🗑️ Cleared all cache for ${symbol}`);
    } catch (error) {
      console.error('Cache clear symbol error:', error);
    }
  }

  /**
   * Clear all cache
   */
  clearAll() {
    try {
      this.db.exec('DELETE FROM financial_data');
      console.log('🗑️ Cleared all cache');
    } catch (error) {
      console.error('Cache clear all error:', error);
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT symbol) as unique_symbols,
          MIN(fetched_at) as oldest,
          MAX(fetched_at) as newest
        FROM financial_data
      `);
      
      return stmt.get();
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  close() {
    this.db.close();
  }
}
