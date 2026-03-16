/**
 * Base Company Class
 * Abstract class cho tất cả loại công ty
 */

import { CompanyType } from './CompanyType.js';

export class Company {
  constructor(data, companyType) {
    this.data = data;
    this.companyType = companyType;
    this.ticker = data.ticker || data['﻿ticker'];
    this.year = parseInt(data.yearReport || data.year);
    this.quarter = parseInt(data.lengthReport || data.quarter);
  }

  /**
   * Kiểm tra xem có phải ngân hàng không
   */
  isBank() {
    return this.companyType === CompanyType.BANK;
  }

  /**
   * Kiểm tra xem có phải công ty thường không
   */
  isRegular() {
    return this.companyType === CompanyType.REGULAR;
  }

  /**
   * Kiểm tra xem có phải công ty chứng khoán không
   */
  isSecurities() {
    return this.companyType === CompanyType.SECURITIES;
  }

  /**
   * Kiểm tra xem có phải công ty bảo hiểm không
   */
  isInsurance() {
    return this.companyType === CompanyType.INSURANCE;
  }

  /**
   * Lấy giá trị field, xử lý missing data
   */
  getField(fieldName, defaultValue = null) {
    const value = this.data[fieldName];
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const numValue = parseFloat(value);
    return isNaN(numValue) ? defaultValue : numValue;
  }

  /**
   * Kiểm tra xem field có tồn tại không
   */
  hasField(fieldName) {
    const value = this.data[fieldName];
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Lấy danh sách indicators áp dụng cho loại công ty này
   * Abstract method - phải override ở subclass
   */
  getApplicableIndicators() {
    throw new Error('getApplicableIndicators() must be implemented by subclass');
  }

  /**
   * Lấy calculation rules cho loại công ty này
   * Abstract method - phải override ở subclass
   */
  getCalculationRules() {
    throw new Error('getCalculationRules() must be implemented by subclass');
  }

  /**
   * Validate data cho loại công ty này
   */
  validate() {
    // Base validation - có thể override ở subclass
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Get company info
   */
  getInfo() {
    return {
      ticker: this.ticker,
      year: this.year,
      quarter: this.quarter,
      companyType: this.companyType
    };
  }
}
