/**
 * Bulk Service
 * API calls cho Bulk Evaluation
 */

import api from './api.service'

export default {
  async getTemplate() {
    return api.get('/bulk/template')
  },
  
  async uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/bulk/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  async previewCsv(uid, filename) {
    return api.post('/bulk/preview', { uid, filename })
  },
  
  async evaluate(uid, filename) {
    return api.post('/bulk/evaluate', { uid, filename })
  },
  
  getDownloadUrl(uid, filename) {
    return `/api/bulk/download/${uid}/${filename}`
  },

  // Database API methods
  async getCompanies(uid, symbol = null, year = null, filters = {}) {
    const params = new URLSearchParams()
    if (symbol) params.append('symbol', symbol)
    if (year) params.append('year', year)
    if (filters.quarter) params.append('quarter', filters.quarter)
    if (filters.riskLevel) params.append('riskLevel', filters.riskLevel)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.offset) params.append('offset', filters.offset)
    
    return api.get(`/bulk/companies/${uid}?${params.toString()}`)
  },

  async getIndicators(uid, companyId) {
    return api.get(`/bulk/indicators/${uid}/${companyId}`)
  },

  async getRuleResults(uid, companyId) {
    return api.get(`/bulk/rules/${uid}/${companyId}`)
  },

  async getStatistics(uid) {
    return api.get(`/bulk/stats/${uid}`)
  }
}
