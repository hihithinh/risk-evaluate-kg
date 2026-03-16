/**
 * Format Utilities
 * Các hàm format số, ngày tháng, currency
 */

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A'
  return parseFloat(num).toFixed(decimals)
}

export function formatPercent(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A'
  return `${(num * 100).toFixed(decimals)}%`
}

export function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('vi-VN')
}

export function formatCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(num)
}

export function formatLargeNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A'
  
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
  
  return num.toFixed(2)
}
