/**
 * Regular Company Class
 * Xử lý logic cho công ty thường (không phải ngân hàng, chứng khoán, bảo hiểm)
 */

import { Company } from './Company.js';
import { CompanyType } from './CompanyType.js';

export class RegularCompany extends Company {
  constructor(data) {
    super(data, CompanyType.REGULAR);
  }

  /**
   * Indicators áp dụng cho công ty thường
   * Đầy đủ 12 indicators A1-D3
   */
  getApplicableIndicators() {
    return {
      // Liquidity
      'A1': 'Current Ratio',
      'A2': 'Quick Ratio',
      'A3': 'Cash Ratio',
      
      // Leverage
      'B1': 'Debt Ratio',
      'B2': 'Debt to Equity',
      'B3': 'Interest Coverage',
      
      // Efficiency
      'C1': 'Inventory Turnover',
      'C2': 'Receivables Turnover',
      'C3': 'Asset Turnover',
      
      // Profitability
      'D1': 'Gross Profit Margin',
      'D2': 'Operating Profit Margin',
      'D3': 'ROE'
    };
  }

  /**
   * Calculation rules cho công ty thường
   */
  getCalculationRules() {
    return {
      // A1: Current Ratio
      'A1': {
        numerator: 'CURRENT ASSETS (Bn. VND)',
        denominator: 'Current liabilities (Bn. VND)',
        description: 'Tỷ lệ thanh toán hiện hành'
      },
      
      // A2: Quick Ratio
      'A2': {
        numerator: {
          operation: 'subtract',
          operands: [
            { field: 'CURRENT ASSETS (Bn. VND)' },
            { field: 'Inventories, Net (Bn. VND)' }
          ]
        },
        denominator: 'Current liabilities (Bn. VND)',
        description: 'Tỷ lệ thanh toán nhanh'
      },
      
      // A3: Cash Ratio
      'A3': {
        numerator: 'Cash and cash equivalents',
        denominator: 'Current liabilities (Bn. VND)',
        description: 'Tỷ lệ tiền mặt'
      },
      
      // B1: Debt Ratio
      'B1': {
        numerator: 'LIABILITIES',
        denominator: 'TOTAL ASSETS',
        description: 'Tỷ lệ nợ trên tổng tài sản'
      },
      
      // B2: Debt to Equity
      'B2': {
        numerator: 'LIABILITIES',
        denominator: 'Capital and reserves (Bn. VND)',
        description: 'Tỷ lệ nợ trên vốn chủ sở hữu'
      },
      
      // B3: Interest Coverage
      'B3': {
        numerator: 'Operating Profit/Loss',
        denominator: { field: 'Interest Expenses', transform: 'abs' },
        description: 'Khả năng thanh toán lãi vay'
      },
      
      // C1: Inventory Turnover
      'C1': {
        numerator: 'Cost of Sales',
        denominator: 'Inventories, Net (Bn. VND)',
        description: 'Vòng quay hàng tồn kho'
      },
      
      // C2: Receivables Turnover
      'C2': {
        numerator: 'Net Sales',
        denominator: 'Accounts receivable (Bn. VND)',
        description: 'Vòng quay khoản phải thu'
      },
      
      // C3: Asset Turnover
      'C3': {
        numerator: 'Net Sales',
        denominator: 'TOTAL ASSETS',
        description: 'Vòng quay tổng tài sản'
      },
      
      // D1: Gross Profit Margin
      'D1': {
        numerator: 'Gross Profit',
        denominator: 'Net Sales',
        description: 'Tỷ suất lợi nhuận gộp'
      },
      
      // D2: Operating Profit Margin
      'D2': {
        numerator: 'Operating Profit/Loss',
        denominator: 'Net Sales',
        description: 'Tỷ suất lợi nhuận hoạt động'
      },
      
      // D3: ROE
      'D3': {
        numerator: 'Net Profit/Loss before tax',
        denominator: 'Capital and reserves (Bn. VND)',
        description: 'Tỷ suất sinh lời trên vốn chủ sở hữu'
      }
    };
  }

  /**
   * Validate data cho công ty thường
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Kiểm tra các field bắt buộc
    const requiredFields = [
      'TOTAL ASSETS',
      'LIABILITIES',
      'Capital and reserves (Bn. VND)'
    ];

    for (const field of requiredFields) {
      if (!this.hasField(field)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Kiểm tra balance equation
    const totalAssets = this.getField('TOTAL ASSETS');
    const totalLiabilities = this.getField('LIABILITIES');
    const equity = this.getField('Capital and reserves (Bn. VND)');

    if (totalAssets !== null && totalLiabilities !== null && equity !== null) {
      const diff = Math.abs(totalAssets - (totalLiabilities + equity));
      const tolerance = totalAssets * 0.01;

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

    // Kiểm tra numerator
    if (rule.numerator.operation) {
      // Complex numerator
      const operands = rule.numerator.operands;
      for (const operand of operands) {
        if (!this.hasField(operand.field)) {
          return false;
        }
      }
    } else {
      // Simple numerator
      if (!this.hasField(rule.numerator)) {
        return false;
      }
    }

    // Kiểm tra denominator
    if (rule.denominator.operation) {
      // Complex denominator
      const operands = rule.denominator.operands;
      for (const operand of operands) {
        if (!this.hasField(operand.field)) {
          return false;
        }
      }
    } else if (rule.denominator.field) {
      // Denominator with transform
      if (!this.hasField(rule.denominator.field)) {
        return false;
      }
    } else {
      // Simple denominator
      if (!this.hasField(rule.denominator)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Lấy field mapping cho công ty thường
   */
  getFieldMapping() {
    return {
      // Assets
      total_assets: 'TOTAL ASSETS',
      current_assets: 'CURRENT ASSETS (Bn. VND)',
      cash: 'Cash and cash equivalents',
      inventories: 'Inventories, Net (Bn. VND)',
      receivables: 'Accounts receivable (Bn. VND)',
      
      // Liabilities
      total_liabilities: 'LIABILITIES',
      current_liabilities: 'Current liabilities (Bn. VND)',
      
      // Equity
      equity: 'Capital and reserves (Bn. VND)',
      
      // Income
      net_sales: 'Net Sales',
      gross_profit: 'Gross Profit',
      operating_profit: 'Operating Profit/Loss',
      net_profit: 'Net Profit/Loss before tax',
      
      // Expenses
      cost_of_sales: 'Cost of Sales',
      interest_expenses: 'Interest Expenses'
    };
  }
}
