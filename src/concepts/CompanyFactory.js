/**
 * Company Factory
 * Factory pattern để tạo đúng loại Company object dựa trên data structure
 */

import { CompanyType, identifyCompanyType } from './CompanyType.js';
import { BankCompany } from './BankCompany.js';
import { RegularCompany } from './RegularCompany.js';

export class CompanyFactory {
  /**
   * Tạo Company object dựa trên data
   * Suy luận company type từ cấu trúc data, không dựa vào ticker
   */
  static createCompany(data) {
    const ticker = data.ticker || data['﻿ticker'];
    
    if (!ticker) {
      throw new Error('Cannot create company: ticker is missing');
    }

    // Suy luận company type dựa trên data structure
    const companyType = identifyCompanyType(data);

    switch (companyType) {
      case CompanyType.BANK:
        return new BankCompany(data);
      
      case CompanyType.SECURITIES:
        // Tạm thời dùng RegularCompany, có thể tạo SecuritiesCompany sau
        return new RegularCompany(data);
      
      case CompanyType.INSURANCE:
        // Tạm thời dùng RegularCompany, có thể tạo InsuranceCompany sau
        return new RegularCompany(data);
      
      case CompanyType.REGULAR:
      default:
        return new RegularCompany(data);
    }
  }

  /**
   * Tạo nhiều Company objects từ array of data
   */
  static createCompanies(dataArray) {
    return dataArray.map(data => CompanyFactory.createCompany(data));
  }

  /**
   * Kiểm tra xem data có phải ngân hàng không
   */
  static isBank(data) {
    return identifyCompanyType(data) === CompanyType.BANK;
  }

  /**
   * Lấy company type từ data
   */
  static getCompanyType(data) {
    return identifyCompanyType(data);
  }
}
