import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent.parent

INPUT_FILE = PROJECT_ROOT / "dataset" / "financial_features.csv"
OUTPUT_DIR = BASE_DIR / "output_cronbach"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(INPUT_FILE)

GROUPS = {
    "A": ["A1", "A2", "A3"],
    "B": ["B1", "B2", "B3"],
    "C": ["C1", "C2", "C3"],
    "D": ["D1", "D2", "D3"],
}



# 2. Hàm tính Cronbach's alpha
def cronbach_alpha(df_items: pd.DataFrame) -> float:
    """
    Tính Cronbach's alpha cho một nhóm biến quan sát.
    Công thức:
        alpha = k/(k-1) * (1 - sum(variance từng biến) / variance của tổng điểm)
    """
    k = df_items.shape[1]  # số biến quan sát

    if k < 2:
        return np.nan

    # phương sai của từng biến
    item_variances = df_items.var(axis=0, ddof=1)

    # tổng điểm của từng dòng
    total_score = df_items.sum(axis=1)

    # phương sai của tổng điểm
    total_variance = total_score.var(ddof=1)

    if total_variance == 0:
        return np.nan

    alpha = (k / (k - 1)) * (1 - item_variances.sum() / total_variance)
    return alpha

# 3. Hàm tính tương quan biến-tổng đã hiệu chỉnh

def corrected_item_total_correlation(df_items: pd.DataFrame) -> pd.Series:
    """
    Với từng biến, tính tương quan giữa biến đó và tổng của các biến còn lại.
    Đây là chỉ số thường dùng để xem biến quan sát có phù hợp không.
    """
    result = {}

    for col in df_items.columns:
        total_other_items = df_items.drop(columns=[col]).sum(axis=1)
        corr = df_items[col].corr(total_other_items)
        result[col] = corr

    return pd.Series(result)



# 4. Hàm tính alpha nếu loại từng biến
def alpha_if_item_deleted(df_items: pd.DataFrame) -> pd.Series:
    """
    Thử bỏ từng biến ra khỏi nhóm rồi tính lại Cronbach's alpha.
    Dùng để xem biến nào làm giảm độ tin cậy của thang đo.
    """
    result = {}

    for col in df_items.columns:
        reduced_df = df_items.drop(columns=[col])
        result[col] = cronbach_alpha(reduced_df)

    return pd.Series(result)



# 5. Hàm diễn giải alpha
def interpret_alpha(alpha: float) -> str:
    """
    Diễn giải mức độ tin cậy dựa trên Cronbach's alpha.
    """
    if pd.isna(alpha):
        return "Không tính được"
    elif alpha >= 0.9:
        return "Rất tốt"
    elif alpha >= 0.8:
        return "Tốt"
    elif alpha >= 0.7:
        return "Chấp nhận được"
    elif alpha >= 0.6:
        return "Tạm chấp nhận"
    else:
        return "Không đạt độ tin cậy"



# 6. Đọc dữ liệu
df = pd.read_csv(INPUT_FILE)

# Chỉ lấy các cột A1 đến D3
all_measurement_columns = [col for cols in GROUPS.values() for col in cols]

# Ép kiểu số để tránh lỗi nếu có dữ liệu dạng text
for col in all_measurement_columns:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# Loại bỏ các dòng bị thiếu dữ liệu ở các biến quan sát
analysis_df = df[all_measurement_columns].dropna().copy()


# 7. Tính descriptive statistics
descriptive_stats = analysis_df.describe().T
descriptive_stats["variance"] = analysis_df.var()
descriptive_stats["median"] = analysis_df.median()
descriptive_stats["missing_count"] = df[all_measurement_columns].isna().sum()
descriptive_stats["missing_percent"] = (df[all_measurement_columns].isna().mean() * 100).round(2)

descriptive_stats = descriptive_stats[
    ["count", "mean", "std", "min", "25%", "50%", "75%", "max", "variance", "median", "missing_count", "missing_percent"]
]


# 8. Tính kết quả Cronbach cho từng nhóm
cronbach_rows = []
item_analysis_rows = []

for latent_var, cols in GROUPS.items():
    group_df = analysis_df[cols]

    alpha = cronbach_alpha(group_df)
    item_total_corr = corrected_item_total_correlation(group_df)
    alpha_deleted = alpha_if_item_deleted(group_df)

    cronbach_rows.append({
        "latent_variable": latent_var,
        "observed_variables": ", ".join(cols),
        "n_items": len(cols),
        "n_samples": len(group_df),
        "cronbach_alpha": round(alpha, 6),
        "interpretation": interpret_alpha(alpha),
        "reliable_for_measurement": "Yes" if alpha >= 0.7 else "No"
    })

    for item in cols:
        item_analysis_rows.append({
            "latent_variable": latent_var,
            "item": item,
            "corrected_item_total_correlation": round(item_total_corr[item], 6),
            "alpha_if_item_deleted": round(alpha_deleted[item], 6),
            "item_status": "Keep" if item_total_corr[item] >= 0.3 else "Consider removing"
        })

cronbach_result = pd.DataFrame(cronbach_rows)
item_analysis = pd.DataFrame(item_analysis_rows)



# 9. Ma trận tương quan
correlation_matrix = analysis_df.corr()

# 10. Vẽ correlation heatmap bằng matplotlib
fig, ax = plt.subplots(figsize=(10, 8))

cax = ax.imshow(correlation_matrix, interpolation="nearest", aspect="auto")
fig.colorbar(cax)

ax.set_xticks(range(len(correlation_matrix.columns)))
ax.set_yticks(range(len(correlation_matrix.index)))
ax.set_xticklabels(correlation_matrix.columns, rotation=45, ha="right")
ax.set_yticklabels(correlation_matrix.index)

# Ghi giá trị vào từng ô
for i in range(len(correlation_matrix.index)):
    for j in range(len(correlation_matrix.columns)):
        ax.text(j, i, f"{correlation_matrix.iloc[i, j]:.2f}",
                ha="center", va="center", fontsize=8)

ax.set_title("Correlation Heatmap")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "correlation_heatmap.png", dpi=300)
plt.close()

# 11. Tạo statistical analysis dạng text
analysis_lines = []
analysis_lines.append("STATISTICAL ANALYSIS")
analysis_lines.append("=" * 80)
analysis_lines.append(f"So dong duoc dung de phan tich: {len(analysis_df)}")
analysis_lines.append("")

for _, row in cronbach_result.iterrows():
    latent_var = row["latent_variable"]
    alpha = row["cronbach_alpha"]

    analysis_lines.append(f"Nhom bien {latent_var}")
    analysis_lines.append("-" * 40)
    analysis_lines.append(f"Bien quan sat: {row['observed_variables']}")
    analysis_lines.append(f"Cronbach's alpha: {alpha}")
    analysis_lines.append(f"Dien giai: {row['interpretation']}")
    analysis_lines.append(f"Du do tin cay de do luong bien tiem an {latent_var}: {row['reliable_for_measurement']}")
    analysis_lines.append("")

    sub_items = item_analysis[item_analysis["latent_variable"] == latent_var]
    for _, item_row in sub_items.iterrows():
        analysis_lines.append(
            f"  {item_row['item']}: "
            f"Corrected item-total correlation = {item_row['corrected_item_total_correlation']}, "
            f"Alpha if item deleted = {item_row['alpha_if_item_deleted']}, "
            f"Recommendation = {item_row['item_status']}"
        )
    analysis_lines.append("")

analysis_lines.append("Guideline for interpretation:")
analysis_lines.append("- Cronbach's alpha >= 0.7: thang do duoc xem la co do tin cay chap nhan duoc.")
analysis_lines.append("- Corrected item-total correlation >= 0.3: bien quan sat thuong duoc xem la phu hop.")
analysis_lines.append("- Neu alpha_if_item_deleted lon hon alpha hien tai mot cach dang ke, co the xem xet loai bien do.")

statistical_analysis_text = "\n".join(analysis_lines)

# 12. Lưu kết quả ra file
cronbach_result.to_csv(OUTPUT_DIR / "cronbach_result.csv", index=False, encoding="utf-8-sig")
item_analysis.to_csv(OUTPUT_DIR / "item_analysis.csv", index=False, encoding="utf-8-sig")
correlation_matrix.to_csv(OUTPUT_DIR / "correlation_matrix.csv", encoding="utf-8-sig")
descriptive_stats.to_csv(OUTPUT_DIR / "descriptive_stats.csv", encoding="utf-8-sig")

with open(OUTPUT_DIR / "statistical_analysis.txt", "w", encoding="utf-8") as f:
    f.write(statistical_analysis_text)

print("Da hoan thanh phan tich.")
print(f"Ket qua duoc luu trong thu muc: {OUTPUT_DIR.resolve()}")
print("- cronbach_result.csv")
print("- item_analysis.csv")
print("- correlation_matrix.csv")
print("- descriptive_stats.csv")
print("- statistical_analysis.txt")
print("- correlation_heatmap.png")