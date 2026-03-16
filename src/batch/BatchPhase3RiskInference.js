/**
 * Batch Phase 3: Risk Inference
 * Xử lý batch inference cho nhiều công ty
 * Tái sử dụng Phase2, Phase3, Phase4 từ single company pipeline
 */

import { IndicatorCalculator } from '../phases/Phase2IndicatorCalculation.js';
import { RiskEvaluator } from '../phases/Phase3RiskEvaluation.js';
import { CompositeInferer } from '../phases/Phase4CompositeInference.js';

export class BatchRiskInferer {
  constructor(configDir) {
    this.configDir = configDir;
    
    // Tái sử dụng các phases từ single company pipeline
    this.indicatorCalculator = new IndicatorCalculator(
      `${configDir}/calculation_rules.json`
    );
    this.riskEvaluator = new RiskEvaluator(
      `${configDir}/indicator_rules.json`
    );
    this.compositeInferer = new CompositeInferer(
      `${configDir}/composite_rules.json`,
      true // use forward chaining
    );
  }

  /**
   * Xử lý inference cho một công ty
   */
  inferSingleCompany(companyData) {
    // Phase 2: Indicator Calculation
    const indicators = this.indicatorCalculator.calculateAll(companyData);

    // Phase 3: Risk Evaluation
    const evaluations = this.riskEvaluator.evaluateAll(indicators);

    // Phase 4: Composite Inference
    const phase4Result = this.compositeInferer.infer(evaluations);

    return {
      indicators: indicators,
      evaluations: evaluations,
      composite_risks: phase4Result.composite_risks,
      final_score: phase4Result.final_score,
      inference_stats: phase4Result.inference_stats
    };
  }

  /**
   * Xử lý batch inference cho nhiều công ty
   */
  inferBatch(standardizedData) {
    console.log('\n=== Batch Phase 3: Risk Inference ===');
    console.log(`Processing ${standardizedData.length} companies...`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < standardizedData.length; i++) {
      const companyData = standardizedData[i];
      const ticker = companyData.ticker || companyData['﻿ticker'];
      const year = companyData.yearReport || companyData.year;
      const quarter = companyData.lengthReport || companyData.quarter;

      try {
        const result = this.inferSingleCompany(companyData);
        
        results.push({
          ticker: ticker,
          year: year,
          quarter: quarter,
          ...result,
          status: 'success'
        });

        successCount++;

        // Progress indicator
        if ((i + 1) % 100 === 0) {
          console.log(`  Processed ${i + 1}/${standardizedData.length} companies...`);
        }

      } catch (error) {
        results.push({
          ticker: ticker,
          year: year,
          quarter: quarter,
          status: 'failed',
          error: error.message
        });
        failCount++;
      }
    }

    console.log(`✓ Batch Phase 3 completed`);
    console.log(`  Success: ${successCount}, Failed: ${failCount}`);
    console.log('');

    return {
      results: results,
      summary: {
        total: standardizedData.length,
        success: successCount,
        failed: failCount
      }
    };
  }

  /**
   * Tính summary statistics cho batch results
   */
  calculateBatchSummary(batchResults) {
    const successResults = batchResults.results.filter(r => r.status === 'success');

    if (successResults.length === 0) {
      return {
        total_companies: batchResults.results.length,
        successful_inferences: 0,
        risk_distribution: {},
        average_risk_score: 0
      };
    }

    // Risk level distribution
    const riskDistribution = {
      High: 0,
      Medium: 0,
      Good: 0,
      Unknown: 0
    };

    let totalRiskScore = 0;

    for (const result of successResults) {
      const riskLevel = result.final_score?.risk_level || 'Unknown';
      riskDistribution[riskLevel] = (riskDistribution[riskLevel] || 0) + 1;
      totalRiskScore += result.final_score?.risk_score || 0;
    }

    return {
      total_companies: batchResults.results.length,
      successful_inferences: successResults.length,
      failed_inferences: batchResults.summary.failed,
      risk_distribution: riskDistribution,
      average_risk_score: (totalRiskScore / successResults.length).toFixed(4),
      high_risk_companies: successResults
        .filter(r => r.final_score?.risk_level === 'High')
        .map(r => ({ ticker: r.ticker, year: r.year, quarter: r.quarter }))
    };
  }

  /**
   * Lấy top N công ty có rủi ro cao nhất
   */
  getTopRiskCompanies(batchResults, topN = 10) {
    const successResults = batchResults.results.filter(r => r.status === 'success');

    return successResults
      .sort((a, b) => (b.final_score?.risk_score || 0) - (a.final_score?.risk_score || 0))
      .slice(0, topN)
      .map(r => ({
        ticker: r.ticker,
        year: r.year,
        quarter: r.quarter,
        risk_score: r.final_score?.risk_score,
        risk_level: r.final_score?.risk_level,
        composite_risks_count: r.composite_risks?.length || 0
      }));
  }

  /**
   * Export batch results ra CSV format
   */
  exportToCSV(batchResults) {
    const rows = [];
    
    // Header
    rows.push([
      'ticker',
      'year',
      'quarter',
      'risk_score',
      'risk_level',
      'total_risk_points',
      'max_total_points',
      'composite_risks_count',
      'iterations',
      'rules_fired',
      'status'
    ].join(','));

    // Data rows
    for (const result of batchResults.results) {
      if (result.status === 'success') {
        rows.push([
          result.ticker,
          result.year,
          result.quarter,
          (result.final_score?.risk_score * 100).toFixed(2),
          result.final_score?.risk_level,
          result.final_score?.total_risk_points,
          result.final_score?.max_total_points,
          result.composite_risks?.length || 0,
          result.inference_stats?.iterations || 0,
          result.inference_stats?.rules_fired || 0,
          'success'
        ].join(','));
      } else {
        rows.push([
          result.ticker,
          result.year,
          result.quarter,
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          'failed'
        ].join(','));
      }
    }

    return rows.join('\n');
  }
}
