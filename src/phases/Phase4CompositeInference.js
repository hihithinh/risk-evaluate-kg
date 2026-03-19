/**
 * Phase 4: Composite Inference
 * Suy diễn phức hợp sử dụng Forward Chaining và Backward Chaining
 * Service layer cho core inference components
 */

import { ForwardChainer } from '../core/ForwardChainer.js';
import { BackwardChainer } from '../core/BackwardChainer.js';

export class CompositeInferer {
  constructor(compositeRulesPath, useForwardChaining = true) {
    this.compositeRulesPath = compositeRulesPath;
    this.useForwardChaining = useForwardChaining;
    
    if (useForwardChaining) {
      this.forwardChainer = new ForwardChainer(compositeRulesPath);
      this.backwardChainer = new BackwardChainer(compositeRulesPath);
    }
  }

  /**
   * Chạy suy diễn phức hợp (Phase 4 chính)
   */
  infer(evaluations) {

    if (!this.useForwardChaining) {
      return this._patternMatchingInference(evaluations);
    }

    
    // Forward Chaining
    const forwardResult = this.forwardChainer.inferenceLoop(evaluations);

    // Backward Chaining queries
    const backwardQueries = this._runBackwardQueries(evaluations);

    // Kết hợp kết quả
    const result = {
      composite_risks: forwardResult.composite_risks,
      final_score: forwardResult.final_score,
      inference_stats: forwardResult.inference_stats,
      inference_trace: forwardResult.inference_trace,
      working_memory_snapshot: forwardResult.working_memory_snapshot,
      backward_chaining: backwardQueries
    };

    return result;
  }

  /**
   * Chạy các backward chaining queries
   */
  _runBackwardQueries(evaluations) {
    const queries = {};

    // Query 1: Tại sao có rủi ro cao?
    queries.why_risky_risk = this.backwardChainer.queryWhyRiskyRisk(evaluations);

    // Query 2: Có rủi ro financial_distress không?
    queries.financial_distress_query = this.backwardChainer.querySpecificRisk(
      'financial_distress',
      evaluations
    );

    // Query 3: Có rủi ro liquidity_crisis không?
    queries.liquidity_crisis_query = this.backwardChainer.querySpecificRisk(
      'liquidity_crisis',
      evaluations
    );

    return queries;
  }

  /**
   * Pattern matching inference (fallback mode)
   */
  _patternMatchingInference(evaluations) {
    const compositeRisks = [];
    let totalPoints = 0;

    // Simple pattern matching - check all rules once
    for (const [indicator, evaluation] of Object.entries(evaluations)) {
      if (evaluation && evaluation.risk_level === 'Risky') {
        totalPoints += evaluation.risk_point || 0;
      }
    }

    const maxPoints = Object.keys(evaluations).length * 2;
    const riskScore = maxPoints > 0 ? totalPoints / maxPoints : 0;

    let riskLevel;
    if (riskScore >= 0.7) {
      riskLevel = 'Risky';
    } else if (riskScore >= 0.4) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'Good';
    }

    return {
      composite_risks: compositeRisks,
      final_score: {
        indicator_risk_points: totalPoints,
        composite_risk_points: 0,
        total_risk_points: totalPoints,
        max_total_points: maxPoints,
        risk_score: riskScore,
        risk_level: riskLevel
      },
      inference_stats: {
        iterations: 1,
        rules_fired: 0,
        total_facts: Object.keys(evaluations).length,
        composite_risks_count: 0
      }
    };
  }

  /**
   * Lấy giải thích cho một fact cụ thể
   */
  explainFact(factId) {
    if (!this.forwardChainer) {
      return 'Forward chaining is not enabled';
    }
    return this.forwardChainer.explainFact(factId);
  }

  /**
   * Query backward chaining với custom goal
   */
  queryBackward(goal, evaluations) {
    if (!this.backwardChainer) {
      return { success: false, explanation: 'Backward chaining is not enabled' };
    }
    return this.backwardChainer.proveGoal(goal, evaluations);
  }

  /**
   * Lấy summary của quá trình suy diễn
   */
  getExplanationSummary() {
    if (!this.forwardChainer) {
      return 'No explanation available';
    }
    return this.forwardChainer.getExplanation();
  }

  /**
   * Export inference trace ra file
   */
  exportInferenceTrace(outputPath) {
    if (!this.forwardChainer || !this.forwardChainer.explanationEngine) {
      throw new Error('Forward chaining is not enabled');
    }
    this.forwardChainer.explanationEngine.exportTrace(outputPath);
  }

  /**
   * Reset inference engine
   */
  reset() {
    if (this.forwardChainer) {
      this.forwardChainer.reset();
    }
    if (this.backwardChainer) {
      this.backwardChainer.reset();
    }
  }

  /**
   * Lấy working memory snapshot
   */
  getWorkingMemorySnapshot() {
    if (!this.forwardChainer) {
      return null;
    }
    return this.forwardChainer.workingMemory.snapshot();
  }

  /**
   * Lấy inference statistics
   */
  getInferenceStats() {
    if (!this.forwardChainer) {
      return null;
    }
    return {
      iterations: this.forwardChainer.iterationCount,
      rules_fired: this.forwardChainer.totalRulesFired,
      total_facts: this.forwardChainer.workingMemory.size
    };
  }
}
