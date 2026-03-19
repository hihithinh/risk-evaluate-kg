/**
 * Evaluation Service
 * Xử lý logic đánh giá rủi ro cho single company
 */

import { SingleSymbolInference } from '../../src/core/SingleSymbolInference.js';
import { LLMService } from './llm.service.js';
import fs from 'fs';
import path from 'path';

export class EvaluationService {
  constructor() {
    this.inference = new SingleSymbolInference();
    this.llmService = new LLMService();
  }

  /**
   * Get risk signal rules from JSON file (luật suy luận tín hiệu rủi ro)
   */
  async getIndicatorRules() {
    try {
      const rulesPath = path.join(process.cwd().replace('/server', ''), 'rules', 'risk_signal_rules.json');
      const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
      return JSON.parse(rulesContent);
    } catch (error) {
      console.error('❌ Error loading risk signal rules:', error);
      throw new Error('Failed to load risk signal rules');
    }
  }

  /**
   * Get risk label rules from JSON file (luật suy luận nhãn rủi ro)
   */
  async getCompositeRules() {
    try {
      const rulesPath = path.join(process.cwd().replace('/server', ''), 'rules', 'risk_label_rules.json');
      const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
      return JSON.parse(rulesContent);
    } catch (error) {
      console.error('❌ Error loading risk label rules:', error);
      throw new Error('Failed to load risk label rules');
    }
  }

  /**
   * Step 1: Load raw financial data + company type (NO inference)
   */
  async loadFinancialData(symbol, year, quarter) {
    try {
      // Chỉ crawl data, không chạy inference
      const crawlResult = await this.inference.crawlSymbolData(symbol, year, quarter);
      
      if (!crawlResult || !crawlResult.success) {
        throw new Error(crawlResult.error || `Không thể tải dữ liệu cho ${symbol} Q${quarter}/${year}`);
      }
      
      return {
        success: true,
        data: {
          symbol,
          year,
          quarter,
          company_type: crawlResult.company_type || 'REGULAR',
          raw_data: crawlResult.raw_data || {},
          company_info: {
            symbol,
            year,
            quarter,
            type: crawlResult.company_type || 'REGULAR'
          },
          from_cache: crawlResult.from_cache || false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Step 2: Calculate financial indicators from cache
   */
  async calculateIndicators(symbol, year, quarter) {
    try {
      // Get data from SQLite cache
      const { DataCrawler } = await import('../../src/crawler/DataCrawler.js');
      const crawler = new DataCrawler();
      const rawData = crawler.cache.get(symbol, year, quarter);
      
      if (!rawData) {
        throw new Error(`No cached data found for ${symbol} Q${quarter}/${year}`);
      }
      
      // Calculate indicators using calculation engine
      const companyType = this._detectCompanyType(symbol);
      const indicators = await this.calculateBasicIndicators(rawData, companyType);
      
      return {
        success: true,
        data: {
          indicators: indicators
        }
      };
    } catch (error) {
      console.error('❌ Step 2 error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Step 3: Evaluate risk from existing indicators
   */
  async evaluateRisk(symbol, year, quarter) {
    try {
      // Get indicators from Step 2 (cache or calculate if needed)
      const { DataCrawler } = await import('../../src/crawler/DataCrawler.js');
      const crawler = new DataCrawler();
      const rawData = crawler.cache.get(symbol, year, quarter);
      
      if (!rawData) {
        throw new Error(`No cached data found for ${symbol} Q${quarter}/${year}`);
      }
      
      // Calculate indicators if not already done
      const companyType = this._detectCompanyType(symbol);
      const indicators = await this.calculateBasicIndicators(rawData, companyType);
      
      // Evaluate risk using risk evaluation engine
      const riskAssessment = await this.evaluateRiskFromIndicators(indicators, symbol);
      
      // Run Phase 4 composite inference directly on evaluations
      let compositeResult;
      try {
        const { CompositeInferer } = await import('../../src/phases/Phase4CompositeInference.js');
        const path = await import('path');
        const compositeRulesPath = path.join(process.cwd().replace('/server', ''), 'rules', 'risk_label_rules.json');
        const compositeInferer = new CompositeInferer(compositeRulesPath, true);
        
        // Convert indicators to evaluations format for Phase 4
        const evaluations = {};
        for (const factor of riskAssessment.risk_factors) {
          evaluations[factor.indicator] = {
            risk_level: factor.risk_level,
            risk_point: factor.risk_point,
            risk_type: factor.risk_type,
            explanation: factor.explanation
          };
        }
        
        compositeResult = compositeInferer.infer(evaluations);
      } catch (error) {
        console.error('❌ Error running composite inference:', error);
        compositeResult = { 
          composite_risks: [],
          inference_stats: { error: error.message }
        };
      }
      
      // Combine Phase 3 and Phase 4 inference logs
      const phase4Logs = (compositeResult.inference_trace || []).map(log => ({
        ...log,
        phase: 4
      }));
      
      const combinedInferenceLogs = [
        ...(riskAssessment.phase3_inference_logs || []),
        ...phase4Logs
      ];
      
      // Use core's final score calculation (from ForwardChainer)
      const finalScore = compositeResult.final_score || {};
      
      const uiResult = {
        company: {
          symbol,
          year,
          quarter,
          type: this._detectCompanyType(symbol)
        },
        indicators: indicators,
        risk_assessment: {
          ...riskAssessment,
          // Use final score from core inference engine
          risk_score: finalScore.total_risk_points || riskAssessment.risk_score,
          risk_level: finalScore.risk_level || riskAssessment.risk_level,
          // Keep Phase 3 scores for reference
          phase3_risk_score: finalScore.indicator_risk_points || riskAssessment.risk_score,
          phase3_risk_level: riskAssessment.risk_level,
          // Phase 4 composite points
          composite_risk_points: finalScore.composite_risk_points || 0,
          // Max points info
          max_indicator_points: finalScore.max_indicator_points,
          max_composite_points: finalScore.max_composite_points,
          max_total_points: finalScore.max_total_points,
          // Thresholds for UI tooltip
          thresholds: finalScore.thresholds
        },
        inference_stats: {
          total_indicators: indicators.length,
          evaluation_time: new Date().toISOString(),
          phase3_evaluations: riskAssessment.phase3_inference_logs?.length || 0,
          phase4_iterations: compositeResult.inference_stats?.iterations || 0,
          phase4_rules_fired: compositeResult.inference_stats?.rules_fired || 0,
          inference_log: combinedInferenceLogs,
          total_facts: compositeResult.inference_stats?.total_facts,
          composite_risks_count: compositeResult.inference_stats?.composite_risks_count,
          error: compositeResult.inference_stats?.error
        },
        composite_risks: compositeResult.composite_risks || []
      };
      

      // Generate LLM explanation
      try {
        const llmContext = {
          company: {
            symbol,
            year,
            quarter
          },
          companyType: this._detectCompanyType(symbol),
          rawData: rawData,
          indicators: indicators,
          riskSignals: riskAssessment.risk_factors,
          riskLabels: compositeResult.composite_risks || [],
          riskScore: finalScore.total_risk_points || riskAssessment.risk_score,
          phase3Score: finalScore.indicator_risk_points || riskAssessment.risk_score,
          phase4Score: finalScore.composite_risk_points || 0,
          overallRiskLevel: finalScore.risk_level || riskAssessment.risk_level,
          thresholds: finalScore.thresholds || { good_max: 9, medium_min: 10, medium_max: 19, risky_min: 20 },
          inferenceLogs: combinedInferenceLogs
        };

        const llmResult = await this.llmService.generateRiskExplanation(llmContext);
        uiResult.llm_explanation = llmResult;
        
        if (llmResult.enabled && !llmResult.error) {
        } else if (llmResult.error) {
        } else {
        }
      } catch (llmError) {
        console.error('❌ Error generating LLM explanation:', llmError);
        uiResult.llm_explanation = {
          enabled: false,
          error: llmError.message
        };
      }

      return {
        success: true,
        data: uiResult
      };
    } catch (error) {
      console.error('❌ Step 3 error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Evaluate risk cho một company (legacy - full evaluation)
   */
  async evaluateCompany(symbol, year, quarter) {
    try {
      const result = await this.inference.infer(symbol, year, quarter);
      const uiResult = this.inference.formatForUI(result);

      return {
        success: true,
        data: uiResult
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available tickers
   */
  async getAvailableTickers() {
    // Default tickers từ crawler
    return [
      "ACB", "BCM", "BID", "BVH", "CTG", "FPT", "GAS", "GVR", "HDB", "HPG",
      "MBB", "MSN", "MWG", "PLX", "POW", "SAB", "SSI", "STB", "TCB", "TPB",
      "VCB", "VHM", "VIB", "VIC", "VJC", "VNM", "VPB", "VRE", "VND", "VIX",
      "DXG", "DIG", "NLG", "KDH", "PDR", "NVL", "HDG", "CEO", "SCR", "HDC",
      "PNJ", "HCM", "VCI", "BSI", "SHS", "CTS", "FTS", "AGR", "MBS", "BVS"
    ];
  }

  /**
   * Get latest available quarter and year
   * Báo cáo tài chính thường delay 1-2 tháng sau khi kết thúc quý
   */
  getCurrentPeriod() {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1; // 1-12
    
    // Tính quý hiện tại
    let quarter = Math.ceil(month / 3);
    
    // Delay 2 tháng: nếu chưa qua tháng thứ 2 của quý tiếp theo thì lùi về quý trước
    // VD: Tháng 4 (Q2) thì báo cáo Q1 mới có
    // Tháng 1-2 → Q4 năm trước
    // Tháng 3 → Q4 năm trước (Q1 chưa có)
    // Tháng 4-5 → Q1 năm nay
    // Tháng 6-8 → Q2 năm nay
    // Tháng 9-11 → Q3 năm nay
    // Tháng 12 → Q3 năm nay (Q4 chưa có)
    
    const quarterStartMonth = (quarter - 1) * 3 + 1;
    const monthsSinceQuarterStart = month - quarterStartMonth;
    
    // Nếu chưa qua 2 tháng kể từ đầu quý hiện tại → lùi về quý trước
    // Tháng 1,2,3 của Q1 → Q4 năm trước (Q1 chưa có báo cáo)
    // Tháng 4,5 của Q2 → Q1 năm nay
    // Tháng 7,8 của Q3 → Q2 năm nay
    // Tháng 10,11 của Q4 → Q3 năm nay
    // Tháng 12 của Q4 → Q3 năm nay (Q4 chưa có)
    if (monthsSinceQuarterStart <= 1 || (quarter === 1 && month === 3)) {
      quarter = quarter - 1;
      if (quarter === 0) {
        quarter = 4;
        year = year - 1;
      }
    }

    return { year, quarter };
  }

  /**
   * Calculate financial indicators using calculation engine
   */
  async calculateBasicIndicators(rawData, companyType = 'BANK') {
    try {
      
      // Import calculation engine
      const { IndicatorCalculatorV2 } = await import('../../src/phases/Phase2IndicatorCalculationV2.js');
      const calculator = new IndicatorCalculatorV2();
      
      // Prepare company data for calculation engine
      const companyData = {
        ticker: rawData.symbol || rawData.ticker,
        ...rawData // Spread all financial data directly
      };
      
      // Calculate indicators using engine
      const results = calculator.calculateAll(companyData);
      
      
      // Convert to API format
      const indicators = [];
      
      // Calculation engine returns flat object: { A1: 1.17, A2: 0.008, ... }
      // Not nested structure like { indicators: {...} }
      
      
      for (const [code, value] of Object.entries(results)) {
        // Skip non-indicator properties
        if (['summary', 'indicator_names', 'company'].includes(code)) {
          continue;
        }
        
        if (value !== null && value !== undefined && !isNaN(value)) {
          indicators.push({
            code: code,
            name: this._getIndicatorName(code),
            value: typeof value === 'number' ? value.toFixed(4) : value,
            unit: this._getIndicatorUnit(code),
            description: this._getIndicatorName(code),
            calculation_method: await this._getCalculationMethod(code, companyType),
            explanation: await this._getIndicatorExplanation(code, companyType)
          });
        } else {
        }
      }
      
      return indicators;
      
    } catch (error) {
      console.error('❌ Error in calculation engine:', error);
      throw error; // Let the error propagate up
    }
  }

  /**
   * Detect company type from symbol
   */
  _detectCompanyType(symbol) {
    const bankSymbols = ['ACB', 'BID', 'CTG', 'HDB', 'MBB', 'STB', 'TCB', 'TPB', 'VCB', 'VIB'];
    const securitiesSymbols = ['SSI', 'VND', 'VCI', 'BSI', 'SHS', 'HCM', 'FTS'];
    
    
    if (bankSymbols.includes(symbol)) {
      return 'BANK';
    } else if (securitiesSymbols.includes(symbol)) {
      return 'SECURITIES';
    } else {
      return 'REGULAR';
    }
  }
  
  /**
   * Get unit for indicator
   */
  _getIndicatorName(code) {
    const names = {
      'A1': 'Current Ratio',
      'A2': 'Quick Ratio', 
      'A3': 'Cash Ratio',
      'B1': 'Debt Ratio',
      'B2': 'Debt to Equity',
      'B3': 'Equity Multiplier',
      'C1': 'Inventory Turnover',
      'C2': 'Receivables Turnover',
      'C3': 'Asset Turnover',
      'D1': 'Gross Profit Margin',
      'D2': 'Operating Profit Margin',
      'D3': 'ROE'
    };
    return names[code] || code;
  }
  
  async _getCalculationMethod(code, companyType = 'BANK') {
    try {
      // Try storage/app/rules first (priority)
      const fs = await import('fs');
      const path = await import('path');
      
      const storageRulesPath = path.join(process.cwd().replace('/server', ''), 'storage', 'app', 'rules', 'indicator_rules.json');
      const defaultRulesPath = path.join(process.cwd().replace('/server', ''), 'rules', 'indicator_rules.json');
      
      let rulesPath = storageRulesPath;
      if (!fs.existsSync(storageRulesPath)) {
        rulesPath = defaultRulesPath;
      }
      
      const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
      const rulesData = JSON.parse(rulesContent);
      const rules = rulesData.indicator_rules || rulesData.calculation_rules;
      
      // Find rule for this indicator and company type
      const rule = rules.find(r => r.indicator === code && r.company_type === companyType);
      
      if (rule && rule.calculation) {
        const { numerator, denominator, operation } = rule.calculation;
        
        // Build calculation description
        let numeratorDesc = this._getFieldDescription(numerator);
        let denominatorDesc = this._getFieldDescription(denominator);
        let operationDesc = this._getOperationDescription(operation);
        
        return `${numeratorDesc} ${operationDesc} ${denominatorDesc}`;
      }
      
      return 'N/A';
    } catch (error) {
      console.error('❌ Error getting calculation method:', error);
      return 'N/A';
    }
  }
  
  async _getIndicatorExplanation(code, companyType = 'BANK') {
    try {
      // Try storage/app/rules first (priority)
      const fs = await import('fs');
      const path = await import('path');
      
      const storageRulesPath = path.join(process.cwd().replace('/server', ''), 'storage', 'app', 'rules', 'indicator_rules.json');
      const defaultRulesPath = path.join(process.cwd().replace('/server', ''), 'rules', 'indicator_rules.json');
      
      let rulesPath = storageRulesPath;
      if (!fs.existsSync(storageRulesPath)) {
        rulesPath = defaultRulesPath;
      }
      
      const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
      const rulesData = JSON.parse(rulesContent);
      const rules = rulesData.indicator_rules || rulesData.calculation_rules;
      
      // Find rule for this indicator and company type
      const rule = rules.find(r => r.indicator === code && r.company_type === companyType);
      
      return rule?.description || 'N/A';
    } catch (error) {
      console.error('❌ Error getting indicator explanation:', error);
      return 'N/A';
    }
  }
  
  _getFieldDescription(field) {
    if (field.field) {
      return field.field;
    } else if (field.operation && field.operands) {
      const operandDescs = field.operands.map(op => this._getFieldDescription(op));
      const operation = field.operation === 'add' ? '+' : 
                      field.operation === 'subtract' ? '-' : 
                      field.operation === 'multiply' ? '×' : '÷';
      return `(${operandDescs.join(` ${operation} `)})`;
    }
    return 'Unknown';
  }
  
  _getOperationDescription(operation) {
    switch (operation) {
      case 'divide': return '÷';
      case 'multiply': return '×';
      case 'add': return '+';
      case 'subtract': return '-';
      default: return operation;
    }
  }
  
  _getIndicatorUnit(indicatorCode) {
    // Return appropriate unit based on indicator type
    switch (indicatorCode.charAt(0)) {
      case 'A': // Liquidity ratios
        return '';
      case 'B': // Leverage ratios  
        return '';
      case 'C': // Efficiency ratios
        return '';
      case 'D': // Profitability ratios
        return '%';
      default:
        return '';
    }
  }

  /**
   * Evaluate risk from indicators using risk evaluation engine
   */
  async evaluateRiskFromIndicators(indicators, symbol) {
    try {
      
      // Import risk evaluation engine
      const { RiskEvaluator } = await import('../../src/phases/Phase3RiskEvaluation.js');
      const path = await import('path');
      const rulesPath = path.join(process.cwd().replace('/server', ''), 'rules', 'risk_signal_rules.json');
      const riskEvaluator = new RiskEvaluator(rulesPath);
      
      // Evaluate each indicator and create Phase 3 inference logs
      const riskFactors = [];
      const phase3InferenceLogs = [];
      let totalRiskScore = 0;
      let riskLevelCounts = { Good: 0, Medium: 0, Risky: 0 };
      
      for (const indicator of indicators) {
        const value = parseFloat(indicator.value);
        const riskResult = riskEvaluator.evaluateIndicator(indicator.code, value);
        
        if (riskResult) {
          riskFactors.push({
            indicator: indicator.code,
            name: indicator.name,
            value: indicator.value,
            risk_level: riskResult.risk_level,
            risk_point: riskResult.risk_point,
            risk_type: riskResult.risk_type,
            explanation: riskResult.explanation
          });
          
          // Create Phase 3 inference log entry
          phase3InferenceLogs.push({
            phase: 3,
            stepId: `phase3_${indicator.code}`,
            ruleId: `EVAL_${indicator.code}`,
            ruleDescription: `Đánh giá rủi ro cho chỉ số ${indicator.name}`,
            inputFacts: [`indicator_${indicator.code}`],
            inputData: {
              code: indicator.code,
              name: indicator.name,
              value: value
            },
            outputFacts: [`risk_signal_${indicator.code}`],
            outputData: {
              risk_level: riskResult.risk_level,
              risk_point: riskResult.risk_point,
              risk_type: riskResult.risk_type
            },
            explanation: `Chỉ số ${indicator.name} có giá trị ${value}. ${riskResult.explanation}`,
            timestamp: new Date().toISOString()
          });
          
          totalRiskScore += riskResult.risk_point || 0;
          riskLevelCounts[riskResult.risk_level] = (riskLevelCounts[riskResult.risk_level] || 0) + 1;
          
        }
      }
      
      // Determine overall risk level
      let overallRiskLevel = 'Good';
      if (riskLevelCounts.Risky >= 3 || totalRiskScore >= 6) {
        overallRiskLevel = 'Risky';
      } else if (riskLevelCounts.Risky >= 1 || riskLevelCounts.Medium >= 4 || totalRiskScore >= 3) {
        overallRiskLevel = 'Medium';
      }
      
      // Generate recommendations
      const recommendations = this._generateRecommendations(riskFactors, overallRiskLevel);
      
      const riskAssessment = {
        risk_level: overallRiskLevel,
        risk_score: totalRiskScore,
        risk_factors: riskFactors,
        risk_level_counts: riskLevelCounts,
        recommendations: recommendations,
        evaluation_time: new Date().toISOString(),
        phase3_inference_logs: phase3InferenceLogs
      };
      
      return riskAssessment;
      
    } catch (error) {
      console.error('❌ Error in risk evaluation:', error);
      throw error;
    }
  }
  
  /**
   * Generate recommendations based on risk factors
   */
  _generateRecommendations(riskFactors, overallRiskLevel) {
    const recommendations = [];
    
    if (overallRiskLevel === 'Risky') {
      recommendations.push('Cần xem xét lại toàn bộ cấu trúc tài chính và hoạt động kinh doanh');
    }
    
    if (overallRiskLevel === 'Medium' || overallRiskLevel === 'Risky') {
      const highRiskFactors = riskFactors.filter(f => f.risk_level === 'Risky');
      if (highRiskFactors.length > 0) {
        recommendations.push(`Cần chú ý các chỉ số rủi ro cao: ${highRiskFactors.map(f => f.name).join(', ')}`);
      }
    }
    
    // Specific recommendations by risk type
    const liquidityRisks = riskFactors.filter(f => f.risk_type === 'liquidity_risk');
    if (liquidityRisks.length > 0) {
      recommendations.push('Cần cải thiện khả năng thanh khoản và quản lý dòng tiền');
    }
    
    const leverageRisks = riskFactors.filter(f => f.risk_type && f.risk_type.includes('leverage'));
    if (leverageRisks.length > 0) {
      recommendations.push('Cần xem xét lại cấu trúc vốn và giảm đòn bẩy tài chính');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Tình hình tài chính tương đối ổn định');
    }
    
    return recommendations;
  }
}
