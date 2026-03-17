<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <router-link to="/" class="text-yellow-600 hover:underline mb-4 inline-block">← Back to Dashboard</router-link>
        <h1 class="text-4xl font-bold text-gray-900">Knowledge Management</h1>
        <p class="text-gray-600 mt-2">Quản lý knowledge graph và inference rules</p>
      </div>
      
      <!-- Rule Type Selector -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4">Select Rule Type</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
              @click="selectedType = 'indicator'"
              :class="selectedType === 'indicator' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'"
              class="px-6 py-4 rounded-lg font-medium hover:opacity-80 transition text-left"
          >
            <div class="font-bold text-lg mb-1">Indicator Rules</div>
            <div class="text-sm opacity-90">Luật tính toán chỉ số - Định nghĩa công thức tính các chỉ số tài chính từ dữ liệu báo cáo (Phase 2)</div>
          </button>
          <button
              @click="selectedType = 'risk_signal'"
              :class="selectedType === 'risk_signal' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'"
              class="px-6 py-4 rounded-lg font-medium hover:opacity-80 transition text-left"
          >
            <div class="font-bold text-lg mb-1">Risk Signal Rules</div>
            <div class="text-sm opacity-90">Luật suy luận tín hiệu rủi ro - Đánh giá rủi ro cho từng chỉ số tài chính (Phase 3)</div>
          </button>
          <button
              @click="selectedType = 'risk_label'"
              :class="selectedType === 'risk_label' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'"
              class="px-6 py-4 rounded-lg font-medium hover:opacity-80 transition text-left"
          >
            <div class="font-bold text-lg mb-1">Risk Label Rules</div>
            <div class="text-sm opacity-90">Luật suy luận nhãn rủi ro - Kết hợp nhiều risk signal thành risk label (Phase 4)</div>
          </button>
        </div>
      </div>
      
      <!-- JSON Structure Visualization -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4">Sơ đồ tri thức</h2>
        <div v-if="rules" class="grid grid-cols-3 gap-4">
          <!-- Mindmap Visualization -->
          <div class="col-span-2">
            <div ref="graphContainer" class="relative border-2 border-yellow-200 rounded-lg bg-white" style="height: 500px;"></div>
          </div>
          
          <!-- Detail Panel -->
          <div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50" style="height: 500px; overflow-y: auto;">
            <div v-if="selectedNode">
              <h3 class="font-bold text-lg mb-3">{{ selectedNode.label }}</h3>
              <div class="text-sm space-y-2">
                <div v-if="selectedNode.data.name">
                  <strong>Name:</strong> {{ selectedNode.data.name }}
                </div>
                <div v-if="selectedNode.data.description">
                  <strong>Description:</strong>
                  <p class="text-gray-600 mt-1">{{ selectedNode.data.description }}</p>
                </div>
                <div v-if="selectedNode.data.category">
                  <strong>Category:</strong> {{ selectedNode.data.category }}
                </div>
                <div v-if="selectedNode.data.ranges">
                  <strong>Ranges:</strong>
                  <div class="mt-1 space-y-1">
                    <div v-for="(range, i) in selectedNode.data.ranges" :key="i" class="text-xs bg-white p-2 rounded">
                      <div>Risk: <span class="font-medium">{{ range.risk_level }}</span></div>
                      <div>Points: {{ range.risk_point }}</div>
                    </div>
                  </div>
                </div>
                <div v-if="selectedNode.data.conditions">
                  <strong>Conditions:</strong>
                  <div class="mt-1 space-y-1">
                    <div v-for="(cond, i) in selectedNode.data.conditions" :key="i" class="text-xs bg-white p-2 rounded">
                      {{ cond.indicator }} {{ cond.operator }} {{ cond.value }}
                    </div>
                  </div>
                </div>
                <div v-if="selectedNode.data.calculation">
                  <strong>Formula:</strong>
                  <div class="mt-1 bg-white p-2 rounded text-xs font-mono">
                    <div v-if="selectedNode.data.calculation.operation === 'divide'">
                      {{ selectedNode.data.calculation.numerator.field }} / {{ selectedNode.data.calculation.denominator.field }}
                    </div>
                    <div v-else-if="selectedNode.data.calculation.operation === 'multiply'">
                      {{ selectedNode.data.calculation.numerator.field }} × {{ selectedNode.data.calculation.denominator.field }}
                    </div>
                    <div v-else>
                      {{ JSON.stringify(selectedNode.data.calculation) }}
                    </div>
                  </div>
                  <div v-if="selectedNode.data.company_type" class="mt-2 text-xs">
                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">{{ selectedNode.data.company_type }}</span>
                  </div>
                </div>
                <button @click="scrollToRule" class="mt-4 w-full btn-secondary text-sm">
                  Jump to JSON
                </button>
              </div>
            </div>
            <div v-else class="text-center text-gray-400 mt-20">
              Click a node to view details
            </div>
          </div>
        </div>
      </div>
      
      <!-- Rules Editor -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold mb-4">Rules Editor</h2>
        
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
        </div>
        
        <div v-else-if="rules">
          <div class="mb-4 flex gap-3 items-center">
            <button @click="saveRules" class="btn-primary" :disabled="!hasChanges">
              Save Rules
            </button>
            <button @click="loadRules" class="btn-secondary">
              Reload
            </button>
            <button @click="resetToOriginal" class="btn-secondary" :disabled="!hasChanges">
              Reset to Original
            </button>
            <span v-if="hasChanges" class="text-sm text-orange-600 font-medium">
              ⚠️ Unsaved changes
            </span>
          </div>
          
          <div ref="jsonEditorContainer" class="border rounded-lg overflow-auto" style="max-height: 600px;">
            <vue-json-pretty
              v-model:data="editableRules"
              v-model:selectedValue="selectedPath"
              :editable="true"
              :show-line="true"
              :show-length="true"
              :deep="5"
              :highlight-selected-node="true"
              :selectable-type="'single'"
              @update:data="handleJsonChange"
            />
          </div>
          
          <div v-if="jsonError" class="mt-2 text-red-600 text-sm">
            ⚠️ Invalid JSON: {{ jsonError }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

const store = useKnowledgeStore()

const selectedType = ref('indicator')
const jsonError = ref(null)
const graphContainer = ref(null)
const selectedNode = ref(null)
const originalRules = ref(null)
const editableRules = ref(null)
const hasChanges = ref(false)
const jsonEditorContainer = ref(null)
const selectedPath = ref('')
let network = null

const rules = computed(() => store.rules)
const isCustom = computed(() => store.isCustom)
const loading = computed(() => store.loading)
const knowledgeGraph = computed(() => store.knowledgeGraph)

onMounted(async () => {
  await store.loadRuleTypes()
  await loadRules()
  // Ensure mindmap renders on initial load
  if (rules.value) {
    renderMindmap(rules.value)
  }
})

watch(rules, (newRules) => {
  if (newRules) {
    selectedNode.value = null
    originalRules.value = JSON.parse(JSON.stringify(newRules))
    editableRules.value = JSON.parse(JSON.stringify(newRules))
    hasChanges.value = false
    renderMindmap(newRules)
  }
})

function handleJsonChange(newData) {
  editableRules.value = newData
  checkForChanges()
}

watch(selectedType, async () => {
  // Khi đổi file type, load rules mới và render mindmap
  await loadRules()
})

async function loadRules() {
  try {
    await store.loadRules(selectedType.value)
    // The watch(rules) will handle updating the editor and originalRules
  } catch (error) {
    console.error('Error loading rules:', error)
    alert('Error loading rules: ' + error.message)
  }
}

function checkForChanges() {
  if (!originalRules.value || !editableRules.value) {
    hasChanges.value = false
    return
  }
  
  const currentStr = JSON.stringify(editableRules.value)
  const originalStr = JSON.stringify(originalRules.value)
  hasChanges.value = currentStr !== originalStr
}

function renderMindmap(rulesData) {
  if (!graphContainer.value || !rulesData) return
  
  const container = graphContainer.value
  container.innerHTML = ''
  
  const width = container.clientWidth
  const height = container.clientHeight
  
  // Parse rules based on type
  let items = []
  if (Array.isArray(rulesData)) {
    items = rulesData
  } else if (rulesData.risk_signal_rules) {
    items = rulesData.risk_signal_rules
  } else if (rulesData.risk_label_rules) {
    items = rulesData.risk_label_rules
  } else if (rulesData.indicator_rules) {
    items = rulesData.indicator_rules
  }
  
  if (items.length === 0) {
    container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">No data to visualize</div>'
    return
  }
  
  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', width)
  svg.setAttribute('height', height)
  svg.style.position = 'absolute'
  svg.style.top = '0'
  svg.style.left = '0'
  container.appendChild(svg)
  
  // Root node
  const rootX = width / 2
  const rootY = 80
  const rootNode = document.createElement('div')
  rootNode.className = 'absolute transform -translate-x-1/2 -translate-y-1/2'
  rootNode.style.left = rootX + 'px'
  rootNode.style.top = rootY + 'px'
  rootNode.innerHTML = `
    <div class="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg font-bold">
      ${selectedType.value.toUpperCase()} RULES
    </div>
  `
  container.appendChild(rootNode)
  
  // Child nodes in tree layout
  const childrenPerRow = Math.min(items.length, 6)
  const rows = Math.ceil(items.length / childrenPerRow)
  const horizontalSpacing = (width - 100) / (childrenPerRow + 1)
  const verticalSpacing = (height - 200) / (rows + 1)
  
  items.forEach((item, i) => {
    const row = Math.floor(i / childrenPerRow)
    const col = i % childrenPerRow
    const itemsInRow = Math.min(childrenPerRow, items.length - row * childrenPerRow)
    const startX = (width - (itemsInRow - 1) * horizontalSpacing) / 2
    
    const x = startX + col * horizontalSpacing
    const y = rootY + 150 + row * verticalSpacing
    
    // Draw line from root to child
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', rootX)
    line.setAttribute('y1', rootY + 20)
    line.setAttribute('x2', x)
    line.setAttribute('y2', y - 20)
    line.setAttribute('stroke', '#fbbf24')
    line.setAttribute('stroke-width', '2')
    line.setAttribute('opacity', '0.3')
    svg.appendChild(line)
    
    // Child node
    const nodeEl = document.createElement('div')
    nodeEl.className = 'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform'
    nodeEl.style.left = x + 'px'
    nodeEl.style.top = y + 'px'
    
    let label = ''
    let description = ''
    
    if (selectedType.value === 'risk_signal') {
      label = item.indicator || `Item ${i+1}`
      description = item.name || item.description || ''
    } else if (selectedType.value === 'risk_label') {
      label = item.composite_risk || item.rule_id || `Rule ${i+1}`
      description = item.description || ''
    } else if (selectedType.value === 'indicator') {
      label = item.indicator || `Calc ${i+1}`
      description = item.description || ''
    }
    
    nodeEl.title = description
    nodeEl.innerHTML = `
      <div class="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap hover:bg-blue-600">
        ${label}
      </div>
    `
    
    // Click handler
    nodeEl.addEventListener('click', () => {
      selectedNode.value = {
        label,
        data: item,
        fullData: JSON.stringify(item)  // Store full item data for exact matching
      }
    })
    
    container.appendChild(nodeEl)
  })
  
  // Legend
  const legend = document.createElement('div')
  legend.className = 'absolute bottom-4 right-4 bg-white p-3 rounded shadow text-sm'
  legend.innerHTML = `<strong>${items.length}</strong> ${selectedType.value} rules`
  container.appendChild(legend)
}



function scrollToRule() {
  if (!selectedNode.value) {
    return
  }
  
  // First scroll to the editor section
  const headings = document.querySelectorAll('h2')
  let editorSection = null
  
  for (const heading of headings) {
    if (heading.textContent.includes('Rules Editor')) {
      editorSection = heading.closest('.bg-white.rounded-lg.shadow')
      break
    }
  }
  
  if (editorSection) {
    editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  
  // Use vue-json-pretty's built-in path selection
  setTimeout(() => {
    const targetData = selectedNode.value.fullData
    
    // Find the index in the data array
    let foundIndex = -1
    let arrayKey = ''
    
    if (Array.isArray(editableRules.value)) {
      foundIndex = editableRules.value.findIndex(item => 
        JSON.stringify(item) === targetData
      )
      arrayKey = 'root'
    } else if (editableRules.value?.indicator_rules) {
      foundIndex = editableRules.value.indicator_rules.findIndex(item => 
        JSON.stringify(item) === targetData
      )
      arrayKey = 'root.indicator_rules'
    } else if (editableRules.value?.risk_signal_rules) {
      foundIndex = editableRules.value.risk_signal_rules.findIndex(item => 
        JSON.stringify(item) === targetData
      )
      arrayKey = 'root.risk_signal_rules'
    } else if (editableRules.value?.risk_label_rules) {
      foundIndex = editableRules.value.risk_label_rules.findIndex(item => 
        JSON.stringify(item) === targetData
      )
      arrayKey = 'root.risk_label_rules'
    }
    
    if (foundIndex >= 0) {
      // Set the path to select the item in vue-json-pretty
      selectedPath.value = `${arrayKey}[${foundIndex}]`
      
      // Wait for vue-json-pretty to render the highlight, then scroll to it
      setTimeout(() => {
        const highlightedNode = jsonEditorContainer.value?.querySelector('.is-highlight')
        if (highlightedNode) {
          highlightedNode.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
        }
      }, 200)
    }
  }, 300)
}

function resetToOriginal() {
  if (!originalRules.value) return
  
  if (confirm('Are you sure you want to discard all changes and reset to the original?')) {
    editableRules.value = JSON.parse(JSON.stringify(originalRules.value))
    hasChanges.value = false
  }
}

async function saveRules() {
  try {
    await store.saveRules(selectedType.value, editableRules.value)
    originalRules.value = JSON.parse(JSON.stringify(editableRules.value))
    hasChanges.value = false
    alert('Rules saved successfully!')
    jsonError.value = null
  } catch (error) {
    jsonError.value = error.message
    alert('Error saving rules: ' + error.message)
  }
}

async function restoreDefault() {
  if (confirm('Are you sure you want to restore default rules? This will overwrite your custom rules.')) {
    try {
      await store.restoreDefault(selectedType.value)
      alert('Default rules restored!')
    } catch (error) {
      alert('Failed to restore: ' + error.message)
    }
  }
}
</script>
