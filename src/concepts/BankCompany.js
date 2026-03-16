/**
 * Bank Company Class
 * Xử lý logic đặc thù cho ngân hàng
 */

import { Company } from './Company.js';
import { CompanyType } from './CompanyType.js';

export class BankCompany extends Company {
  constructor(data) {
    super(data, CompanyType.BANK);
  }

  /**
   * Indicators áp dụng cho ngân hàng
   * Map về tên chung để dùng chung rules với công ty thường
   */
  getApplicableIndicators() {
    return {
      // Liquidity - Map A1, A2, A3 về indicators đặc thù cho bank
      'A1': 'Loan to Deposit Ratio',        // Thay vì Current Ratio
      'A2': 'Liquid Assets Ratio',          // Thay vì Quick Ratio
      'A3': 'Cash to Assets Ratio',         // Thay vì Cash Ratio
      
      // Leverage - Dùng chung với công ty thường
      'B1': 'Debt Ratio',
      'B2': 'Debt to Equity',
      'B3': 'Equity Multiplier',            // Thay vì Interest Coverage
      
      // Efficiency - Map C1, C2, C3 về indicators đặc thù cho bank
      'C1': 'Cost to Income Ratio',         // Thay vì Inventory Turnover
      'C2': 'Asset Turnover',               // Giống công ty thường
      'C3': 'NIM (Net Interest Margin)',    // Thay vì Asset Turnover
      
      // Profitability - Dùng chung với công ty thường
      'D1': 'Gross Profit Margin',
      'D2': 'Operating Profit Margin',
      'D3': 'ROE'
    };
  }

  /**
   * Calculation rules cho ngân hàng
   * Map về tên chung A1-D3 để dùng chung indicator_rules.json
   */
  getCalculationRules() {
    return {
      // A1: Loan to Deposit Ratio (thay vì Current Ratio)
      'A1': {
        numerator: 'Loans and advances to customers',
        denominator: 'Deposits from customers',
        description: 'Tỷ lệ cho vay trên huy động vốn'
      },
      
      // A2: Liquid Assets Ratio (thay vì Quick Ratio)
      'A2': {
        numerator: 'Cash and cash equivalents (Bn. VND)',
        denominator: 'TOTAL ASSETS (Bn. VND)',
        description: 'Tỷ lệ tài sản thanh khoản'
      },
      
      // A3: Cash to Assets Ratio (thay vì Cash Ratio)
      'A3': {
        numerator: 'Cash and cash equivalents (Bn. VND)',
        denominator: 'TOTAL ASSETS (Bn. VND)',
        description: 'Tỷ lệ tiền mặt trên tổng tài sản'
      },
      
      // B1: Debt Ratio (dùng chung)
      'B1': {
        numerator: 'LIABILITIES (Bn. VND)',
        denominator: 'TOTAL ASSETS (Bn. VND)',
        description: 'Tỷ lệ nợ trên tổng tài sản'
      },
      
      // B2: Debt to Equity (dùng chung)
      'B2': {
        numerator: 'LIABILITIES (Bn. VND)',
        denominator: 'OWNER\'S EQUITY(Bn.VND)',
        description: 'Tỷ lệ nợ trên vốn chủ sở hữu'
      },
      
      // B3: Equity Multiplier (thay vì Interest Coverage)
      'B3': {
        numerator: 'TOTAL ASSETS (Bn. VND)',
        denominator: 'OWNER\'S EQUITY(Bn.VND)',
        description: 'Hệ số nhân vốn chủ sở hữu'
      },
      
      // C1: Cost to Income Ratio (thay vì Inventory Turnover)
      'C1': {
        numerator: 'General & Admin Expenses',
        denominator: 'Total operating revenue',
        description: 'Tỷ lệ chi phí trên thu nhập'
      },
      
      // C2: Asset Turnover (giống công ty thường)
      'C2': {
        numerator: 'Total operating revenue',
        denominator: 'TOTAL ASSETS (Bn. VND)',
        description: 'Vòng quay tổng tài sản'
      },
      
      // C3: Net Interest Margin (thay vì Asset Turnover)
      'C3': {
        numerator: 'Net Interest Income',
        denominator: 'Total operating revenue',
        description: 'Tỷ suất lãi ròng'
      },
      
      // D1: Gross Profit Margin (dùng chung, nhưng tính khác)
      'D1': {
        numerator: 'Net Interest Income',
        denominator: 'Total operating revenue',
        description: 'Tỷ suất lợi nhuận gộp'
      },
      
      // D2: Operating Profit Margin (dùng chung)
      'D2': {
        numerator: 'Operating Profit before Provision',
        denominator: 'Total operating revenue',
        description: 'Tỷ suất lợi nhuận hoạt động'
      },
      
      // D3: ROE (dùng chung)
      'D3': {
        numerator: 'Net Profit For the Year',
        denominator: 'OWNER\'S EQUITY(Bn.VND)',
        description: 'Tỷ suất sinh lời trên vốn chủ sở hữu'
      }
    };
  }

  /**
   * Validate data cho ngân hàng
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Kiểm tra các field bắt buộc cho ngân hàng
    const requiredFields = [
      'TOTAL ASSETS (Bn. VND)',
      'LIABILITIES (Bn. VND)',
      'OWNER\'S EQUITY(Bn.VND)',
      'Total operating revenue'
    ];

    for (const field of requiredFields) {
      if (!this.hasField(field)) {
        errors.push(`Missing required field for bank: ${field}`);
      }
    }

    // Kiểm tra balance equation cho ngân hàng
    const totalAssets = this.getField('TOTAL ASSETS (Bn. VND)');
    const totalLiabilities = this.getField('LIABILITIES (Bn. VND)');
    const equity = this.getField('OWNER\'S EQUITY(Bn.VND)');

    if (totalAssets !== null && totalLiabilities !== null && equity !== null) {
      const diff = Math.abs(totalAssets - (totalLiabilities + equity));
      const tolerance = totalAssets * 0.01; // 1% tolerance

      if (diff > tolerance) {
        warnings.push(
          `Balance equation violation: Assets (${totalAssets}) != Liabilities (${totalLiabilities}) + Equity (${equity})`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }

  /**
   * Kiểm tra xem có thể tính indicator này không
   */
  canCalculateIndicator(indicator) {
    const rules = this.getCalculationRules();
    const rule = rules[indicator];

    if (!rule) {
      return false;
    }

    // Kiểm tra xem có đủ fields không
    return this.hasField(rule.numerator) && this.hasField(rule.denominator);
  }

  /**
   * Lấy field mapping cho ngân hàng
   */
  getFieldMapping() {
    return {
      // Assets
      total_assets: 'TOTAL ASSETS (Bn. VND)',
      cash: 'Cash and cash equivalents (Bn. VND)',
      loans: 'Loans and advances to customers',
      
      // Liabilities
      total_liabilities: 'LIABILITIES (Bn. VND)',
      deposits: 'Deposits from customers',
      
      // Equity
      equity: 'OWNER\'S EQUITY(Bn.VND)',
      
      // Income
      operating_revenue: 'Total operating revenue',
      net_interest_income: 'Net Interest Income',
      operating_profit: 'Operating Profit before Provision',
      net_profit: 'Net Profit For the Year',
      
      // Expenses
      admin_expenses: 'General & Admin Expenses'
    };
  }
}
