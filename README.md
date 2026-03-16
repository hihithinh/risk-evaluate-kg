# Risk Evaluation System

Full-stack hệ thống đánh giá rủi ro doanh nghiệp với Vue 3 + Express + Knowledge Graph.

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd server
npm install
npm start
# Server: http://localhost:3000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Frontend: http://localhost:5173
```

### 3. Core Engine Setup (cho crawler)

```bash
# Setup Python venv
python3 -m venv venv
source venv/bin/activate
pip install vnstock

# Test crawler
cd src
npm install
npm run crawler:test
```

## 📁 Structure

```
server/                      # Express backend
├── routes/                  # API routes
├── controllers/             # Request handlers
└── services/                # Business logic

frontend/                    # Vue 3 frontend
├── src/
│   ├── views/               # Pages (Dashboard, Knowledge, Evaluation, Bulk)
│   ├── stores/              # Pinia state management
│   ├── services/            # API calls
│   └── utils/               # Utilities

src/                         # Core inference engine
├── core/                    # InferenceEngine, SingleSymbolInference
├── phases/                  # 4 phases pipeline
├── concepts/                # OOP company types
├── crawler/                 # Data crawler
└── batch/                   # Batch processing

rules/                       # Inference rules (JSON)
storage/                     # File storage
```

## 🎯 Features

### 1. Knowledge Management (🟡 Yellow)
- Visualize knowledge graph
- Edit inference rules (indicator, composite, calculation)
- Save custom rules → `storage/app/rules/`
- Restore default rules

### 2. Single Company Evaluation (🔵 Blue)
- Input: Ticker, Quarter, Year
- Auto-complete ticker suggestions
- Real-time risk evaluation
- Detailed indicator analysis
- Composite risk inference

### 3. Bulk Evaluation (🟢 Green)
- Upload CSV file
- Preview data
- Batch processing with progress tracking
- Cronbach's alpha validation
- Download results

## 🧪 Testing

### Backend API Test
```bash
cd server
npm test
# Tests: Health check, Knowledge API, Evaluation API, Bulk API
```

### Frontend Development
```bash
cd frontend
npm run dev
# Access: http://localhost:5173
```

## 📊 API Endpoints

- `GET /api/health` - Health check
- `GET /api/knowledge/graph` - Knowledge graph
- `GET /api/knowledge/rules/:type` - Get rules
- `POST /api/knowledge/rules/:type` - Save rules
- `POST /api/evaluation/evaluate` - Evaluate company
- `POST /api/bulk/upload` - Upload CSV
- `POST /api/bulk/evaluate` - Batch evaluation

## 🔧 Tech Stack

**Backend**: Express.js, Multer, UUID, CSV Parser
**Frontend**: Vue 3, Vite, Pinia, Axios, Tailwind CSS
**Engine**: Node.js inference engine với OOP design
**Data**: Python vnstock crawler
