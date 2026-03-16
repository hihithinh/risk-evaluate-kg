#!/usr/bin/env python
# coding: utf-8

# In[3]:


# from vnstock import Vnstock
# import pandas as pd
# import time

# symbols = [
#     "HPG", "VCB", "SSI", "VNM", "MWG",
#     "FPT", "GAS", "VPB", "TCB", "MBB",
#     "ACB", "VIC", "VHM", "BID", "CTG",
#     "PNJ", "REE", "HDB", "VRE", "PLX",
#     "POW", "BVH", "GVR", "KDH", "NVL",
#     "PDR", "STB", "MSN", "SAB", "DGC"
# ]

# vn = Vnstock()
# all_data = []

# REQUEST_DELAY = 3.5  # 👈 quan trọng

# for symbol in symbols:
#     print(f"Đang lấy dữ liệu {symbol}...")

#     stock = vn.stock(symbol=symbol, source="VCI")

#     for func, name in [
#         (stock.finance.income_statement, "income_statement"),
#         (stock.finance.balance_sheet, "balance_sheet"),
#         (stock.finance.cash_flow, "cash_flow"),
#     ]:
#         df = func(period="year")
#         df["symbol"] = symbol
#         df["report"] = name
#         all_data.append(df)

#         time.sleep(REQUEST_DELAY)  # 👈 chặn rate limit

# final_df = pd.concat(all_data, ignore_index=True)
# final_df.to_excel("financial_report_30_companies.xlsx", index=False)

# print("Hoàn thành!")


# In[4]:


from vnstock import Vnstock
import pandas as pd
import time

symbols = [
    "HPG", "VCB", "SSI", "VNM", "MWG",
    "FPT", "GAS", "VPB", "TCB", "MBB",
    "ACB", "VIC", "VHM", "BID", "CTG",
    "PNJ", "REE", "HDB", "VRE", "PLX",
    "POW", "BVH", "GVR", "KDH", "NVL",
    "PDR", "STB", "MSN", "SAB", "DGC"
]

vn = Vnstock()
all_data = []

# Chỉ cần delay ngắn nếu dùng code xử lý lỗi bên dưới
REQUEST_DELAY = 3.5

for symbol in symbols:
    print(f"🔄 Đang xử lý mã: {symbol}...")
    
    # Khởi tạo object stock
    stock = vn.stock(symbol=symbol, source="VCI")

    for func, name in [
        (stock.finance.income_statement, "income_statement"),
        (stock.finance.balance_sheet, "balance_sheet"),
        (stock.finance.cash_flow, "cash_flow"),
    ]:
        # Vòng lặp thử lại (Retry mechanism)
        while True:
            try:
                print(f"   -> Đang tải {name}...", end="")
                df = func(period="quarter")
                
                df["symbol"] = symbol
                df["report"] = name
                all_data.append(df)
                print(" ✅ Xong")
                
                # Ngủ ngắn sau khi thành công
                time.sleep(REQUEST_DELAY)
                break # Thoát vòng lặp while để sang báo cáo tiếp theo
                
            except (Exception, SystemExit) as e:
                # Bắt cả lỗi thường và lỗi SystemExit do rate limit
                print(f"\n⚠️ Gặp lỗi hoặc bị chặn Rate Limit.")
                print("⏳ Đang tạm dừng 65 giây để hồi phục quota...")
                time.sleep(65) # Chờ 65s (hơn 1 phút) để reset limit
                print("▶️ Đang thử lại...")
                # Code sẽ tự quay lại đầu vòng while để gọi lại hàm func()

# Xuất file CSV giữ nguyên số dài
import os
final_df = pd.concat(all_data, ignore_index=True)

# Tạo đường dẫn tới thư mục dataset (2 cấp lên từ pipeline/1_data_processing)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dataset_path = os.path.join(project_root, "dataset", "raw_financial_data.csv")

# Lưu file vào thư mục dataset
final_df.to_csv(dataset_path, index=False, encoding='utf-8-sig', float_format='%.0f')

print(f"\n🎉 Hoàn thành tất cả!")
print(f"📁 File đã được lưu tại: {dataset_path}")


# In[5]:


final_df.columns


# In[6]:


final_df.head()


# In[11]:


# xem doanh thu thuần của HPG trong các quý năm 2025
final_df[final_df['symbol'] == 'HPG']





# In[12]:


print(final_df[final_df["ticker"]=="HPG"][["yearReport","lengthReport","Revenue (Bn. VND)"]])


# In[13]:


df = final_df.dropna(axis=1, how="all")


# In[ ]:


df.head()

