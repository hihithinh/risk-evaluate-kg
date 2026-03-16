/**
 * Evaluation Store
 * State management cho Single Company Evaluation
 */

import { defineStore } from 'pinia'
import evaluationService from '@/services/evaluation.service'

export const useEvaluationStore = defineStore('evaluation', {
  state: () => ({
    tickers: [],
    currentPeriod: { year: 2026, quarter: 1 },
    result: null,
    indicatorRules: [],
    loading: {
      started: false,
      step1: false,
      step2: false,
      step3: false
    },
    error: null
  }),
  
  actions: {
    async loadTickers() {
      try {
        this.tickers = await evaluationService.getTickers()
      } catch (error) {
        this.error = error.message
      }
    },

    async loadCurrentPeriod() {
      try {
        this.currentPeriod = await evaluationService.getCurrentPeriod()
      } catch (error) {
        this.error = error.message
      }
    },

    async loadIndicatorRules() {
      try {
        this.indicatorRules = await evaluationService.getIndicatorRules()
      } catch (error) {
        this.error = error.message
        console.error('Failed to load indicator rules:', error)
      }
    },

    async evaluateStepByStep(symbol, year, quarter) {
      this.loading.started = true
      this.loading.step1 = true
      this.loading.step2 = false
      this.loading.step3 = false
      this.error = null
      this.result = {
        step: 0,
        financialData: null,
        indicators: null,
        riskAssessment: null,
        company: { symbol, year, quarter },
        stepErrors: {}
      }

      // Step 1: Load financial data
      this.result.step = 1
      this.result.stepErrors[1] = null
      const step1 = await evaluationService.loadFinancialData(symbol, year, quarter)
      console.log('Step 1 API response:', step1)
      console.log('Step 1 data keys:', Object.keys(step1.data || {}))
      console.log('Step 1 financialData:', step1.data?.financialData)
      console.log('Step 1 raw_data keys:', Object.keys(step1.data?.raw_data || {}))
      
      if (!step1.success) {
        this.result.stepErrors[1] = step1.error
        this.error = step1.error
        console.error('❌ Step 1 failed:', step1.error)
        this.loading.step1 = false
        return
      }
      this.result.financialData = step1.data
      this.result.company = step1.data.company_info
      console.log('🔍 Store after Step 1 - financialData:', !!this.result.financialData)
      console.log('🔍 Store after Step 1 - company:', this.result.company)
      
      // Check data mismatch - chỉ warning nếu thực sự không có data
      const dataYear = step1.data.raw_data?.yearReport
      const dataFields = Object.keys(step1.data.raw_data).filter(key => 
        step1.data.raw_data[key] && step1.data.raw_data[key] !== '' && step1.data.raw_data[key] !== '0'
      )
      
      console.log(`📊 Data analysis: requested=${year}, got=${dataYear}, fields=${dataFields.length}`)
      
      if (dataYear && dataYear != year && dataFields.length < 5) {
        console.warn(`⚠️ Data mismatch: Requested ${year}, got ${dataYear} with limited data (${dataFields.length} fields)`)
        this.result.dataWarning = `Không có dữ liệu Q${quarter}/${year}, hệ thống sử dụng báo cáo tài chính mới nhất (${dataYear})`
      } else if (dataYear && dataYear != year && dataFields.length >= 5) {
        console.log(`ℹ️ Using data from ${dataYear} for Q${quarter}/${year} (${dataFields.length} fields available)`)
      }
      
      console.log('✅ Step 1 completed:', this.result.financialData)
      console.log('🔍 Store state after step 1:', {
        result: this.result,
        loading: this.loading,
        financialData: this.result.financialData
      })
      console.log('🔄 Setting loading.step1 to false after Step 1...')
      this.loading.step1 = false // Xong step 1 → tắt loading để hiển thị data
      console.log('✅ Loading.step1 is now:', this.loading.step1)

      // Wait a bit for UI to update before starting Step 2
      await new Promise(resolve => setTimeout(resolve, 100))

      // Step 2: Calculate indicators
      this.loading.step2 = true
      this.result.step = 2
      this.result.stepErrors[2] = null
      try {
        const step2 = await evaluationService.calculateIndicators(symbol, year, quarter)
        console.log('Step 2 API response:', step2)
        if (!step2.success) {
          this.result.stepErrors[2] = step2.error
          this.error = step2.error
          console.error('❌ Step 2 failed:', step2.error)
          this.loading.step2 = false
          return
        }
        this.result.indicators = step2.data.indicators
        console.log('✅ Step 2 completed:', this.result.indicators)
        this.loading.step2 = false // Xong step 2 → tắt loading để hiển thị data
      } catch (error) {
        this.result.stepErrors[2] = error.message
        this.error = error.message
        console.error('❌ Step 2 error:', error.message)
        this.loading.step2 = false
        return
      }

      // Wait a bit for UI to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Step 3: Evaluate risk
      this.loading.step3 = true
      this.result.step = 3
      this.result.stepErrors[3] = null
      const step3 = await evaluationService.evaluateRisk(symbol, year, quarter)
      console.log('Step 3 API response:', step3)
      if (!step3.success) {
        this.result.stepErrors[3] = step3.error
        this.error = step3.error
        console.error('❌ Step 3 failed:', step3.error)
        this.loading.step3 = false
        return
      }
      console.log('🔍 Before Step 3 merge - financialData exists:', !!this.result.financialData)
      console.log('🔍 Step 3 data keys:', Object.keys(step3.data))
      
      // Chỉ update data của Step 3, không touch data của step khác
      this.result.risk_assessment = step3.data.risk_assessment
      this.result.inference_stats = step3.data.inference_stats
      this.result.composite_risks = step3.data.composite_risks
      this.result.company = { ...this.result.company, ...step3.data.company }
      // KHÔNG update financialData và indicators - đã có từ Step 1 và Step 2
      
      console.log('🔍 After Step 3 merge - financialData exists:', !!this.result.financialData)
      console.log('✅ Step 3 completed:', this.result)
      this.result.step = 4
      this.loading.step3 = false // Xong step 3 → tắt loading
    },

    async retryStep(stepNum) {
      // Retry specific step
      const { symbol, year, quarter } = this.result.company
      
      try {
        this.loading = true
        this.result.stepErrors[stepNum] = null
        
        if (stepNum === 1) {
          const result = await evaluationService.loadFinancialData(symbol, year, quarter)
          if (result.success) {
            this.result.financialData = result.data
            this.result.company = result.data.company_info
            this.result.step = 2
          }
        } else if (stepNum === 2) {
          const result = await evaluationService.calculateIndicators(symbol, year, quarter)
          if (result.success) {
            this.result.indicators = result.data.indicators
            this.result.step = 3
          }
        } else if (stepNum === 3) {
          const result = await evaluationService.evaluateRisk(symbol, year, quarter)
          if (result.success) {
            this.result = { ...this.result, ...result.data }
            this.result.step = 4
          }
        }
      } catch (error) {
        this.result.stepErrors[stepNum] = error.message
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async evaluate(symbol, year, quarter) {
      this.loading = true
      this.error = null
      this.result = null

      try {
        const response = await evaluationService.evaluate(symbol, year, quarter)
        if (response.success) {
          this.result = response.data
        } else {
          this.error = response.error
        }
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    clearResult() {
      this.result = null
      this.error = null
    }
  }
})
