/**
 * Knowledge Service
 * API calls cho Knowledge Management
 */

import api from './api.service'

export default {
  async getRuleTypes() {
    return api.get('/knowledge/types')
  },
  
  async getKnowledgeGraph() {
    return api.get('/knowledge/graph')
  },
  
  async getRules(type) {
    return api.get(`/knowledge/rules/${type}`)
  },
  
  async saveRules(type, rules) {
    return api.post(`/knowledge/rules/${type}`, { rules })
  },
  
  async restoreDefault(type) {
    return api.post(`/knowledge/rules/${type}/restore`)
  }
}
