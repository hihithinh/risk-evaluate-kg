/**
 * Knowledge Service
 * Xử lý logic nghiệp vụ cho Knowledge Management
 */

import fs from 'fs';
import path from 'path';
import { STORAGE_CONFIG } from '../../src/configs/storage.config.js';

export class KnowledgeService {
  constructor() {
    this.defaultRulesPath = STORAGE_CONFIG.DEFAULT_RULES;
    this.customRulesPath = STORAGE_CONFIG.RULES;
  }

  /**
   * Load rules (custom hoặc default)
   */
  async loadRules(ruleType = 'indicator') {
    const customPath = path.join(this.customRulesPath, `${ruleType}_rules.json`);
    const defaultPath = path.join(this.defaultRulesPath, `${ruleType}_rules.json`);

    // Ưu tiên custom rules
    if (fs.existsSync(customPath)) {
      return {
        rules: JSON.parse(fs.readFileSync(customPath, 'utf-8')),
        isCustom: true,
        path: customPath
      };
    }

    // Fallback to default
    if (fs.existsSync(defaultPath)) {
      return {
        rules: JSON.parse(fs.readFileSync(defaultPath, 'utf-8')),
        isCustom: false,
        path: defaultPath
      };
    }

    throw new Error(`Rules file not found: ${ruleType}_rules.json`);
  }

  /**
   * Save custom rules
   */
  async saveRules(ruleType, rules) {
    const customPath = path.join(this.customRulesPath, `${ruleType}_rules.json`);
    
    // Ensure directory exists
    if (!fs.existsSync(this.customRulesPath)) {
      fs.mkdirSync(this.customRulesPath, { recursive: true });
    }

    fs.writeFileSync(customPath, JSON.stringify(rules, null, 2), 'utf-8');

    return {
      success: true,
      path: customPath
    };
  }

  /**
   * Restore default rules
   */
  async restoreDefault(ruleType) {
    const customPath = path.join(this.customRulesPath, `${ruleType}_rules.json`);

    // Delete custom rules if exists
    if (fs.existsSync(customPath)) {
      fs.unlinkSync(customPath);
    }

    // Load default rules
    return await this.loadRules(ruleType);
  }

  /**
   * Get all rule types
   */
  async getAllRuleTypes() {
    return ['indicator', 'risk_signal', 'risk_label'];
  }

  /**
   * Build knowledge graph structure for visualization
   */
  async buildKnowledgeGraph() {
    const indicatorRules = await this.loadRules('risk_signal');
    const compositeRules = await this.loadRules('risk_label');

    // Build nodes and edges
    const nodes = [];
    const edges = [];

    // Indicator nodes - rules là array trực tiếp
    const indicators = Array.isArray(indicatorRules.rules) 
      ? indicatorRules.rules 
      : (indicatorRules.rules.risk_signal_rules || []);
      
    for (const rule of indicators) {
      nodes.push({
        id: rule.indicator,
        label: rule.indicator,
        type: 'indicator',
        data: rule
      });
    }

    // Composite nodes and edges - rules là array trực tiếp
    const composites = Array.isArray(compositeRules.rules)
      ? compositeRules.rules
      : (compositeRules.rules.risk_label_rules || []);
      
    for (const rule of composites) {
      const nodeId = rule.composite_risk || rule.rule_id;
      const nodeLabel = rule.composite_risk || rule.rule_id;
      
      nodes.push({
        id: nodeId,
        label: nodeLabel,
        type: 'composite',
        data: rule
      });

      // Add edges from indicators to composite
      if (rule.conditions) {
        for (const condition of rule.conditions) {
          if (condition.indicator) {
            edges.push({
              from: condition.indicator,
              to: nodeId,
              label: condition.risk_level || ''
            });
          }
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        totalIndicators: nodes.filter(n => n.type === 'risk_signal').length,
        totalComposites: nodes.filter(n => n.type === 'risk_label').length,
        totalEdges: edges.length
      }
    };
  }
}
