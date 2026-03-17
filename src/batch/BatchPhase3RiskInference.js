/**
 * Batch Phase 3: Risk Inference
 * Xử lý batch inference cho nhiều công ty
 * Tái sử dụng Phase3, Phase4 từ single company pipeline
 * (Phase 2 indicators đã được tính trước đó)
 */

import { RiskEvaluator } from '../phases/Phase3RiskEvaluation.js';
import { CompositeInferer } from '../phases/Phase4CompositeInference.js';

export class BatchRiskInferer {
  constructor(configDir) {
    this.configDir = configDir;
    
    // Tái sử dụng các phases từ single company pipeline
    this.riskEvaluator = new RiskEvaluator(
      `${configDir}/risk_signal_rules.json`
    );
    this.compositeInferer = new CompositeInferer(
      `${configDir}/risk_label_rules.json`,
      true // use forward chaining
    );
  }

  /**
   * Infer risk cho một công ty (chỉ Phase 3 & 4, indicators đã được tính ở Phase 2)
   */
  inferSingleCompany(companyData) {
    // companyData already has indicators as {A1, A2, A3, B1, B2, B3, ...}
    // No need to recalculate, just use them directly
    const indicators = {};
    
    // Extract only indicator codes (A1, A2, A3, B1, B2, B3, C1, C2, C3, D1, D2, D3)
    for (const [key, value] of Object.entries(companyData)) {
      if (/^[A-D]\d+$/.test(key)) { // Match A1, A2, B1, etc.
        indicators[key] = value;
      }
    }

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
  inferBatch(indicatorData) {
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < indicatorData.length; i++) {
      const companyData = indicatorData[i];
      const ticker = companyData.ticker;
      const year = companyData.year;
      const quarter = companyData.quarter;

      try {
        // Convert indicatorData structure to what inferSingleCompany expects
        const companyForInference = {
          ticker: ticker,
          year: year,
          quarter: quarter,
          companyType: companyData.companyType,
          ...companyData.indicators // Spread indicators to top level
        };

        const result = this.inferSingleCompany(companyForInference);
        
        results.push({
          ticker: ticker,
          year: year,
          quarter: quarter,
          ...result,
          status: 'success'
        });

        successCount++;

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

    return {
      results: results,
      summary: {
        total: indicatorData.length,
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
      totalRiskScore += result.final_score?.total_risk_points || 0;
    }

    return {
      total_companies: batchResults.results.length,
      successful_inferences: successResults.length,
      failed_inferences: batchResults.summary.failed,
      risk_distribution: riskDistribution,
      average_risk_score: totalRiskScore / successResults.length, // Return number, not string
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
      .sort((a, b) => (b.final_score?.total_risk_points || 0) - (a.final_score?.total_risk_points || 0))
      .slice(0, topN)
      .map(r => ({
        ticker: r.ticker,
        year: r.year,
        quarter: r.quarter,
        risk_score: r.final_score?.total_risk_points || 0,
        risk_level: r.final_score?.risk_level || 'Unknown',
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
          result.final_score?.total_risk_points || 0,
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
