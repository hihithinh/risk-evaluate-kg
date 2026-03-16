/**
 * Demo Full Pipeline - Chạy từ raw data đến kết quả cuối cùng
 * Tích hợp đầy đủ 4 phases
 */

import { InferenceEngine } from './core/InferenceEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function demoSingleCompany() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO: SINGLE COMPANY ANALYSIS');
  console.log('='.repeat(80));

  const configDir = path.join(__dirname, '../rules');
  const rawDataPath = path.join(__dirname, '../dataset/raw_financial_data.csv');

  try {
    const engine = new InferenceEngine(configDir, true);

    // Lấy ticker đầu tiên từ CSV thay vì hard-code
    const standardizedData = await engine.phase1.standardize(rawDataPath);
    if (standardizedData.length === 0) {
      throw new Error('No data found in CSV');
    }
    
    const firstRow = standardizedData[0];
    const ticker = firstRow.ticker || firstRow['﻿ticker']; // Handle BOM
    const year = parseInt(firstRow.yearReport || firstRow.year);
    const quarter = parseInt(firstRow.lengthReport || firstRow.quarter);
    
    console.log(`\nAnalyzing: ${ticker} Q${quarter}/${year} (first company in dataset)`);

    const result = await engine.inferSingleCompany(
      rawDataPath,
      ticker,
      year,
      quarter
    );

    // In thêm chi tiết
    console.log('\n=== DETAILED RESULTS ===');
    
    console.log('\nIndicators:');
    for (const [indicator, value] of Object.entries(result.indicators)) {
      if (value !== null) {
        console.log(`  ${indicator}: ${value.toFixed(4)}`);
      }
    }

    console.log('\nHigh Risk Indicators:');
    for (const [indicator, evaluation] of Object.entries(result.evaluations)) {
      if (evaluation.risk_level === 'High') {
        console.log(`  - ${indicator}: ${evaluation.explanation}`);
      }
    }

    if (result.backward_chaining) {
      console.log('\n=== BACKWARD CHAINING ===');
      
      const whyHighRisk = result.backward_chaining.why_high_risk;
      if (whyHighRisk.success) {
        console.log('\n✓ Tìm thấy bằng chứng cho rủi ro cao');
        console.log(`Rules used: ${whyHighRisk.rules_used.join(', ')}`);
      }
    }

    return result;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nLưu ý:');
    console.error('1. Cần có file raw_financial_data.csv tại: ../dataset/');
    console.error('2. Cần có các rule files tại: ../rules/');
    console.error('   - schema_mapping.json');
    console.error('   - calculation_rules.json');
    console.error('   - indicator_rules.json');
    console.error('   - composite_rules.json');
  }
}

async function demoBatchProcessing() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO: BATCH PROCESSING');
  console.log('='.repeat(80));

  const configDir = path.join(__dirname, '../rules');
  const rawDataPath = path.join(__dirname, '../dataset/raw_financial_data.csv');

  try {
    const engine = new InferenceEngine(configDir, true);
    
    // Lấy 3 công ty đầu tiên từ CSV
    const standardizedData = await engine.phase1.standardize(rawDataPath);
    if (standardizedData.length === 0) {
      throw new Error('No data found in CSV');
    }
    
    const companies = standardizedData.slice(0, 3).map(row => ({
      ticker: row.ticker || row['﻿ticker'],
      year: parseInt(row.yearReport || row.year),
      quarter: parseInt(row.lengthReport || row.quarter)
    }));
    
    console.log(`\nAnalyzing ${companies.length} companies from dataset:`);
    companies.forEach(c => console.log(`  - ${c.ticker} Q${c.quarter}/${c.year}`));

    const results = await engine.inferBatch(rawDataPath, companies);

    console.log('\n=== BATCH RESULTS SUMMARY ===');
    for (const result of results) {
      const info = result.company_info;
      const score = result.final_score;
      console.log(
        `${info.ticker}: ${(score.risk_score * 100).toFixed(2)}% (${score.risk_level})`
      );
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function demoComparison() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO: COMPANY COMPARISON');
  console.log('='.repeat(80));

  const configDir = path.join(__dirname, '../rules');
  const rawDataPath = path.join(__dirname, '../dataset/raw_financial_data.csv');

  try {
    const engine = new InferenceEngine(configDir, true);
    
    // Lấy các ticker unique từ CSV
    const standardizedData = await engine.phase1.standardize(rawDataPath);
    if (standardizedData.length === 0) {
      throw new Error('No data found in CSV');
    }
    
    // Lấy unique tickers và chọn 3 cái đầu
    const uniqueTickers = [...new Set(standardizedData.map(row => row.ticker || row['﻿ticker']))];
    const tickers = uniqueTickers.slice(0, 3);
    
    // Lấy year, quarter từ row đầu tiên
    const year = parseInt(standardizedData[0].yearReport || standardizedData[0].year);
    const quarter = parseInt(standardizedData[0].lengthReport || standardizedData[0].quarter);
    
    console.log(`\nComparing ${tickers.length} companies for Q${quarter}/${year}:`);
    tickers.forEach(t => console.log(`  - ${t}`));

    const comparison = await engine.compareCompanies(rawDataPath, tickers, year, quarter);

    console.log('\n=== COMPARISON DETAILS ===');
    for (const [ticker, result] of Object.entries(comparison.results)) {
      console.log(`\n${ticker}:`);
      console.log(`  Risk Score: ${(result.final_score.risk_score * 100).toFixed(2)}%`);
      console.log(`  Composite Risks: ${result.composite_risks.length}`);
      console.log(`  Iterations: ${result.inference_stats?.iterations || 0}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'single';

  console.log('\n' + '='.repeat(80));
  console.log('KNOWLEDGE INFERENCE ENGINE - FULL PIPELINE');
  console.log('Node.js Version with Complete 4-Phase Integration');
  console.log('='.repeat(80));

  if (mode === 'single') {
    await demoSingleCompany();
  } else if (mode === 'batch') {
    await demoBatchProcessing();
  } else if (mode === 'comparison') {
    await demoComparison();
  } else if (mode === 'all') {
    await demoSingleCompany();
    console.log('\n\n');
    await demoBatchProcessing();
    console.log('\n\n');
    await demoComparison();
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEMO COMPLETED');
  console.log('='.repeat(80));
  
  console.log('\nCách chạy:');
  console.log('  node demo-full-pipeline.js single      - Phân tích 1 công ty');
  console.log('  node demo-full-pipeline.js batch       - Phân tích nhiều công ty');
  console.log('  node demo-full-pipeline.js comparison  - So sánh công ty');
  console.log('  node demo-full-pipeline.js all         - Chạy tất cả');
}

main().catch(console.error);
