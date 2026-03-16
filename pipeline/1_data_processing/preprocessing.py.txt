#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import os

# Tạo đường dẫn tới thư mục dataset (2 cấp lên từ pipeline/1_data_processing)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dataset_path = os.path.join(project_root, "dataset", "raw_financial_data.csv")

df = pd.read_csv(dataset_path)
print(f"📂 Đã đọc file từ: {dataset_path}")


# In[2]:


column_mapping = {
"ticker": "Mã cổ phiếu",
"yearReport": "Năm báo cáo",
"lengthReport": "Kỳ báo cáo (quý/năm)",
"Revenue YoY (%)": "Tăng trưởng doanh thu (%)",
"Revenue (Bn. VND)": "Doanh thu (Tỷ VND)",
"Attribute to parent company (Bn. VND)": "LN thuộc cổ đông công ty mẹ (Tỷ VND)",
"Attribute to parent company YoY (%)": "Tăng trưởng LN công ty mẹ (%)",
"Financial Income": "Doanh thu tài chính",
"Interest Expenses": "Chi phí lãi vay",
"Sales": "Doanh thu bán hàng",
"Sales deductions": "Giảm trừ doanh thu",
"Net Sales": "Doanh thu thuần",
"Cost of Sales": "Giá vốn hàng bán",
"Gross Profit": "Lợi nhuận gộp",
"Financial Expenses": "Chi phí tài chính",
"Gain/(loss) from joint ventures": "Lãi/lỗ từ liên doanh liên kết",
"Selling Expenses": "Chi phí bán hàng",
"General & Admin Expenses": "Chi phí quản lý doanh nghiệp",
"Operating Profit/Loss": "Lợi nhuận hoạt động",
"Other income": "Thu nhập khác",
"Net income from associated companies": "LN từ công ty liên kết",
"Other Income/Expenses": "Thu/chi khác",
"Net other income/expenses": "Thu nhập khác thuần",
"Profit before tax": "Lợi nhuận trước thuế",
"Business income tax - current": "Thuế TNDN hiện hành",
"Business income tax - deferred": "Thuế TNDN hoãn lại",
"Net Profit For the Year": "Lợi nhuận sau thuế",
"Minority Interest": "Lợi ích cổ đông thiểu số",
"Attributable to parent company": "LN thuộc cổ đông công ty mẹ",
"symbol": "Mã chứng khoán",
"report": "Loại báo cáo",

"CURRENT ASSETS (Bn. VND)": "Tài sản ngắn hạn (Tỷ VND)",
"Cash and cash equivalents (Bn. VND)": "Tiền và tương đương tiền (Tỷ VND)",
"Short-term investments (Bn. VND)": "Đầu tư ngắn hạn (Tỷ VND)",
"Accounts receivable (Bn. VND)": "Khoản phải thu (Tỷ VND)",
"Net Inventories": "Hàng tồn kho thuần",
"Other current assets": "Tài sản ngắn hạn khác",
"LONG-TERM ASSETS (Bn. VND)": "Tài sản dài hạn (Tỷ VND)",
"Long-term loans receivables (Bn. VND)": "Cho vay dài hạn (Tỷ VND)",
"Fixed assets (Bn. VND)": "Tài sản cố định (Tỷ VND)",
"Investment in properties": "Bất động sản đầu tư",
"Long-term investments (Bn. VND)": "Đầu tư dài hạn (Tỷ VND)",
"Goodwill": "Lợi thế thương mại",
"Other non-current assets": "Tài sản dài hạn khác",
"TOTAL ASSETS (Bn. VND)": "Tổng tài sản (Tỷ VND)",

"LIABILITIES (Bn. VND)": "Tổng nợ phải trả (Tỷ VND)",
"Current liabilities (Bn. VND)": "Nợ ngắn hạn (Tỷ VND)",
"Long-term liabilities (Bn. VND)": "Nợ dài hạn (Tỷ VND)",
"OWNER'S EQUITY(Bn.VND)": "Vốn chủ sở hữu (Tỷ VND)",
"Capital and reserves (Bn. VND)": "Vốn và các quỹ (Tỷ VND)",
"Undistributed earnings (Bn. VND)": "Lợi nhuận chưa phân phối (Tỷ VND)",
"Budget sources and other funds": "Nguồn vốn ngân sách và quỹ khác",
"MINORITY INTERESTS": "Lợi ích cổ đông thiểu số",
"TOTAL RESOURCES (Bn. VND)": "Tổng nguồn vốn (Tỷ VND)",

"Prepayments to suppliers (Bn. VND)": "Trả trước cho người bán (Tỷ VND)",
"Short-term loans receivables (Bn. VND)": "Cho vay ngắn hạn (Tỷ VND)",
"Inventories, Net (Bn. VND)": "Hàng tồn kho thuần (Tỷ VND)",
"Other current assets (Bn. VND)": "Tài sản ngắn hạn khác (Tỷ VND)",
"Investment and development funds (Bn. VND)": "Quỹ đầu tư phát triển (Tỷ VND)",
"Common shares (Bn. VND)": "Cổ phiếu phổ thông (Tỷ VND)",
"Paid-in capital (Bn. VND)": "Vốn góp (Tỷ VND)",
"Long-term borrowings (Bn. VND)": "Vay dài hạn (Tỷ VND)",
"Advances from customers (Bn. VND)": "Người mua trả tiền trước (Tỷ VND)",
"Short-term borrowings (Bn. VND)": "Vay ngắn hạn (Tỷ VND)",
"Good will (Bn. VND)": "Lợi thế thương mại (Tỷ VND)",
"Long-term prepayments (Bn. VND)": "Trả trước dài hạn (Tỷ VND)",
"Other long-term assets (Bn. VND)": "Tài sản dài hạn khác (Tỷ VND)",
"Other long-term receivables (Bn. VND)": "Phải thu dài hạn khác (Tỷ VND)",
"Long-term trade receivables (Bn. VND)": "Phải thu dài hạn (Tỷ VND)",

"Net Profit/Loss before tax": "Lợi nhuận trước thuế",
"Depreciation and Amortisation": "Khấu hao",
"Provision for credit losses": "Dự phòng tổn thất tín dụng",
"Unrealized foreign exchange gain/loss": "Lãi/lỗ tỷ giá chưa thực hiện",
"Profit/Loss from investing activities": "LN từ hoạt động đầu tư",
"Interest Expense": "Chi phí lãi vay",
"Interest income and dividends": "Thu lãi và cổ tức",
"Operating profit before changes in working capital": "LN trước thay đổi vốn lưu động",

"Increase/Decrease in receivables": "Tăng/giảm khoản phải thu",
"Increase/Decrease in inventories": "Tăng/giảm tồn kho",
"Increase/Decrease in payables": "Tăng/giảm khoản phải trả",
"Increase/Decrease in prepaid expenses": "Tăng/giảm chi phí trả trước",
"Interest paid": "Lãi vay đã trả",
"Business Income Tax paid": "Thuế TNDN đã nộp",
"Other receipts from operating activities": "Thu khác từ HĐKD",
"Other payments on operating activities": "Chi khác từ HĐKD",
"Net cash inflows/outflows from operating activities": "Lưu chuyển tiền thuần HĐKD",

"Purchase of fixed assets": "Mua tài sản cố định",
"Proceeds from disposal of fixed assets": "Thu từ thanh lý TSCĐ",
"Loans granted, purchases of debt instruments (Bn. VND)": "Cho vay/mua công cụ nợ (Tỷ VND)",
"Collection of loans, proceeds from sales of debts instruments (Bn. VND)": "Thu hồi cho vay/bán công cụ nợ (Tỷ VND)",
"Investment in other entities": "Đầu tư vào đơn vị khác",
"Proceeds from divestment in other entities": "Thu từ thoái vốn",
"Gain on Dividend": "Thu cổ tức",
"Net Cash Flows from Investing Activities": "Lưu chuyển tiền thuần HĐ đầu tư",

"Increase in charter captial": "Tăng vốn điều lệ",
"Payments for share repurchases": "Mua lại cổ phiếu",
"Proceeds from borrowings": "Thu từ vay",
"Repayment of borrowings": "Trả nợ vay",
"Finance lease principal payments": "Trả gốc thuê tài chính",
"Dividends paid": "Cổ tức đã trả",
"Cash flows from financial activities": "Lưu chuyển tiền HĐ tài chính",
"Net increase/decrease in cash and cash equivalents": "Tăng/giảm tiền thuần",
"Cash and cash equivalents": "Tiền và tương đương tiền",
"Foreign exchange differences Adjustment": "Điều chỉnh chênh lệch tỷ giá",
"Cash and Cash Equivalents at the end of period": "Tiền cuối kỳ",

"Interest and Similar Income": "Thu nhập lãi và tương tự",
"Interest and Similar Expenses": "Chi phí lãi và tương tự",
"Net Interest Income": "Thu nhập lãi thuần",
"Fees and Comission Income": "Thu phí và hoa hồng",
"Fees and Comission Expenses": "Chi phí phí và hoa hồng",
"Net Fee and Commission Income": "Thu phí thuần",
"Net gain (loss) from foreign currency and gold dealings": "Lãi/lỗ kinh doanh ngoại tệ và vàng",
"Net gain (loss) from trading of trading securities": "Lãi/lỗ chứng khoán kinh doanh",
"Net gain (loss) from disposal of investment securities": "Lãi/lỗ bán chứng khoán đầu tư",
"Net Other income/(expenses)": "Thu nhập khác thuần",
"Other expenses": "Chi phí khác",
"Net Other income/expenses": "Thu nhập khác thuần",
"Dividends received": "Cổ tức nhận được",
"Total operating revenue": "Tổng thu nhập hoạt động",
"Operating Profit before Provision": "LN hoạt động trước dự phòng",
"Tax For the Year": "Thuế trong năm",
"EPS_basis": "EPS cơ bản",

"Balances with the SBV": "Tiền gửi tại NHNN",
"Placements with and loans to other credit institutions": "Tiền gửi/cho vay TCTD khác",
"Trading Securities, net": "Chứng khoán kinh doanh thuần",
"Trading Securities": "Chứng khoán kinh doanh",
"Provision for diminution in value of Trading Securities": "Dự phòng giảm giá CK kinh doanh",
"Derivatives and other financial liabilities": "Công cụ phái sinh và nợ tài chính khác",
"Loans and advances to customers, net": "Cho vay khách hàng thuần",
"Loans and advances to customers": "Cho vay khách hàng",
"Less: Provision for losses on loans and advances to customers": "Dự phòng rủi ro cho vay",
"Investment Securities": "Chứng khoán đầu tư",
"Available-for Sales Securities": "CK sẵn sàng để bán",
"Held-to-Maturity Securities": "CK nắm giữ đến đáo hạn",
"Less: Provision for diminution in value of investment securities": "Dự phòng giảm giá CK đầu tư",
"Investment in joint ventures": "Đầu tư liên doanh",
"Investments in associate companies": "Đầu tư công ty liên kết",
"Less: Provision for diminuation in value of long term investments": "Dự phòng giảm giá đầu tư dài hạn",
"Tangible fixed assets": "TSCĐ hữu hình",
"Intagible fixed assets": "TSCĐ vô hình",
"Other Assets": "Tài sản khác",

"Due to Gov and borrowings from SBV": "Nợ Chính phủ/NHNN",
"Deposits and borrowings from other credit institutions": "Tiền gửi/vay TCTD khác",
"Deposits from customers": "Tiền gửi khách hàng",
"_Derivatives and other financial liabilities": "Phái sinh và nợ tài chính khác",
"Funds received from Gov, international and other institutions": "Vốn nhận từ Chính phủ/tổ chức khác",
"Convertible bonds/CDs and other valuable papers issued": "Trái phiếu chuyển đổi và giấy tờ có giá",
"Other liabilities": "Nợ phải trả khác",

"Capital": "Vốn",
"Reserves": "Các quỹ",
"Foreign Currency Difference reserve": "Quỹ chênh lệch tỷ giá",
"Difference upon Assets Revaluation": "Chênh lệch đánh giá lại tài sản",
"Other Reserves": "Quỹ khác",
"Profits from other activities": "LN từ hoạt động khác",
"Net Cash Flows from Operating Activities before BIT": "Lưu chuyển tiền trước lãi vay và thuế",
"Payment from reserves": "Chi từ quỹ",
"Convertible bonds (Bn. VND)": "Trái phiếu chuyển đổi (Tỷ VND)",
"_Increase/Decrease in receivables": "Tăng/giảm phải thu",
"_Increase/Decrease in payables": "Tăng/giảm phải trả",
"Profit/Loss from disposal of fixed assets": "Lãi/lỗ thanh lý TSCĐ",
"Leased assets": "Tài sản thuê"
}


# In[3]:


cols = df.columns.tolist()
column_index = {col: idx for idx, col in enumerate(df.columns)}

for idx, col in enumerate(df.columns):
    print(idx, col)


# In[4]:


# Tách từng report
df_income = df[df["report"] == "income_statement"].copy()
df_balance = df[df["report"] == "balance_sheet"].copy()
df_cash = df[df["report"] == "cash_flow"].copy()

# Drop các cột toàn NaN
df_income = df_income.dropna(axis=1, how="all")
df_balance = df_balance.dropna(axis=1, how="all")
df_cash = df_cash.dropna(axis=1, how="all")

# Tạo thư mục cleaned_data nếu chưa có
cleaned_data_dir = os.path.join(project_root, "dataset", "cleaned_data")
os.makedirs(cleaned_data_dir, exist_ok=True)

# Lưu ra file vào thư mục cleaned_data
income_path = os.path.join(cleaned_data_dir, "income_statement_clean.csv")
balance_path = os.path.join(cleaned_data_dir, "balance_sheet_clean.csv")
cash_path = os.path.join(cleaned_data_dir, "cash_flow_clean.csv")

df_income.to_csv(income_path, index=False)
df_balance.to_csv(balance_path, index=False)
df_cash.to_csv(cash_path, index=False)

print("Đã tách và loại bỏ cột rỗng xong.")
print(f"📁 Files đã được lưu tại: {cleaned_data_dir}")


# In[5]:


df_balance.head()


# In[6]:


# df_cash.head()
df_cash.loc[
    (df_cash["ticker"] == "HPG") &
    (df_cash["yearReport"] == 2022),
    ["Interest Expense","lengthReport"]
]


# In[7]:


import numpy as np
keys = ["ticker", "yearReport", "lengthReport"]

# Tránh duplicate key trước khi merge
for name, d in {
    "income": df_income,
    "balance": df_balance,
    "cash": df_cash
}.items():
    dup = d.duplicated(subset=keys).sum()
    print(f"{name} duplicate rows:", dup)


# Chỉ giữ symbol ở balance 
df_income = df_income.drop(columns=["symbol"], errors="ignore")
df_cash = df_cash.drop(columns=["symbol"], errors="ignore")


df_merged = (
    df_balance
    .merge(df_income, on=keys, how="left", validate="one_to_one")
    .merge(df_cash, on=keys, how="left", validate="one_to_one")
)

print("Merged shape:", df_merged.shape)


def safe_divide(a, b):
    return np.where((b == 0) | (pd.isna(b)), np.nan, a / b)



# ----- A: Thanh khoản -----
df_merged["A1"] = safe_divide(
    df_merged["CURRENT ASSETS (Bn. VND)"],
    df_merged["Current liabilities (Bn. VND)"]
)

df_merged["A2"] = safe_divide(
    df_merged["CURRENT ASSETS (Bn. VND)"] -
    df_merged["Inventories, Net (Bn. VND)"],
    df_merged["Current liabilities (Bn. VND)"]
)

df_merged["A3"] = safe_divide(
    df_merged["Cash and cash equivalents (Bn. VND)"],
    df_merged["Current liabilities (Bn. VND)"]
)


# ----- B: Đòn bẩy -----
df_merged["B1"] = safe_divide(
    df_merged["LIABILITIES (Bn. VND)"],
    df_merged["TOTAL ASSETS (Bn. VND)"]
)

df_merged["B2"] = safe_divide(
    df_merged["LIABILITIES (Bn. VND)"],
    df_merged["OWNER'S EQUITY(Bn.VND)"]
)

df_merged["B3"] = safe_divide(
    df_merged["Profit before tax"] + df_merged["Interest Expenses"].abs(),
    df_merged["Interest Expenses"]
)


# ----- C: Hiệu quả -----
df_merged["C1"] = safe_divide(
    df_merged["Cost of Sales"].abs(),
    df_merged["Inventories, Net (Bn. VND)"]
)

df_merged["C2"] = safe_divide(
    df_merged["Accounts receivable (Bn. VND)"],
    df_merged["Net Sales"]
)

df_merged["C3"] = safe_divide(
    df_merged["Net Sales"],
    df_merged["Fixed assets (Bn. VND)"]
)


# ----- D: Sinh lời -----
df_merged["D1"] = safe_divide(
    df_merged["Net Profit For the Year"],
    df_merged["Net Sales"]
)

df_merged["D2"] = safe_divide(
    df_merged["Profit before tax"] + df_merged["Interest Expenses"].abs(),
    df_merged["TOTAL ASSETS (Bn. VND)"]
)

df_merged["D3"] = safe_divide(
    df_merged["Net Profit For the Year"],
    df_merged["TOTAL ASSETS (Bn. VND)"]
)


ratio_cols = [
    "ticker",
    "symbol",
    "yearReport",
    "lengthReport",
    "A1","A2","A3",
    "B1","B2","B3",
    "C1","C2","C3",
    "D1","D2","D3"
]

df_ratio = df_merged[ratio_cols]

# Lưu file ratios vào thư mục cleaned_data
ratio_path = os.path.join(cleaned_data_dir, "financial_ratios_A1_D3.csv")
df_ratio.to_csv(ratio_path, index=False)

print(f"Đã lưu file financial_ratios_A1_D3.csv tại: {ratio_path}")


# In[8]:


df_merged.head()


# In[9]:


df_ratio.head(20)


# In[10]:


import numpy as np

def get_data(ticker, year, quarter, column_name):
    
    row = df_merged[
        (df_merged["ticker"] == ticker) &
        (df_merged["yearReport"] == year) &
        (df_merged["lengthReport"] == quarter)
    ]

    if row.empty:
        return np.nan
    
    print("Value:", row.iloc[0][column_name])
    
    return row.iloc[0][column_name]


# In[11]:


ratio_column_map = {

    # ===== A. Thanh toán =====
    "Tài sản ngắn hạn": "CURRENT ASSETS (Bn. VND)",
    "Nợ ngắn hạn": "Current liabilities (Bn. VND)",
    "Hàng tồn kho": "Inventories, Net (Bn. VND)",
    "Tiền và tương đương tiền": "Cash and cash equivalents (Bn. VND)",

    # ===== B. Cân đối vốn =====
    "Nợ phải trả": "LIABILITIES (Bn. VND)",
    "Tổng tài sản": "TOTAL ASSETS (Bn. VND)",
    "Vốn chủ sở hữu": "OWNER'S EQUITY(Bn.VND)",
    "Lợi nhuận trước thuế": "Profit before tax",
    "Chi phí lãi vay": "Interest Expenses",

    # ===== C. Hiệu quả hoạt động =====
    "Giá vốn hàng bán": "Cost of Sales",
    "Khoản phải thu": "Accounts receivable (Bn. VND)",
    "Doanh thu thuần": "Net Sales",
    "Tài sản cố định": "Fixed assets (Bn. VND)",

    # ===== D. Sinh lợi =====
    "Lợi nhuận sau thuế": "Net Profit For the Year"
}


# In[12]:


import numpy as np

def get_value(data_source, ticker, year, quarter, column_name):
    df_filtered = data_source[
        (data_source['ticker'] == ticker) & 
        (data_source['yearReport'] == year) & 
        (data_source['lengthReport'] == quarter)
    ]
    
    if not df_filtered.empty:
        return df_filtered.iloc[0][column_name]
    else:
        return np.nan


# In[13]:


# Kiểm tra dữ liệu

all_tickers = [
    "HPG", "VCB", "SSI", "VNM", "MWG",
    "FPT", "GAS", "VPB", "TCB", "MBB",
    "ACB", "VIC", "VHM", "BID", "CTG",
    "PNJ", "REE", "HDB", "VRE", "PLX",
    "POW", "BVH", "GVR", "KDH", "NVL",
    "PDR", "STB", "MSN", "SAB", "DGC"
]



tickers_to_test = [
    "HPG", "ACB", "VIC", "VHM", "BID", "CTG",
]

years = [2022, 2023, 2024, 2025, 2026]

quarters = [3]

for ticker in tickers_to_test:
    for year in years:
        for quarter in quarters:
            
            temp_data = {}
            
            for col_vn, col_en in ratio_column_map.items():
                temp_data[col_vn] = get_value(df_merged, ticker, year, int(quarter), col_en)

            
            # Nhóm A: Thanh toán
            tai_san_ngan_han         = temp_data["Tài sản ngắn hạn"]
            no_ngan_han              = temp_data["Nợ ngắn hạn"]
            hang_ton_kho             = temp_data["Hàng tồn kho"]
            tien_va_tuong_duong_tien = temp_data["Tiền và tương đương tiền"]

            # Nhóm B: Cân đối vốn
            no_phai_tra              = temp_data["Nợ phải trả"]
            tong_tai_san             = temp_data["Tổng tài sản"]
            von_chu_so_huu           = temp_data["Vốn chủ sở hữu"]
            loi_nhuan_truoc_thue     = temp_data["Lợi nhuận trước thuế"]
            chi_phi_lai_vay          = temp_data["Chi phí lãi vay"]

            print(f"\n=== Debug: B3 components ===")
            print(f"  Lợi nhuận trước thuế: {loi_nhuan_truoc_thue}")
            print(f"  Chi phí lãi vay: {chi_phi_lai_vay}")
            # Nhóm C: Hiệu quả hoạt động
            gia_von_hang_ban         = temp_data["Giá vốn hàng bán"]
            khoan_phai_thu           = temp_data["Khoản phải thu"]
            doanh_thu_thuan          = temp_data["Doanh thu thuần"]
            tai_san_co_dinh          = temp_data["Tài sản cố định"]

            # Nhóm D: Sinh lợi
            loi_nhuan_sau_thue       = temp_data["Lợi nhuận sau thuế"]

            
            def safe_div(a, b):
                try:
                    if a is None or b is None or b == 0:
                        return None
                    return a / b
                except:
                    return None


            # ================= A. Thanh toán =================
            A1_cal = safe_div(tai_san_ngan_han, no_ngan_han)

            A2_cal = safe_div(
                (tai_san_ngan_han - hang_ton_kho) if tai_san_ngan_han and hang_ton_kho else None,
                no_ngan_han
            )

            A3_cal = safe_div(tien_va_tuong_duong_tien, no_ngan_han)


            # ================= B. Cân đối vốn =================
            B1_cal = safe_div(no_phai_tra, tong_tai_san)

            B2_cal = safe_div(no_phai_tra, von_chu_so_huu)

            B3_cal = safe_div(loi_nhuan_truoc_thue, chi_phi_lai_vay)


            # ================= C. Hiệu quả hoạt động =================
            C1_cal = safe_div(gia_von_hang_ban, hang_ton_kho)

            C2_cal = safe_div(khoan_phai_thu, doanh_thu_thuan)

            C3_cal = safe_div(doanh_thu_thuan, tai_san_co_dinh)


            # ================= D. Sinh lợi =================
            D1_cal = safe_div(loi_nhuan_sau_thue, doanh_thu_thuan)

            D2_cal = safe_div(loi_nhuan_truoc_thue, tong_tai_san)

            D3_cal = safe_div(loi_nhuan_sau_thue, tong_tai_san)

            ratio_results = {
                "A1": A1_cal,
                "A2": A2_cal,
                "A3": A3_cal,
                "B1": B1_cal,
                "B2": B2_cal,
                "B3": B3_cal,
                "C1": C1_cal,
                "C2": C2_cal,
                "C3": C3_cal,
                "D1": D1_cal,
                "D2": D2_cal,
                "D3": D3_cal,
            }

            print(f"\n===== TEST {ticker} - Year {year} - Q{quarter} =====")

            all_pass = True

            for ratio_name, calculated_value in ratio_results.items():
                print(f"Testing {ratio_name}...")

                original_value = get_value(df_ratio, ticker, year, quarter, ratio_name)

                if calculated_value is None or original_value is None:
                    print(f"[SKIP] {ratio_name} - missing data")
                    continue

                if np.isclose(calculated_value, original_value, atol=1e-6):
                    print(f"[PASS] {ratio_name}")
                else:
                    if np.isnan(calculated_value) and np.isnan(original_value):
                        print(f"[PASS] {ratio_name} (both NaN)")
                    else:
                        print(f"[FAIL] {ratio_name}")
                        print(f"       Calculated : {calculated_value}")
                        print(f"       Original   : {original_value}")
                        print(f"       Diff       : {calculated_value - original_value}")
                        all_pass = False


            if all_pass:
                print(">>> ✅ ALL RATIOS MATCH")
            else:
                print(">>> ❌ SOME RATIOS FAILED")



# In[ ]:





# In[ ]:




