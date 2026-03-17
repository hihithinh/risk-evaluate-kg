/**
 * Phase 2: Indicator Calculation
 * Tính toán các chỉ số tài chính từ A1 đến D3
 * Áp dụng Heuristic H4 - Ưu tiên xác định thuộc tính
 */

import fs from 'fs';

export class IndicatorCalculator {
  constructor(calculationRulesPath) {
    const rulesData = JSON.parse(fs.readFileSync(calculationRulesPath, 'utf-8'));
    this.rules = rulesData;
    this.calculationMap = {};
    
    const rules = rulesData.indicator_rules || rulesData.calculation_rules;
    for (const rule of rules) {
      this.calculationMap[rule.indicator] = rule;
    }
  }

  /**
   * Chia an toàn, trả về null nếu mẫu số = 0 hoặc null
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
   * Cộng an toàn
   */
  safeAdd(a, b) {
    if (a === null || a === undefined || b === null || b === undefined) {
      return null;
    }
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) {
      return null;
    }
    return numA + numB;
  }

  /**
   * Giá trị tuyệt đối an toàn
   */
  safeAbs(a) {
    if (a === null || a === undefined) {
      return null;
    }
    const num = parseFloat(a);
    if (isNaN(num)) {
      return null;
    }
    return Math.abs(num);
  }

  /**
   * Lấy giá trị từ field, áp dụng transform nếu có
   */
  getFieldValue(data, fieldInfo) {
    const fieldName = fieldInfo.field;
    let value = data[fieldName];

    if (value === undefined || value === null || value === '') {
      return null;
    }

    value = parseFloat(value);
    if (isNaN(value)) {
      return null;
    }

    if (fieldInfo.transform === 'abs') {
      value = Math.abs(value);
    }

    return value;
  }

  /**
   * Tính toán một chỉ số cụ thể
   */
  calculateIndicator(indicator, data) {
    if (!this.calculationMap[indicator]) {
      return null;
    }

    const rule = this.calculationMap[indicator];
    const calc = rule.calculation;

    if (calc.operation === 'divide') {
      const numeratorInfo = calc.numerator;
      const denominatorInfo = calc.denominator;

      let numerator;
      let denominator;

      // Calculate numerator
      if (numeratorInfo.operation === 'subtract') {
        const operands = numeratorInfo.operands;
        const val1 = this.getFieldValue(data, operands[0]);
        const val2 = this.getFieldValue(data, operands[1]);
        numerator = this.safeSubtract(val1, val2);
      } else if (numeratorInfo.operation === 'add') {
        const operands = numeratorInfo.operands;
        const val1 = this.getFieldValue(data, operands[0]);
        const val2 = this.getFieldValue(data, operands[1]);
        numerator = this.safeAdd(val1, val2);
      } else {
        numerator = this.getFieldValue(data, numeratorInfo);
      }

      // Calculate denominator
      if (denominatorInfo.operation === 'subtract') {
        const operands = denominatorInfo.operands;
        const val1 = this.getFieldValue(data, operands[0]);
        const val2 = this.getFieldValue(data, operands[1]);
        denominator = this.safeSubtract(val1, val2);
      } else if (denominatorInfo.operation === 'add') {
        const operands = denominatorInfo.operands;
        const val1 = this.getFieldValue(data, operands[0]);
        const val2 = this.getFieldValue(data, operands[1]);
        denominator = this.safeAdd(val1, val2);
      } else {
        denominator = this.getFieldValue(data, denominatorInfo);
      }

      return this.safeDivide(numerator, denominator);
    }

    return null;
  }

  /**
   * Tính toán tất cả chỉ số cho một công ty
   */
  calculateAll(data) {

    const indicators = {};

    for (const indicator of Object.keys(this.calculationMap)) {
      const value = this.calculateIndicator(indicator, data);
      indicators[indicator] = value;

      if (value !== null) {
      } else {
      }
    }

    return indicators;
  }

  /**
   * Lấy thông tin về một chỉ số
   */
  getIndicatorInfo(indicator) {
    return this.calculationMap[indicator] || null;
  }
}
