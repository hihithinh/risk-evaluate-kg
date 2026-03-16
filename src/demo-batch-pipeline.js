/**
 * Demo Batch Pipeline
 * Chạy: node demo-batch-pipeline.js [mode]
 * Modes: full, validation, inference, timeseries, compare
 */

import { BatchInferenceEngine } from './batch/BatchInferenceEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function demoFullBatchPipeline() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO: FULL BATCH PIPELINE');
  console.log('Data Processing → Statistical Validation → Risk Inference');
  console.log('='.repeat(80));

  const configDir = path.join(__dirname, '..', 'rules');
  const rawDataPath = path.join(__dirname, '..', 'dataset', 'raw_financial_data.csv');
  const outputDir = path.join(__dirname, '..', 'output', 'batch_results');

  try {
    const engine = new BatchInferenceEngine(configDir);

    const results = await engine.runBatchPipeline(rawDataPath, {
      runStatisticalValidation: true,
      runRiskInference: true,
      outputDir: outputDir
    });

    console.log('\n✓ Full batch pipeline completed successfully!');
    console.log(`Results exported to: ${outputDir}`);

    return results;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

async function demoStatisticalValidation() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO: STATISTICAL VALIDATION ONLY');
  console.log('Cronbach\'s Alpha & Descriptive Statistics');
  console.log('='.repeat(80));

  const configDir = path.join(__dirname, '..', 'rules');
  const rawDataPath = path.join(__dirname, '..', 'dataset', 'raw_financial_data.csv');
  const outputDir = path.join(__dirname, '..', 'output', 'validation_only');

  try {
    const engine = new BatchInferenceEngine(configDir);

    const results = await engine.runBatchPipeline(rawDataPath, {
      runStatisticalValidation: true,
      runRiskInference: false,
      outputDir: outputDir
    });

    console.log('\n✓ Statistical validation completed!');
    return results;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function demoRiskInferenceOnly() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO: BATCH RISK INFERENCE ONLY');
  console.log('Skip validation, run inference directly');
  console.log('='.repeat(80));

  const configDir = path.join(__dirname, '..', 'rules');
  const rawDataPath = path.join(__dirname, '..', 'dataset', 'raw_financial_data.csv');
  const outputDir = path.join(__dirname, '..', 'output', 'inference_only');

  try {
    const engine = new BatchInferenceEngine(configDir);

    const results = await engine.runBatchPipeline(rawDataPath, {
      runStatisticalValidation: false,
      runRiskInference: true,
      outputDir: outputDir
    });

    console.log('\n✓ Batch risk inference completed!');
    return results;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function demoTimeSeriesAnalysis() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO: TIME SERIES ANALYSIS');
  console.log('Analyze one company across multiple periods');
  console.log('='.repeat(80));

  const configDir = path.join(__dirname, '..', 'rules');
  const rawDataPath = path.join(__dirname, '..', 'dataset', 'raw_financial_data.csv');

  try {
    const engine = new BatchInferenceEngine(configDir);

    // Lấy ticker đầu tiên từ data
    const standardizedData = await engine.dataStandardizer.standardize(rawDataPath);
    if (standardizedData.length === 0) {
      throw new Error('No data found');
    }

    const ticker = standardizedData[0].ticker || standardizedData[0]['﻿ticker'];
    console.log(`\nAnalyzing ticker: ${ticker}`);

    const results = await engine.runTimeSeriesAnalysis(rawDataPath, ticker);

    console.log('\n=== Time Series Results ===');
    if (results.risk_inference && results.risk_inference.results.length > 0) {
      console.log('\nRisk Score Over Time:');
      for (const result of results.risk_inference.results) {
        if (result.status === 'success') {
          console.log(
            `  Q${result.quarter}/${result.year}: ` +
            `${(result.final_score.risk_score * 100).toFixed(2)}% (${result.final_score.risk_level})`
          );
        }
      }
    }

    return results;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function demoCompareCompanies() {
  console.log('\n' + '='.repeat(80));
  console.log('DEMO: COMPANY COMPARISON');
  console.log('Compare multiple companies in the same period');
  console.log('='.repeat(80));

  const configDir = path.join(__dirname, '..', 'rules');
  const rawDataPath = path.join(__dirname, '..', 'dataset', 'raw_financial_data.csv');

  try {
    const engine = new BatchInferenceEngine(configDir);

    // Lấy unique tickers và period từ data
    const standardizedData = await engine.dataStandardizer.standardize(rawDataPath);
    if (standardizedData.length === 0) {
      throw new Error('No data found');
    }

    const uniqueTickers = [...new Set(standardizedData.map(row => row.ticker || row['﻿ticker']))];
    const tickers = uniqueTickers.slice(0, 5); // Top 5 tickers

    const year = parseInt(standardizedData[0].yearReport || standardizedData[0].year);
    const quarter = parseInt(standardizedData[0].lengthReport || standardizedData[0].quarter);

    console.log(`\nComparing ${tickers.length} companies for Q${quarter}/${year}`);
    console.log(`Tickers: ${tickers.join(', ')}`);

    const results = await engine.compareCompanies(rawDataPath, tickers, year, quarter);

    return results;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'full';

  console.log('\n' + '='.repeat(80));
  console.log('BATCH INFERENCE ENGINE - DEMO');
  console.log('='.repeat(80));

  let results;

  switch (mode) {
    case 'full':
      results = await demoFullBatchPipeline();
      break;
    case 'validation':
      results = await demoStatisticalValidation();
      break;
    case 'inference':
      results = await demoRiskInferenceOnly();
      break;
    case 'timeseries':
      results = await demoTimeSeriesAnalysis();
      break;
    case 'compare':
      results = await demoCompareCompanies();
      break;
    default:
      console.log(`Unknown mode: ${mode}`);
      console.log('Available modes: full, validation, inference, timeseries, compare');
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEMO COMPLETED');
  console.log('='.repeat(80));

  console.log('\nUsage:');
  console.log('  node demo-batch-pipeline.js full        - Full pipeline (all phases)');
  console.log('  node demo-batch-pipeline.js validation  - Statistical validation only');
  console.log('  node demo-batch-pipeline.js inference   - Risk inference only');
  console.log('  node demo-batch-pipeline.js timeseries  - Time series analysis');
  console.log('  node demo-batch-pipeline.js compare     - Compare companies');
}

main().catch(console.error);
