/**
 * Working Memory - Quản lý tập hợp các facts trong quá trình suy diễn
 * 
 * Chức năng:
 * - Lưu trữ facts (initial facts + derived facts)
 * - Thêm/xóa facts
 * - Query facts theo điều kiện
 * - Track lineage (nguồn gốc) của facts
 */
import { Fact } from './Fact.js';

export class WorkingMemory {
  constructor() {
    this.facts = new Map(); // factId -> Fact
    this.factsByType = new Map(); // factType -> Set<factId>
    this.inferenceHistory = [];
  }

  /**
   * Thêm một fact vào working memory
   * @param {Fact} fact 
   * @returns {boolean} True nếu fact mới, False nếu đã có
   */
  addFact(fact) {
    if (this.facts.has(fact.factId)) {
      return false;
    }

    this.facts.set(fact.factId, fact);

    if (!this.factsByType.has(fact.factType)) {
      this.factsByType.set(fact.factType, new Set());
    }
    this.factsByType.get(fact.factType).add(fact.factId);

    this.inferenceHistory.push({
      action: 'add_fact',
      factId: fact.factId,
      factType: fact.factType,
      source: fact.source,
      timestamp: fact.timestamp
    });

    return true;
  }

  /**
   * Xóa một fact khỏi working memory
   * @param {string} factId 
   * @returns {boolean}
   */
  removeFact(factId) {
    if (!this.facts.has(factId)) {
      return false;
    }

    const fact = this.facts.get(factId);
    this.facts.delete(factId);

    if (this.factsByType.has(fact.factType)) {
      this.factsByType.get(fact.factType).delete(factId);
    }

    this.inferenceHistory.push({
      action: 'remove_fact',
      factId: factId,
      timestamp: new Date()
    });

    return true;
  }

  /**
   * Lấy một fact theo ID
   * @param {string} factId 
   * @returns {Fact|null}
   */
  getFact(factId) {
    return this.facts.get(factId) || null;
  }

  /**
   * Lấy tất cả facts của một loại
   * @param {string} factType 
   * @returns {Fact[]}
   */
  getFactsByType(factType) {
    const factIds = this.factsByType.get(factType) || new Set();
    return Array.from(factIds).map(fid => this.facts.get(fid));
  }

  /**
   * Query facts theo điều kiện
   * @param {Object} conditions 
   * @returns {Fact[]}
   */
  queryFacts(conditions = {}) {
    const results = [];

    for (const fact of this.facts.values()) {
      let match = true;

      if (conditions.factType && fact.factType !== conditions.factType) {
        match = false;
        continue;
      }

      for (const [key, value] of Object.entries(conditions)) {
        if (key === 'factType') continue;

        if (!fact.data[key] || fact.data[key] !== value) {
          match = false;
          break;
        }
      }

      if (match) {
        results.push(fact);
      }
    }

    return results;
  }

  /**
   * Lấy tất cả facts
   * @returns {Fact[]}
   */
  getAllFacts() {
    return Array.from(this.facts.values());
  }

  /**
   * Xóa tất cả facts
   */
  clear() {
    this.facts.clear();
    this.factsByType.clear();
    this.inferenceHistory = [];
  }

  /**
   * Truy vết nguồn gốc của một fact
   * @param {string} factId 
   * @returns {string[]} List các fact_id mà fact này được suy ra từ đó
   */
  getLineage(factId) {
    const fact = this.getFact(factId);
    if (!fact) return [];

    const lineage = [];

    for (const parentId of fact.derivedFrom) {
      lineage.push(parentId);
      lineage.push(...this.getLineage(parentId));
    }

    return lineage;
  }

  /**
   * Lấy chuỗi suy diễn dẫn đến một fact
   * @param {string} factId 
   * @returns {Object[]}
   */
  getInferenceChain(factId) {
    const chain = [];
    const fact = this.getFact(factId);

    if (!fact) return chain;

    for (const parentId of fact.derivedFrom) {
      chain.push(...this.getInferenceChain(parentId));
    }

    chain.push({
      factId: fact.factId,
      factType: fact.factType,
      source: fact.source,
      data: { ...fact.data },
      derivedFrom: [...fact.derivedFrom]
    });

    return chain;
  }

  /**
   * Tạo snapshot của working memory hiện tại
   * @returns {Object}
   */
  snapshot() {
    const factsObj = {};
    for (const [fid, f] of this.facts.entries()) {
      factsObj[fid] = {
        factId: f.factId,
        factType: f.factType,
        data: { ...f.data },
        source: f.source,
        derivedFrom: [...f.derivedFrom]
      };
    }

    const factsByTypeObj = {};
    for (const [type, ids] of this.factsByType.entries()) {
      factsByTypeObj[type] = ids.size;
    }

    return {
      facts: factsObj,
      totalFacts: this.facts.size,
      factsByType: factsByTypeObj,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Số lượng facts
   */
  get size() {
    return this.facts.size;
  }

  toString() {
    return `WorkingMemory(facts=${this.facts.size}, types=${this.factsByType.size})`;
  }
}
