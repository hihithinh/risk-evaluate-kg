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
            @change="handleFileSelect"
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
      <div v-if="currentStep === 1 && localPreview" class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold mb-4">Data Preview</h2>
        <p class="text-gray-600 mb-4">{{ localPreview.totalRows }} rows loaded</p>
        
        <div class="overflow-x-auto mb-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b-2 border-gray-200">
                <th v-for="col in localPreview.columns" :key="col" class="text-left py-2 px-3">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in localPreview.sample" :key="idx" class="border-b border-gray-100">
                <td v-for="col in localPreview.columns" :key="col" class="py-2 px-3">{{ row[col] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="flex gap-3">
          <button @click="handleEvaluate" :disabled="loading" class="btn-primary">
            Đánh giá rủi ro
          </button>
          <button @click="reset" class="btn-secondary">
            Hủy
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
        <!-- Cronbach's Alpha -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Cronbach's Alpha</h2>
          <div class="space-y-3">
            <div v-for="result in result.statistical_validation?.cronbach_results" :key="result.latent_variable" class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div class="font-medium">{{ result.latent_variable }} Group</div>
              <div class="text-lg font-bold" :class="getCronbachColor(result.cronbach_alpha)">
                {{ result.cronbach_alpha }} {{ result.interpretation ? `(${result.interpretation})` : '' }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Risk Distribution -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Phân bổ Rủi ro</h2>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600">{{ result.risk_inference?.summary?.risk_distribution?.Risky || 0 }}</div>
              <div class="text-sm text-gray-600">Rủi ro Cao</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600">{{ result.risk_inference?.summary?.risk_distribution?.Medium || 0 }}</div>
              <div class="text-sm text-gray-600">Rủi ro Trung bình</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ result.risk_inference?.summary?.risk_distribution?.Good || 0 }}</div>
              <div class="text-sm text-gray-600">Rủi ro Thấp</div>
            </div>
          </div>
        </div>
        
        <!-- Top Risk Companies -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Top Công ty Rủi ro Cao</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b-2 border-gray-200">
                  <th class="text-left py-2 px-3">Mã CK</th>
                  <th class="text-left py-2 px-3">Mức rủi ro</th>
                  <th class="text-left py-2 px-3">Điểm rủi ro</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="company in result.top_risk_companies" :key="`${company.ticker}-${company.year}-${company.quarter}`" class="border-b border-gray-100">
                  <td class="py-2 px-3 font-medium">{{ company.ticker }} Q{{ company.quarter }}/{{ company.year }}</td>
                  <td class="py-2 px-3">
                    <span class="px-2 py-1 rounded-full text-xs" :class="getRiskBadgeClass(company.risk_level)">
                      {{ company.risk_level || 'Unknown' }}
                    </span>
                  </td>
                  <td class="py-2 px-3">{{ company.risk_score }} points</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Cronbach Validation & Statistics -->
        <div v-if="result.results?.validationResults" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-2xl font-bold mb-4">Kiểm định Thống kê</h2>
          
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
              <h3 class="font-bold mb-2">Chất lượng Dữ liệu</h3>
              <div class="space-y-2 text-sm">
                <p><strong>Bản ghi hợp lệ:</strong> {{ result.results.validationResults.valid_count || 'N/A' }}</p>
                <p><strong>Tổng bản ghi:</strong> {{ result.results.validationResults.total_count || 'N/A' }}</p>
                <p><strong>Độ đầy đủ:</strong> {{ result.results.validationResults.total_count ? ((result.results.validationResults.valid_count / result.results.validationResults.total_count) * 100).toFixed(1) : 'N/A' }}%</p>
              </div>
            </div>
          </div>
          
          <!-- Statistics Table -->
          <div v-if="result.results.validationResults.statistics">
            <h3 class="font-bold mb-3">Thống kê Mô tả</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="text-left py-2 px-3">Chỉ báo</th>
                    <th class="text-left py-2 px-3">Trung bình</th>
                    <th class="text-left py-2 px-3">Độ lệch chuẩn</th>
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
          <h2 class="text-2xl font-bold mb-4">Tải Kết quả</h2>
          <a :href="downloadUrl" download class="btn-primary inline-block">
            Tải CSV Kết quả
          </a>
        </div>
        
        <!-- Results Table -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Kết quả Đánh giá Rủi ro</h2>
            <div class="flex gap-3">
              <button @click="loadDetailedResults" :disabled="loading" class="btn-primary">
                {{ companies.length > 0 ? 'Làm mới từ Database' : 'Tải từ Database' }}
              </button>
            </div>
          </div>
          
          <!-- Show database results if loaded, otherwise show API results -->
          <div v-if="companies.length > 0">
            <div class="flex gap-4 mb-4">
              <input 
                v-model="searchSymbol" 
                @input="filterCompanies"
                placeholder="Tìm kiếm theo mã CK..." 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <select 
                v-model="selectedQuarter" 
                @change="filterCompanies"
                class="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả các quý</option>
                <option value="1">Quý 1</option>
                <option value="2">Quý 2</option>
                <option value="3">Quý 3</option>
                <option value="4">Quý 4</option>
              </select>
              <select 
                v-model="selectedYear" 
                @change="filterCompanies"
                class="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả các năm</option>
                <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
              </select>
              <select 
                v-model="selectedRiskLevel" 
                @change="filterCompanies"
                class="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tất cả mức rủi ro</option>
                <option value="Low">Thấp</option>
                <option value="Medium">Trung bình</option>
                <option value="Good">Tốt</option>
                <option value="Risky">Cao</option>
              </select>
              <select 
                v-model="sortBy" 
                @change="filterCompanies"
                class="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="symbol">Sắp xếp: Mã CK</option>
                <option value="year_report">Sắp xếp: Năm</option>
                <option value="risk_score">Sắp xếp: Điểm rủi ro</option>
                <option value="risk_level">Sắp xếp: Mức rủi ro</option>
              </select>
              <button 
                @click="toggleSortOrder" 
                class="px-3 py-2 border border-gray-300 rounded-md"
              >
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </button>
            </div>
            
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="text-left py-2 px-3">Mã CK</th>
                    <th class="text-left py-2 px-3">Quý/Năm</th>
                    <th class="text-left py-2 px-3">Mức rủi ro</th>
                    <th class="text-left py-2 px-3">Điểm rủi ro</th>
                    <th class="text-left py-2 px-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="company in filteredCompanies" :key="company.id" class="border-b border-gray-100">
                    <td class="py-2 px-3 font-medium">{{ company.symbol }}</td>
                    <td class="py-2 px-3">Q{{ company.length_report }}/{{ company.year_report }}</td>
                    <td class="py-2 px-3">
                      <span class="px-2 py-1 rounded-full text-xs" :class="getRiskBadgeClass(company.risk_level)">
                        {{ company.risk_level || 'Unknown' }}
                      </span>
                    </td>
                    <td class="py-2 px-3">{{ company.risk_score }}%</td>
                    <td class="py-2 px-3">
                      <button @click="selectCompany(company)" class="btn-secondary text-xs">
                        Xem Chi tiết
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Show original API results if database not loaded -->
          <div v-else>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b-2 border-gray-200">
                    <th class="text-left py-2 px-3">Mã CK</th>
                    <th class="text-left py-2 px-3">Kỳ</th>
                    <th class="text-left py-2 px-3">Mức rủi ro</th>
                    <th class="text-left py-2 px-3">Điểm rủi ro</th>
                    <th class="text-left py-2 px-3">Điểm</th>
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
                    <td class="py-2 px-3">{{ r.final_score?.risk_score }}%</td>
                    <td class="py-2 px-3">{{ r.final_score?.total_risk_points }}/{{ r.final_score?.max_total_points }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="text-center text-gray-500 mt-4">
              Hiển thị 20 kết quả đầu tiên từ API. Nhấn "Tải từ Database" để xem tất cả kết quả.
            </div>
          </div>
        </div>
        
        <button @click="reset" class="btn-secondary">
          Bắt đầu Đánh giá mới
        </button>
      </div>
      
      <!-- Company Details Modal -->
      <div v-if="selectedCompany" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="store.selectCompany(null)">
        <div class="bg-white rounded-lg p-8 max-w-4xl max-h-[80vh] overflow-y-auto" @click.stop>
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold">{{ selectedCompany.symbol }} - {{ selectedCompany.year_report }}</h3>
            <button @click="store.selectCompany(null)" class="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          <!-- Company Info -->
          <div class="mb-6">
            <h4 class="text-lg font-semibold mb-2">Thông tin Công ty</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Mã CK:</strong> {{ selectedCompany.symbol }}</div>
              <div><strong>Mã công ty:</strong> {{ selectedCompany.ticker }}</div>
              <div><strong>Loại báo cáo:</strong> {{ selectedCompany.report }}</div>
              <div><strong>Năm:</strong> {{ selectedCompany.year_report }}</div>
              <div><strong>Mức rủi ro:</strong> {{ selectedCompany.risk_level }}</div>
              <div><strong>Điểm rủi ro:</strong> {{ selectedCompany.risk_score }}%</div>
            </div>
          </div>
          
          <!-- Financial Indicators -->
          <div class="mb-6" v-if="companyIndicators.length > 0">
            <h4 class="text-lg font-semibold mb-2">Chỉ báo Tài chính</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-1">Chỉ báo</th>
                    <th class="text-left py-1">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="indicator in companyIndicators" :key="indicator.indicator_name" class="border-b">
                    <td class="py-1">{{ indicator.indicator_name }}</td>
                    <td class="py-1">{{ indicator.indicator_value.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Rule Results -->
          <div v-if="companyRuleResults">
            <h4 class="text-lg font-semibold mb-2">Kết quả Quy tắc</h4>
            
            <!-- Risk Signal Rules -->
            <div class="mb-4" v-if="companyRuleResults.indicatorResults?.length > 0">
              <h5 class="font-semibold mb-2">Luật Suy Luận Tín Hiệu Rủi Ro</h5>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left py-1">Quy tắc</th>
                      <th class="text-left py-1">Danh mục</th>
                      <th class="text-left py-1">Điểm</th>
                      <th class="text-left py-1">Điểm tối đa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rule in companyRuleResults.indicatorResults" :key="rule.rule_name" class="border-b">
                      <td class="py-1">{{ rule.rule_name }}</td>
                      <td class="py-1">{{ rule.rule_category }}</td>
                      <td class="py-1">{{ rule.risk_points }}</td>
                      <td class="py-1">{{ rule.max_points }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Risk Label Rules -->
            <div v-if="companyRuleResults.compositeResults?.length > 0">
              <h5 class="font-semibold mb-2">Luật Suy Luận Nhãn Rủi Ro</h5>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left py-1">Quy tắc</th>
                      <th class="text-left py-1">Danh mục</th>
                      <th class="text-left py-1">Điểm</th>
                      <th class="text-left py-1">Điểm rủi ro</th>
                      <th class="text-left py-1">Điểm tối đa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rule in companyRuleResults.compositeResults" :key="rule.rule_name" class="border-b">
                      <td class="py-1">{{ rule.rule_name }}</td>
                      <td class="py-1">{{ rule.rule_category }}</td>
                      <td class="py-1">{{ rule.composite_score?.toFixed(3) }}</td>
                      <td class="py-1">{{ rule.risk_points }}</td>
                      <td class="py-1">{{ rule.max_points }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
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
const selectedFile = ref(null)
const localPreview = ref(null)
const searchSymbol = ref('')

// Filter and sort variables
const selectedQuarter = ref('')
const selectedYear = ref('')
const selectedRiskLevel = ref('')
const sortBy = ref('symbol')
const sortOrder = ref('asc')

const currentStep = computed(() => store.currentStep)
const preview = computed(() => store.preview)
const result = computed(() => store.result)
const loading = computed(() => store.loading)
const downloadUrl = computed(() => store.getDownloadUrl())
const companies = computed(() => store.companies)
const selectedCompany = computed(() => store.selectedCompany)
const companyIndicators = computed(() => store.companyIndicators)
const companyRuleResults = computed(() => store.companyRuleResults)

// Get available years for filter
const availableYears = computed(() => {
  const years = [...new Set(companies.value.map(c => c.year_report))]
  return years.sort((a, b) => b - a) // Descending order
})

const filteredCompanies = computed(() => companies.value) // Now handled by backend SQL

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  
  selectedFile.value = file
  
  try {
    // Parse CSV locally
    const preview = await parseCsvFile(file)
    localPreview.value = preview
    store.setCurrentStep(1) // Move to preview step
  } catch (error) {
    alert('Failed to read file: ' + error.message)
  }
}

async function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length === 0) {
          reject(new Error('Empty file'))
          return
        }
        
        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        
        // Parse sample rows (first 5 data rows)
        const sample = []
        const maxSample = Math.min(5, lines.length - 1)
        
        for (let i = 1; i <= maxSample; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const row = {}
          headers.forEach((header, idx) => {
            row[header] = values[idx] || ''
          })
          sample.push(row)
        }
        
        resolve({
          columns: headers,
          sample: sample,
          totalRows: lines.length - 1
        })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

async function handleEvaluate() {
  if (!selectedFile.value) {
    alert('No file selected')
    return
  }
  
  const startTime = Date.now()
  try {
    // Upload file first, then evaluate
    await store.uploadFile(selectedFile.value)
    await store.evaluate()
    processingTime.value = ((Date.now() - startTime) / 1000).toFixed(1)
  } catch (error) {
    alert('Evaluation failed: ' + error.message)
  }
}

function downloadTemplate() {
  window.open('/api/bulk/template', '_blank')
}

async function loadDetailedResults() {
  try {
    const filters = {
      quarter: selectedQuarter.value,
      riskLevel: selectedRiskLevel.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      limit: 100,
      offset: 0
    }
    
    await store.loadCompanies(searchSymbol.value, selectedYear.value, filters)
  } catch (error) {
    alert('Failed to load detailed results: ' + error.message)
  }
}

function selectCompany(company) {
  store.selectCompany(company)
}

function filterCompanies() {
  // Reload data with new filters
  loadDetailedResults()
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  // Reload data with new sort order
  loadDetailedResults()
}

function reset() {
  store.reset()
  selectedFile.value = null
  localPreview.value = null
  searchSymbol.value = ''
  if (fileInput.value) {
    fileInput.value = ''
  }
}

function getRiskBadgeClass(level) {
  const classes = {
    'Risky': 'bg-red-100 text-red-800',
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

function getCronbachAlphaDisplay() {
  if (!result.value?.statistical_validation?.cronbach_results) return 'N/A'
  
  const cronbachResults = result.value.statistical_validation.cronbach_results
  
  // Format as "A: 0.85, B: 0.78, C: 0.82, D: 0.91"
  const alphaStrings = cronbachResults.map(r => {
    const alpha = r.cronbach_alpha === 'N/A' ? 'N/A' : parseFloat(r.cronbach_alpha).toFixed(3)
    return `${r.latent_variable}: ${alpha}`
  })
  
  return alphaStrings.join(', ')
}

function getCronbachColor(alpha) {
  if (alpha === 'N/A') return 'text-gray-500'
  const numAlpha = parseFloat(alpha)
  if (numAlpha >= 0.9) return 'text-green-600'
  if (numAlpha >= 0.8) return 'text-blue-600'
  if (numAlpha >= 0.7) return 'text-yellow-600'
  return 'text-red-600'
}
</script>
