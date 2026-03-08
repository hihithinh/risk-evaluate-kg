# risk-evaluate-kg

Dự án đánh giá rủi ro doanh nghiệp sử dụng Knowledge Graph.

## Cài đặt môi trường

### Yêu cầu
- Conda hoặc Miniconda đã được cài đặt

### Các bước setup

1. **Tạo conda environment từ file `environment.yml`:**
```bash
conda env create -f environment.yml
```

2. **Kích hoạt environment:**
```bash
conda activate risk-evaluate-kg
```

3. **Kiểm tra cài đặt:**
```bash
python -c "import pandas; import vnstock; print('Setup thành công!')"
```

## Cấu trúc dự án

```
.
├── pipeline/
│   ├── 1_data_processing/      # Xử lý dữ liệu tài chính
│   │   ├── main.ipynb          # Notebook thu thập dữ liệu (legacy)
│   │   ├── data_crawler.py     # Script thu thập dữ liệu từ vnstock
│   │   ├── preprocessing.ipynb # Notebook tiền xử lý (legacy)
│   │   └── preprocessing.py    # Script tiền xử lý dữ liệu
│   ├── 2_cronbach_validation/  # Kiểm định Cronbach's Alpha
│   ├── 3_risk_score_model/     # Mô hình tính điểm rủi ro
│   │   └── scoring_model.py    # Script tính điểm rủi ro
│   └── 4_risk_knowledge_model/ # Mô hình Knowledge Graph
│       ├── indicator_rules.json    # Luật đánh giá chỉ số đơn lẻ
│       └── composite_rules.json    # Luật đánh giá tổng hợp
├── dataset/
│   ├── raw_financial_data.csv  # Dữ liệu thô từ vnstock
│   ├── financial_features.csv  # Dữ liệu đặc trưng
│   ├── risk_scores.csv         # Kết quả đánh giá rủi ro
│   └── cleaned_data/           # Dữ liệu đã xử lý
│       ├── income_statement_clean.csv
│       ├── balance_sheet_clean.csv
│       ├── cash_flow_clean.csv
│       └── financial_ratios_A1_D3.csv
├── environment.yml             # Conda environment configuration
└── README.md
```

## Hướng dẫn chạy đầy đủ

### ⚠️ Quan trọng: Kích hoạt conda environment trước khi chạy

**Mỗi lần mở terminal mới, bạn phải kích hoạt environment:**

```bash
conda activate risk-evaluate-kg
```

### Pipeline xử lý dữ liệu (chạy theo thứ tự)

#### Bước 1: Thu thập dữ liệu tài chính

```bash
# Kích hoạt environment
conda activate risk-evaluate-kg

# Di chuyển vào thư mục
cd pipeline/1_data_processing

# Chạy script thu thập dữ liệu
python data_crawler.py
```

**Script này sẽ:**
- Lấy dữ liệu báo cáo tài chính từ 30 công ty niêm yết
- Bao gồm: báo cáo kết quả kinh doanh, bảng cân đối kế toán, báo cáo lưu chuyển tiền tệ
- Xử lý rate limit tự động (retry mechanism)
- Xuất file CSV vào `dataset/raw_financial_data.csv`
- ⏱️ Thời gian chạy: ~30-60 phút (tùy thuộc vào rate limit)

#### Bước 2: Tiền xử lý dữ liệu

```bash
# Kích hoạt environment (nếu chưa)
conda activate risk-evaluate-kg

# Di chuyển vào thư mục (nếu chưa)
cd pipeline/1_data_processing

# Chạy script tiền xử lý
python preprocessing.py
```

**Script này sẽ:**
- Đọc dữ liệu từ `dataset/raw_financial_data.csv`
- Tách dữ liệu theo loại báo cáo (income statement, balance sheet, cash flow)
- Loại bỏ các cột rỗng
- Tính toán các chỉ số tài chính (A1-A3, B1-B3, C1-C3, D1-D3)
- Lưu kết quả vào `dataset/cleaned_data/`:
  - `income_statement_clean.csv`
  - `balance_sheet_clean.csv`
  - `cash_flow_clean.csv`
  - `financial_ratios_A1_D3.csv`
- ⏱️ Thời gian chạy: ~1-2 phút

#### Bước 3: Tính điểm rủi ro

```bash
# Kích hoạt environment (nếu chưa)
conda activate risk-evaluate-kg

# Di chuyển vào thư mục
cd pipeline/3_risk_score_model

# Chạy scoring model
python scoring_model.py
```

**Script này sẽ:**
- Đọc dữ liệu từ `dataset/financial_features.csv`
- Load các luật đánh giá từ `pipeline/4_risk_knowledge_model/`
- Đánh giá rủi ro cho từng công ty theo từng kỳ
- Tính toán risk score (0-1) và risk label (Good/Medium/High)
- Lưu kết quả vào `dataset/risk_scores.csv`
- Hiển thị thống kê tổng quan
- ⏱️ Thời gian chạy: ~30 giây

### Chạy nhanh toàn bộ pipeline

```bash
# Kích hoạt environment
conda activate risk-evaluate-kg

# Bước 1: Thu thập dữ liệu
## nếu đang ở
cd pipeline/1_data_processing
python data_crawler.py
## nếu đang ở root
python pipeline/1_data_processing/data_crawler.py

# Bước 2: Tiền xử lý
cd pipeline/1_data_processing
python preprocessing.py
## hoặc nếu đang ở root
python pipeline/1_data_processing/preprocessing.py

# Bước 3: Tính điểm rủi ro
cd pipeline/3_risk_score_model
python scoring_model.py
## hoặc nếu đang ở root
python pipeline/3_risk_score_model/scoring_model.py
```

## Gỡ lỗi

### Nếu gặp lỗi khi tạo environment:
```bash
# Xóa environment cũ (nếu có)
conda env remove -n risk-evaluate-kg

# Tạo lại
conda env create -f environment.yml
```

### Nếu cần cập nhật packages:
```bash
conda activate risk-evaluate-kg
conda update --all
```

## Kiểm tra kết quả

### Xem dữ liệu đã thu thập
```bash
# Xem 10 dòng đầu của dữ liệu thô
head -10 dataset/raw_financial_data.csv

# Đếm số dòng
wc -l dataset/raw_financial_data.csv
```

### Xem kết quả đánh giá rủi ro
```bash
# Xem kết quả risk scores
head -20 dataset/risk_scores.csv

# Hoặc dùng Python
python -c "import pandas as pd; df = pd.read_csv('dataset/risk_scores.csv'); print(df.head(20))"
```

## Ghi chú

- **Quan trọng:** Luôn chạy `conda activate risk-evaluate-kg` trước khi chạy bất kỳ script Python nào
- Dữ liệu từ vnstock có giới hạn API (20 requests/phút cho gói miễn phí)
- Script đã tích hợp retry mechanism để xử lý rate limit tự động
- Để tăng tốc độ thu thập dữ liệu, cân nhắc đăng ký API key tại https://vnstocks.com/login
- Tất cả các script đã được cấu hình để tự động tìm đường dẫn project root, có thể chạy từ bất kỳ thư mục nào
