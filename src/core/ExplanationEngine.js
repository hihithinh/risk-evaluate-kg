/**
 * Explanation Engine - Tạo giải thích cho quá trình suy diễn
 * Trace chuỗi suy luận và tạo justification tree
 */

export class InferenceStep {
  constructor(stepId, ruleId, inputFacts, outputFacts, ruleDescription, explanation) {
    this.stepId = stepId;
    this.ruleId = ruleId;
    this.inputFacts = inputFacts;
    this.outputFacts = outputFacts;
    this.ruleDescription = ruleDescription;
    this.explanation = explanation;
    this.timestamp = new Date();
  }

  toObject() {
    return {
      stepId: this.stepId,
      ruleId: this.ruleId,
      inputFacts: this.inputFacts,
      outputFacts: this.outputFacts,
      ruleDescription: this.ruleDescription,
      explanation: this.explanation,
      timestamp: this.timestamp.toISOString()
    };
  }
}

export class ExplanationEngine {
  constructor() {
    this.inferenceTrace = [];
    this.stepCounter = 0;
  }

  /**
   * Ghi lại một bước suy diễn
   */
  recordStep(ruleId, inputFacts, outputFacts, ruleDescription, explanation) {
    const step = new InferenceStep(
      this.stepCounter,
      ruleId,
      inputFacts,
      outputFacts,
      ruleDescription,
      explanation
    );
    this.inferenceTrace.push(step);
    this.stepCounter++;
  }

  /**
   * Lấy toàn bộ chuỗi suy diễn
   */
  getInferenceTrace() {
    return this.inferenceTrace.map(step => step.toObject());
  }

  /**
   * Trả lời câu hỏi "Tại sao có fact này?"
   */
  explainWhy(factId, workingMemory) {
    const fact = workingMemory.getFact(factId);

    if (!fact) {
      return `Không tìm thấy fact ${factId}`;
    }

    const parts = [`=== Giải thích cho ${factId} ===\n`];

    if (fact.source === 'initial') {
      parts.push('Đây là fact ban đầu từ dữ liệu đầu vào.\n');
      parts.push(`Dữ liệu: ${JSON.stringify(fact.data, null, 2)}`);
    } else {
      parts.push(`Fact này được suy ra từ rule: ${fact.source}\n`);

      if (fact.derivedFrom.length > 0) {
        parts.push('Dựa trên các facts sau:');
        for (const parentId of fact.derivedFrom) {
          const parentFact = workingMemory.getFact(parentId);
          if (parentFact) {
            parts.push(`  - ${parentId}: ${parentFact.data.risk_level || 'N/A'}`);
          }
        }
      }

      parts.push(`\nKết quả: ${JSON.stringify(fact.data, null, 2)}`);
    }

    const inferenceChain = workingMemory.getInferenceChain(factId);
    if (inferenceChain.length > 1) {
      parts.push(`\nChuỗi suy diễn (${inferenceChain.length} bước):`);
      for (let i = 0; i < inferenceChain.length; i++) {
        const step = inferenceChain[i];
        parts.push(`  ${i + 1}. ${step.factId} (từ ${step.source})`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Trả lời câu hỏi "Tại sao rule này không được kích hoạt?"
   */
  explainWhyNot(ruleId, evaluations, ruleDefinition) {
    const parts = [`=== Tại sao ${ruleId} không được kích hoạt? ===\n`];

    const conditions = ruleDefinition.conditions || [];
    const failedConditions = [];

    for (const condition of conditions) {
      const indicator = condition.indicator;

      if (!evaluations[indicator]) {
        failedConditions.push(`  ✗ ${indicator}: Không có dữ liệu`);
        continue;
      }

      const evalResult = evaluations[indicator];

      if (condition.source === 'indicator_rules_output') {
        const field = condition.field || 'risk_level';
        const operator = condition.operator;
        const expected = condition.value;
        const actual = evalResult[field];

        if (operator === 'eq' && actual !== expected) {
          failedConditions.push(
            `  ✗ ${indicator}.${field}: Cần '${expected}', thực tế '${actual}'`
          );
        } else if (operator === 'in' && !expected.includes(actual)) {
          failedConditions.push(
            `  ✗ ${indicator}.${field}: Cần trong ${JSON.stringify(expected)}, thực tế '${actual}'`
          );
        }
      }
    }

    if (failedConditions.length > 0) {
      parts.push('Các điều kiện không thỏa mãn:');
      parts.push(...failedConditions);
    } else {
      parts.push('Tất cả điều kiện đều thỏa mãn, nhưng rule có thể đã bị loại bỏ do conflict resolution.');
    }

    return parts.join('\n');
  }

  /**
   * Tạo tóm tắt toàn bộ quá trình suy diễn
   */
  generateSummary() {
    if (this.inferenceTrace.length === 0) {
      return 'Không có bước suy diễn nào được thực hiện.';
    }

    const parts = [
      '=== Tóm tắt quá trình suy diễn ===',
      `Tổng số bước: ${this.inferenceTrace.length}`,
      ''
    ];

    const rulesUsed = new Set();
    let totalFactsGenerated = 0;

    for (const step of this.inferenceTrace) {
      rulesUsed.add(step.ruleId);
      totalFactsGenerated += step.outputFacts.length;
    }

    parts.push(`Số rules được kích hoạt: ${rulesUsed.size}`);
    parts.push(`Số facts mới được tạo: ${totalFactsGenerated}`);
    parts.push('');
    parts.push('Chi tiết từng bước:');

    for (const step of this.inferenceTrace) {
      parts.push(`  Bước ${step.stepId + 1}: ${step.ruleId} - ${step.ruleDescription}`);
      parts.push(`    Input: ${step.inputFacts.length} facts`);
      parts.push(`    Output: ${step.outputFacts.length} facts`);
    }

    return parts.join('\n');
  }

  /**
   * Tạo giải thích bằng ngôn ngữ tự nhiên cho kết luận cuối cùng
   */
  generateNaturalLanguageExplanation(finalConclusion, workingMemory) {
    const parts = [];

    const riskScore = finalConclusion.risk_score || 0;
    const riskLevel = finalConclusion.risk_level || 'Unknown';

    parts.push(
      `Kết luận: Doanh nghiệp có mức độ rủi ro ${riskLevel} với điểm số ${(riskScore * 100).toFixed(2)}%.\n`
    );

    const highRiskIndicators = finalConclusion.high_risk_indicators || [];
    if (highRiskIndicators.length > 0) {
      parts.push(`Phát hiện ${highRiskIndicators.length} chỉ số có rủi ro cao:`);
      for (const ind of highRiskIndicators) {
        const fact = workingMemory.getFact(`eval_${ind}`);
        if (fact) {
          parts.push(`  - ${ind}: ${fact.data.explanation || 'N/A'}`);
        }
      }
    }

    const compositeRisks = finalConclusion.composite_risks || [];
    if (compositeRisks.length > 0) {
      parts.push(`\nPhát hiện ${compositeRisks.length} vấn đề phức hợp:`);
      for (const risk of compositeRisks) {
        parts.push(`  - ${risk.risk_type} (${risk.severity}): ${risk.explanation}`);
      }
    }

    if (this.inferenceTrace.length > 0) {
      const uniqueRules = new Set(this.inferenceTrace.map(s => s.ruleId));
      parts.push(
        `\nQuá trình suy diễn đã trải qua ${this.inferenceTrace.length} bước, ` +
        `kích hoạt ${uniqueRules.size} rules khác nhau.`
      );
    }

    return parts.join('\n');
  }

  /**
   * Xuất inference trace ra file JSON
   */
  exportTrace(outputPath) {
    const fs = require('fs');
    const traceData = {
      totalSteps: this.inferenceTrace.length,
      steps: this.getInferenceTrace()
    };

    fs.writeFileSync(outputPath, JSON.stringify(traceData, null, 2), 'utf-8');
  }

  /**
   * Reset explanation engine
   */
  reset() {
    this.inferenceTrace = [];
    this.stepCounter = 0;
  }

  toString() {
    return `ExplanationEngine(steps=${this.inferenceTrace.length})`;
  }
}
