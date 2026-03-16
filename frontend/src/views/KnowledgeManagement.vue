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
        <div class="flex items-center justify-between mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rule Type</label>
            <select v-model="selectedType" @change="loadRules" class="input-field w-64">
              <option value="indicator">Indicator Rules</option>
              <option value="composite">Composite Rules</option>
              <option value="calculation">Calculation Rules</option>
            </select>
          </div>
          
          <div class="flex gap-3">
            <button 
              @click="saveRules" 
              :disabled="loading"
              class="btn-primary"
            >
              Save Custom Rules
            </button>
            <button 
              @click="restoreDefault" 
              :disabled="loading"
              class="btn-secondary"
            >
              Restore Default
            </button>
          </div>
        </div>
        
        <div v-if="isCustom" class="text-sm text-yellow-600">
          ⚠️ Using custom rules
        </div>
      </div>
      
      <!-- JSON Structure Visualization -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4">{{ selectedType.charAt(0).toUpperCase() + selectedType.slice(1) }} Rules Structure</h2>
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
          <pre 
            ref="editorContainer"
            class="w-full h-96 font-mono text-sm p-4 border border-gray-300 rounded bg-gray-50 overflow-auto"
            contenteditable="true"
            @input="handleEditorInput"
            @blur="validateJson"
          ><code class="language-json">{{ rulesJson }}</code></pre>
          
          <div v-if="jsonError" class="mt-2 text-red-600 text-sm">
            ⚠️ Invalid JSON: {{ jsonError }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge.store'

const store = useKnowledgeStore()

const selectedType = ref('indicator')
const rulesJson = ref('')
const jsonError = ref(null)
const graphContainer = ref(null)
const editorContainer = ref(null)
const selectedNode = ref(null)
let network = null

const rules = computed(() => store.rules)
const isCustom = computed(() => store.isCustom)
const loading = computed(() => store.loading)
const knowledgeGraph = computed(() => store.knowledgeGraph)

onMounted(async () => {
  await store.loadRuleTypes()
  await loadRules()
})

watch(rules, async (newRules) => {
  if (newRules) {
    rulesJson.value = JSON.stringify(newRules, null, 2)
    selectedNode.value = null
    // Auto-render mindmap khi rules thay đổi
    await nextTick()
    renderMindmap(newRules)
    applySyntaxHighlighting()
  }
})

function applySyntaxHighlighting() {
  if (!editorContainer.value) return
  
  // Simple syntax highlighting
  const code = editorContainer.value.querySelector('code')
  if (code) {
    let html = rulesJson.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, '<span style="color: #0066cc;">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span style="color: #008800;">"$1"</span>')
      .replace(/: (true|false|null)/g, ': <span style="color: #aa00aa;">$1</span>')
      .replace(/: (\d+)/g, ': <span style="color: #dd4400;">$1</span>')
    code.innerHTML = html
  }
}

watch(selectedType, async () => {
  // Khi đổi file type, load rules mới và render mindmap
  await loadRules()
})

async function loadRules() {
  await store.loadRules(selectedType.value)
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
  } else if (rulesData.indicator_rules) {
    items = rulesData.indicator_rules
  } else if (rulesData.composite_rules) {
    items = rulesData.composite_rules
  } else if (rulesData.calculation_rules) {
    items = rulesData.calculation_rules
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
    
    if (selectedType.value === 'indicator') {
      label = item.indicator || `Item ${i+1}`
      description = item.name || item.description || ''
    } else if (selectedType.value === 'composite') {
      label = item.composite_risk || item.rule_id || `Rule ${i+1}`
      description = item.description || ''
    } else if (selectedType.value === 'calculation') {
      label = item.indicator || `Calc ${i+1}`
      description = item.description || ''
    }
    
    nodeEl.title = description
    nodeEl.innerHTML = `
      <div class="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap hover:bg-blue-600">
        ${label}
        <span class="ml-1 text-xs">▼</span>
      </div>
    `
    
    // Click handler
    nodeEl.addEventListener('click', () => {
      selectedNode.value = {
        label,
        data: item
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

function handleEditorInput(event) {
  rulesJson.value = event.target.textContent
}

function validateJson() {
  try {
    JSON.parse(rulesJson.value)
    jsonError.value = null
  } catch (error) {
    jsonError.value = error.message
  }
}

function scrollToRule() {
  if (!selectedNode.value || !editorContainer.value) return
  
  const label = selectedNode.value.label
  const content = editorContainer.value.textContent
  
  // Find the position of this rule in JSON
  let searchTerm = ''
  if (selectedType.value === 'indicator') {
    searchTerm = `"indicator": "${label}"`
  } else if (selectedType.value === 'composite') {
    searchTerm = `"rule_id": "${label}"`
  }
  
  const index = content.indexOf(searchTerm)
  if (index !== -1) {
    // Scroll to position
    const lines = content.substring(0, index).split('\n')
    const lineNumber = lines.length
    const lineHeight = 20
    editorContainer.value.scrollTop = (lineNumber - 5) * lineHeight
    
    // Highlight briefly
    editorContainer.value.classList.add('ring-2', 'ring-yellow-400')
    setTimeout(() => {
      editorContainer.value.classList.remove('ring-2', 'ring-yellow-400')
    }, 1000)
  }
}

async function saveRules() {
  try {
    const content = editorContainer.value ? editorContainer.value.textContent : rulesJson.value
    const parsed = JSON.parse(content)
    await store.saveRules(selectedType.value, parsed)
    alert('Rules saved successfully!')
  } catch (error) {
    alert('Failed to save rules: ' + error.message)
  }
}

async function restoreDefault() {
  if (confirm('Are you sure you want to restore default rules?')) {
    try {
      await store.restoreDefault(selectedType.value)
      alert('Default rules restored!')
    } catch (error) {
      alert('Failed to restore: ' + error.message)
    }
  }
}
</script>
