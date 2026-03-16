# Quick Start - Inference Engine V2

## 🎯 Cho buổi thuyết trình (2 ngày nữa)

### Chạy demo nhanh

```bash
cd knowledge_inferer
python demo_inference_v2.py
```

Chọn option 5 để chạy tất cả demos.

---

## 📚 Hiểu nhanh hệ thống

### 1. Cấu trúc files mới

```
knowledge_inferer/
├── working_memory.py          ← Quản lý facts động
├── conflict_resolver.py       ← Giải quyết xung đột rules
├── explanation_engine.py      ← Tạo giải thích
├── forward_chainer.py         ← Suy diễn tiến (VÒNG LẶP)
├── backward_chainer.py        ← Suy diễn lùi (GOAL-DRIVEN)
├── inference_engine_v2.py     ← Engine chính (tích hợp tất cả)
└── demo_inference_v2.py       ← Demo scripts
```

### 2. Điểm khác biệt chính

**TRƯỚC (Pattern Matching)**:
```python
for rule in rules:
    if check(rule):
        results.append(rule)
# Xong! Không có vòng lặp
```

**SAU (Forward Chaining)**:
```python
while có_rules_mới:
    matching = find_matching_rules()
    selected = conflict_resolver.select(matching)
    new_facts = fire_rule(selected)
    working_memory.add(new_facts)  # ← Facts mới kích hoạt rules khác!
```

### 3. Các khái niệm cần nhớ

#### Working Memory
- Lưu trữ facts động
- Initial facts (từ Phase 3)
- Derived facts (từ rules)

#### Conflict Resolution
- **Refractoriness**: Không fire rule đã dùng
- **Specificity**: Ưu tiên rules cụ thể
- **Priority**: Ưu tiên theo severity

#### Forward Chaining
- Data-driven (từ dữ liệu → kết luận)
- Vòng lặp suy diễn
- Rules kích hoạt lẫn nhau

#### Backward Chaining
- Goal-driven (từ mục tiêu → tìm bằng chứng)
- Đệ quy chứng minh
- Proof chain

---

## 🎤 Kịch bản thuyết trình

### Slide 1: Vấn đề

"Hệ thống cũ chỉ là **pattern matching**, không phải inference engine thực sự"

**Demo**: Chạy pattern matching → chỉ check rules 1 lần

### Slide 2: Giải pháp

"Chúng em đã implement **Forward Chaining** và **Backward Chaining** thực sự"

**Demo**: 
```bash
python demo_inference_v2.py
# Chọn 1 - Forward Chaining
```

Chỉ ra:
- Số iterations (vòng lặp)
- Số rules fired
- Facts mới được tạo ra

### Slide 3: Forward Chaining

"Vòng lặp suy diễn với Working Memory và Conflict Resolution"

**Demo**: Xem inference trace
- Iteration 1: Fire R1 → tạo composite_R1
- Iteration 2: Fire R8 → tạo composite_R8
- ...

### Slide 4: Backward Chaining

"Goal-driven reasoning - chứng minh mục tiêu"

**Demo**:
```bash
python demo_inference_v2.py
# Chọn 2 - Backward Chaining
```

Query: "Tại sao công ty có rủi ro cao?"
→ Hiển thị proof chain

### Slide 5: Explanation

"Hệ thống có thể giải thích quá trình suy luận"

**Demo**:
```bash
python demo_inference_v2.py
# Chọn 3 - Explanation
```

- Explain why (tại sao có fact này?)
- Inference trace (chuỗi suy luận)

### Slide 6: So sánh

"Forward Chaining vs Pattern Matching"

**Demo**:
```bash
python demo_inference_v2.py
# Chọn 4 - Comparison
```

Chỉ ra differences:
- Forward Chaining: X iterations, Y rules fired
- Pattern Matching: 1 pass only

---

## 💡 Câu hỏi có thể gặp

### Q1: Forward Chaining khác Pattern Matching như thế nào?

**A**: Pattern Matching chỉ check rules **1 lần**. Forward Chaining có **vòng lặp**, rules có thể kích hoạt lẫn nhau, tạo ra facts mới.

**Ví dụ**:
- Iteration 1: R1 fire → tạo fact mới
- Iteration 2: Fact mới kích hoạt R8 → tạo fact mới nữa
- ...

### Q2: Conflict Resolution là gì?

**A**: Khi nhiều rules cùng match, phải chọn rule nào? Có 3 strategies:
1. **Refractoriness**: Không fire rule đã dùng (tránh lặp)
2. **Specificity**: Ưu tiên rules cụ thể hơn
3. **Priority**: Ưu tiên theo severity (high > medium > low)

### Q3: Backward Chaining dùng khi nào?

**A**: Khi muốn **chứng minh** một mục tiêu cụ thể.

**Ví dụ**:
- "Chứng minh công ty có rủi ro cao"
- "Công ty có rủi ro financial_distress không?"

### Q4: Tại sao cần Explanation?

**A**: 
- **Transparency**: Hiểu hệ thống suy luận thế nào
- **Trust**: Tin tưởng kết quả
- **Debugging**: Tìm lỗi trong rules

### Q5: Working Memory là gì?

**A**: Bộ nhớ làm việc lưu trữ facts động:
- Initial facts (từ dữ liệu đầu vào)
- Derived facts (từ rules)

Facts mới có thể kích hoạt rules khác → Suy diễn thực sự!

---

## 🔍 Code quan trọng cần hiểu

### Forward Chaining Loop (forward_chainer.py)

```python
def inference_loop(self, evaluations):
    # 1. Khởi tạo working memory
    self.initialize_working_memory(evaluations)
    
    iteration = 0
    while iteration < max_iterations:
        # 2. Tìm matching rules
        matching_rules = self.find_matching_rules()
        
        if not matching_rules:
            break  # Dừng khi không còn rules
        
        # 3. Conflict resolution
        selected = self.conflict_resolver.select_next_rule(matching_rules)
        
        # 4. Fire rule
        new_facts = self.fire_rule(selected)
        
        # 5. Thêm vào working memory
        for fact in new_facts:
            self.working_memory.add_fact(fact)
        
        iteration += 1
    
    return result
```

### Backward Chaining (backward_chainer.py)

```python
def prove_goal(self, goal, evaluations):
    # 1. Tìm rules kết luận goal
    matching_rules = self._find_rules_for_goal(goal)
    
    for rule in matching_rules:
        # 2. Thử chứng minh với từng rule
        all_met = True
        
        for condition in rule['conditions']:
            # 3. Đệ quy chứng minh sub-goals
            if not self._check_condition(condition, evaluations):
                all_met = False
                break
        
        # 4. Thành công nếu tất cả conditions thỏa
        if all_met:
            return True, proof_chain
    
    return False, []
```

---

## ✅ Checklist trước khi thuyết trình

- [ ] Đã chạy thử tất cả demos
- [ ] Hiểu rõ Forward Chaining loop
- [ ] Hiểu rõ Backward Chaining
- [ ] Hiểu rõ Conflict Resolution
- [ ] Chuẩn bị trả lời 5 câu hỏi trên
- [ ] Kiểm tra data có sẵn (raw_financial_data.csv)
- [ ] Test demo với công ty khác (VCB, FPT, etc.)

---

## 🚀 Chạy nhanh từng demo

### Demo Forward Chaining
```bash
cd knowledge_inferer
python -c "from demo_inference_v2 import demo_forward_chaining; demo_forward_chaining()"
```

### Demo Backward Chaining
```bash
python -c "from demo_inference_v2 import demo_backward_chaining; demo_backward_chaining()"
```

### Demo Explanation
```bash
python -c "from demo_inference_v2 import demo_explanation; demo_explanation()"
```

### Demo Comparison
```bash
python -c "from demo_inference_v2 import demo_comparison; demo_comparison()"
```

---

## 📊 Kết quả mong đợi

Khi chạy demo, bạn sẽ thấy:

**Forward Chaining**:
```
Iteration 1: Firing rule R1 (matched 3 rules)
Iteration 2: Firing rule R8 (matched 2 rules)
...
✓ Forward chaining completed:
  - Iterations: 3
  - Rules fired: 3
  - Composite risks found: 3
```

**Backward Chaining**:
```
✓ Found proof for high risk (used 2 rules)

Proof chain:
  1. Fact: B1.risk_level = 'High'
  2. Fact: D3.risk_level = 'High'
  3. Rule R1: B1=High AND D3=High → financial_distress (high)
```

**Comparison**:
```
Forward Chaining:
  Risk Score: 0.45
  Composite Risks: 3
  Iterations: 3

Pattern Matching:
  Risk Score: 0.45
  Composite Risks: 3
  
Differences:
  Risk Score Diff: 0.0000
  Composite Risks Diff: 0
```

---

## 🎓 Tóm tắt cho thuyết trình

**3 điểm chính**:

1. **Forward Chaining** = Vòng lặp suy diễn thực sự
   - Working Memory động
   - Conflict Resolution
   - Rules kích hoạt lẫn nhau

2. **Backward Chaining** = Goal-driven reasoning
   - Chứng minh mục tiêu
   - Proof chain
   - Đệ quy sub-goals

3. **Explanation** = Transparency
   - Inference trace
   - Why/Why not
   - Justification tree

**Kết luận**: Đây là **TRUE Inference Engine**, không chỉ pattern matching!
