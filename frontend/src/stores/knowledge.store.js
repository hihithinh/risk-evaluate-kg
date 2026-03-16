/**
 * Knowledge Store
 * State management cho Knowledge Management
 */

import { defineStore } from 'pinia'
import knowledgeService from '@/services/knowledge.service'

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    ruleTypes: [],
    currentRuleType: 'indicator',
    rules: null,
    isCustom: false,
    knowledgeGraph: null,
    loading: false,
    error: null
  }),
  
  actions: {
    async loadRuleTypes() {
      try {
        const response = await knowledgeService.getRuleTypes()
        this.ruleTypes = response.data
      } catch (error) {
        console.error('Failed to load rule types:', error)
      }
    },
    
    async loadKnowledgeGraph() {
      this.loading = true
      try {
        const response = await knowledgeService.getKnowledgeGraph()
        this.knowledgeGraph = response.data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async loadRules(type) {
      this.loading = true
      this.currentRuleType = type
      
      try {
        const response = await knowledgeService.getRules(type)
        this.rules = response.data.rules
        this.isCustom = response.data.isCustom
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async saveRules(type, rules) {
      this.loading = true
      
      try {
        await knowledgeService.saveRules(type, rules)
        this.rules = rules
        this.isCustom = true
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async restoreDefault(type) {
      this.loading = true
      
      try {
        const response = await knowledgeService.restoreDefault(type)
        this.rules = response.data.rules
        this.isCustom = false
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
