# Pipeline - Bulk Financial Risk Assessment

Pipeline xử lý hàng loạt dữ liệu tài chính với **Cronbach validation** trước khi đánh giá rủi ro.

## Cấu trúc

```
pipeline/
├── 1_data_processing/       # Data crawling & preprocessing (legacy)
├── 2_cronbach_validation/   # Statistical validation (legacy, giờ tích hợp vào pipeline_runner)
├── 3_risk_score_model/      # Old scoring model (deprecated)
└── pipeline_runner.py       # NEW: Bulk processing với cronbach validation
```

## Pipeline Flow

```
Raw CSV 
  ↓
Phase 1: Data Standardization (merge 3 reports, validate)
  ↓
Phase 2: Indicator Calculation (tính 12 chỉ số A1-D3)
  ↓
Cronbach Validation + Statistics (validate reliability của indicators)
  ↓
Phase 3: Risk Evaluation (đánh giá từng indicator)
  ↓
Phase 4: Composite Risk Inference (suy luận rủi ro phức hợp)
  ↓
Output CSV + Validation JSON
```

**Khác biệt với Inferer:**
- **Pipeline**: Có thêm bước **Cronbach validation** sau Phase 2 (để validate độ tin cậy của indicators trên toàn bộ dataset)
- **Inferer**: Không có cronbach (vì chỉ xử lý 1 record, không đủ data để tính cronbach)

## Usage

### Bulk Processing

```python
from pipeline.pipeline_runner import run_bulk_pipeline

# Xử lý toàn bộ CSV file với cronbach validation
results_df, validation_results = run_bulk_pipeline(
    raw_data_path='dataset/raw_financial_data.csv',
    output_path='dataset/risk_assessment_results.csv',
    config_dir='rules',
    validation_output='dataset/validation_results.json'
)
```

### Command Line

```bash
cd pipeline
python pipeline_runner.py
```

## Input Format

CSV file với các cột:
- `ticker`, `yearReport`, `lengthReport`
- Các cột từ 3 báo cáo tài chính (income_statement, balance_sheet, cash_flow)

## Output Format

### 1. Risk Assessment CSV (`risk_assessment_results.csv`)

**Basic Info:**
- `ticker`, `symbol`, `yearReport`, `lengthReport`

**Phase 2: Indicators (12 chỉ số):**
- `A1`, `A2`, `A3` (Liquidity)
- `B1`, `B2`, `B3` (Leverage)
- `C1`, `C2`, `C3` (Efficiency)
- `D1`, `D2`, `D3` (Profitability)

**Phase 3: Risk Evaluation (cho mỗi indicator):**
- `{indicator}_risk_level` (Good/Medium/High)
- `{indicator}_risk_point` (0-2)
- `{indicator}_risk_type` (liquidity_risk, leverage_risk, etc.)

**Phase 4: Composite Risks:**
- `composite_risks_json` (JSON string of activated rules)
- `composite_risk_count` (số lượng composite risks)

### 2. Validation JSON (`validation_results.json`)

```json
{
  "cronbach_results": {
    "A": {"alpha": 0.85, "interpretation": "Good", "n_items": 3, "n_samples": 1234},
    "B": {"alpha": 0.78, "interpretation": "Good", "n_items": 3, "n_samples": 1234},
    "C": {"alpha": 0.72, "interpretation": "Good", "n_items": 3, "n_samples": 1234},
    "D": {"alpha": 0.81, "interpretation": "Good", "n_items": 3, "n_samples": 1234}
  },
  "descriptive_stats": {...},
  "n_samples": 1234
}
```

## So sánh Pipeline vs Inferer

| Feature | Pipeline | Inferer |
|---------|----------|---------|
| **Input** | CSV file (bulk) | Single row / company |
| **Processing** | Batch (toàn bộ file) | Single record |
| **Cronbach Validation** | ✅ Yes (sau Phase 2) | ❌ No (không đủ data) |
| **Output** | CSV + Validation JSON | Dict/JSON |
| **Use Case** | Xử lý hàng loạt + validation | Real-time analysis |
| **Architecture** | 4 phases + validation | 4 phases |
| **Rules** | `/rules/` (giống nhau) | `/rules/` (giống nhau) |

## Legacy Components

### 1_data_processing/
- `data_crawler.py` - Crawl dữ liệu từ vnstock
- `preprocessing.py` - Tính toán 12 chỉ số A1-D3 (legacy, giờ dùng Phase 2)

### 2_cronbach_validation/
- `cronbach.py` - Validation thống kê (Cronbach's Alpha)

### 3_risk_score_model/
- `scoring_model.py` - Old scoring model (deprecated, thay bằng InferenceEngine)

**⚠️ Các file legacy này giữ lại để tham khảo, nhưng production nên dùng `pipeline_runner.py`**

## Demo Application Plan

Xem chi tiết tại `DEMO_PLAN.md`:
- **Tab 1**: Single report analysis (real-time, step-by-step)
- **Tab 2**: Bulk CSV processing (batch)
- **Tab 3**: Knowledge management (edit JSON rules)
