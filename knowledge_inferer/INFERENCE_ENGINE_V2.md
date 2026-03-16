# Inference Engine V2 - TRUE Reasoning System

## 📋 Tổng quan

Inference Engine V2 là bộ suy diễn **thực sự** với đầy đủ khả năng reasoning theo chuẩn Knowledge-Based Systems, khác hoàn toàn với pattern matching đơn giản.

### ✅ Điểm khác biệt chính

| Tính năng | Version Cũ | Version 2 (Mới) |
|-----------|------------|-----------------|
| **Suy diễn** | Pattern matching 1 lần | Forward chaining loop |
| **Working Memory** | ❌ Không có | ✅ Có (dynamic facts) |
| **Conflict Resolution** | ❌ Kích hoạt tất cả | ✅ 3 strategies |
| **Backward Chaining** | ❌ Không có | ✅ Goal-driven reasoning |
| **Explanation** | String concatenation | ✅ Trace + Justification |
| **Rule Chaining** | ❌ Không có | ✅ Rules kích hoạt lẫn nhau |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                   INFERENCE ENGINE V2                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: Data Standardization                              │
│  ├─ Load raw data                                           │
│  ├─ Split by report type                                    │
│  ├─ Merge reports                                           │
│  └─ Validate data                                           │
│                                                              │
│  Phase 2: Indicator Calculation                             │
│  ├─ Calculate A1-A3 (Liquidity)                            │
│  ├─ Calculate B1-B3 (Leverage)                             │
│  ├─ Calculate C1-C3 (Efficiency)                           │
│  └─ Calculate D1-D3 (Profitability)                        │
│                                                              │
│  Phase 3: Risk Evaluation                                   │
│  ├─ Evaluate each indicator                                 │
│  ├─ Assign risk_level (Good/Medium/High)                   │
│  └─ Create initial facts                                    │
│                                                              │
│  Phase 4: FORWARD CHAINING (NEW!)                          │
│  ┌────────────────────────────────────────────────┐        │
│  │  Working Memory                                 │        │
│  │  ├─ Initial facts (from Phase 3)               │        │
│  │  └─ Derived facts (from rules)                 │        │
│  │                                                  │        │
│  │  Inference Loop:                                │        │
│  │  1. Find matching rules                         │        │
│  │  2. Conflict resolution (select best rule)     │        │
│  │  3. Fire rule → create new facts               │        │
│  │  4. Add facts to working memory                │        │
│  │  5. Repeat until no more rules                 │        │
│  │                                                  │        │
│  │  Explanation Engine:                            │        │
│  │  ├─ Record each step                            │        │
│  │  ├─ Build justification tree                   │        │
│  │  └─ Generate explanations                      │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  BACKWARD CHAINING (NEW!)                                   │
│  ┌────────────────────────────────────────────────┐        │
│  │  Goal-driven reasoning:                         │        │
│  │  1. Start from goal (e.g., "prove high risk")  │        │
│  │  2. Find rules that conclude goal              │        │
│  │  3. Recursively prove sub-goals                │        │
│  │  4. Return proof chain                         │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Các thành phần chính

### 1. Working Memory (`working_memory.py`)

**Chức năng**: Lưu trữ và quản lý facts động trong quá trình suy diễn

```python
class WorkingMemory:
    - add_fact(fact)           # Thêm fact mới
    - get_fact(fact_id)        # Lấy fact theo ID
    - query_facts(**conditions) # Query facts theo điều kiện
    - get_lineage(fact_id)     # Truy vết nguồn gốc
    - get_inference_chain()    # Lấy chuỗi suy diễn
```

**Ví dụ**:
```python
# Fact ban đầu
fact1 = Fact(
    fact_id="eval_B1",
    fact_type="indicator_evaluation",
    data={'risk_level': 'High', 'risk_point': 2},
    source="initial"
)

# Fact được suy ra
fact2 = Fact(
    fact_id="composite_R1_1",
    fact_type="composite_risk",
    data={'risk_type': 'financial_distress'},
    source="rule_R1",
    derived_from=["eval_B1", "eval_D3"]  # Suy ra từ 2 facts này
)
```

### 2. Conflict Resolver (`conflict_resolver.py`)

**Chức năng**: Giải quyết xung đột khi nhiều rules cùng match

**3 Strategies**:

1. **Refractoriness**: Không kích hoạt rule đã dùng với cùng facts
   - Tránh vòng lặp vô hạn
   
2. **Specificity**: Ưu tiên rules có nhiều conditions hơn
   - Rule càng cụ thể thì càng ưu tiên
   
3. **Priority**: Ưu tiên theo severity
   - high > medium > low

**Ví dụ**:
```python
# 3 rules cùng match
matching_rules = [R1, R5, R8]

# Conflict resolver chọn rule tốt nhất
selected = conflict_resolver.select_next_rule(matching_rules, wm_snapshot)
# → Chọn R1 vì: severity=high, có 2 conditions, chưa fire
```

### 3. Forward Chainer (`forward_chainer.py`)

**Chức năng**: Vòng lặp suy diễn tiến (data-driven)

**Thuật toán**:
```python
def inference_loop(evaluations):
    # 1. Khởi tạo working memory với initial facts
    initialize_working_memory(evaluations)
    
    iteration = 0
    while iteration < max_iterations:
        # 2. Tìm tất cả rules có thể kích hoạt
        matching_rules = find_matching_rules()
        
        if not matching_rules:
            break  # Không còn rules nào → dừng
        
        # 3. Chọn rule tốt nhất (conflict resolution)
        selected_rule = conflict_resolver.select_next_rule(matching_rules)
        
        # 4. Kích hoạt rule → tạo facts mới
        new_facts = fire_rule(selected_rule)
        
        # 5. Thêm facts mới vào working memory
        for fact in new_facts:
            working_memory.add_fact(fact)
        
        # 6. Đánh dấu rule đã fire (refractoriness)
        conflict_resolver.mark_rule_fired(selected_rule)
        
        iteration += 1
    
    return build_result()
```

**Ví dụ thực tế**:
```
Iteration 1:
  - Initial facts: eval_B1=High, eval_D3=High
  - Matching rules: [R1, R2, R8]
  - Selected: R1 (specificity + priority)
  - Fired R1 → created composite_R1_1 (financial_distress)
  
Iteration 2:
  - New facts: composite_R1_1
  - Matching rules: [R2, R8]  # R1 đã fire, bị loại (refractoriness)
  - Selected: R8
  - Fired R8 → created composite_R8_2 (severe_liquidity_risk)
  
Iteration 3:
  - No more matching rules → STOP
  
Result: 2 iterations, 2 rules fired, 2 composite risks found
```

### 4. Backward Chainer (`backward_chainer.py`)

**Chức năng**: Suy diễn lùi (goal-driven reasoning)

**Thuật toán**:
```python
def prove_goal(goal, evaluations):
    # 1. Tìm rules có thể suy ra goal
    matching_rules = find_rules_for_goal(goal)
    
    for rule in matching_rules:
        # 2. Thử chứng minh với từng rule
        all_conditions_met = True
        
        for condition in rule.conditions:
            # 3. Đệ quy chứng minh sub-goals
            condition_met = check_condition(condition, evaluations)
            
            if not condition_met:
                all_conditions_met = False
                break
        
        # 4. Nếu tất cả conditions thỏa mãn → thành công
        if all_conditions_met:
            return True, proof_chain
    
    # 5. Không tìm thấy bằng chứng
    return False, []
```

**Ví dụ**:
```
Goal: Chứng minh công ty có rủi ro cao (severity='high')

Step 1: Tìm rules kết luận severity='high'
  → Found: R1, R2, R3, R4

Step 2: Thử chứng minh với R1
  Conditions:
    - B1.risk_level = 'High' ✓ (có trong evaluations)
    - D3.risk_level = 'High' ✓ (có trong evaluations)
  
  → Tất cả conditions thỏa mãn!
  → CHỨNG MINH THÀNH CÔNG

Proof chain:
  1. Fact: B1.risk_level = 'High' (từ dữ liệu)
  2. Fact: D3.risk_level = 'High' (từ dữ liệu)
  3. Rule R1: B1=High AND D3=High → financial_distress (high)
```

### 5. Explanation Engine (`explanation_engine.py`)

**Chức năng**: Tạo giải thích cho quá trình suy diễn

**Các loại explanation**:

1. **Explain Why**: Tại sao có fact này?
   ```python
   explain_why("composite_R1_1")
   # → "Fact này được suy ra từ rule R1
   #    Dựa trên: eval_B1 (High), eval_D3 (High)
   #    Kết luận: financial_distress với severity=high"
   ```

2. **Explain Why Not**: Tại sao rule không kích hoạt?
   ```python
   explain_why_not("R5", evaluations)
   # → "Rule R5 không kích hoạt vì:
   #    ✗ C1.risk_level: Cần 'High', thực tế 'Medium'"
   ```

3. **Inference Trace**: Chuỗi các bước suy diễn
   ```python
   get_inference_trace()
   # → [
   #   {step: 1, rule: 'R1', input: [...], output: [...]},
   #   {step: 2, rule: 'R8', input: [...], output: [...]}
   # ]
   ```

4. **Justification Tree**: Cây chứng minh
   ```
   composite_R1_1 (financial_distress)
   ├── eval_B1 (High) ← initial fact
   └── eval_D3 (High) ← initial fact
   ```

---

## 🚀 Cách sử dụng

### Ví dụ 1: Forward Chaining

```python
from knowledge_inferer.inference_engine_v2 import InferenceEngineV2

# Khởi tạo engine
engine = InferenceEngineV2(
    config_dir='pipeline/4_risk_knowledge_model',
    use_forward_chaining=True  # Bật forward chaining
)

# Chạy inference
result = engine.infer_single_company(
    raw_data_path='dataset/raw_financial_data.csv',
    ticker='HPG',
    year=2023,
    quarter=4
)

# Xem kết quả
print(f"Risk Score: {result['final_score']['risk_score']:.2%}")
print(f"Iterations: {result['inference_stats']['iterations']}")
print(f"Rules fired: {result['inference_stats']['rules_fired']}")
```

### Ví dụ 2: Backward Chaining Query

```python
# Query: Tại sao công ty có rủi ro cao?
bc_result = result['backward_chaining']['why_high_risk']

if bc_result['success']:
    print("Tìm thấy bằng chứng!")
    print(f"Rules sử dụng: {bc_result['rules_used']}")
    print(bc_result['explanation'])
```

### Ví dụ 3: Explanation

```python
# Giải thích một fact cụ thể
explanation = engine.explain_why("composite_R1_1")
print(explanation)

# Export inference trace
engine.export_inference_trace("output/trace.json")
```

### Ví dụ 4: So sánh modes

```python
# So sánh Forward Chaining vs Pattern Matching
comparison = engine.compare_inference_modes(
    raw_data_path='dataset/raw_financial_data.csv',
    ticker='HPG',
    year=2023,
    quarter=4
)

print(f"Forward Chaining: {comparison['forward_chaining']['iterations']} iterations")
print(f"Pattern Matching: 1 pass only")
```

---

## 📊 Demo cho thuyết trình

Chạy script demo:

```bash
cd knowledge_inferer
python demo_inference_v2.py
```

**Các demo có sẵn**:

1. **Demo 1: Forward Chaining**
   - Minh họa inference loop
   - Hiển thị từng iteration
   - Xem inference trace

2. **Demo 2: Backward Chaining**
   - Query "Tại sao có rủi ro cao?"
   - Query "Có rủi ro X không?"
   - Hiển thị proof chain

3. **Demo 3: Explanation**
   - Explain why
   - Explain why not
   - Justification tree

4. **Demo 4: Comparison**
   - So sánh 2 modes
   - Hiển thị differences

---

## 🎯 Điểm nhấn cho thuyết trình

### 1. Forward Chaining là gì?

**Trước (Pattern Matching)**:
```python
# Chỉ kiểm tra rules 1 lần
for rule in rules:
    if check_rule(rule):
        results.append(rule)
# Xong! Không có vòng lặp
```

**Sau (Forward Chaining)**:
```python
# Vòng lặp suy diễn thực sự
while có_rules_mới:
    matching_rules = find_matching_rules()
    selected = conflict_resolver.select(matching_rules)
    new_facts = fire_rule(selected)
    working_memory.add(new_facts)  # Facts mới có thể kích hoạt rules khác!
# Rules có thể kích hoạt lẫn nhau → Suy diễn thực sự
```

### 2. Tại sao cần Conflict Resolution?

Khi nhiều rules cùng match, phải chọn rule nào?

- **Refractoriness**: Tránh lặp vô hạn
- **Specificity**: Ưu tiên rules cụ thể
- **Priority**: Ưu tiên theo mức độ nghiêm trọng

### 3. Backward Chaining khác gì Forward Chaining?

| Forward Chaining | Backward Chaining |
|------------------|-------------------|
| Data → Conclusion | Goal → Proof |
| "Có dữ liệu gì?" | "Chứng minh X" |
| Tìm tất cả kết luận | Chứng minh 1 goal |
| Breadth-first | Depth-first |

### 4. Explanation quan trọng như thế nào?

- **Transparency**: Hiểu được hệ thống suy luận như thế nào
- **Trust**: Tin tưởng vào kết quả
- **Debugging**: Tìm lỗi trong rules
- **Learning**: Học từ quá trình suy diễn

---

## 📝 Tóm tắt

**Inference Engine V2** là bộ suy diễn **thực sự** với:

✅ **Forward Chaining** - Vòng lặp suy diễn với working memory  
✅ **Backward Chaining** - Goal-driven reasoning  
✅ **Conflict Resolution** - 3 strategies chuẩn  
✅ **Explanation** - Trace, justification, why/why-not  
✅ **Rule Chaining** - Rules kích hoạt lẫn nhau  

Đây là **Knowledge-Based System đầy đủ**, không chỉ là pattern matching!
