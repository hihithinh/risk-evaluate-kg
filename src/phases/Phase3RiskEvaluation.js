/**
 * Phase 3: Risk Evaluation
 * Đánh giá rủi ro cục bộ cho từng chỉ số
 * Áp dụng Heuristic H2 - Sắp xếp ưu tiên luật đơn
 */

import fs from 'fs';

export class RiskEvaluator {
  constructor(indicatorRulesPath) {
    const rulesData = JSON.parse(fs.readFileSync(indicatorRulesPath, 'utf-8'));
    this.rules = rulesData;
    this.indicatorRules = {};
    
    // indicator_rules.json là array, cần convert thành object
    if (Array.isArray(rulesData)) {
      for (const rule of rulesData) {
        this.indicatorRules[rule.indicator] = rule;
      }
    } else {
      // Fallback nếu là object
      for (const [indicator, ruleData] of Object.entries(rulesData)) {
        this.indicatorRules[indicator] = ruleData;
      }
    }
  }

  /**
   * Đánh giá một chỉ số dựa trên giá trị
   */
  evaluateIndicator(indicator, value) {
    if (!this.indicatorRules[indicator]) {
      return {
        indicator: indicator,
        value: value,
        risk_level: 'Unknown',
        risk_point: 0,
        risk_type: 'unknown',
        explanation: 'Không có rule đánh giá cho chỉ số này'
      };
    }

    if (value === null || value === undefined || isNaN(value)) {
      return {
        indicator: indicator,
        value: null,
        risk_level: 'Unknown',
        risk_point: 0,
        risk_type: 'unknown',
        explanation: 'Không có dữ liệu để đánh giá'
      };
    }

    const rules = this.indicatorRules[indicator];
    const ranges = rules.ranges || [];

    for (const range of ranges) {
      if (this._checkRange(value, range)) {
        return {
          indicator: indicator,
          value: value,
          risk_level: range.risk_level,
          risk_point: range.risk_point,
          risk_type: range.risk_type,
          explanation: range.explanation
        };
      }
    }

    return {
      indicator: indicator,
      value: value,
      risk_level: 'Unknown',
      risk_point: 0,
      risk_type: 'unknown',
      explanation: 'Giá trị nằm ngoài phạm vi đánh giá'
    };
  }

  /**
   * Kiểm tra xem giá trị có nằm trong range không
   */
  _checkRange(value, range) {
    const min = range.min;
    const max = range.max;

    if (min !== null && min !== undefined) {
      if (value < min) {
        return false;
      }
    }

    if (max !== null && max !== undefined) {
      if (value > max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Đánh giá tất cả chỉ số
   */
  evaluateAll(indicators) {
    console.log('\n=== Phase 3: Risk Evaluation ===');

    const evaluations = {};

    for (const [indicator, value] of Object.entries(indicators)) {
      const evaluation = this.evaluateIndicator(indicator, value);
      evaluations[indicator] = evaluation;

      if (evaluation && evaluation.risk_level !== 'Unknown') {
        console.log(`✓ ${indicator}: ${evaluation.risk_level} (${evaluation.risk_point} points)`);
      } else if (evaluation && evaluation.risk_level === 'Unknown') {
        console.log(`⚠ ${indicator}: Unknown (no data or out of range)`);
      }
    }

    console.log('✓ Phase 3 completed\n');
    return evaluations;
  }

  /**
   * Tính tóm tắt rủi ro
   */
  getSummary(evaluations) {
    const summary = {
      total_indicators: 0,
      high_risk_count: 0,
      medium_risk_count: 0,
      good_count: 0,
      total_risk_points: 0,
      high_risk_indicators: [],
      by_category: {
        liquidity: { high: 0, medium: 0, good: 0 },
        leverage: { high: 0, medium: 0, good: 0 },
        efficiency: { high: 0, medium: 0, good: 0 },
        profitability: { high: 0, medium: 0, good: 0 }
      }
    };

    for (const [indicator, evaluation] of Object.entries(evaluations)) {
      if (!evaluation) continue;

      summary.total_indicators++;
      summary.total_risk_points += evaluation.risk_point || 0;

      const riskLevel = evaluation.risk_level;
      if (riskLevel === 'High') {
        summary.high_risk_count++;
        summary.high_risk_indicators.push(indicator);
      } else if (riskLevel === 'Medium') {
        summary.medium_risk_count++;
      } else if (riskLevel === 'Good') {
        summary.good_count++;
      }

      // Categorize by type
      const category = this._getCategory(indicator);
      if (category && summary.by_category[category]) {
        if (riskLevel === 'High') {
          summary.by_category[category].high++;
        } else if (riskLevel === 'Medium') {
          summary.by_category[category].medium++;
        } else if (riskLevel === 'Good') {
          summary.by_category[category].good++;
        }
      }
    }

    return summary;
  }

  /**
   * Xác định category của indicator
   */
  _getCategory(indicator) {
    if (indicator.startsWith('A')) return 'liquidity';
    if (indicator.startsWith('B')) return 'leverage';
    if (indicator.startsWith('C')) return 'efficiency';
    if (indicator.startsWith('D')) return 'profitability';
    return null;
  }

  /**
   * Lấy các chỉ số có rủi ro cao
   */
  getHighRiskIndicators(evaluations) {
    const highRisk = [];

    for (const [indicator, evaluation] of Object.entries(evaluations)) {
      if (evaluation && evaluation.risk_level === 'High') {
        highRisk.push({
          indicator: indicator,
          value: evaluation.value,
          risk_point: evaluation.risk_point,
          explanation: evaluation.explanation
        });
      }
    }

    return highRisk;
  }

  /**
   * Lấy rủi ro theo category
   */
  getRiskByCategory(evaluations, category) {
    const categoryRisks = [];

    for (const [indicator, evaluation] of Object.entries(evaluations)) {
      if (this._getCategory(indicator) === category) {
        categoryRisks.push({
          indicator: indicator,
          ...evaluation
        });
      }
    }

    return categoryRisks;
  }
}
