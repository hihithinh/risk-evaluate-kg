/**
 * Phase 1: Data Standardization & Integration
 * Chuẩn hóa và hợp nhất dữ liệu từ 3 nguồn báo cáo tài chính
 */

import fs from 'fs';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

export class DataStandardizer {
  constructor(schemaMappingPath) {
    const schemaData = JSON.parse(fs.readFileSync(schemaMappingPath, 'utf-8'));
    this.schema = schemaData;
    this.reportTypes = schemaData.report_types;
    this.mergeKeys = schemaData.merge_keys;
    this.validationFields = schemaData.validation_fields;
  }

  /**
   * Bước 1: Đọc dữ liệu thô từ CSV
   */
  async loadRawData(rawDataPath) {
    return new Promise((resolve, reject) => {
      const data = [];
      
      createReadStream(rawDataPath)
        .pipe(csv())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', () => {
          resolve(data);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Bước 2: Tách dữ liệu theo loại báo cáo
   */
  splitByReportType(data) {
    const reports = {};
    
    for (const reportType of this.reportTypes) {
      reports[reportType] = data.filter(row => row.report === reportType);
    }
    
    return reports;
  }

  /**
   * Bước 3: Loại bỏ các cột toàn null/undefined
   */
  removeEmptyColumns(reports) {
    const cleaned = {};
    
    for (const [reportType, rows] of Object.entries(reports)) {
      if (rows.length === 0) {
        cleaned[reportType] = rows;
        continue;
      }

      const allKeys = Object.keys(rows[0]);
      const nonEmptyKeys = allKeys.filter(key => {
        return rows.some(row => row[key] !== null && row[key] !== undefined && row[key] !== '');
      });

      cleaned[reportType] = rows.map(row => {
        const cleanedRow = {};
        for (const key of nonEmptyKeys) {
          cleanedRow[key] = row[key];
        }
        return cleanedRow;
      });

      const removed = allKeys.length - nonEmptyKeys.length;
    }
    
    return cleaned;
  }

  /**
   * Bước 4: Hợp nhất 3 báo cáo
   */
  mergeReports(reports) {
    const balance = reports['balance_sheet'] || [];
    const income = reports['income_statement'] || [];
    const cash = reports['cash_flow'] || [];

    if (balance.length === 0) {
      return [];
    }

    const merged = balance.map(balanceRow => {
      const mergedRow = { ...balanceRow };

      const matchingIncome = income.find(row => 
        this.mergeKeys.every(key => row[key] === balanceRow[key])
      );

      const matchingCash = cash.find(row =>
        this.mergeKeys.every(key => row[key] === balanceRow[key])
      );

      if (matchingIncome) {
        Object.assign(mergedRow, matchingIncome);
      }

      if (matchingCash) {
        Object.assign(mergedRow, matchingCash);
      }

      return mergedRow;
    });

    return merged;
  }

  /**
   * Bước 5: Kiểm tra tính hợp lệ của dữ liệu
   */
  validateData(data) {
    const validationRules = this.schema.validation_rules || [];

    for (const rule of validationRules) {
      const ruleName = rule.rule;

      if (ruleName === 'non_negative_assets') {
        for (const field of rule.fields) {
          const col = this.validationFields[field];
          if (col) {
            const negativeCount = data.filter(row => {
              const value = parseFloat(row[col]);
              return !isNaN(value) && value < 0;
            }).length;

            if (negativeCount > 0) {
            }
          }
        }
      } else if (ruleName === 'non_negative_liabilities') {
        for (const field of rule.fields) {
          const col = this.validationFields[field];
          if (col) {
            const negativeCount = data.filter(row => {
              const value = parseFloat(row[col]);
              return !isNaN(value) && value < 0;
            }).length;

            if (negativeCount > 0) {
            }
          }
        }
      } else if (ruleName === 'balance_equation') {
        const totalAssetsCol = this.validationFields['total_assets'];
        const totalLiabilitiesCol = this.validationFields['total_liabilities'];
        const equityCol = this.validationFields['owners_equity'];
        const tolerance = rule.tolerance || 0.01;

        const violations = data.filter(row => {
          const assets = parseFloat(row[totalAssetsCol]);
          const liabilities = parseFloat(row[totalLiabilitiesCol]);
          const equity = parseFloat(row[equityCol]);

          if (isNaN(assets) || isNaN(liabilities) || isNaN(equity)) {
            return false;
          }

          const diff = Math.abs(assets - (liabilities + equity));
          return diff > tolerance;
        }).length;

        if (violations > 0) {
        }
      }
    }

    return data;
  }

  /**
   * Chạy toàn bộ pipeline Phase 1
   */
  async standardize(rawDataPath) {

    const rawData = await this.loadRawData(rawDataPath);
    const reports = this.splitByReportType(rawData);
    const cleaned = this.removeEmptyColumns(reports);
    const merged = this.mergeReports(cleaned);
    const validated = this.validateData(merged);

    return validated;
  }

  /**
   * Lấy dữ liệu cho một công ty cụ thể
   */
  getCompanyData(standardizedData, ticker, year, quarter) {
    const filtered = standardizedData.filter(row => {
      const rowTicker = row.ticker || row['﻿ticker']; // Handle BOM
      const rowYear = parseInt(row.yearReport || row.year);
      const rowQuarter = parseInt(row.lengthReport || row.quarter);
      
      return rowTicker === ticker &&
             rowYear === year &&
             rowQuarter === quarter;
    });

    if (filtered.length === 0) {
      throw new Error(`No data found for ${ticker} Q${quarter}/${year}`);
    }

    return filtered[0];
  }
}
