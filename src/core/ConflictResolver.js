/**
 * Conflict Resolver - Giải quyết xung đột khi nhiều rules cùng match
 * Implement 3 strategies: Refractoriness, Specificity, Priority
 */

export const ConflictStrategy = {
  REFRACTORINESS: 'refractoriness',
  SPECIFICITY: 'specificity',
  PRIORITY: 'priority',
  RECENCY: 'recency'
};

export class ConflictResolver {
  constructor(strategies = null) {
    this.strategies = strategies || [
      ConflictStrategy.REFRACTORINESS,
      ConflictStrategy.PRIORITY,
      ConflictStrategy.SPECIFICITY
    ];
    this.firedRules = new Set(); // Set of "ruleId:factIds" signatures
  }

  /**
   * Giải quyết xung đột và trả về danh sách rules theo thứ tự ưu tiên
   * @param {Array} candidateRules - Danh sách rules có thể kích hoạt
   * @param {Object} workingMemorySnapshot - Snapshot của working memory
   * @returns {Array} Rules đã được sắp xếp
   */
  resolve(candidateRules, workingMemorySnapshot) {
    if (!candidateRules || candidateRules.length === 0) {
      return [];
    }

    let filteredRules = [...candidateRules];

    for (const strategy of this.strategies) {
      if (strategy === ConflictStrategy.REFRACTORINESS) {
        filteredRules = this._applyRefractoriness(filteredRules);
      } else if (strategy === ConflictStrategy.SPECIFICITY) {
        filteredRules = this._applySpecificity(filteredRules);
      } else if (strategy === ConflictStrategy.PRIORITY) {
        filteredRules = this._applyPriority(filteredRules);
      } else if (strategy === ConflictStrategy.RECENCY) {
        filteredRules = this._applyRecency(filteredRules, workingMemorySnapshot);
      }
    }

    return filteredRules;
  }

  /**
   * Strategy 1: Refractoriness
   * Loại bỏ các rules đã được kích hoạt với cùng tập facts
   */
  _applyRefractoriness(rules) {
    const filtered = [];

    for (const rule of rules) {
      const ruleId = rule.rule_id;
      const matchedFacts = rule.matched_facts || [];
      const signature = this._createSignature(ruleId, matchedFacts);

      if (!this.firedRules.has(signature)) {
        filtered.push(rule);
      }
    }

    return filtered;
  }

  /**
   * Strategy 2: Specificity
   * Ưu tiên các rules có nhiều conditions hơn (cụ thể hơn)
   */
  _applySpecificity(rules) {
    return rules.sort((a, b) => {
      const aConditions = a.conditions?.length || 0;
      const bConditions = b.conditions?.length || 0;
      return bConditions - aConditions; // Descending
    });
  }

  /**
   * Strategy 3: Priority
   * Ưu tiên theo severity/priority của rule
   */
  _applyPriority(rules) {
    const severityOrder = {
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return rules.sort((a, b) => {
      const aSeverity = a.result?.severity || a.severity;
      const bSeverity = b.result?.severity || b.severity;
      const aOrder = severityOrder[aSeverity] || 0;
      const bOrder = severityOrder[bSeverity] || 0;
      return bOrder - aOrder; // Descending
    });
  }

  /**
   * Strategy 4: Recency (placeholder)
   */
  _applyRecency(rules, workingMemorySnapshot) {
    return rules;
  }

  /**
   * Tạo signature duy nhất cho rule + facts
   */
  _createSignature(ruleId, matchedFacts) {
    const sortedFacts = [...matchedFacts].sort();
    return `${ruleId}:${sortedFacts.join(',')}`;
  }

  /**
   * Đánh dấu một rule đã được kích hoạt
   */
  markRuleFired(ruleId, matchedFacts) {
    const signature = this._createSignature(ruleId, matchedFacts);
    this.firedRules.add(signature);
  }

  /**
   * Reset lịch sử các rules đã kích hoạt
   */
  reset() {
    this.firedRules.clear();
  }

  /**
   * Lấy số lượng rules đã kích hoạt
   */
  getFiredRulesCount() {
    return this.firedRules.size;
  }

  /**
   * Chọn rule tiếp theo để kích hoạt
   */
  selectNextRule(candidateRules, workingMemorySnapshot) {
    const resolved = this.resolve(candidateRules, workingMemorySnapshot);
    return resolved.length > 0 ? resolved[0] : null;
  }

  /**
   * Giải thích tại sao rule này được chọn
   */
  explainSelection(selectedRule, allCandidates) {
    if (!selectedRule) {
      return 'Không có rule nào được chọn.';
    }

    const parts = [`Rule ${selectedRule.rule_id} được chọn vì:`];

    const numConditions = selectedRule.conditions?.length || 0;
    parts.push(`- Có ${numConditions} điều kiện (specificity)`);

    const severity = selectedRule.result?.severity || selectedRule.severity || 'unknown';
    parts.push(`- Mức độ nghiêm trọng: ${severity} (priority)`);

    const matchedFacts = selectedRule.matched_facts || [];
    const signature = this._createSignature(selectedRule.rule_id, matchedFacts);
    if (!this.firedRules.has(signature)) {
      parts.push('- Chưa được kích hoạt với tập facts này (refractoriness)');
    }

    const otherRules = allCandidates.filter(r => r.rule_id !== selectedRule.rule_id);
    if (otherRules.length > 0) {
      parts.push(`- Ưu tiên hơn ${otherRules.length} rules khác`);
    }

    return parts.join('\n');
  }

  toString() {
    return `ConflictResolver(strategies=${this.strategies.join(',')}, fired=${this.firedRules.size})`;
  }
}
