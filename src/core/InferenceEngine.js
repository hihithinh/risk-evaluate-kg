/**
 * Inference Engine - Tích hợp 4 phases
 * Pipeline hoàn chỉnh từ raw data đến kết quả cuối cùng
 */

import { DataStandardizer } from '../phases/Phase1DataStandardization.js';
import { IndicatorCalculator } from '../phases/Phase2IndicatorCalculation.js';
import { RiskEvaluator } from '../phases/Phase3RiskEvaluation.js';
import { CompositeInferer } from '../phases/Phase4CompositeInference.js';
import path from 'path';

export class InferenceEngine {
  constructor(configDir, useForwardChaining = true) {
    this.configDir = configDir;
    this.useForwardChaining = useForwardChaining;

    // Initialize all 4 phases
    this.phase1 = new DataStandardizer(
      path.join(configDir, 'schema_mapping.json')
    );
    this.phase2 = new IndicatorCalculator(
      path.join(configDir, 'indicator_rules.json')
    );
    this.phase3 = new RiskEvaluator(
      path.join(configDir, 'risk_signal_rules.json')
    );
    this.phase4 = new CompositeInferer(
      path.join(configDir, 'risk_label_rules.json'),
      useForwardChaining
    );
  }

  /**
   * Chạy inference cho một công ty
   */
  async inferSingleCompany(rawDataPath, ticker, year, quarter) {
    console.log('\n' + '='.repeat(80));
    console.log(`INFERENCE ENGINE - ${ticker} Q${quarter}/${year}`);
    console.log('='.repeat(80));

    // Phase 1: Data Standardization
    const standardizedData = await this.phase1.standardize(rawDataPath);
    const companyData = this.phase1.getCompanyData(standardizedData, ticker, year, quarter);

    // Phase 2: Indicator Calculation
    const indicators = this.phase2.calculateAll(companyData);

    // Phase 3: Risk Evaluation
    const evaluations = this.phase3.evaluateAll(indicators);

    // Phase 4: Composite Inference
    const phase4Result = this.phase4.infer(evaluations);

    // Kết hợp kết quả từ 4 phases
    const result = {
      company_info: {
        ticker: ticker,
        year: year,
        quarter: quarter
      },
      indicators: indicators,
      evaluations: evaluations,
      composite_risks: phase4Result.composite_risks,
      final_score: phase4Result.final_score,
      inference_stats: phase4Result.inference_stats,
      inference_trace: phase4Result.inference_trace || [],
      backward_chaining: phase4Result.backward_chaining || {}
    };

    this._printSummary(result);
    return result;
  }

  /**
   * Chạy inference cho nhiều công ty (batch)
   */
  async inferBatch(rawDataPath, companies) {
    console.log('\n' + '='.repeat(80));
    console.log('BATCH INFERENCE');
    console.log('='.repeat(80));

    const results = [];

    for (const company of companies) {
      try {
        const result = await this.inferSingleCompany(
          rawDataPath,
          company.ticker,
          company.year,
          company.quarter
        );
        results.push(result);
      } catch (error) {
        console.error(`Error processing ${company.ticker}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * So sánh nhiều công ty
   */
  async compareCompanies(rawDataPath, tickers, year, quarter) {
    console.log('\n' + '='.repeat(80));
    console.log(`COMPANY COMPARISON - Q${quarter}/${year}`);
    console.log('='.repeat(80));

    const results = {};

    for (const ticker of tickers) {
      try {
        const result = await this.inferSingleCompany(rawDataPath, ticker, year, quarter);
        results[ticker] = result;
      } catch (error) {
        console.error(`Error processing ${ticker}: ${error.message}`);
      }
    }

    // Ranking
    const ranking = Object.entries(results)
      .map(([ticker, result]) => ({
        ticker: ticker,
        risk_score: result.final_score.risk_score,
        risk_level: result.final_score.risk_level
      }))
      .sort((a, b) => a.risk_score - b.risk_score);

    console.log('\n=== RANKING (Best to Worst) ===');
    for (let i = 0; i < ranking.length; i++) {
      const company = ranking[i];
      console.log(
        `${i + 1}. ${company.ticker}: ${(company.risk_score * 100).toFixed(2)}% (${company.risk_level})`
      );
    }

    return {
      results: results,
      ranking: ranking
    };
  }

  /**
   * Giải thích một fact cụ thể (delegate to Phase4)
   */
  explainFact(factId) {
    return this.phase4.explainFact(factId);
  }

  /**
   * Query backward chaining (delegate to Phase4)
   */
  queryBackward(goal, evaluations) {
    return this.phase4.queryBackward(goal, evaluations);
  }

  /**
   * Export inference trace (delegate to Phase4)
   */
  exportInferenceTrace(outputPath) {
    return this.phase4.exportInferenceTrace(outputPath);
  }

  /**
   * Lấy explanation summary (delegate to Phase4)
   */
  getExplanationSummary() {
    return this.phase4.getExplanationSummary();
  }

  /**
   * In tóm tắt kết quả
   */
  _printSummary(result) {
    console.log('\n' + '='.repeat(80));
    console.log('FINAL RESULT');
    console.log('='.repeat(80));

    const finalScore = result.final_score;
    console.log(`\nRisk Score: ${(finalScore.risk_score * 100).toFixed(2)}%`);
    console.log(`Risk Level: ${finalScore.risk_level}`);
    console.log(`Total Points: ${finalScore.total_risk_points}/${finalScore.max_total_points}`);

    if (result.composite_risks && result.composite_risks.length > 0) {
      console.log(`\nComposite Risks Detected: ${result.composite_risks.length}`);
      for (const risk of result.composite_risks) {
        console.log(`  - [${risk.rule_id}] ${risk.risk_type} (${risk.severity})`);
      }
    }

    if (result.inference_stats) {
      console.log(`\nInference Statistics:`);
      console.log(`  - Iterations: ${result.inference_stats.iterations}`);
      console.log(`  - Rules fired: ${result.inference_stats.rules_fired}`);
    }

    console.log('\n' + '='.repeat(80));
  }
}
