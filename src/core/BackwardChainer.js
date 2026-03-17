/**
 * Backward Chainer - Suy diễn lùi (Goal-driven reasoning)
 * Bắt đầu từ mục tiêu và tìm kiếm ngược lại để chứng minh
 */

import fs from 'fs';

export class BackwardChainer {
  constructor(compositeRulesPath) {
    const rulesData = JSON.parse(fs.readFileSync(compositeRulesPath, 'utf-8'));
    this.rules = rulesData;
    this.proofTrace = [];
    this.visitedGoals = new Set();
  }

  /**
   * Chứng minh một goal
   */
  proveGoal(goal, evaluations, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) {
      return { success: false, proofChain: [] };
    }

    const goalSignature = this._goalSignature(goal);

    if (this.visitedGoals.has(goalSignature)) {
      return { success: false, proofChain: [] };
    }

    this.visitedGoals.add(goalSignature);

    const matchingRules = this._findRulesForGoal(goal);

    if (matchingRules.length === 0) {
      return { success: false, proofChain: [] };
    }

    for (const rule of matchingRules) {
      const result = this._tryProveWithRule(rule, evaluations, depth);

      if (result.success) {
        const proofStep = {
          goal: goal,
          rule_id: rule.rule_id,
          description: rule.description,
          proof_chain: result.proofChain,
          depth: depth
        };

        this.proofTrace.push(proofStep);

        return {
          success: true,
          proofChain: [proofStep, ...result.proofChain]
        };
      }
    }

    return { success: false, proofChain: [] };
  }

  /**
   * Tìm các rules có thể suy ra goal
   */
  _findRulesForGoal(goal) {
    const matchingRules = [];

    for (const rule of this.rules) {
      const result = rule.result || {};

      let match = true;
      for (const [key, value] of Object.entries(goal)) {
        if (result[key] !== value) {
          match = false;
          break;
        }
      }

      if (match) {
        matchingRules.push(rule);
      }
    }

    return matchingRules;
  }

  /**
   * Thử chứng minh goal bằng một rule cụ thể
   */
  _tryProveWithRule(rule, evaluations, depth) {
    const conditions = rule.conditions || [];

    let allConditionsMet = true;
    const proofChain = [];

    for (const condition of conditions) {
      const result = this._checkCondition(condition, evaluations, depth + 1);

      if (!result.conditionMet) {
        allConditionsMet = false;
        break;
      }

      if (result.subProof) {
        proofChain.push(...result.subProof);
      }
    }

    if (allConditionsMet) {
      const proofStep = {
        rule_id: rule.rule_id,
        description: rule.description,
        conditions: conditions,
        all_met: true
      };
      return {
        success: true,
        proofChain: [proofStep, ...proofChain]
      };
    }

    return { success: false, proofChain: [] };
  }

  /**
   * Kiểm tra một điều kiện
   */
  _checkCondition(condition, evaluations, depth) {
    const indicator = condition.indicator;

    if (!evaluations[indicator]) {
      return { conditionMet: false, subProof: [] };
    }

    const evalResult = evaluations[indicator];

    if (condition.source === 'risk_signal_rules_output') {
      const field = condition.field || 'risk_level';
      const operator = condition.operator;
      const expectedValue = condition.value;

      const actualValue = evalResult[field];

      let met = false;

      if (operator === 'eq') {
        met = actualValue === expectedValue;
      } else if (operator === 'in') {
        met = Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      } else if (operator === 'ne') {
        met = actualValue !== expectedValue;
      }

      if (met) {
        const proofStep = {
          type: 'fact',
          indicator: indicator,
          field: field,
          expected: expectedValue,
          actual: actualValue,
          operator: operator
        };
        return { conditionMet: true, subProof: [proofStep] };
      }
    }

    return { conditionMet: false, subProof: [] };
  }

  /**
   * Tạo signature duy nhất cho goal
   */
  _goalSignature(goal) {
    const items = Object.entries(goal).sort();
    return JSON.stringify(items);
  }

  /**
   * Tạo giải thích cho chuỗi chứng minh
   */
  explainProof(proofChain) {
    if (!proofChain || proofChain.length === 0) {
      return 'Không thể chứng minh được mục tiêu.';
    }

    const parts = ['=== Chuỗi chứng minh (Backward Chaining) ===\n'];

    for (let i = 0; i < proofChain.length; i++) {
      const step = proofChain[i];

      if (step.type === 'fact') {
        parts.push(
          `${i + 1}. Fact: ${step.indicator}.${step.field} ${step.operator} ${step.expected} (thực tế: ${step.actual})`
        );
      } else {
        parts.push(`${i + 1}. Rule ${step.rule_id}: ${step.description}`);
        if (step.all_met) {
          parts.push('   ✓ Tất cả điều kiện đều thỏa mãn');
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Trả lời câu hỏi: "Tại sao công ty này có rủi ro cao?"
   */
  queryWhyHighRisk(evaluations) {
    const goal = { severity: 'high' };

    this.visitedGoals.clear();
    this.proofTrace = [];

    const result = this.proveGoal(goal, evaluations);

    if (result.success) {
      const rulesUsed = new Set();
      for (const step of result.proofChain) {
        if (step.rule_id) {
          rulesUsed.add(step.rule_id);
        }
      }

      return {
        success: true,
        goal: goal,
        proof_chain: result.proofChain,
        explanation: this.explainProof(result.proofChain),
        rules_used: Array.from(rulesUsed)
      };
    } else {
      return {
        success: false,
        goal: goal,
        explanation: 'Không tìm thấy bằng chứng cho rủi ro cao.'
      };
    }
  }

  /**
   * Trả lời câu hỏi: "Công ty có rủi ro [risk_type] không?"
   */
  querySpecificRisk(riskType, evaluations) {
    const goal = { risk_type: riskType };

    this.visitedGoals.clear();
    this.proofTrace = [];

    const result = this.proveGoal(goal, evaluations);

    if (result.success) {
      return {
        success: true,
        risk_type: riskType,
        has_risk: true,
        proof_chain: result.proofChain,
        explanation: this.explainProof(result.proofChain)
      };
    } else {
      return {
        success: false,
        risk_type: riskType,
        has_risk: false,
        explanation: `Không tìm thấy bằng chứng cho rủi ro ${riskType}.`
      };
    }
  }

  /**
   * Reset backward chainer
   */
  reset() {
    this.proofTrace = [];
    this.visitedGoals.clear();
  }

  toString() {
    return `BackwardChainer(rules=${this.rules.length}, proofs=${this.proofTrace.length})`;
  }
}
