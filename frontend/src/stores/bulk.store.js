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
    companies: [],
    selectedCompany: null,
    companyIndicators: [],
    companyRuleResults: null,
    statistics: null,
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
        // Don't change step here - let evaluate() handle it
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
      // Always download the result CSV with result_ prefix
      const originalName = this.uploadedFile.filename
      // Remove extension and add result_ prefix with .csv extension
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
      const resultName = `result_${nameWithoutExt}.csv`
      return bulkService.getDownloadUrl(
        this.uploadedFile.uid,
        resultName
      )
    },
    
    setCurrentStep(step) {
      this.currentStep = step
    },

    // Database API methods
    async loadCompanies(symbol = null, year = null, filters = {}) {
      if (!this.uploadedFile) return
      
      this.loading = true
      
      try {
        const response = await bulkService.getCompanies(
          this.uploadedFile.uid, 
          symbol, 
          year,
          filters
        )
        this.companies = response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadCompanyIndicators(companyId) {
      if (!this.uploadedFile) return
      
      this.loading = true
      
      try {
        const response = await bulkService.getIndicators(
          this.uploadedFile.uid, 
          companyId
        )
        this.companyIndicators = response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadCompanyRuleResults(companyId) {
      if (!this.uploadedFile) return
      
      this.loading = true
      
      try {
        const response = await bulkService.getRuleResults(
          this.uploadedFile.uid, 
          companyId
        )
        this.companyRuleResults = response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadStatistics() {
      if (!this.uploadedFile) return
      
      this.loading = true
      
      try {
        const response = await bulkService.getStatistics(this.uploadedFile.uid)
        this.statistics = response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    selectCompany(company) {
      this.selectedCompany = company
      this.companyIndicators = []
      this.companyRuleResults = null
      
      // Load detailed data if company is selected
      if (company) {
        this.loadCompanyIndicators(company.id)
        this.loadCompanyRuleResults(company.id)
      }
    },

    reset() {
      this.uploadedFile = null
      this.preview = null
      this.result = null
      this.companies = []
      this.selectedCompany = null
      this.companyIndicators = []
      this.companyRuleResults = null
      this.statistics = null
      this.currentStep = 0
      this.error = null
    }
  }
})
