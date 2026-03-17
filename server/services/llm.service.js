/**
 * LLM Service
 * Generate natural language explanations for risk assessments using OpenAI
 */

import OpenAI from 'openai';
import { openaiConfig, isOpenAIEnabled } from '../configs/openai.config.js';

export class LLMService {
  constructor() {
    this.enabled = isOpenAIEnabled();
    if (this.enabled) {
      this.client = new OpenAI({
        apiKey: openaiConfig.apiKey,
      });
    }
  }

  /**
   * Generate comprehensive risk explanation using LLM
   * @param {Object} context - All available information for risk assessment
   * @returns {Promise<Object>} - LLM-generated explanation
   */
  async generateRiskExplanation(context) {
    if (!this.enabled) {
      return {
        enabled: false,
        explanation: null,
        recommendations: null
      };
    }

    try {
      const prompt = this._buildPrompt(context);
      
      console.log('🤖 Calling OpenAI API for risk explanation...');
      const response = await this.client.chat.completions.create({
        model: openaiConfig.model,
        messages: [
          {
            role: 'system',
            content: this._getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: openaiConfig.temperature,
        max_tokens: openaiConfig.maxTokens,
      });

      const content = response.choices[0].message.content;
      console.log('✅ OpenAI response received');

      // Parse the response to extract explanation and recommendations
      const parsed = this._parseResponse(content);

      return {
        enabled: true,
        raw_response: content,
        ...parsed,
        usage: {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens
        }
      };

    } catch (error) {
      console.error('❌ Error calling OpenAI API:', error.message);
      return {
        enabled: true,
        error: error.message,
        explanation: null,
        recommendations: null
      };
    }
  }

  /**
   * Build system prompt for the LLM
   */
  _getSystemPrompt() {
    return `Bạn là một chuyên gia phân tích tài chính và tư vấn đầu tư với nhiều năm kinh nghiệm. 
Nhiệm vụ của bạn là phân tích rủi ro tài chính của doanh nghiệp và đưa ra khuyến nghị cho NHÀ ĐẦU TƯ.

Hãy phân tích dựa trên:
1. Các chỉ số tài chính và mức độ rủi ro của từng chỉ số
2. Các rủi ro phức hợp được phát hiện từ việc kết hợp nhiều tín hiệu
3. Điểm rủi ro tổng thể và mức độ rủi ro

Yêu cầu:
- Giải thích bằng tiếng Việt, ngôn ngữ tự nhiên, dễ hiểu
- Tránh thuật ngữ kỹ thuật phức tạp, nếu dùng thì giải thích ngắn gọn
- Đưa ra phân tích cụ thể dựa trên số liệu thực tế
- Sử dụng markdown formatting (**, ##, ###, -, 1., 2., etc.) để format text
- Khuyến nghị phải hướng tới NHÀ ĐẦU TƯ (nên mua/bán/giữ, mức độ rủi ro đầu tư, chiến lược đầu tư)

Cấu trúc trả lời:
## Tổng quan
[Mô tả tổng quan tình hình tài chính của doanh nghiệp và ý nghĩa với nhà đầu tư]

## Phân tích chi tiết
[Phân tích các vấn đề chính được phát hiện, giải thích tại sao các chỉ số lại ở mức rủi ro đó và tác động đến giá trị đầu tư]

## Khuyến nghị
[Đưa ra 3-5 khuyến nghị cụ thể cho nhà đầu tư: nên đầu tư hay không, mức độ rủi ro, chiến lược phù hợp, thời điểm vào/ra, v.v.]`;
  }

  /**
   * Build detailed prompt with all context information
   */
  _buildPrompt(context) {
    const {
      company,
      companyType,
      rawData,
      indicators,
      riskSignals,
      riskLabels,
      riskScore,
      phase3Score,
      phase4Score,
      overallRiskLevel,
      thresholds,
      inferenceLogs
    } = context;

    let prompt = `# THÔNG TIN DOANH NGHIỆP\n`;
    prompt += `- Mã chứng khoán: ${company.symbol}\n`;
    prompt += `- Kỳ báo cáo: Quý ${company.quarter}/${company.year}\n`;
    prompt += `- Loại hình: ${this._getCompanyTypeDescription(companyType)}\n\n`;

    // Financial data summary
    if (rawData && Object.keys(rawData).length > 0) {
      prompt += `# DỮ LIỆU TÀI CHÍNH CHỦ YẾU\n`;
      const keyFields = [
        'TOTAL ASSETS (Bn. VND)',
        'TOTAL LIABILITIES (Bn. VND)',
        'Revenue (Bn. VND)',
        'Net Profit For the Year',
        'Cash and cash equivalents'
      ];
      
      for (const field of keyFields) {
        if (rawData[field] !== undefined) {
          prompt += `- ${field}: ${this._formatNumber(rawData[field])}\n`;
        }
      }
      prompt += `\n`;
    }

    // Indicators with risk assessment
    prompt += `# CHỈ SỐ TÀI CHÍNH VÀ ĐÁNH GIÁ RỦI RO\n`;
    if (indicators && indicators.length > 0) {
      const groups = {
        'A': 'Khả năng thanh khoản',
        'B': 'Đòn bẩy tài chính',
        'C': 'Hiệu quả hoạt động',
        'D': 'Khả năng sinh lời'
      };

      for (const [prefix, groupName] of Object.entries(groups)) {
        const groupIndicators = indicators.filter(ind => ind.code.startsWith(prefix));
        if (groupIndicators.length > 0) {
          prompt += `\n## ${groupName}\n`;
          for (const ind of groupIndicators) {
            const signal = riskSignals?.find(s => s.indicator === ind.code);
            prompt += `- ${ind.code} (${ind.name}): ${ind.value}${ind.unit}\n`;
            prompt += `  Công thức: ${ind.calculation_method}\n`;
            if (signal) {
              prompt += `  Mức rủi ro: ${signal.risk_level} (${signal.risk_point} điểm)\n`;
              prompt += `  Giải thích: ${signal.explanation}\n`;
            }
          }
        }
      }
    }

    // Risk labels (composite risks)
    if (riskLabels && riskLabels.length > 0) {
      prompt += `\n# RỦI RO PHỨC HỢP ĐƯỢC PHÁT HIỆN\n`;
      for (const risk of riskLabels) {
        prompt += `\n## ${risk.description}\n`;
        prompt += `- Mức độ: ${risk.severity === 'high' ? 'Nghiêm trọng' : risk.severity === 'medium' ? 'Trung bình' : 'Thấp'}\n`;
        prompt += `- Loại rủi ro: ${risk.risk_type}\n`;
        prompt += `- Điểm rủi ro: +${risk.risk_point}\n`;
        prompt += `- Chi tiết: ${risk.explanation}\n`;
      }
    }

    // Overall assessment with threshold explanation
    prompt += `\n# ĐÁNH GIÁ TỔNG QUAN\n`;
    prompt += `- Mức độ rủi ro: ${overallRiskLevel}\n`;
    prompt += `- Điểm rủi ro tổng: ${riskScore} điểm\n`;
    if (phase3Score !== undefined && phase4Score !== undefined) {
      prompt += `  + Từ tín hiệu rủi ro (Phase 3): ${phase3Score} điểm\n`;
      prompt += `  + Từ nhãn rủi ro (Phase 4): ${phase4Score} điểm\n`;
    }
    
    // Add threshold explanation
    if (thresholds) {
      prompt += `\n## Ngưỡng phân loại rủi ro\n`;
      prompt += `- **Good (Tốt)**: < ${thresholds.medium_min} điểm - Doanh nghiệp có tình hình tài chính ổn định\n`;
      prompt += `- **Medium (Trung bình)**: ${thresholds.medium_min}-${thresholds.medium_max} điểm - Có một số rủi ro cần theo dõi\n`;
      prompt += `- **High (Cao)**: ≥ ${thresholds.high_min} điểm - Có nhiều rủi ro nghiêm trọng, cần thận trọng\n`;
      prompt += `\n**Giải thích**: Với ${riskScore} điểm, doanh nghiệp được xếp vào mức "${overallRiskLevel}" vì điểm rủi ro ${riskScore >= thresholds.high_min ? `≥ ${thresholds.high_min}` : riskScore >= thresholds.medium_min ? `nằm trong khoảng ${thresholds.medium_min}-${thresholds.medium_max}` : `< ${thresholds.medium_min}`}.\n`;
    }
    
    if (riskSignals) {
      const highRisks = riskSignals.filter(s => s.risk_level === 'High').length;
      const mediumRisks = riskSignals.filter(s => s.risk_level === 'Medium').length;
      const goodRisks = riskSignals.filter(s => s.risk_level === 'Good').length;
      prompt += `\n- Phân bố tín hiệu: ${highRisks} chỉ số rủi ro cao, ${mediumRisks} chỉ số rủi ro trung bình, ${goodRisks} chỉ số tốt\n`;
    }

    prompt += `\n---\n\nDựa trên các thông tin trên, hãy phân tích tình hình tài chính của doanh nghiệp ${company.symbol} và đưa ra khuyến nghị đầu tư cho nhà đầu tư. Hãy sử dụng markdown formatting để làm nổi bật các điểm quan trọng.`;

    return prompt;
  }

  /**
   * Parse LLM response to extract structured data
   */
  _parseResponse(content) {
    // Try to extract sections
    const sections = {
      overview: '',
      analysis: '',
      recommendations: []
    };

    // Extract overview section
    const overviewMatch = content.match(/##\s*Tổng quan\s*\n([\s\S]*?)(?=##|$)/i);
    if (overviewMatch) {
      sections.overview = overviewMatch[1].trim();
    }

    // Extract analysis section
    const analysisMatch = content.match(/##\s*Phân tích chi tiết\s*\n([\s\S]*?)(?=##|$)/i);
    if (analysisMatch) {
      sections.analysis = analysisMatch[1].trim();
    }

    // Extract recommendations section
    const recommendationsMatch = content.match(/##\s*Khuyến nghị\s*\n([\s\S]*?)$/i);
    if (recommendationsMatch) {
      const recText = recommendationsMatch[1].trim();
      // Split by numbered list or bullet points
      const recs = recText.split(/\n(?=\d+\.|\-|\*)/);
      sections.recommendations = recs
        .map(r => r.replace(/^\d+\.\s*|\-\s*|\*\s*/, '').trim())
        .filter(r => r.length > 0);
    }

    return {
      explanation: content,
      overview: sections.overview,
      detailed_analysis: sections.analysis,
      ai_recommendations: sections.recommendations
    };
  }

  /**
   * Get company type description in Vietnamese
   */
  _getCompanyTypeDescription(type) {
    const descriptions = {
      'BANK': 'Ngân hàng',
      'SECURITIES': 'Công ty chứng khoán',
      'REGULAR': 'Doanh nghiệp thường'
    };
    return descriptions[type] || type;
  }

  /**
   * Format number for display
   */
  _formatNumber(value) {
    if (value === null || value === undefined) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('vi-VN');
  }
}
