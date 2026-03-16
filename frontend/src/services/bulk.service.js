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
  }
}
