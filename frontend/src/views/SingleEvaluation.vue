<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-start justify-between">
          <div>
            <router-link to="/" class="text-blue-600 hover:underline mb-4 inline-block">← Back to Dashboard
            </router-link>
            <h1 class="text-4xl font-bold text-gray-900">Single Company Evaluation</h1>
            <p class="text-gray-600 mt-2">Đánh giá rủi ro cho một công ty cụ thể</p>
          </div>

          <!-- View Type Switcher -->
          <div class="flex gap-2 bg-white rounded-lg shadow p-1">
            <button
                @click="viewType = 'list'"
                :class="viewType === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
                class="flex items-center gap-2 px-4 py-2 rounded transition-colors"
                title="Xem dạng danh sách"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              <span class="text-sm font-medium">Danh sách</span>
            </button>
            <button
                @click="viewType = 'tabs'"
                :class="viewType === 'tabs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
                class="flex items-center gap-2 px-4 py-2 rounded transition-colors"
                title="Xem dạng tab"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
              </svg>
              <span class="text-sm font-medium">Tab</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation (only show in tab view) -->
      <div v-if="viewType === 'tabs'" class="bg-white rounded-lg shadow mb-6">
        <div class="flex border-b border-gray-200">
          <!-- Tab 1: Input -->
          <button
              @click="activeTab = 'input'"
              :class="activeTab === 'input' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'"
              class="px-6 py-3 font-medium transition-colors"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</div>
              <span>Nhập công ty</span>
            </div>
          </button>

          <!-- Tab 2: Financial Data -->
          <button
              @click="result?.financialData ? activeTab = 'financial' : null"
              @mouseenter="!result?.financialData ? showTabTooltip($event, 'financial') : null"
              @mouseleave="hideTabTooltip"
              :disabled="!result?.financialData"
              :class="[
              activeTab === 'financial' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600',
              result?.financialData ? 'hover:text-gray-900 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            ]"
              class="px-6 py-3 font-medium transition-colors"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">2</div>
              <span>Dữ liệu tài chính</span>
            </div>
          </button>

          <!-- Tab 3: Indicators -->
          <button
              @click="result?.indicators ? activeTab = 'indicators' : null"
              @mouseenter="!result?.indicators ? showTabTooltip($event, 'indicators') : null"
              @mouseleave="hideTabTooltip"
              :disabled="!result?.indicators"
              :class="[
              activeTab === 'indicators' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600',
              result?.indicators ? 'hover:text-gray-900 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            ]"
              class="px-6 py-3 font-medium transition-colors"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">3
              </div>
              <span>Chỉ số tài chính</span>
            </div>
          </button>

          <!-- Tab 4: Risk Signal -->
          <button
              @click="result?.risk_assessment ? activeTab = 'risk' : null"
              @mouseenter="!result?.risk_assessment ? showTabTooltip($event, 'risk') : null"
              @mouseleave="hideTabTooltip"
              :disabled="!result?.risk_assessment"
              :class="[
              activeTab === 'risk' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600',
              result?.risk_assessment ? 'hover:text-gray-900 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            ]"
              class="px-6 py-3 font-medium transition-colors"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs">4
              </div>
              <span>Risk Signal</span>
            </div>
          </button>

          <!-- Tab 5: Risk Label -->
          <button
              @click="result?.composite_risks && result.composite_risks.length > 0 ? activeTab = 'composite' : null"
              @mouseenter="!(result?.composite_risks && result.composite_risks.length > 0) ? showTabTooltip($event, 'composite') : null"
              @mouseleave="hideTabTooltip"
              :disabled="!(result?.composite_risks && result.composite_risks.length > 0)"
              :class="[
              activeTab === 'composite' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600',
              result?.composite_risks && result.composite_risks.length > 0 ? 'hover:text-gray-900 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            ]"
              class="px-6 py-3 font-medium transition-colors"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">5
              </div>
              <span>Risk Label</span>
            </div>
          </button>

          <!-- Tab 6: Inference Details -->
          <button
              @click="result?.inference_stats && result.inference_stats.inference_log && result.inference_stats.inference_log.length > 0 ? activeTab = 'inference' : null"
              @mouseenter="!(result?.inference_stats && result.inference_stats.inference_log && result.inference_stats.inference_log.length > 0) ? showTabTooltip($event, 'inference') : null"
              @mouseleave="hideTabTooltip"
              :disabled="!(result?.inference_stats && result.inference_stats.inference_log && result.inference_stats.inference_log.length > 0)"
              :class="[
              activeTab === 'inference' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600',
              result?.inference_stats && result.inference_stats.inference_log && result.inference_stats.inference_log.length > 0 ? 'hover:text-gray-900 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            ]"
              class="px-6 py-3 font-medium transition-colors"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">📋
              </div>
              <span>Chi tiết suy luận</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Bước 1: Input Form -->
      <div v-show="viewType === 'list' || activeTab === 'input'">

        <div class="bg-blue-50 rounded-lg shadow p-6 mb-8">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
            <h2 class="text-xl font-bold text-gray-900">Nhập công ty</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Ticker Symbol</label>
              <input
                  v-model="symbol"
                  list="tickers"
                  placeholder="VD: ACB, VCB, HPG"
                  class="input-field"
                  @keyup.enter="handleEvaluate"
              >
              <datalist id="tickers">
                <option v-for="t in tickers" :key="t" :value="t"></option>
              </datalist>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                  v-model.number="year"
                  type="number"
                  class="input-field"
                  @keyup.enter="handleEvaluate"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
              <select v-model.number="quarter" class="input-field">
                <option :value="1">Q1</option>
                <option :value="2">Q2</option>
                <option :value="3">Q3</option>
                <option :value="4">Q4</option>
              </select>
            </div>
          </div>

          <button
              @click="handleEvaluate"
              :disabled="loading.step1 || loading.step2 || loading.step3 || !symbol"
              class="mt-4 btn-primary"
          >
            <span v-if="loading.step1 || loading.step2 || loading.step3">Evaluating...</span>
            <span v-else>Đánh giá rủi ro</span>
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p class="text-red-800">{{ error }}</p>
        </div>

        <!-- Loading State with Progress -->
        <div v-if="loading.started" class="bg-white rounded-lg shadow p-6 mb-8">
          <h2 class="text-xl font-bold mb-6">Tiến trình xử lý</h2>

          <!-- Horizontal Progress Steps -->
          <div class="flex items-center justify-between mb-8">
            <!-- Step 1 -->
            <div class="flex flex-col items-center flex-1">
              <div class="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                   :class="result?.financialData ? 'bg-blue-600 text-white' : loading.step1 ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-300 text-gray-600'">
                <span v-if="result?.financialData" class="text-xl">✓</span>
                <span v-else-if="loading.step1" class="text-lg">⏳</span>
                <span v-else class="text-lg">1</span>
              </div>
              <div class="text-center">
                <div class="font-medium text-sm">Tải dữ liệu</div>
                <div class="text-xs text-gray-500">Báo cáo tài chính</div>
              </div>
              <div v-if="result?.stepErrors?.[1]" class="text-xs text-red-600 mt-1">
                ❌ Lỗi
              </div>
            </div>

            <!-- Connector 1-2 -->
            <div class="flex-1 h-1 mx-2 -mt-8"
                 :class="result?.financialData ? 'bg-blue-600' : 'bg-gray-300'">
            </div>

            <!-- Step 2 -->
            <div class="flex flex-col items-center flex-1">
              <div class="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                   :class="result?.indicators ? 'bg-blue-600 text-white' : loading.step2 ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-300 text-gray-600'">
                <span v-if="result?.indicators" class="text-xl">✓</span>
                <span v-else-if="loading.step2" class="text-lg">⏳</span>
                <span v-else class="text-lg">2</span>
              </div>
              <div class="text-center">
                <div class="font-medium text-sm">Tính chỉ số</div>
                <div class="text-xs text-gray-500">Chỉ số tài chính</div>
              </div>
              <div v-if="result?.stepErrors?.[2]" class="text-xs text-red-600 mt-1">
                ❌ Lỗi
              </div>
            </div>

            <!-- Connector 2-3 -->
            <div class="flex-1 h-1 mx-2 -mt-8"
                 :class="result?.indicators ? 'bg-blue-600' : 'bg-gray-300'">
            </div>

            <!-- Step 3 -->
            <div class="flex flex-col items-center flex-1">
              <div class="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                   :class="result?.risk_assessment ? 'bg-blue-600 text-white' : loading.step3 ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-300 text-gray-600'">
                <span v-if="result?.risk_assessment" class="text-xl">✓</span>
                <span v-else-if="loading.step3" class="text-lg">⏳</span>
                <span v-else class="text-lg">3</span>
              </div>
              <div class="text-center">
                <div class="font-medium text-sm">Đánh giá rủi ro</div>
                <div class="text-xs text-gray-500">Suy luận & phân tích</div>
              </div>
              <div v-if="result?.stepErrors?.[3]" class="text-xs text-red-600 mt-1">
                ❌ Lỗi
              </div>
            </div>
          </div>

          <!-- Error Messages & Retry Buttons -->
          <div v-if="result?.stepErrors?.[1] || result?.stepErrors?.[2] || result?.stepErrors?.[3]" class="space-y-2">
            <div v-if="result?.stepErrors?.[1]"
                 class="bg-red-50 border border-red-200 rounded p-3 flex items-center justify-between">
              <span class="text-sm text-red-600">Bước 1: {{ result.stepErrors[1] }}</span>
              <button @click="retryStep(1)" class="text-sm text-blue-600 hover:underline font-medium">Thử lại</button>
            </div>
            <div v-if="result?.stepErrors?.[2]"
                 class="bg-red-50 border border-red-200 rounded p-3 flex items-center justify-between">
              <span class="text-sm text-red-600">Bước 2: {{ result.stepErrors[2] }}</span>
              <button @click="retryStep(2)" class="text-sm text-blue-600 hover:underline font-medium">Thử lại</button>
            </div>
            <div v-if="result?.stepErrors?.[3]"
                 class="bg-red-50 border border-red-200 rounded p-3 flex items-center justify-between">
              <span class="text-sm text-red-600">Bước 3: {{ result.stepErrors[3] }}</span>
              <button @click="retryStep(3)" class="text-sm text-blue-600 hover:underline font-medium">Thử lại</button>
            </div>
          </div>
        </div>
      </div>


      <!-- Results - Hiển thị ngay khi có data -->
      <div v-if="result" class="space-y-6">

        <!-- Bước 2: Dữ liệu tài chính -->
        <div v-if="result?.financialData" v-show="viewType === 'list' || activeTab === 'financial'"
             class="bg-green-50 rounded-lg shadow p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">2</div>
            <h2 class="text-xl font-bold text-gray-900">Dữ liệu tài chính</h2>
          </div>
          {{
            console.log('🎯 Vue: financialData exists', !!result?.financialData, 'keys:', Object.keys(result?.financialData || {}))
          }}
          {{ console.log('🎯 Vue: loading state:', loading) }}
          {{ console.log('🎯 Vue: loading step1:', loading.step1, 'step2:', loading.step2, 'step3:', loading.step3) }}
          {{ console.log('🎯 Vue: result step:', result?.step) }}

          <!-- Data mismatch warning -->
          <div v-if="result.dataWarning" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p class="text-yellow-800 text-sm">⚠️ {{ result.dataWarning }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-600">Loại công ty</p>
              <div class="flex items-center gap-2">
                <p class="text-lg font-bold">{{ result.financialData.company_type }}</p>
                <button class="text-gray-400 hover:text-gray-600"
                        :title="getCompanyTypeDescription(result.financialData.company_type)">
                  ?
                </button>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-600">Kỳ báo cáo</p>
              <p class="text-lg font-bold">Q{{ result.company?.quarter }}/{{ result.company?.year }}</p>
            </div>
          </div>

          <!-- Raw Financial Data Preview -->
          <div v-if="result.financialData.raw_data" class="mt-4">
            <h3 class="font-bold mb-2">Dữ liệu tài chính đầy đủ:</h3>

            <div class="bg-gray-50 p-3 rounded text-xs max-h-96 overflow-y-auto">
              <table class="w-full">
                <tbody>
                <tr v-for="(value, key) in Object.entries(result.financialData.raw_data)" :key="key"
                    class="border-b border-gray-200">
                  <td class="py-1 pr-2 text-gray-600 w-1/2">{{ value[0] }}</td>
                  <td class="py-1 font-mono w-1/2 text-right">{{ formatFinancialValue(value[0], value[1]) }}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Bước 3: Chỉ số tài chính -->
        <div v-if="result?.indicators && result.indicators.length > 0"
             v-show="viewType === 'list' || activeTab === 'indicators'" class="bg-purple-50 rounded-lg shadow p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">3
            </div>
            <h2 class="text-xl font-bold text-gray-900">Chỉ số tài chính</h2>
          </div>
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm text-gray-600">{{ result.indicators.length }} chỉ số</div>
          </div>

          <!-- Liquidity Ratios (A) -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-blue-600 mb-4">📊 Khả năng thanh khoản (A)</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="ind in getIndicatorsByGroup('A')" :key="ind.code"
                   class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{{ ind.code }}</span>
                    <div class="relative group">
                      <button
                          class="text-gray-400 hover:text-gray-600 w-4 h-4 rounded-full border border-gray-300 text-xs">
                        ?
                      </button>
                      <div
                          class="absolute left-6 top-0 z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded shadow-lg w-64 text-sm">
                        <p class="font-semibold mb-1">{{ ind.name }}</p>
                        <p class="mb-1"><strong>Cách tính:</strong> {{ ind.calculation_method }}</p>
                        <p><strong>Diễn giải:</strong> {{ ind.explanation }}</p>
                        <div
                            class="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-800"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ ind.value }}{{ ind.unit }}
                </div>
              </div>
            </div>
          </div>

          <!-- Leverage Ratios (B) -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-orange-600 mb-4">🏗️ Đòn bẩy tài chính (B)</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="ind in getIndicatorsByGroup('B')" :key="ind.code"
                   class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{{ ind.code }}</span>
                    <div class="relative group">
                      <button
                          class="text-gray-400 hover:text-gray-600 w-4 h-4 rounded-full border border-gray-300 text-xs">
                        ?
                      </button>
                      <div
                          class="absolute left-6 top-0 z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded shadow-lg w-64 text-sm">
                        <p class="font-semibold mb-1">{{ ind.name }}</p>
                        <p class="mb-1"><strong>Cách tính:</strong> {{ ind.calculation_method }}</p>
                        <p><strong>Diễn giải:</strong> {{ ind.explanation }}</p>
                        <div
                            class="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-800"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ ind.value }}{{ ind.unit }}
                </div>
              </div>
            </div>
          </div>

          <!-- Efficiency Ratios (C) -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-green-600 mb-4">⚡ Hiệu quả hoạt động (C)</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="ind in getIndicatorsByGroup('C')" :key="ind.code"
                   class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{{ ind.code }}</span>
                    <div class="relative group">
                      <button
                          class="text-gray-400 hover:text-gray-600 w-4 h-4 rounded-full border border-gray-300 text-xs">
                        ?
                      </button>
                      <div
                          class="absolute left-6 top-0 z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded shadow-lg w-64 text-sm">
                        <p class="font-semibold mb-1">{{ ind.name }}</p>
                        <p class="mb-1"><strong>Cách tính:</strong> {{ ind.calculation_method }}</p>
                        <p><strong>Diễn giải:</strong> {{ ind.explanation }}</p>
                        <div
                            class="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-800"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ ind.value }}{{ ind.unit }}
                </div>
              </div>
            </div>
          </div>

          <!-- Profitability Ratios (D) -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-purple-600 mb-4">💰 Khả năng sinh lời (D)</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="ind in getIndicatorsByGroup('D')" :key="ind.code"
                   class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{{ ind.code }}</span>
                    <div class="relative group">
                      <button
                          class="text-gray-400 hover:text-gray-600 w-4 h-4 rounded-full border border-gray-300 text-xs">
                        ?
                      </button>
                      <div
                          class="absolute left-6 top-0 z-10 invisible group-hover:visible bg-gray-800 text-white p-2 rounded shadow-lg w-64 text-sm">
                        <p class="font-semibold mb-1">{{ ind.name }}</p>
                        <p class="mb-1"><strong>Cách tính:</strong> {{ ind.calculation_method }}</p>
                        <p><strong>Diễn giải:</strong> {{ ind.explanation }}</p>
                        <div
                            class="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-800"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-2xl font-bold text-gray-900">
                  {{ ind.value }}{{ ind.unit }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bước 4: Risk Assessment -->
        <div v-if="result?.risk_assessment" v-show="viewType === 'list' || activeTab === 'risk'"
             class="bg-yellow-50 rounded-lg shadow p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-yellow-600 text-white flex items-center justify-center font-bold">4
            </div>
            <h2 class="text-xl font-bold text-gray-900">Đánh giá Risk Signal cục bộ</h2>
          </div>
          <div class="flex items-center justify-between mb-6">
            <div class="text-sm text-gray-600">Dựa trên {{ result.risk_assessment.risk_factors?.length || 0 }} chỉ số
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p class="text-sm text-gray-600 mb-1">Công ty</p>
              <p class="text-2xl font-bold">{{ result.company.symbol }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 mb-1">Kỳ báo cáo</p>
              <p class="text-2xl font-bold">Q{{ result.company.quarter }}/{{ result.company.year }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 mb-1">Mức rủi ro</p>
              <p class="text-3xl font-bold" :class="getRiskColor(result.risk_assessment.risk_level)">
                {{ result.risk_assessment.risk_level }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600 mb-1">Điểm rủi ro</p>
              <p class="text-3xl font-bold text-gray-900">{{ result.risk_assessment.risk_score }}</p>
            </div>
          </div>

          <!-- Detailed Risk Factors Table -->
          <div v-if="result.risk_assessment.risk_factors && result.risk_assessment.risk_factors.length > 0"
               class="mt-6">
            <h3 class="text-xl font-bold mb-3">Chi tiết rủi ro theo chỉ số</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                <tr>
                  <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chỉ số
                  </th>
                  <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị
                  </th>
                  <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức rủi ro
                  </th>
                  <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm rủi ro
                  </th>
                  <th scope="col"
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giải thích
                  </th>
                </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(factor, factorIndex) in result.risk_assessment.risk_factors" :key="factorIndex">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ factor.indicator }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ factor.value }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getRiskBadgeClass(factor.risk_level)"
                          class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">{{
                        factor.risk_level
                      }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center gap-2">
                      <span>{{ factor.risk_point }}</span>
                      <button
                          @mouseenter="showPopover($event, factor.indicator)"
                          @mouseleave="hidePopover"
                          class="text-gray-400 hover:text-gray-600 w-4 h-4 rounded-full border border-gray-300 text-xs"
                      >
                        ?
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ factor.explanation }}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recommendations -->
          <div v-if="result.risk_assessment.recommendations && result.risk_assessment.recommendations.length > 0"
               class="mt-6">
            <h3 class="text-xl font-bold mb-3">Khuyến nghị</h3>
            <ul class="list-disc list-inside text-gray-700">
              <li v-for="(rec, recIndex) in result.risk_assessment.recommendations" :key="recIndex">{{ rec }}</li>
            </ul>
          </div>
        </div>

        <!-- Bước 5: Composite Risks -->
        <div v-if="result.composite_risks && result.composite_risks.length > 0"
             v-show="viewType === 'list' || activeTab === 'composite'" class="bg-orange-50 rounded-lg shadow p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">5
            </div>
            <h2 class="text-xl font-bold text-gray-900">Đánh giá Risk Label toàn diện</h2>
          </div>
          <p class="text-gray-600 mb-4">Hệ thống đã phát hiện các tín hiệu rủi ro phức hợp từ việc kết hợp nhiều chỉ số
            tài chính:</p>
          <div class="space-y-4">
            <div
                v-for="(risk, index) in result.composite_risks"
                :key="risk.rule_id"
                class="border-l-4 rounded-lg p-4"
                :class="risk.severity === 'high' ? 'border-red-500 bg-red-50' : risk.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-lg">{{ risk.description }}</span>
                    <span
                        class="px-2 py-1 rounded text-xs font-semibold"
                        :class="risk.severity === 'high' ? 'bg-red-600 text-white' : risk.severity === 'medium' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'"
                    >
                      {{
                        risk.severity === 'high' ? 'Nghiêm trọng' : risk.severity === 'medium' ? 'Trung bình' : 'Thấp'
                      }}
                    </span>
                    <span class="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">
                      +{{ risk.risk_point }} điểm rủi ro
                    </span>
                  </div>
                  <p class="text-sm text-gray-700 mb-2">{{ risk.explanation }}</p>
                  <div class="text-xs text-gray-500">
                    <span class="font-semibold">Loại rủi ro:</span> {{ risk.risk_type }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chi tiết suy luận -->
        <div
            v-if="result.inference_stats && result.inference_stats.inference_log && result.inference_stats.inference_log.length > 0"
            v-show="viewType === 'list' || activeTab === 'inference'" class="bg-indigo-50 rounded-lg shadow p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">📋
            </div>
            <h2 class="text-xl font-bold text-gray-900">Chi tiết suy luận</h2>
          </div>
          <div class="mb-4 flex gap-4 text-sm flex-wrap">
            <div class="bg-blue-50 px-4 py-2 rounded">
              <span class="font-semibold">Phase 3 - Đánh giá chỉ số:</span> {{
                result.inference_stats.phase3_evaluations
              }}
            </div>
            <div class="bg-green-50 px-4 py-2 rounded">
              <span class="font-semibold">Phase 4 - Vòng lặp:</span> {{ result.inference_stats.phase4_iterations }}
            </div>
            <div class="bg-purple-50 px-4 py-2 rounded">
              <span class="font-semibold">Phase 4 - Quy tắc:</span> {{ result.inference_stats.phase4_rules_fired }}
            </div>
            <div class="bg-orange-50 px-4 py-2 rounded">
              <span class="font-semibold">Tổng facts:</span> {{ result.inference_stats.total_facts }}
            </div>
          </div>

          <div class="space-y-4">
            <div
                v-for="(step, index) in result.inference_stats.inference_log"
                :key="step.stepId"
                class="border rounded-lg p-4"
                :class="step.phase === 3 ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50'"
            >
              <div class="flex items-start gap-3">
                <div
                    class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                    :class="step.phase === 3 ? 'bg-blue-600' : 'bg-green-600'">
                  {{ index + 1 }}
                </div>
                <div class="flex-1">
                  <div class="mb-2 flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-bold text-white"
                          :class="step.phase === 3 ? 'bg-blue-600' : 'bg-green-600'">
                      Phase {{ step.phase }}
                    </span>
                    <span class="font-bold" :class="step.phase === 3 ? 'text-blue-700' : 'text-green-700'">
                      {{ step.ruleId }}:
                    </span>
                    <span class="text-gray-700">{{ step.ruleDescription }}</span>
                  </div>

                  <div class="mb-2 text-sm">
                    <div class="font-semibold text-gray-700 mb-1">
                      {{ step.phase === 3 ? '📊 Chỉ số đầu vào:' : '📊 Facts đầu vào:' }}
                    </div>
                    <div v-if="step.phase === 3 && step.inputData" class="bg-white p-2 rounded border border-gray-300">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold">{{ step.inputData.code }}:</span>
                        <span>{{ step.inputData.name }}</span>
                        <span class="ml-auto font-mono font-bold text-blue-600">{{ step.inputData.value }}</span>
                      </div>
                    </div>
                    <div v-else class="flex flex-wrap gap-2">
                      <span
                          v-for="fact in step.inputFacts"
                          :key="fact"
                          class="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                      >
                        {{ fact.replace('eval_', '') }}
                      </span>
                    </div>
                  </div>

                  <div class="mb-2 text-sm">
                    <div class="font-semibold text-gray-700 mb-1">
                      {{ step.phase === 3 ? '⚠️ Tín hiệu rủi ro:' : '✅ Kết quả suy luận:' }}
                    </div>
                    <div v-if="step.phase === 3 && step.outputData" class="bg-white p-2 rounded border border-gray-300">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-1 rounded text-xs font-bold"
                              :class="step.outputData.risk_level === 'High' ? 'bg-red-100 text-red-700' : 
                                      step.outputData.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                                      'bg-green-100 text-green-700'">
                          {{ step.outputData.risk_level }}
                        </span>
                        <span class="text-gray-600">{{ step.outputData.risk_point }} điểm</span>
                        <span class="ml-auto text-xs text-gray-500">{{ step.outputData.risk_type }}</span>
                      </div>
                    </div>
                    <div v-else class="flex flex-wrap gap-2">
                      <span
                          v-for="fact in step.outputFacts"
                          :key="fact"
                          class="px-2 py-1 bg-green-100 border border-green-300 rounded text-xs font-semibold"
                      >
                        {{ fact }}
                      </span>
                    </div>
                  </div>

                  <div class="text-sm bg-white p-3 rounded border border-gray-200">
                    <div class="font-semibold text-gray-700 mb-1">💡 Giải thích:</div>
                    <p class="text-gray-600">{{ step.explanation }}</p>
                  </div>

                  <div class="text-xs text-gray-400 mt-2">
                    ⏱️ {{ new Date(step.timestamp).toLocaleTimeString('vi-VN') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="result.inference_stats && result.inference_stats.error"
             class="bg-indigo-50 rounded-lg shadow p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">📋
            </div>
            <h2 class="text-xl font-bold text-gray-900">Chi tiết suy luận</h2>
          </div>
          <div class="bg-red-50 border border-red-200 rounded p-4">
            <p class="text-red-600"><strong>Lỗi:</strong> {{ result.inference_stats.error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Popper.js Popovers -->
  <div
      v-for="factor in result?.risk_assessment?.risk_factors || []"
      :key="factor.indicator"
      :id="`popover-${factor.indicator}`"
      v-show="activePopover === factor.indicator"
      @mouseenter="activePopover = factor.indicator"
      @mouseleave="hidePopover"
      class="bg-gray-800 text-white p-3 rounded shadow-lg w-80 text-sm z-50"
      style="position: absolute; top: 0; left: 0;"
  >
    <p class="font-semibold mb-2">Hệ thống điểm rủi ro - {{ factor.indicator }}</p>
    <div class="space-y-1 text-xs">
      <table class="w-full border-collapse border border-gray-600">
        <thead>
        <tr class="bg-gray-700">
          <th class="whitespace-nowrap w-1 text-left px-2 py-1 border border-gray-600">Điều kiện</th>
          <th class="whitespace-nowrap w-1 text-left px-2 py-1 border border-gray-600">Điểm</th>
          <th class="text-left px-2 py-1 border border-gray-600">Giải thích</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="range in getIndicatorRiskRanges(factor.indicator)" :key="range.range">
          <tr>
            <td class="whitespace-nowrap w-1 align-top px-2 py-1 border border-gray-600">{{ range.range }}</td>
            <td class="whitespace-nowrap w-1 align-top px-2 py-1 border border-gray-600">{{ range.point }}</td>
            <td class="break-words whitespace-normal align-top px-2 py-1 border border-gray-600">{{
                range.explanation
              }}
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
    <div id="arrow" data-popper-arrow class="absolute w-2 h-2 bg-gray-800 transform rotate-45"
         style="left: -4px;"></div>
  </div>

  <!-- Tab Tooltip for Disabled Tabs -->
  <div
      id="tab-tooltip"
      v-show="tabTooltipInstance"
      class="bg-gray-900 text-white px-4 py-2 rounded shadow-lg text-sm z-50 max-w-xs"
      style="position: absolute; top: 0; left: 0;"
  >
    <p class="font-medium">⚠️ Chưa có dữ liệu</p>
    <p class="text-xs text-gray-300 mt-1">Hãy nhập liệu trước và bấm <strong>Đánh giá rủi ro</strong></p>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, nextTick} from 'vue'
import {useEvaluationStore} from '@/stores/evaluation.store'
import {createPopper} from '@popperjs/core'

const store = useEvaluationStore()

const symbol = ref('ACB')
const year = ref(2024)
const quarter = ref(4)
const expandedIndicators = ref(new Set())
const expandedComposites = ref(new Set())
const activePopover = ref(null)
const popperInstance = ref(null)
const viewType = ref('list') // 'list' or 'tabs'
const activeTab = ref('input') // 'input', 'financial', 'indicators', 'risk', 'composite', 'inference'
const tabTooltipInstance = ref(null)

const showPopover = async (event, indicatorCode) => {
  const button = event.currentTarget
  const popoverId = `popover-${indicatorCode}`

  // Close existing popover
  if (activePopover.value) {
    activePopover.value = null
    if (popperInstance.value) {
      popperInstance.value.destroy()
      popperInstance.value = null
    }
  }

  // Open new popover
  activePopover.value = indicatorCode

  await nextTick()

  const popover = document.getElementById(popoverId)
  if (popover) {
    popperInstance.value = createPopper(button, popover, {
      placement: 'right',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['left', 'top', 'bottom'],
          },
        },
      ],
    })
  }
}

const hidePopover = () => {
  activePopover.value = null
  if (popperInstance.value) {
    popperInstance.value.destroy()
    popperInstance.value = null
  }
}

const showTabTooltip = async (event, tabName) => {
  const button = event.currentTarget

  // Close existing tooltip
  if (tabTooltipInstance.value) {
    tabTooltipInstance.value.destroy()
    tabTooltipInstance.value = null
  }

  await nextTick()

  const tooltip = document.getElementById('tab-tooltip')
  if (tooltip) {
    tabTooltipInstance.value = createPopper(button, tooltip, {
      placement: 'bottom',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['left', 'top', 'bottom'],
          },
        },
      ],
    })
  }
}

const hideTabTooltip = () => {
  if (tabTooltipInstance.value) {
    tabTooltipInstance.value.destroy()
    tabTooltipInstance.value = null
  }
}

const tickers = computed(() => store.tickers)
const result = computed(() => store.result)
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const indicatorRules = computed(() => store.indicatorRules)

onMounted(async () => {
  await store.loadTickers()
  await store.loadCurrentPeriod()
  await store.loadIndicatorRules()
  year.value = store.currentPeriod.year
  quarter.value = store.currentPeriod.quarter
})

async function handleEvaluate() {
  if (!symbol.value) return
  await store.evaluateStepByStep(symbol.value.toUpperCase(), year.value, quarter.value)
}

async function retryStep(stepNum) {
  await store.retryStep(stepNum)
}

function getCompanyTypeDescription(type) {
  const descriptions = {
    'BANK': 'Ngân hàng - Sử dụng các chỉ số đặc thù như Loan/Deposit Ratio, NPL Ratio, CAR',
    'SECURITIES': 'Công ty chứng khoán - Sử dụng các chỉ số về thanh khoản và vốn',
    'REGULAR': 'Công ty thường - Sử dụng các chỉ số tài chính chuẩn như Current Ratio, ROE, ROA'
  }
  return descriptions[type] || 'Unknown company type'
}

function formatFinancialValue(fieldName, value) {
  if (!value || value === '' || value === '0') return '0'

  // Convert to string first to handle all types
  const stringValue = String(value)

  // Try to parse as number
  const numValue = parseFloat(stringValue.replace(/,/g, ''))

  // If it's not a number, return as-is
  if (isNaN(numValue)) return stringValue

  // Fix -0 issue
  if (numValue === 0 || numValue === -0) return '0'

  // For percentage fields
  if (fieldName.includes('%')) {
    return `${numValue}%`
  }

  // Format ALL numbers as currency with thousand separators
  return numValue.toLocaleString('en-US')
}

function getRiskColor(level) {
  const colors = {
    'High': 'text-red-600',
    'Medium': 'text-yellow-600',
    'Good': 'text-green-600',
    'Unknown': 'text-gray-600'
  }
  return colors[level] || 'text-gray-600'
}

function getIndicatorRiskRanges(indicatorCode) {
  if (!indicatorRules.value || !indicatorCode) return []

  const rule = indicatorRules.value.find(r => r.indicator === indicatorCode)
  if (!rule || !rule.ranges) return []

  return rule.ranges.map(range => {
    let rangeText = ''
    if (range.min !== null && range.max !== null) {
      rangeText = `${range.min} - ${range.max}`
    } else if (range.min !== null) {
      rangeText = `> ${range.min}`
    } else if (range.max !== null) {
      rangeText = `< ${range.max}`
    }

    return {
      range: rangeText,
      level: range.risk_level,
      point: range.risk_point,
      explanation: range.explanation
    }
  })
}

function getIndicatorsByGroup(group) {
  if (!result.value?.indicators) return []
  return result.value.indicators.filter(ind => ind.code && ind.code.startsWith(group)).map((item) => {
    if (item.unit === 'x') {
      item.unit = ''
    }
    return item
  })
}

function getRiskBadgeClass(level) {
  const classes = {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Good': 'bg-green-100 text-green-800',
    'Unknown': 'bg-gray-100 text-gray-800'
  }
  return classes[level] || 'bg-gray-100 text-gray-800'
}

function toggleIndicatorDetails(code) {
  if (expandedIndicators.value.has(code)) {
    expandedIndicators.value.delete(code)
  } else {
    expandedIndicators.value.add(code)
  }
  expandedIndicators.value = new Set(expandedIndicators.value)
}

function toggleCompositeDetails(risk) {
  if (expandedComposites.value.has(risk)) {
    expandedComposites.value.delete(risk)
  } else {
    expandedComposites.value.add(risk)
  }
  expandedComposites.value = new Set(expandedComposites.value)
}
</script>
