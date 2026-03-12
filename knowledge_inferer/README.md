# Knowledge Inference Engine

Bộ suy diễn tri thức cho hệ thống đánh giá rủi ro tài chính doanh nghiệp.

## Kiến trúc

Hệ thống được thiết kế dựa trên **Extended Rela-model** với 4 pha suy diễn:

### Phase 1: Data Standardization & Integration
- **Module**: `phase1_data_standardization.py`
- **Chức năng**: Chuẩn hóa và hợp nhất dữ liệu từ 3 nguồn báo cáo tài chính
- **Input**: Dữ liệu thô từ `raw_financial_data.csv`
- **Output**: DataFrame đã được chuẩn hóa và hợp nhất
- **Các bước**:
  1. Load raw data
  2. Split by report type (income_statement, balance_sheet, cash_flow)
  3. Remove empty columns
  4. Merge reports
  5. Validate data

### Phase 2: Indicator Calculation
- **Module**: `phase2_indicator_calculation.py`
- **Chức năng**: Tính toán 12 chỉ số tài chính (A1-D3)
- **Input**: DataFrame đã chuẩn hóa
- **Output**: DataFrame với các cột chỉ số tài chính
- **Heuristic**: H4 - Ưu tiên xác định thuộc tính
- **Chỉ số**:
  - **A (Liquidity)**: A1, A2, A3
  - **B (Leverage)**: B1, B2, B3
  - **C (Efficiency)**: C1, C2, C3
  - **D (Profitability)**: D1, D2, D3

### Phase 3: Risk Evaluation
- **Module**: `phase3_risk_evaluation.py`
- **Chức năng**: Đánh giá rủi ro cục bộ cho từng chỉ số
- **Input**: DataFrame với các chỉ số tài chính
- **Output**: DataFrame với risk_level, risk_point, risk_type cho mỗi chỉ số
- **Heuristic**: H2 - Sắp xếp ưu tiên luật đơn
- **Risk Levels**: Good, Medium, High

### Phase 4: Composite Risk Inference
- **Module**: `phase4_composite_inference.py`
- **Chức năng**: Suy luận rủi ro phức hợp từ kết hợp nhiều tín hiệu
- **Input**: Kết quả đánh giá từ Phase 3
- **Output**: Danh sách các rủi ro phức hợp được phát hiện
- **Composite Rules**: 13 luật (R1-R13)

## Cấu trúc thư mục

```
knowledge_inferer/
├── __init__.py                          # Package initialization
├── phase1_data_standardization.py      # Phase 1: Chuẩn hóa dữ liệu
├── phase2_indicator_calculation.py     # Phase 2: Tính chỉ số
├── phase3_risk_evaluation.py           # Phase 3: Đánh giá rủi ro
├── phase4_composite_inference.py       # Phase 4: Suy luận phức hợp
├── inference_engine.py                 # Main orchestrator
├── example_usage.py                    # Ví dụ sử dụng
└── README.md                           # Documentation
```

## Cài đặt

```bash
pip install pandas numpy openpyxl
```

## Sử dụng

### 1. Batch Inference (Toàn bộ dataset)

```python
from knowledge_inferer import InferenceEngine

engine = InferenceEngine(config_dir='rules')

results = engine.run_full_pipeline(
    raw_data_path='dataset/raw_financial_data.csv'
)

engine.export_results('output/results.csv', format='csv')
```

### 2. Single Company Analysis

```python
from knowledge_inferer import InferenceEngine

engine = InferenceEngine(config_dir='rules')

result = engine.infer_single_company(
    raw_data_path='dataset/raw_financial_data.csv',
    ticker='HPG',
    year=2024,
    quarter=3
)

print(result['explanation'])
print(f"Risk Score: {result['final_score']['risk_score']:.2%}")
print(f"Risk Level: {result['final_score']['risk_level']}")
```

### 3. Sử dụng từng Phase riêng lẻ

```python
from knowledge_inferer import (
    DataStandardizer,
    IndicatorCalculator,
    RiskEvaluator,
    CompositeInferer
)

# Phase 1
standardizer = DataStandardizer('rules/schema_mapping.json')
df = standardizer.standardize('dataset/raw_financial_data.csv')

# Phase 2
calculator = IndicatorCalculator('rules/calculation_rules.json')
df = calculator.calculate_batch(df)

# Phase 3
evaluator = RiskEvaluator('rules/indicator_rules.json')
df = evaluator.evaluate_batch(df)

# Phase 4
inferer = CompositeInferer('rules/composite_rules.json')
df = inferer.infer_batch(df)
```

## Output Format

### Kết quả cho một công ty

```python
{
    'company_info': {
        'ticker': 'HPG',
        'year': 2024,
        'quarter': 3
    },
    'indicators': {
        'A1': 1.5,
        'A2': 1.2,
        # ... các chỉ số khác
    },
    'evaluations': {
        'A1': {
            'risk_level': 'Medium',
            'risk_point': 1,
            'risk_type': 'liquidity_risk',
            'explanation': '...'
        },
        # ... đánh giá các chỉ số khác
    },
    'risk_summary': {
        'total_risk_points': 8,
        'risk_score': 0.33,
        'overall_risk_level': 'Medium',
        'high_risk_indicators': ['B1', 'D3'],
        'medium_risk_indicators': ['A1', 'C2']
    },
    'composite_risks': [
        {
            'rule_id': 'R1',
            'risk_type': 'financial_distress',
            'severity': 'high',
            'explanation': '...'
        }
    ],
    'final_score': {
        'risk_score': 0.45,
        'risk_level': 'Medium',
        'total_risk_points': 15,
        'composite_risk_count': 2
    },
    'explanation': '...'
}
```

## Ví dụ

Chạy file `example_usage.py`:

```bash
cd knowledge_inferer
python example_usage.py
```

Chọn một trong các ví dụ:
1. Batch inference (all companies)
2. Single company analysis
3. Compare multiple companies

## Tham khảo

- **Báo cáo**: `Mô hình tri thức - báo cáo cuối kỳ.md`
- **Schema Mapping**: `rules/schema_mapping.json`
- **Calculation Rules**: `rules/calculation_rules.json`
- **Indicator Rules**: `rules/indicator_rules.json`
- **Composite Rules**: `rules/composite_rules.json`

## Lưu ý

- Đảm bảo các file JSON rules đã được tạo trong thư mục `rules/`
- Dữ liệu đầu vào phải có đầy đủ các trường theo schema mapping
- Hệ thống xử lý an toàn các giá trị NaN và division by zero
