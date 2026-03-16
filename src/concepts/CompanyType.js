/**
 * Company Type Enumeration
 * Định nghĩa các loại công ty khác nhau
 */

export const CompanyType = {
  BANK: 'BANK',
  REGULAR: 'REGULAR',
  INSURANCE: 'INSURANCE',
  SECURITIES: 'SECURITIES'
};

/**
 * Suy luận loại công ty dựa trên cấu trúc data (heuristic)
 * Không dùng hard-code ticker list
 */
export function identifyCompanyType(data) {
  // Heuristic 1: Ngân hàng có các field đặc trưng
  const bankFields = [
    'Loans and advances to customers',
    'Deposits from customers',
    'Net Interest Income',
    'Provision for credit losses'
  ];

  // Heuristic 2: Công ty thường có các field đặc trưng
  const regularFields = [
    'Inventories, Net (Bn. VND)',
    'Cost of Sales',
    'Gross Profit'
  ];

  // Heuristic 3: Công ty chứng khoán có các field đặc trưng
  const securitiesFields = [
    'Trading Securities',
    'Investment Securities'
  ];

  // Đếm số field match
  let bankScore = 0;
  let regularScore = 0;
  let securitiesScore = 0;

  for (const field of bankFields) {
    if (hasField(data, field)) {
      bankScore++;
    }
  }

  for (const field of regularFields) {
    if (hasField(data, field)) {
      regularScore++;
    }
  }

  for (const field of securitiesFields) {
    if (hasField(data, field)) {
      securitiesScore++;
    }
  }

  // Debug scores
  console.log(`🔍 Company Type Detection - Scores:`);
  console.log(`  - Bank score: ${bankScore}`);
  console.log(`  - Regular score: ${regularScore}`);
  console.log(`  - Securities score: ${securitiesScore}`);
  console.log(`  - Bank fields found:`, bankFields.filter(field => hasField(data, field)));
  console.log(`  - Regular fields found:`, regularFields.filter(field => hasField(data, field)));

  // Quyết định dựa trên score cao nhất
  if (bankScore >= 2) {
    console.log(`🔍 Detected as BANK (bankScore >= 2)`);
    return CompanyType.BANK;
  } else if (securitiesScore >= 1 && bankScore >= 1) {
    console.log(`🔍 Detected as SECURITIES (securitiesScore >= 1 && bankScore >= 1)`);
    return CompanyType.SECURITIES;
  } else if (regularScore >= 2) {
    console.log(`🔍 Detected as REGULAR (regularScore >= 2)`);
    return CompanyType.REGULAR;
  } else {
    // Default: Regular company
    console.log(`🔍 Default to REGULAR`);
    return CompanyType.REGULAR;
  }
}

/**
 * Helper: Kiểm tra xem data có field không
 */
function hasField(data, fieldName) {
  const value = data[fieldName];
  return value !== null && value !== undefined && value !== '';
}
