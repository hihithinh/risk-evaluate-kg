/**
 * Batch Phase 2: Statistical Validation
 * Cronbach's Alpha, Descriptive Statistics, Correlation Analysis
 * Tương đương với pipeline/2_cronbach_validation/cronbach.py
 */

export class StatisticalValidator {
  constructor() {
    this.groups = {
      A: ['A1', 'A2', 'A3'],
      B: ['B1', 'B2', 'B3'],
      C: ['C1', 'C2', 'C3'],
      D: ['D1', 'D2', 'D3']
    };
  }

  /**
   * Tính Cronbach's alpha cho một nhóm biến
   * Formula: alpha = k/(k-1) * (1 - sum(variance từng biến) / variance của tổng điểm)
   */
  cronbachAlpha(data, columns) {
    const k = columns.length;
    
    if (k < 2) {
      return null;
    }

    // Lọc rows có đủ data cho tất cả columns
    const validRows = data.filter(row => {
      return columns.every(col => {
        const val = parseFloat(row[col]);
        return !isNaN(val) && val !== null && val !== undefined;
      });
    });

    if (validRows.length === 0) {
      return null;
    }

    // Tính variance của từng biến
    const itemVariances = columns.map(col => this._variance(validRows, col));
    const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);

    // Tính tổng điểm của từng row
    const totalScores = validRows.map(row => {
      return columns.reduce((sum, col) => sum + parseFloat(row[col]), 0);
    });

    // Tính variance của tổng điểm
    const totalVariance = this._varianceArray(totalScores);

    if (totalVariance === 0) {
      return null;
    }

    const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
    return alpha;
  }

  /**
   * Tính variance của một column
   */
  _variance(data, column) {
    const values = data.map(row => parseFloat(row[column]));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1); // ddof=1
  }

  /**
   * Tính variance của một array
   */
  _varianceArray(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  }

  /**
   * Tính corrected item-total correlation
   */
  correctedItemTotalCorrelation(data, columns) {
    const result = {};

    for (const col of columns) {
      const otherCols = columns.filter(c => c !== col);
      
      // Lọc valid rows
      const validRows = data.filter(row => {
        return columns.every(c => {
          const val = parseFloat(row[c]);
          return !isNaN(val) && val !== null;
        });
      });

      if (validRows.length === 0) {
        result[col] = null;
        continue;
      }

      // Tính tổng của các biến còn lại
      const itemValues = validRows.map(row => parseFloat(row[col]));
      const otherTotals = validRows.map(row => {
        return otherCols.reduce((sum, c) => sum + parseFloat(row[c]), 0);
      });

      // Tính correlation
      result[col] = this._correlation(itemValues, otherTotals);
    }

    return result;
  }

  /**
   * Tính correlation giữa 2 arrays
   */
  _correlation(x, y) {
    const n = x.length;
    if (n === 0) return null;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumSqX += dx * dx;
      sumSqY += dy * dy;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);
    if (denominator === 0) return null;

    return numerator / denominator;
  }

  /**
   * Tính alpha nếu loại từng biến
   */
  alphaIfItemDeleted(data, columns) {
    const result = {};

    for (const col of columns) {
      const reducedCols = columns.filter(c => c !== col);
      result[col] = this.cronbachAlpha(data, reducedCols);
    }

    return result;
  }

  /**
   * Diễn giải alpha
   */
  interpretAlpha(alpha) {
    if (alpha === null || isNaN(alpha)) {
      return 'Không tính được';
    } else if (alpha >= 0.9) {
      return 'Rất tốt';
    } else if (alpha >= 0.8) {
      return 'Tốt';
    } else if (alpha >= 0.7) {
      return 'Chấp nhận được';
    } else if (alpha >= 0.6) {
      return 'Tạm chấp nhận';
    } else {
      return 'Không đạt độ tin cậy';
    }
  }

  /**
   * Tính descriptive statistics
   */
  descriptiveStats(data, columns) {
    const stats = {};

    for (const col of columns) {
      const values = data
        .map(row => parseFloat(row[col]))
        .filter(v => !isNaN(v) && v !== null);

      if (values.length === 0) {
        stats[col] = {
          count: 0,
          mean: null,
          std: null,
          min: null,
          max: null,
          median: null,
          variance: null,
          missing_count: data.length,
          missing_percent: 100
        };
        continue;
      }

      values.sort((a, b) => a - b);

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = this._varianceArray(values);
      const std = Math.sqrt(variance);

      stats[col] = {
        count: values.length,
        mean: mean,
        std: std,
        min: values[0],
        max: values[values.length - 1],
        median: this._median(values),
        variance: variance,
        missing_count: data.length - values.length,
        missing_percent: ((data.length - values.length) / data.length * 100).toFixed(2)
      };
    }

    return stats;
  }

  /**
   * Tính median
   */
  _median(sortedValues) {
    const n = sortedValues.length;
    if (n === 0) return null;
    
    const mid = Math.floor(n / 2);
    if (n % 2 === 0) {
      return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
    } else {
      return sortedValues[mid];
    }
  }

  /**
   * Chạy validation cho toàn bộ dataset
   */
  validate(data) {
    console.log('\n=== Batch Phase 2: Statistical Validation ===');

    const allColumns = Object.values(this.groups).flat();

    // Descriptive statistics
    const descriptiveStats = this.descriptiveStats(data, allColumns);

    // Cronbach analysis cho từng nhóm
    const cronbachResults = [];
    const itemAnalysis = [];

    for (const [latentVar, cols] of Object.entries(this.groups)) {
      const alpha = this.cronbachAlpha(data, cols);
      const itemTotalCorr = this.correctedItemTotalCorrelation(data, cols);
      const alphaDeleted = this.alphaIfItemDeleted(data, cols);

      const validRows = data.filter(row => {
        return cols.every(col => {
          const val = parseFloat(row[col]);
          return !isNaN(val) && val !== null;
        });
      });

      cronbachResults.push({
        latent_variable: latentVar,
        observed_variables: cols.join(', '),
        n_items: cols.length,
        n_samples: validRows.length,
        cronbach_alpha: alpha !== null ? alpha.toFixed(6) : 'N/A',
        interpretation: this.interpretAlpha(alpha),
        reliable_for_measurement: alpha >= 0.7 ? 'Yes' : 'No'
      });

      for (const item of cols) {
        itemAnalysis.push({
          latent_variable: latentVar,
          item: item,
          corrected_item_total_correlation: itemTotalCorr[item] !== null ? itemTotalCorr[item].toFixed(6) : 'N/A',
          alpha_if_item_deleted: alphaDeleted[item] !== null ? alphaDeleted[item].toFixed(6) : 'N/A',
          item_status: itemTotalCorr[item] >= 0.3 ? 'Keep' : 'Consider removing'
        });
      }
    }

    // In kết quả
    console.log('\nCronbach\'s Alpha Results:');
    for (const result of cronbachResults) {
      console.log(`  ${result.latent_variable}: α = ${result.cronbach_alpha} (${result.interpretation})`);
    }

    // Generate report before returning (uses full data)
    const report = this.generateReport({
      cronbach_results: cronbachResults,
      item_analysis: itemAnalysis,
      n_samples: data.length
    });

    // Return only essential data for frontend
    return {
      cronbach_results: cronbachResults,
      n_samples: data.length,
      // Store full data internally for report generation if needed
      _internal: {
        descriptive_stats: descriptiveStats,
        item_analysis: itemAnalysis,
        report: report
      }
    };
  }

  /**
   * Export kết quả ra text
   */
  generateReport(validationResult) {
    const lines = [];
    lines.push('STATISTICAL VALIDATION REPORT');
    lines.push('='.repeat(80));
    lines.push(`Total samples: ${validationResult.n_samples}`);
    lines.push('');

    for (const result of validationResult.cronbach_results) {
      lines.push(`Group ${result.latent_variable}`);
      lines.push('-'.repeat(40));
      lines.push(`Observed variables: ${result.observed_variables}`);
      lines.push(`Cronbach's alpha: ${result.cronbach_alpha}`);
      lines.push(`Interpretation: ${result.interpretation}`);
      lines.push(`Reliable for measurement: ${result.reliable_for_measurement}`);
      lines.push('');

      const items = validationResult.item_analysis.filter(
        item => item.latent_variable === result.latent_variable
      );

      for (const item of items) {
        lines.push(
          `  ${item.item}: ` +
          `CITC = ${item.corrected_item_total_correlation}, ` +
          `α if deleted = ${item.alpha_if_item_deleted}, ` +
          `Status = ${item.item_status}`
        );
      }
      lines.push('');
    }

    lines.push('Guidelines:');
    lines.push('- Cronbach\'s alpha >= 0.7: Acceptable reliability');
    lines.push('- CITC >= 0.3: Item is appropriate');
    lines.push('- If α_deleted > current α significantly, consider removing item');

    return lines.join('\n');
  }
}
