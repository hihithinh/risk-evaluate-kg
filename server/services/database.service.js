/**
 * Database Service
 * SQLite service for storing CSV data, indicators, and calculation results
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

export class DatabaseService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Open database connection
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON');

      // Create tables
      await this.createTables();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create all necessary tables
   */
  async createTables() {
    // Companies table - store basic company info from CSV
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL,
        symbol TEXT NOT NULL,
        ticker TEXT,
        report TEXT NOT NULL,
        year_report INTEGER NOT NULL,
        quarter_report INTEGER,
        length_report INTEGER NOT NULL,
        risk_level TEXT,
        risk_score REAL,
        total_risk_points REAL,
        max_total_points REAL,
        evaluation_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(uid, symbol, year_report, quarter_report)
      )
    `);

    // Check if ticker column needs to be modified (for existing databases)
    try {
      const tableInfo = await this.db.all("PRAGMA table_info(companies)");
      const tickerColumn = tableInfo.find(col => col.name === 'ticker');
      
      if (tickerColumn && tickerColumn.notnull === 1) {
        await this.db.exec(`
          BEGIN TRANSACTION;
          CREATE TABLE companies_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uid TEXT NOT NULL,
            symbol TEXT NOT NULL,
            ticker TEXT,
            report TEXT NOT NULL,
            year_report INTEGER NOT NULL,
            quarter_report INTEGER,
            length_report INTEGER NOT NULL,
            risk_level TEXT,
            risk_score REAL,
            total_risk_points REAL,
            max_total_points REAL,
            evaluation_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(uid, symbol, year_report, quarter_report)
          );
          INSERT INTO companies_new SELECT id, uid, symbol, ticker, report, year_report, NULL, length_report, NULL, NULL, NULL, NULL, NULL, created_at FROM companies;
          DROP TABLE companies;
          ALTER TABLE companies_new RENAME TO companies;
          COMMIT TRANSACTION;
        `);
      }
      
      // Check if evaluation columns exist, add them if not
      const hasRiskLevel = tableInfo.some(col => col.name === 'risk_level');
      if (!hasRiskLevel) {
        await this.db.exec(`
          ALTER TABLE companies ADD COLUMN risk_level TEXT;
          ALTER TABLE companies ADD COLUMN risk_score REAL;
          ALTER TABLE companies ADD COLUMN total_risk_points REAL;
          ALTER TABLE companies ADD COLUMN max_total_points REAL;
          ALTER TABLE companies ADD COLUMN evaluation_date DATETIME;
        `);
      }
      
      // Check if quarter_report column exists
      const hasQuarterReport = tableInfo.some(col => col.name === 'quarter_report');
      if (!hasQuarterReport) {
        await this.db.exec(`ALTER TABLE companies ADD COLUMN quarter_report INTEGER;`);
      }
      
    } catch (error) {
      // Silently handle migration errors
    }

    // Financial indicators table - store raw financial data
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS financial_indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        indicator_name TEXT NOT NULL,
        indicator_value REAL NOT NULL,
        period TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
      )
    `);

    // Risk signal rules results table - store risk signal inference results
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS risk_signal_rule_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        rule_name TEXT NOT NULL,
        rule_category TEXT NOT NULL,
        rule_value REAL NOT NULL,
        rule_weight REAL NOT NULL,
        risk_points REAL NOT NULL,
        max_points REAL NOT NULL,
        calculation_details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
      )
    `);

    // Risk label rules results table - store risk label inference results
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS risk_label_rule_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        rule_name TEXT NOT NULL,
        rule_category TEXT NOT NULL,
        composite_score REAL NOT NULL,
        component_rules TEXT,
        risk_points REAL NOT NULL,
        max_points REAL NOT NULL,
        calculation_details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
      )
    `);

    // Risk assessment summary table - store final risk results
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS risk_assessment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL,
        symbol TEXT NOT NULL,
        year_report INTEGER NOT NULL,
        quarter_report INTEGER,
        risk_level TEXT NOT NULL,
        risk_score REAL NOT NULL,
        total_risk_points REAL NOT NULL,
        max_total_points REAL NOT NULL,
        assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(uid, symbol, year_report, quarter_report)
      )
    `);

    // Check if risk_assessment table needs migration (for existing databases)
    try {
      const tableInfo = await this.db.all("PRAGMA table_info(risk_assessment)");
      const uidColumn = tableInfo.find(col => col.name === 'uid');
      
      if (!uidColumn) {
        console.log('🔄 Migrating risk_assessment table...');
        
        // Create new table with proper schema
        await this.db.exec(`
          CREATE TABLE risk_assessment_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uid TEXT NOT NULL,
            symbol TEXT NOT NULL,
            year_report INTEGER NOT NULL,
            quarter_report INTEGER,
            risk_level TEXT NOT NULL,
            risk_score REAL NOT NULL,
            total_risk_points REAL NOT NULL,
            max_total_points REAL NOT NULL,
            assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(uid, symbol, year_report, quarter_report)
          )
        `);
        
        // Migrate data from old table if exists
        try {
          // Check if old table has company_id column
          const oldTableInfo = await this.db.all("PRAGMA table_info(risk_assessment)");
          const hasCompanyId = oldTableInfo.some(col => col.name === 'company_id');
          
          if (hasCompanyId) {
            await this.db.exec(`
              INSERT INTO risk_assessment_new (uid, symbol, year_report, quarter_report, risk_level, risk_score, total_risk_points, max_total_points, assessment_date)
              SELECT c.uid, c.symbol, c.year_report, c.quarter_report, ra.risk_level, ra.risk_score, ra.total_risk_points, ra.max_total_points, ra.assessment_date
              FROM risk_assessment ra
              JOIN companies c ON c.id = ra.company_id
            `);
            console.log('✅ Data migrated from old risk_assessment table');
          } else {
            console.log('⚠️ Old risk_assessment table does not have company_id column, starting fresh');
          }
        } catch (migrateError) {
          console.log('⚠️ Could not migrate data, starting fresh:', migrateError.message);
        }
        
        // Replace old table
        await this.db.exec(`
          DROP TABLE risk_assessment;
          ALTER TABLE risk_assessment_new RENAME TO risk_assessment;
        `);
        
        console.log('✅ risk_assessment table migrated successfully');
      }
    } catch (error) {
      console.log('⚠️ risk_assessment table migration check failed:', error.message);
    }

    // Create indexes for better performance
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_companies_uid ON companies(uid);
      CREATE INDEX IF NOT EXISTS idx_companies_symbol ON companies(symbol);
      CREATE INDEX IF NOT EXISTS idx_financial_indicators_company ON financial_indicators(company_id);
      CREATE INDEX IF NOT EXISTS idx_risk_signal_results_company ON risk_signal_rule_results(company_id);
      CREATE INDEX IF NOT EXISTS idx_risk_label_results_company ON risk_label_rule_results(company_id);
      
      -- New indexes for risk_assessment table
      CREATE INDEX IF NOT EXISTS idx_risk_assessment_composite ON risk_assessment(uid, symbol, year_report, quarter_report);
    `);

    // Database tables created
  }

  /**
   * Store company data from CSV (called during upload)
   */
  async storeCompanyData(uid, companyData) {
    try {
      const stmt = await this.db.prepare(`
        INSERT OR REPLACE INTO companies 
        (uid, symbol, ticker, report, year_report, quarter_report, length_report)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt.run(
        uid,
        companyData.symbol,
        companyData.ticker || null,
        companyData.report,
        companyData.yearReport,
        companyData.quarter || null,
        companyData.lengthReport
      );

      await stmt.finalize();
      
      // Get company ID - use different query approach
      const company = await this.db.get(`
        SELECT id FROM companies 
        WHERE uid = ? AND symbol = ? AND year_report = ? AND 
              (quarter_report = ? OR (quarter_report IS NULL AND ? IS NULL))
      `, [uid, companyData.symbol, companyData.yearReport, 
          companyData.quarter || null, companyData.quarter || null]);

      if (!company) {
        throw new Error(`Failed to retrieve company record for ${companyData.symbol} ${companyData.yearReport} Q${companyData.quarter}`);
      }

      return company.id;
    } catch (error) {
      console.error('❌ Error storing company data:', error);
      throw error;
    }
  }

  /**
   * Update company with evaluation results (called during evaluate)
   */
  async updateCompanyEvaluation(uid, symbol, year, quarter, evaluationData) {
    try {
      const stmt = await this.db.prepare(`
        UPDATE companies 
        SET risk_level = ?, risk_score = ?, total_risk_points = ?, max_total_points = ?, 
            evaluation_date = CURRENT_TIMESTAMP
        WHERE uid = ? AND symbol = ? AND year_report = ? AND 
              (quarter_report = ? OR (quarter_report IS NULL AND ? IS NULL))
      `);

      const result = await stmt.run(
        evaluationData.risk_level,
        evaluationData.risk_score,
        evaluationData.total_risk_points,
        evaluationData.max_total_points,
        uid,
        symbol,
        year,
        quarter,
        quarter
      );

      await stmt.finalize();
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error updating company evaluation:', error);
      throw error;
    }
  }

  /**
   * Get company by ticker, year, quarter
   */
  async getCompanyByKey(uid, symbol, year, quarter) {
    try {
      const company = await this.db.get(`
        SELECT * FROM companies 
        WHERE uid = ? AND symbol = ? AND year_report = ? AND 
              (quarter_report = ? OR (quarter_report IS NULL AND ? IS NULL))
      `, [uid, symbol, year, quarter, quarter]);
      
      if (!company) {
        console.log(`⚠️ Company not found: uid=${uid}, symbol=${symbol}, year=${year}, quarter=${quarter}`);
      }
      
      return company;
    } catch (error) {
      console.error('❌ Error getting company by key:', error);
      throw error;
    }
  }

  /**
   * Store financial indicators
   */
  async storeFinancialIndicators(companyId, indicators) {
    try {
      const stmt = await this.db.prepare(`
        INSERT INTO financial_indicators 
        (company_id, indicator_name, indicator_value, period)
        VALUES (?, ?, ?, ?)
      `);

      for (const [name, value] of Object.entries(indicators)) {
        if (typeof value === 'number' && !isNaN(value)) {
          await stmt.run(companyId, name, value, 'current');
        }
      }

      await stmt.finalize();
    } catch (error) {
      console.error('❌ Error storing financial indicators:', error);
      throw error;
    }
  }

  /**
   * Store risk signal rule results
   */
  async storeRiskSignalRuleResults(companyId, ruleResults) {
    try {
      const stmt = await this.db.prepare(`
        INSERT INTO risk_signal_rule_results 
        (company_id, rule_name, rule_category, rule_value, rule_weight, risk_points, max_points, calculation_details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const result of ruleResults) {
        await stmt.run(
          companyId,
          result.rule_name,
          result.rule_category || 'unknown',
          result.rule_value || 0,
          result.rule_weight || 0,
          result.risk_points || 0,
          result.max_points || 0,
          JSON.stringify(result.calculation_details || {})
        );
      }

      await stmt.finalize();
    } catch (error) {
      console.error('❌ Error storing risk signal rule results:', error);
      throw error;
    }
  }

  /**
   * Store risk label rule results
   */
  async storeRiskLabelRuleResults(companyId, compositeResults) {
    try {
      const stmt = await this.db.prepare(`
        INSERT INTO risk_label_rule_results 
        (company_id, rule_name, rule_category, composite_score, component_rules, risk_points, max_points, calculation_details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const result of compositeResults) {
        await stmt.run(
          companyId,
          result.rule_name,
          result.rule_category || 'unknown',
          result.composite_score || 0,
          JSON.stringify(result.component_rules || []),
          result.risk_points || 0,
          result.max_points || 0,
          JSON.stringify(result.calculation_details || {})
        );
      }

      await stmt.finalize();
    } catch (error) {
      console.error('❌ Error storing risk label rule results:', error);
      throw error;
    }
  }

  /**
   * Store final risk assessment
   */
  async storeRiskAssessment(uid, symbol, year, quarter, riskData) {
    try {
      const stmt = await this.db.prepare(`
        INSERT OR REPLACE INTO risk_assessment 
        (uid, symbol, year_report, quarter_report, risk_level, risk_score, total_risk_points, max_total_points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      await stmt.run(
        uid,
        symbol,
        year,
        quarter,
        riskData.risk_level,
        riskData.risk_score,
        riskData.total_risk_points,
        riskData.max_total_points
      );

      await stmt.finalize();
    } catch (error) {
      console.error('❌ Error storing risk assessment:', error);
      throw error;
    }
  }

  /**
   * Get company data with all related information
   */
  async getCompanyData(uid, symbol = null, year = null, options = {}) {
    try {
      const {
        quarter,
        riskLevel,
        sortBy = 'symbol',
        sortOrder = 'asc',
        limit = 100,
        offset = 0
      } = options;

      let query = `
        SELECT c.*, 
               ra.risk_level as ra_risk_level,
               ra.risk_score as ra_risk_score,
               ra.total_risk_points as ra_total_risk_points,
               ra.max_total_points as ra_max_total_points,
               ra.assessment_date,
               COALESCE(ra.risk_level, c.risk_level) as risk_level,
               COALESCE(ra.risk_score, c.risk_score) as risk_score,
               COALESCE(ra.total_risk_points, c.total_risk_points) as total_risk_points,
               COALESCE(ra.max_total_points, c.max_total_points) as max_total_points
        FROM companies c
        LEFT JOIN risk_assessment ra ON (
          c.uid = ra.uid AND 
          c.symbol = ra.symbol AND 
          c.year_report = ra.year_report AND 
          c.quarter_report = ra.quarter_report
        )
        WHERE c.uid = ?
      `;
      const params = [uid];

      if (symbol) {
        query += ` AND c.symbol LIKE ?`;
        params.push(`%${symbol}%`);
      }

      if (year) {
        query += ` AND c.year_report = ?`;
        params.push(year);
      }

      if (quarter) {
        query += ` AND c.quarter_report = ?`;
        params.push(quarter);
      }

      if (riskLevel) {
        query += ` AND ra.risk_level = ?`;
        params.push(riskLevel);
      }

      // Add sorting
      const validSortColumns = ['symbol', 'year_report', 'length_report', 'risk_level', 'risk_score', 'total_risk_points'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'symbol';
      const sortDirection = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      
      query += ` ORDER BY c.${sortColumn} ${sortDirection}`;

      // Add pagination
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const results = await this.db.all(query, params);
      return results;
    } catch (error) {
      console.error('❌ Error getting company data:', error);
      throw error;
    }
  }

  /**
   * Get financial indicators for a company
   */
  async getFinancialIndicators(companyId) {
    try {
      return await this.db.all(`
        SELECT indicator_name, indicator_value, period, created_at
        FROM financial_indicators
        WHERE company_id = ?
        ORDER BY indicator_name
      `, [companyId]);
    } catch (error) {
      console.error('❌ Error getting risk signal rule results:', error);
      throw error;
    }
  }

  /**
   * Get risk signal rule results for a company
   */
  async getRiskSignalRuleResults(companyId) {
    try {
      return await this.db.all(`
        SELECT rule_name, rule_category, rule_value, rule_weight, 
               risk_points, max_points, calculation_details, created_at
        FROM risk_signal_rule_results
        WHERE company_id = ?
        ORDER BY rule_category, rule_name
      `, [companyId]);
    } catch (error) {
      console.error('❌ Error getting risk signal rule results:', error);
      throw error;
    }
  }

  /**
   * Get risk label rule results for a company
   */
  async getRiskLabelRuleResults(companyId) {
    try {
      return await this.db.all(`
        SELECT rule_name, rule_category, composite_score, component_rules, 
               risk_points, max_points, calculation_details, created_at
        FROM risk_label_rule_results
        WHERE company_id = ?
        ORDER BY rule_category, rule_name
      `, [companyId]);
    } catch (error) {
      console.error('❌ Error getting risk label rule results:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(uid) {
    try {
      const stats = await this.db.get(`
        SELECT 
          COUNT(DISTINCT c.id) as total_companies,
          COUNT(DISTINCT c.symbol) as unique_symbols,
          COUNT(fi.id) as total_indicators,
          COUNT(irr.id) as total_risk_signal_rules,
          COUNT(crr.id) as total_risk_label_rules,
          COUNT(ra.id) as total_risk_assessments
        FROM companies c
        LEFT JOIN financial_indicators fi ON c.id = fi.company_id
        LEFT JOIN risk_signal_rule_results irr ON c.id = irr.company_id
        LEFT JOIN risk_label_rule_results crr ON c.id = crr.company_id
        LEFT JOIN risk_assessment ra ON c.id = ra.company_id
        WHERE c.uid = ?
      `, [uid]);

      return stats;
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      throw error;
    }
  }
}
