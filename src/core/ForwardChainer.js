/**
 * Forward Chainer - Suy diễn tiến (Data-driven reasoning)
 * Implement vòng lặp suy diễn thực sự với Working Memory và Conflict Resolution
 */

import { WorkingMemory } from './WorkingMemory.js';
import { Fact } from './Fact.js';
import { ConflictResolver } from './ConflictResolver.js';
import { ExplanationEngine } from './ExplanationEngine.js';
import fs from 'fs';

export class ForwardChainer {
  constructor(compositeRulesPath, maxIterations = 100, conflictStrategies = null) {
    const rulesData = JSON.parse(fs.readFileSync(compositeRulesPath, 'utf-8'));
    this.rules = rulesData;
    this.maxIterations = maxIterations;
    this.workingMemory = new WorkingMemory();
    this.conflictResolver = new ConflictResolver(conflictStrategies);
    this.explanationEngine = new ExplanationEngine();
    
    this.iterationCount = 0;
    this.totalRulesFired = 0;
  }

  /**
   * Khởi tạo working memory với initial facts từ Phase 3
   */
  initializeWorkingMemory(evaluations) {
    this.workingMemory.clear();

    for (const [indicator, evalResult] of Object.entries(evaluations)) {
      const fact = new Fact(
        `eval_${indicator}`,
        'indicator_evaluation',
        evalResult,
        'initial'
      );
      this.workingMemory.addFact(fact);
    }
  }

  /**
   * Tìm tất cả rules có thể kích hoạt với working memory hiện tại
   */
  findMatchingRules() {
    const matchingRules = [];

    for (const rule of this.rules) {
      const matchedFacts = this._checkRuleMatch(rule);

      if (matchedFacts !== null) {
        const ruleWithFacts = { ...rule, matched_facts: matchedFacts };
        matchingRules.push(ruleWithFacts);
      }
    }

    return matchingRules;
  }

  /**
   * Kiểm tra xem rule có match với working memory không
   */
  _checkRuleMatch(rule) {
    const conditions = rule.conditions || [];
    const matchedFacts = [];

    for (const condition of conditions) {
      const indicator = condition.indicator;
      const factId = `eval_${indicator}`;

      const fact = this.workingMemory.getFact(factId);

      if (!fact) {
        return null;
      }

      if (!this._checkCondition(condition, fact.data)) {
        return null;
      }

      matchedFacts.push(factId);
    }

    return matchedFacts;
  }

  /**
   * Kiểm tra một điều kiện với fact data
   */
  _checkCondition(condition, factData) {
    if (condition.source === 'risk_signal_rules_output') {
      const field = condition.field || 'risk_level';
      const operator = condition.operator;
      const expectedValue = condition.value;

      const actualValue = factData[field];

      // Kiểm tra null/undefined trước
      if (actualValue === null || actualValue === undefined) {
        return false;
      }

      if (operator === 'eq') {
        return actualValue === expectedValue;
      } else if (operator === 'in') {
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      } else if (operator === 'ne') {
        return actualValue !== expectedValue;
      } else if (operator === 'gt') {
        return actualValue > expectedValue;
      } else if (operator === 'gte') {
        return actualValue >= expectedValue;
      } else if (operator === 'lt') {
        return actualValue < expectedValue;
      } else if (operator === 'lte') {
        return actualValue <= expectedValue;
      }
    }

    return false;
  }

  /**
   * Kích hoạt một rule và tạo facts mới
   */
  fireRule(rule) {
    const ruleId = rule.rule_id;
    const result = rule.result;
    const matchedFacts = rule.matched_facts || [];

    const newFactId = `composite_${ruleId}_${this.iterationCount}`;

    const newFact = new Fact(
      newFactId,
      'composite_risk',
      {
        rule_id: ruleId,
        description: rule.description,
        risk_type: result.risk_type,
        severity: result.severity,
        risk_point: result.risk_point,
        explanation: result.explanation
      },
      ruleId,
      matchedFacts
    );

    this.explanationEngine.recordStep(
      ruleId,
      matchedFacts,
      [newFactId],
      rule.description,
      result.explanation
    );

    return [newFact];
  }

  /**
   * Vòng lặp suy diễn chính (FORWARD CHAINING LOOP)
   */
  inferenceLoop(evaluations) {
    this.initializeWorkingMemory(evaluations);
    this.conflictResolver.reset();
    this.explanationEngine.reset();
    this.iterationCount = 0;
    this.totalRulesFired = 0;

    const initialFacts = this.workingMemory.size;

    while (this.iterationCount < this.maxIterations) {
      this.iterationCount++;

      const matchingRules = this.findMatchingRules();

      if (matchingRules.length === 0) {
        break;
      }

      const wmSnapshot = this.workingMemory.snapshot();
      const selectedRule = this.conflictResolver.selectNextRule(matchingRules, wmSnapshot);

      if (!selectedRule) {
        break;
      }

      const newFacts = this.fireRule(selectedRule);

      let factsAdded = 0;
      for (const fact of newFacts) {
        if (this.workingMemory.addFact(fact)) {
          factsAdded++;
        }
      }

      this.conflictResolver.markRuleFired(
        selectedRule.rule_id,
        selectedRule.matched_facts || []
      );

      this.totalRulesFired++;

      if (factsAdded === 0) {
        break;
      }
    }

    if (this.iterationCount >= this.maxIterations) {
      console.warn(`⚠ Reached max iterations (${this.maxIterations})`);
    }

    return this._buildResult();
  }

  /**
   * Tạo kết quả cuối cùng từ working memory
   */
  _buildResult() {
    const compositeRisks = [];

    for (const fact of this.workingMemory.getFactsByType('composite_risk')) {
      compositeRisks.push(fact.data);
    }

    const indicatorEvaluations = {};
    for (const fact of this.workingMemory.getFactsByType('indicator_evaluation')) {
      const indicator = fact.factId.replace('eval_', '');
      indicatorEvaluations[indicator] = fact.data;
    }

    const finalScore = this._calculateFinalScore(indicatorEvaluations, compositeRisks);

    return {
      composite_risks: compositeRisks,
      indicator_evaluations: indicatorEvaluations,
      final_score: finalScore,
      inference_stats: {
        iterations: this.iterationCount,
        rules_fired: this.totalRulesFired,
        total_facts: this.workingMemory.size,
        composite_risks_count: compositeRisks.length
      },
      working_memory_snapshot: this.workingMemory.snapshot(),
      inference_trace: this.explanationEngine.getInferenceTrace()
    };
  }

  /**
   * Tính điểm rủi ro tổng hợp (RAW SCORE)
   * 
   * Thang điểm:
   * - Phase 3 (Indicator Risk): Max 24 điểm (12 indicators × 2 điểm/indicator)
   * - Phase 4 (Composite Risk): Tùy số rules kích hoạt (3-4 điểm/rule)
   * 
   * Ngưỡng phân loại (điểm thô):
   * - Good: < 10 điểm
   * - Medium: 10-20 điểm
   * - Risky: ≥ 20 điểm
   */
  _calculateFinalScore(evaluations, compositeRisks) {
    // Phase 3: Tính điểm từ indicator evaluations
    let indicatorPoints = 0;
    for (const evalResult of Object.values(evaluations)) {
      indicatorPoints += evalResult.risk_point || 0;
    }

    // Phase 4: Tính điểm từ composite risks
    let compositePoints = 0;
    for (const risk of compositeRisks) {
      compositePoints += risk.risk_point || 0;
    }

    // Tổng điểm thô (không chuẩn hóa)
    const totalPoints = indicatorPoints + compositePoints;

    // Xác định risk level dựa trên điểm thô
    let riskLevel;
    if (totalPoints >= 20) {
      riskLevel = 'Risky';
    } else if (totalPoints >= 10) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'Good';
    }

    // Đếm số indicators có risk level Risky
    const highRiskIndicators = [];
    for (const [ind, evalResult] of Object.entries(evaluations)) {
      if (evalResult.risk_level === 'Risky') {
        highRiskIndicators.push(ind);
      }
    }

    // Tính max points để tham khảo
    const maxIndicatorPoints = Object.keys(evaluations).length * 2; // 12 × 2 = 24
    const maxCompositePoints = this.rules.length * 4; // Ước tính
    const maxTotalPoints = maxIndicatorPoints + maxCompositePoints;

    return {
      indicator_risk_points: indicatorPoints,
      composite_risk_points: compositePoints,
      total_risk_points: totalPoints,
      max_indicator_points: maxIndicatorPoints,
      max_composite_points: maxCompositePoints,
      max_total_points: maxTotalPoints,
      risk_score: totalPoints, // Điểm thô, không chuẩn hóa
      risk_level: riskLevel,
      composite_risk_count: compositeRisks.length,
      high_risk_indicators: highRiskIndicators,
      // Thêm thông tin ngưỡng để UI hiển thị
      thresholds: {
        good_max: 9,
        medium_min: 10,
        medium_max: 19,
        risky_min: 20
      }
    };
  }

  /**
   * Lấy giải thích cho quá trình suy diễn
   */
  getExplanation() {
    return this.explanationEngine.generateSummary();
  }

  /**
   * Giải thích một fact cụ thể
   */
  explainFact(factId) {
    return this.explanationEngine.explainWhy(factId, this.workingMemory);
  }

  /**
   * Reset forward chainer
   */
  reset() {
    this.workingMemory.clear();
    this.conflictResolver.reset();
    this.explanationEngine.reset();
    this.iterationCount = 0;
    this.totalRulesFired = 0;
  }
}
