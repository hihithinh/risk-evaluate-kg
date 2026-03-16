<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <router-link to="/" class="text-green-600 hover:underline mb-4 inline-block">← Back to Dashboard</router-link>
        <h1 class="text-4xl font-bold text-gray-900">Bulk Evaluation</h1>
        <p class="text-gray-600 mt-2">Đánh giá rủi ro cho nhiều công ty từ file CSV</p>
      </div>
      
      <!-- Step Indicator -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center" :class="currentStep >= 0 ? 'text-green-600' : 'text-gray-400'">
            <div class="w-8 h-8 rounded-full flex items-center justify-center" 
              :class="currentStep >= 0 ? 'bg-green-600 text-white' : 'bg-gray-300'">1</div>
            <span class="ml-2 font-medium">Upload CSV</span>
          </div>
          <div class="flex-1 h-1 mx-4" :class="currentStep >= 1 ? 'bg-green-600' : 'bg-gray-300'"></div>
          
          <div class="flex items-center" :class="currentStep >= 1 ? 'text-green-600' : 'text-gray-400'">
            <div class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300'">2</div>
            <span class="ml-2 font-medium">Preview</span>
          </div>
          <div class="flex-1 h-1 mx-4" :class="currentStep >= 2 ? 'bg-green-600' : 'bg-gray-300'"></div>
          
          <div class="flex items-center" :class="currentStep >= 2 ? 'text-green-600' : 'text-gray-400'">
            <div class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300'">3</div>
            <span class="ml-2 font-medium">Processing</span>
          </div>
          <div class="flex-1 h-1 mx-4" :class="currentStep >= 3 ? 'bg-green-600' : 'bg-gray-300'"></div>
          
          <div class="flex items-center" :class="currentStep >= 3 ? 'text-green-600' : 'text-gray-400'">
            <div class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300'">4</div>
            <span class="ml-2 font-medium">Results</span>
          </div>
        </div>
      </div>
      
      <!-- Step 0: Upload -->
      <div v-if="currentStep === 0" class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold">Upload CSV File</h2>
          <div class="flex gap-3">
            <button @click="downloadTemplate" class="btn-secondary">
              Download Template
            </button>
            <button @click="showHelp = true" class="btn-secondary">
              ? Help
            </button>
          </div>
        </div>
        
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <input 
            type="file" 
            ref="fileInput"
            accept=".csv"
            @change="handleFileUpload"
            class="hidden"
          >
          <div class="text-gray-600 mb-4">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="text-lg">Drag and drop your CSV file here, or</p>
          </div>
          <button @click="$refs.fileInput.click()" class="btn-primary">
            Choose File
          </button>
        </div>
      </div>
      
      <!-- Step 1: Preview -->
      <div v-if="currentStep === 1 && preview" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold mb-4">Data Preview</h2>
        <p class="text-gray-600 mb-4">{{ preview.totalRows }} rows loaded</p>
        
        <div class="overflow-x-auto mb-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b-2 border-gray-200">
                <th v-for="col in preview.columns" :key="col" class="text-left py-2 px-3">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in preview.sample" :key="idx" class="border-b border-gray-100">
                <td v-for="col in preview.columns" :key="col" class="py-2 px-3">{{ row[col] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="flex gap-3">
          <button @click="handleEvaluate" :disabled="loading" class="btn-primary">
            Start Evaluation
          </button>
          <button @click="reset" class="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
      
      <!-- Step 2: Processing -->
      <div v-if="currentStep === 2" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold mb-4">Processing...</h2>
        <div class="space-y-4">
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-3"></div>
            <span>Đang xử lý dữ liệu và tính toán chỉ số...</span>
          </div>
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-3"></div>
            <span>Đang chạy Cronbach validation...</span>
          </div>
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-3"></div>
            <span>Đang đánh giá rủi ro cho các công ty...</span>
          </div>
        </div>
      </div>
      
      <!-- Step 3: Results -->
      <div v-if="currentStep === 3 && result" class="space-y-6">
        <!-- Summary -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Evaluation Summary</h2>
          <div class="grid grid-cols-3 gap-6">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">Total Companies</div>
              <div class="text-3xl font-bold text-green-600">{{ result.results?.riskResults?.length || 0 }}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">Cronbach's Alpha</div>
              <div class="text-3xl font-bold text-green-600">
                {{ result.results?.validationResults?.cronbach_alpha?.toFixed(3) || 'N/A' }}
              </div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">Processing Time</div>
              <div class="text-3xl font-bold text-green-600">{{ processingTime }}s</div>
            </div>
          </div>
        </div>
        
        <!-- Cronbach Validation & Statistics -->
        <div v-if="result.results?.validationResults" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Statistical Validation</h2>
          
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="font-bold mb-2">Cronbach's Alpha</h3>
              <div class="text-3xl font-bold text-green-600 mb-2">
                {{ result.results.validationResults.cronbach_alpha?.toFixed(3) || 'N/A' }}
              </div>
              <p class="text-sm text-gray-600">
                {{ getCronbachInterpretation(result.results.validationResults.cronbach_alpha) }}
              </p>
            </div>
            
            <div class="border border-gray-200 rounded-lg p-4">
              <h3 class="font-bold mb-2">Data Quality</h3>
              <div class="space-y-2 text-sm">
                <p><strong>Valid Records:</strong> {{ result.results.validationResults.valid_count || 'N/A' }}</p>
                <p><strong>Total Records:</strong> {{ result.results.validationResults.total_count || 'N/A' }}</p>
                <p><strong>Completeness:</strong> {{ ((result.results.validationResults.valid_count / result.results.validationResults.total_count) * 100).toFixed(1) }}%</p>
              </div>
            </div>
          </div>
          
          <!-- Statistics Table -->
          <div v-if="result.results.validationResults.statistics">
            <h3 class="font-bold mb-3">Descriptive Statistics</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="text-left py-2 px-3">Indicator</th>
                    <th class="text-left py-2 px-3">Mean</th>
                    <th class="text-left py-2 px-3">Std Dev</th>
                    <th class="text-left py-2 px-3">Min</th>
                    <th class="text-left py-2 px-3">Max</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(stat, indicator) in result.results.validationResults.statistics" :key="indicator" class="border-b border-gray-100">
                    <td class="py-2 px-3 font-medium">{{ indicator }}</td>
                    <td class="py-2 px-3">{{ stat.mean?.toFixed(3) || 'N/A' }}</td>
                    <td class="py-2 px-3">{{ stat.std?.toFixed(3) || 'N/A' }}</td>
                    <td class="py-2 px-3">{{ stat.min?.toFixed(3) || 'N/A' }}</td>
                    <td class="py-2 px-3">{{ stat.max?.toFixed(3) || 'N/A' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <!-- Download -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Download Results</h2>
          <a :href="downloadUrl" download class="btn-primary inline-block">
            Download CSV Results
          </a>
        </div>
        
        <!-- Results Table -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Risk Evaluation Results</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b-2 border-gray-200">
                  <th class="text-left py-2 px-3">Ticker</th>
                  <th class="text-left py-2 px-3">Period</th>
                  <th class="text-left py-2 px-3">Risk Level</th>
                  <th class="text-left py-2 px-3">Risk Score</th>
                  <th class="text-left py-2 px-3">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in result.results?.riskResults?.slice(0, 20)" :key="r.ticker" class="border-b border-gray-100">
                  <td class="py-2 px-3 font-medium">{{ r.ticker }}</td>
                  <td class="py-2 px-3">Q{{ r.quarter }}/{{ r.year }}</td>
                  <td class="py-2 px-3">
                    <span class="px-2 py-1 rounded-full text-xs" :class="getRiskBadgeClass(r.final_score?.risk_level)">
                      {{ r.final_score?.risk_level || 'Unknown' }}
                    </span>
                  </td>
                  <td class="py-2 px-3">{{ (r.final_score?.risk_score * 100).toFixed(2) }}%</td>
                  <td class="py-2 px-3">{{ r.final_score?.total_risk_points }}/{{ r.final_score?.max_total_points }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <button @click="reset" class="btn-secondary">
          Start New Evaluation
        </button>
      </div>
      
      <!-- Help Modal -->
      <div v-if="showHelp" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="showHelp = false">
        <div class="bg-white rounded-lg p-8 max-w-3xl max-h-[80vh] overflow-y-auto" @click.stop>
          <h3 class="text-2xl font-bold mb-4">CSV Template Help</h3>
          <div class="space-y-4 text-gray-700">
            <div>
              <p class="font-bold mb-2">Required Fields:</p>
              <ul class="list-disc ml-6 space-y-1">
                <li><code class="bg-gray-100 px-2 py-1 rounded">symbol</code> - Mã chứng khoán (VD: ACB, VCB)</li>
                <li><code class="bg-gray-100 px-2 py-1 rounded">report</code> - Loại báo cáo: income_statement, balance_sheet, cash_flow</li>
                <li><code class="bg-gray-100 px-2 py-1 rounded">ticker</code> - Mã công ty</li>
                <li><code class="bg-gray-100 px-2 py-1 rounded">yearReport</code> - Năm báo cáo (VD: 2024)</li>
                <li><code class="bg-gray-100 px-2 py-1 rounded">lengthReport</code> - Quý (1, 2, 3, 4)</li>
              </ul>
            </div>
            
            <div>
              <p class="font-bold mb-2">Financial Fields (examples):</p>
              <ul class="list-disc ml-6 space-y-1">
                <li>Revenue - Doanh thu</li>
                <li>Assets - Tài sản</li>
                <li>Liabilities - Nợ phải trả</li>
                <li>Cash Flow - Dòng tiền</li>
                <li>Net Profit - Lợi nhuận ròng</li>
              </ul>
            </div>
            
            <div class="bg-blue-50 p-4 rounded">
              <p class="font-bold mb-2">💡 Tips:</p>
              <ul class="list-disc ml-6 space-y-1">
                <li>Mỗi dòng là một báo cáo tài chính</li>
                <li>Một công ty cần có đủ 3 loại báo cáo: income_statement, balance_sheet, cash_flow</li>
                <li>Dữ liệu phải đầy đủ để tính được các chỉ số tài chính</li>
              </ul>
            </div>
          </div>
          <button @click="showHelp = false" class="mt-6 btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBulkStore } from '@/stores/bulk.store'

const store = useBulkStore()

const fileInput = ref(null)
const showHelp = ref(false)
const processingTime = ref(0)

const currentStep = computed(() => store.currentStep)
const preview = computed(() => store.preview)
const result = computed(() => store.result)
const loading = computed(() => store.loading)
const downloadUrl = computed(() => store.getDownloadUrl())

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    await store.uploadFile(file)
  } catch (error) {
    alert('Failed to upload file: ' + error.message)
  }
}

async function handleEvaluate() {
  const startTime = Date.now()
  try {
    await store.evaluate()
    processingTime.value = ((Date.now() - startTime) / 1000).toFixed(1)
  } catch (error) {
    alert('Evaluation failed: ' + error.message)
  }
}

function downloadTemplate() {
  window.open('/api/bulk/template', '_blank')
}

function reset() {
  store.reset()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function getRiskBadgeClass(level) {
  const classes = {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Good': 'bg-green-100 text-green-800'
  }
  return classes[level] || 'bg-gray-100 text-gray-800'
}

function getCronbachInterpretation(alpha) {
  if (!alpha) return 'N/A'
  if (alpha >= 0.9) return 'Excellent reliability'
  if (alpha >= 0.8) return 'Good reliability'
  if (alpha >= 0.7) return 'Acceptable reliability'
  if (alpha >= 0.6) return 'Questionable reliability'
  return 'Poor reliability'
}
</script>
