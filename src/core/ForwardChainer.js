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
    if (condition.source === 'indicator_rules_output') {
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
    console.log('\n=== Forward Chaining Inference Loop ===');

    this.initializeWorkingMemory(evaluations);
    this.conflictResolver.reset();
    this.explanationEngine.reset();
    this.iterationCount = 0;
    this.totalRulesFired = 0;

    const initialFacts = this.workingMemory.size;
    console.log(`Initial facts: ${initialFacts}`);

    while (this.iterationCount < this.maxIterations) {
      this.iterationCount++;

      const matchingRules = this.findMatchingRules();

      if (matchingRules.length === 0) {
        console.log(`✓ No more rules to fire. Stopping at iteration ${this.iterationCount}`);
        break;
      }

      const wmSnapshot = this.workingMemory.snapshot();
      const selectedRule = this.conflictResolver.selectNextRule(matchingRules, wmSnapshot);

      if (!selectedRule) {
        console.log(`✓ No rule selected by conflict resolver. Stopping at iteration ${this.iterationCount}`);
        break;
      }

      console.log(`  Iteration ${this.iterationCount}: Firing rule ${selectedRule.rule_id} (matched ${matchingRules.length} rules)`);

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
        console.log(`✓ No new facts added. Stopping at iteration ${this.iterationCount}`);
        break;
      }
    }

    if (this.iterationCount >= this.maxIterations) {
      console.log(`⚠ Reached max iterations (${this.maxIterations})`);
    }

    const finalFacts = this.workingMemory.size;
    console.log('\nInference completed:');
    console.log(`  - Total iterations: ${this.iterationCount}`);
    console.log(`  - Rules fired: ${this.totalRulesFired}`);
    console.log(`  - Initial facts: ${initialFacts}`);
    console.log(`  - Final facts: ${finalFacts}`);
    console.log(`  - New facts created: ${finalFacts - initialFacts}`);

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
   * Tính điểm rủi ro tổng hợp
   */
  _calculateFinalScore(evaluations, compositeRisks) {
    let indicatorPoints = 0;
    for (const evalResult of Object.values(evaluations)) {
      indicatorPoints += evalResult.risk_point || 0;
    }

    let compositePoints = 0;
    for (const risk of compositeRisks) {
      compositePoints += risk.risk_point || 0;
    }

    const totalPoints = indicatorPoints + compositePoints;

    const maxIndicatorPoints = Object.keys(evaluations).length * 2;
    const maxCompositePoints = this.rules.length * 4;
    const maxTotalPoints = maxIndicatorPoints + maxCompositePoints;

    const riskScore = maxTotalPoints > 0 ? totalPoints / maxTotalPoints : 0;

    let riskLevel;
    if (riskScore >= 0.7) {
      riskLevel = 'High';
    } else if (riskScore >= 0.4) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'Good';
    }

    const highRiskIndicators = [];
    for (const [ind, evalResult] of Object.entries(evaluations)) {
      if (evalResult.risk_level === 'High') {
        highRiskIndicators.push(ind);
      }
    }

    return {
      indicator_risk_points: indicatorPoints,
      composite_risk_points: compositePoints,
      total_risk_points: totalPoints,
      max_total_points: maxTotalPoints,
      risk_score: riskScore,
      risk_level: riskLevel,
      composite_risk_count: compositeRisks.length,
      high_risk_indicators: highRiskIndicators
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
