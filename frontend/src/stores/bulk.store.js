/**
 * Bulk Store
 * State management cho Bulk Evaluation
 */

import { defineStore } from 'pinia'
import bulkService from '@/services/bulk.service'

export const useBulkStore = defineStore('bulk', {
  state: () => ({
    template: null,
    uploadedFile: null,
    preview: null,
    result: null,
    currentStep: 0, // 0: upload, 1: preview, 2: processing, 3: results
    loading: false,
    error: null
  }),
  
  actions: {
    async loadTemplate() {
      try {
        const response = await bulkService.getTemplate()
        this.template = response.data
      } catch (error) {
        console.error('Failed to load template:', error)
      }
    },
    
    async uploadFile(file) {
      this.loading = true
      this.error = null
      
      try {
        const response = await bulkService.uploadFile(file)
        this.uploadedFile = response.data
        this.currentStep = 1
        
        // Auto preview
        await this.previewCsv()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async previewCsv() {
      if (!this.uploadedFile) return
      
      this.loading = true
      
      try {
        const response = await bulkService.previewCsv(
          this.uploadedFile.uid,
          this.uploadedFile.filename
        )
        this.preview = response.data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async evaluate() {
      if (!this.uploadedFile) return
      
      this.loading = true
      this.currentStep = 2
      this.error = null
      
      try {
        const response = await bulkService.evaluate(
          this.uploadedFile.uid,
          this.uploadedFile.filename
        )
        this.result = response.data
        this.currentStep = 3
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    getDownloadUrl() {
      if (!this.uploadedFile) return null
      return bulkService.getDownloadUrl(
        this.uploadedFile.uid,
        this.uploadedFile.filename
      )
    },
    
    reset() {
      this.uploadedFile = null
      this.preview = null
      this.result = null
      this.currentStep = 0
      this.error = null
    }
  }
})
