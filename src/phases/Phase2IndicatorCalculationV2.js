/**
 * Phase 2: Indicator Calculation V2
 * Sử dụng Company concept và indicator_rules.json (luật tính toán chỉ số)
 * Áp dụng OOP và Polymorphism
 */

import { CompanyFactory } from '../concepts/CompanyFactory.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class IndicatorCalculatorV2 {
  constructor(rulesPath = null) {
    // Load indicator rules từ JSON (luật tính toán chỉ số)
    if (!rulesPath) {
      rulesPath = path.join(__dirname, '..', '..', 'rules', 'indicator_rules.json');
    }
    
    const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
    this.allRules = rulesData.indicator_rules || rulesData.calculation_rules;
    
    // Index rules by indicator and company_type
    this.rulesByType = {
      BANK: {},
      REGULAR: {}
    };
    
    for (const rule of this.allRules) {
      const companyType = rule.company_type || 'REGULAR';
      if (!this.rulesByType[companyType][rule.indicator]) {
        this.rulesByType[companyType][rule.indicator] = rule;
      }
    }
  }

  /**
   * Chia an toàn
   */
  safeDivide(a, b) {
    if (a === null || a === undefined || b === null || b === undefined || b === 0) {
      return null;
    }
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB) || numB === 0) {
      return null;
    }
    return numA / numB;
  }

  /**
   * Trừ an toàn
   */
  safeSubtract(a, b) {
    if (a === null || a === undefined || b === null || b === undefined) {
      return null;
    }
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) {
      return null;
    }
    return numA - numB;
  }

  /**
   * Lấy giá trị tuyệt đối
   */
  abs(value) {
    if (value === null || value === undefined) {
      return null;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      return null;
    }
    return Math.abs(num);
  }

  /**
   * Tính một indicator cho Company
   */
  calculateIndicator(company, indicator) {
    // Lấy rule từ JSON theo company type
    const companyType = company.companyType;
    const rule = this.rulesByType[companyType]?.[indicator];

    if (!rule) {
      return null;
    }

    const calc = rule.calculation;

    // Lấy numerator
    let numerator = null;
    if (calc.numerator.field) {
      // Simple field
      numerator = company.getField(calc.numerator.field);
      if (calc.numerator.transform === 'abs') {
        numerator = this.abs(numerator);
      }
    } else if (calc.numerator.operation) {
      // Complex operation
      if (calc.numerator.operation === 'subtract') {
        const a = company.getField(calc.numerator.operands[0].field);
        const b = company.getField(calc.numerator.operands[1].field);
        numerator = this.safeSubtract(a, b);
      } else if (calc.numerator.operation === 'add') {
        let sum = 0;
        for (const operand of calc.numerator.operands) {
          let val = company.getField(operand.field);
          if (operand.transform === 'abs') {
            val = this.abs(val);
          }
          if (val !== null) sum += val;
        }
        numerator = sum;
      }
    }

    // Lấy denominator
    let denominator = null;
    if (calc.denominator.field) {
      // Simple field
      denominator = company.getField(calc.denominator.field);
      if (calc.denominator.transform === 'abs') {
        denominator = this.abs(denominator);
      }
    }

    // Tính toán
    return this.safeDivide(numerator, denominator);
  }

  /**
   * Tính tất cả indicators cho một company
   */
  calculateAll(companyData) {

    // Tạo Company object từ data
    const company = CompanyFactory.createCompany(companyData);
    

    // Lấy danh sách indicators áp dụng
    const applicableIndicators = company.getApplicableIndicators();
    
    const results = {};

    // Tính từng indicator
    for (const [indicator, name] of Object.entries(applicableIndicators)) {
      const value = this.calculateIndicator(company, indicator);
      results[indicator] = value;

      if (value !== null) {
      } else {
      }
    }

    return results;
  }

  /**
   * Tính indicators cho batch companies
   */
  calculateBatch(companiesData) {
    const results = [];

    for (const companyData of companiesData) {
      const company = CompanyFactory.createCompany(companyData);
      const indicators = {};

      const applicableIndicators = company.getApplicableIndicators();

      for (const [indicator, name] of Object.entries(applicableIndicators)) {
        indicators[indicator] = this.calculateIndicator(company, indicator);
      }

      results.push({
        ticker: company.ticker,
        year: company.year,
        quarter: company.quarter,
        companyType: company.companyType,
        indicators: indicators
      });
    }

    return results;
  }

  /**
   * Lấy summary về indicators có thể tính được
   */
  getCalculationSummary(companyData) {
    const company = CompanyFactory.createCompany(companyData);
    const applicableIndicators = company.getApplicableIndicators();
    
    const summary = {
      ticker: company.ticker,
      companyType: company.companyType,
      total_indicators: Object.keys(applicableIndicators).length,
      calculable: 0,
      missing: 0,
      indicators_status: {}
    };

    for (const [indicator, name] of Object.entries(applicableIndicators)) {
      const canCalculate = company.canCalculateIndicator 
        ? company.canCalculateIndicator(indicator)
        : this.calculateIndicator(company, indicator) !== null;

      summary.indicators_status[indicator] = {
        name: name,
        can_calculate: canCalculate
      };

      if (canCalculate) {
        summary.calculable++;
      } else {
        summary.missing++;
      }
    }

    return summary;
  }
}
