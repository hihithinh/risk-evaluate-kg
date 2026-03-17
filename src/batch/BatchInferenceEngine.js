/**
 * Batch Inference Engine
 * Orchestrator cho batch pipeline: Data Processing → Statistical Validation → Risk Inference
 * Tái sử dụng Phase1 từ single company pipeline
 */

import { DataStandardizer } from '../phases/Phase1DataStandardization.js';
import { IndicatorCalculatorV2 } from '../phases/Phase2IndicatorCalculationV2.js';
import { StatisticalValidator } from './BatchPhase2StatisticalValidation.js';
import { BatchRiskInferer } from './BatchPhase3RiskInference.js';
import fs from 'fs';

export class BatchInferenceEngine {
  constructor(configDir) {
    this.configDir = configDir;

    // Batch Phase 1: Tái sử dụng Phase1DataStandardization
    this.dataStandardizer = new DataStandardizer(
      `${configDir}/schema_mapping.json`
    );

    // Batch Phase 2: Indicator Calculation
    this.indicatorCalculator = new IndicatorCalculatorV2();

    // Batch Phase 3: Statistical Validation
    this.statisticalValidator = new StatisticalValidator();

    // Batch Phase 4: Risk Inference (tái sử dụng Phase2-4)
    this.batchRiskInferer = new BatchRiskInferer(configDir);
  }

  /**
   * Chạy toàn bộ batch pipeline
   */
  async runBatchPipeline(rawDataPath, options = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('BATCH INFERENCE ENGINE');
    console.log('='.repeat(80));

    const {
      runStatisticalValidation = true,
      runRiskInference = true,
      outputDir = null
    } = options;

    // Batch Phase 1: Data Processing
    const standardizedData = await this.dataStandardizer.standardize(rawDataPath);

    // Batch Phase 2: Indicator Calculation
    const indicatorData = this.indicatorCalculator.calculateBatch(standardizedData);

    // Flatten indicator data for statistical validation
    const flattenedIndicatorData = indicatorData?.map(company => ({
      ...company.indicators,
      ticker: company.ticker,
      year: company.year,
      quarter: company.quarter,
      companyType: company.companyType
    })) || [];

    const results = {
      data_processing: {
        total_records: standardizedData?.length || 0
      },
      indicator_calculation: {
        total_records: indicatorData?.length || 0
      }
    };

    // Batch Phase 3: Statistical Validation
    if (runStatisticalValidation) {
      const validationResult = this.statisticalValidator.validate(flattenedIndicatorData);
      results.statistical_validation = validationResult;

      // Report is already generated internally in validate() method
      results.statistical_report = validationResult._internal?.report || 'Report not available';
    }

    // Batch Phase 4: Risk Inference
    if (runRiskInference) {
      const batchResults = this.batchRiskInferer.inferBatch(indicatorData);
      
      // Only keep summary and top companies, not detailed results
      const summary = this.batchRiskInferer.calculateBatchSummary(batchResults);
      const topRisk = this.batchRiskInferer.getTopRiskCompanies(batchResults, 10);
      
      results.risk_inference = {
        summary: summary,
        results: batchResults.results.slice(0, 10), // Keep only first 10 for frontend preview
        _all_results: batchResults.results // Store all results for CSV export
      };
      results.top_risk_companies = topRisk;
    }

    // Export results if outputDir specified
    if (outputDir) {
      this.exportResults(results, outputDir);
    }

    this._printSummary(results);

    return results;
  }

  /**
   * Chạy batch inference cho một subset của data
   */
  async runBatchSubset(rawDataPath, filterFn, options = {}) {
    console.log('\n=== Running Batch Pipeline on Subset ===');

    // Load and standardize data
    const standardizedData = await this.dataStandardizer.standardize(rawDataPath);
    console.log('🔍 Standardized data length:', standardizedData?.length);

    // Filter data
    const filteredData = standardizedData?.filter(filterFn) || [];
    console.log(`Filtered to ${filteredData.length} records`);

    // Run validation and inference on filtered data
    const results = {
      data_processing: {
        total_records: filteredData.length
      }
    };

    if (options.runStatisticalValidation !== false) {
      results.statistical_validation = this.statisticalValidator.validate(filteredData);
    }

    if (options.runRiskInference !== false) {
      results.risk_inference = this.batchRiskInferer.inferBatch(filteredData);
      results.risk_summary = this.batchRiskInferer.calculateBatchSummary(results.risk_inference);
    }

    return results;
  }

  /**
   * Chạy batch inference cho một ticker cụ thể qua nhiều thời kỳ
   */
  async runTimeSeriesAnalysis(rawDataPath, ticker) {
    console.log(`\n=== Time Series Analysis for ${ticker} ===`);

    const filterFn = (row) => {
      const rowTicker = row.ticker || row['﻿ticker'];
      return rowTicker === ticker;
    };

    const results = await this.runBatchSubset(rawDataPath, filterFn, {
      runStatisticalValidation: false,
      runRiskInference: true
    });

    // Sort by year and quarter
    if (results.risk_inference) {
      results.risk_inference.results.sort((a, b) => {
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.quarter - b.quarter;
      });
    }

    return results;
  }

  /**
   * So sánh nhiều tickers
   */
  async compareCompanies(rawDataPath, tickers, year, quarter) {
    console.log(`\n=== Comparing Companies for Q${quarter}/${year} ===`);

    const filterFn = (row) => {
      const rowTicker = row.ticker || row['﻿ticker'];
      const rowYear = parseInt(row.yearReport || row.year);
      const rowQuarter = parseInt(row.lengthReport || row.quarter);

      return tickers.includes(rowTicker) && rowYear === year && rowQuarter === quarter;
    };

    const results = await this.runBatchSubset(rawDataPath, filterFn, {
      runStatisticalValidation: false,
      runRiskInference: true
    });

    // Ranking
    if (results.risk_inference) {
      const ranking = results.risk_inference.results
        .filter(r => r.status === 'success')
        .sort((a, b) => (a.final_score?.total_risk_points || 0) - (b.final_score?.total_risk_points || 0))
        .map((r, index) => ({
          rank: index + 1,
          ticker: r.ticker,
          risk_score: r.final_score?.total_risk_points || 0,
          risk_level: r.final_score?.risk_level || 'Unknown'
        }));

      results.ranking = ranking;

      console.log('\nRanking (Best to Worst):');
      for (const item of ranking) {
        console.log(`  ${item.rank}. ${item.ticker}: ${item.risk_score} (${item.risk_level})`);
      }
    }

    return results;
  }

  /**
   * Export kết quả ra files
   */
  exportResults(results, outputDir) {
    console.log(`\n=== Exporting Results to ${outputDir} ===`);

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Export statistical validation
    if (results.statistical_validation) {
      // Cronbach results
      const cronbachCSV = this._arrayToCSV(results.statistical_validation.cronbach_results);
      fs.writeFileSync(`${outputDir}/cronbach_results.csv`, cronbachCSV);

      // Item analysis (now in _internal)
      const itemAnalysisCSV = this._arrayToCSV(results.statistical_validation._internal?.item_analysis || []);
      fs.writeFileSync(`${outputDir}/item_analysis.csv`, itemAnalysisCSV);

      // Statistical report
      if (results.statistical_report) {
        fs.writeFileSync(`${outputDir}/statistical_report.txt`, results.statistical_report);
      }

      console.log('  ✓ cronbach_results.csv');
      console.log('  ✓ item_analysis.csv');
      console.log('  ✓ statistical_report.txt');
    }

    // Export risk inference results
    if (results.risk_inference) {
      const riskCSV = this.batchRiskInferer.exportToCSV(results.risk_inference);
      fs.writeFileSync(`${outputDir}/risk_inference_results.csv`, riskCSV);
      console.log('  ✓ risk_inference_results.csv');

      // Export summary
      if (results.risk_summary) {
        const summaryJSON = JSON.stringify(results.risk_summary, null, 2);
        fs.writeFileSync(`${outputDir}/risk_summary.json`, summaryJSON);
        console.log('  ✓ risk_summary.json');
      }

      // Export top risk companies
      if (results.top_risk_companies) {
        const topRiskCSV = this._arrayToCSV(results.top_risk_companies);
        fs.writeFileSync(`${outputDir}/top_risk_companies.csv`, topRiskCSV);
        console.log('  ✓ top_risk_companies.csv');
      }
    }

  }

  /**
   * Convert array of objects to CSV
   */
  _arrayToCSV(array) {
    if (!array || array.length === 0) return '';

    const headers = Object.keys(array[0]);
    const rows = [headers.join(',')];

    for (const obj of array) {
      const values = headers.map(h => {
        const val = obj[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      });
      rows.push(values.join(','));
    }

    return rows.join('\n');
  }

  /**
   * In summary
   */
  _printSummary(results) {
    console.log('\n' + '='.repeat(80));
    console.log('BATCH PIPELINE SUMMARY');
    console.log('='.repeat(80));

    if (results.data_processing) {
      console.log(`\nData Processing:`);
      console.log(`  Total records: ${results.data_processing.total_records}`);
    }

    if (results.statistical_validation) {
      console.log(`\nStatistical Validation:`);
      console.log(`  Samples analyzed: ${results.statistical_validation.n_samples}`);
      console.log(`  Groups validated: ${results.statistical_validation.cronbach_results.length}`);
    }

    if (results.risk_summary) {
      console.log(`\nRisk Inference:`);
      console.log(`  Total companies: ${results.risk_summary.total_companies}`);
      console.log(`  Successful: ${results.risk_summary.successful_inferences}`);
      console.log(`  Failed: ${results.risk_summary.failed_inferences}`);
      console.log(`  Average risk score: ${results.risk_summary.average_risk_score?.toFixed(2) || 'N/A'} points`);
      console.log(`\n  Risk Distribution:`);
      for (const [level, count] of Object.entries(results.risk_summary.risk_distribution)) {
        if (count > 0) {
          console.log(`    ${level}: ${count}`);
        }
      }
    }

    if (results.top_risk_companies && results.top_risk_companies.length > 0) {
      console.log(`\n  Top 10 High Risk Companies:`);
      for (let i = 0; i < Math.min(10, results.top_risk_companies.length); i++) {
        const company = results.top_risk_companies[i];
        console.log(
          `    ${i + 1}. ${company.ticker} Q${company.quarter}/${company.year}: ` +
          `${company.risk_score} points (${company.risk_level})`
        );
      }
    }

    console.log('\n' + '='.repeat(80));
  }
}
