/**
 * Evaluation Service
 * API calls cho Single Company Evaluation
 */

import api from './api.service'

export default {
  async getTickers() {
    const response = await api.get('/evaluation/tickers')
    return response.data
  },
  
  async getCurrentPeriod() {
    const response = await api.get('/evaluation/current-period')
    return response.data
  },
  
  // Step 1: Load financial data
  async loadFinancialData(symbol, year, quarter) {
    const response = await api.post('/evaluation/load-financial-data', {
      symbol,
      year,
      quarter
    })
    return response // response đã được unwrap bởi interceptor
  },

  // Step 2: Calculate indicators
  async calculateIndicators(symbol, year, quarter) {
    const response = await api.post('/evaluation/calculate-indicators', {
      symbol,
      year,
      quarter
    })
    return response // response đã được unwrap bởi interceptor
  },

  // Step 3: Evaluate risk
  async evaluateRisk(symbol, year, quarter) {
    const response = await api.post('/evaluation/evaluate-risk', {
      symbol,
      year,
      quarter
    })
    return response // response đã được unwrap bởi interceptor
  },

  // Legacy: Full evaluation
  async evaluate(symbol, year, quarter) {
    const response = await api.post('/evaluation/evaluate', {
      symbol,
      year,
      quarter
    })
    return response // response đã được unwrap bởi interceptor
  },

  // Get indicator rules for risk scoring
  async getIndicatorRules() {
    const response = await api.get('/evaluation/indicator-rules')
    return response.data
  }
}
