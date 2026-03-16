# Knowledge Inference Engine - Node.js Version

Inference Engine với Forward Chaining và Backward Chaining thực sự, được viết bằng Node.js.

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
cd src
npm install
```

### 2. Chạy demo

```bash
# Chạy tất cả demos
node demo.js

# Chỉ Forward Chaining
node demo.js forward

# Chỉ Backward Chaining
node demo.js backward

# So sánh 2 modes
node demo.js comparison
```

## 📁 Cấu trúc thư mục

```
src/
├── core/                      # Core inference components
│   ├── Fact.js               # Fact model
│   ├── WorkingMemory.js      # Quản lý facts động
│   ├── ConflictResolver.js   # Giải quyết xung đột rules
│   ├── ExplanationEngine.js  # Tạo giải thích
│   ├── ForwardChainer.js     # Suy diễn tiến (vòng lặp)
│   └── BackwardChainer.js    # Suy diễn lùi (goal-driven)
├── demo.js                    # Demo script
├── package.json
└── README.md
```

## 🔧 Core Components

### 1. WorkingMemory
Quản lý facts động trong quá trình suy diễn.

```javascript
import { WorkingMemory, Fact } from './core/WorkingMemory.js';

const wm = new WorkingMemory();

// Thêm fact
const fact = new Fact('eval_B1', 'indicator_evaluation', {
  risk_level: 'High',
  risk_point: 2
}, 'initial');

wm.addFact(fact);

// Query facts
const highRiskFacts = wm.queryFacts({ risk_level: 'High' });
```

### 2. ConflictResolver
Giải quyết xung đột khi nhiều rules cùng match.

**3 Strategies**:
- **Refractoriness**: Không fire rule đã dùng
- **Specificity**: Ưu tiên rules cụ thể hơn
- **Priority**: Ưu tiên theo severity (high > medium > low)

```javascript
import { ConflictResolver } from './core/ConflictResolver.js';

const resolver = new ConflictResolver();
const selectedRule = resolver.selectNextRule(candidateRules, wmSnapshot);
```

### 3. ForwardChainer
Suy diễn tiến với vòng lặp thực sự.

```javascript
import { ForwardChainer } from './core/ForwardChainer.js';

const fc = new ForwardChainer('path/to/composite_rules.json');
const result = fc.inferenceLoop(evaluations);

console.log(`Iterations: ${result.inference_stats.iterations}`);
console.log(`Rules fired: ${result.inference_stats.rules_fired}`);
```

**Inference Loop**:
```
while (có_rules_mới) {
  1. Tìm matching rules
  2. Conflict resolution → chọn rule tốt nhất
  3. Fire rule → tạo facts mới
  4. Thêm facts vào working memory
  5. Lặp lại
}
```

### 4. BackwardChainer
Suy diễn lùi - chứng minh mục tiêu.

```javascript
import { BackwardChainer } from './core/BackwardChainer.js';

const bc = new BackwardChainer('path/to/composite_rules.json');

// Query: Tại sao có rủi ro cao?
const result = bc.queryWhyHighRisk(evaluations);

if (result.success) {
  console.log(result.explanation);
  console.log('Rules used:', result.rules_used);
}
```

### 5. ExplanationEngine
Tạo giải thích cho quá trình suy diễn.

```javascript
import { ExplanationEngine } from './core/ExplanationEngine.js';

const ee = new ExplanationEngine();

// Record inference steps
ee.recordStep(ruleId, inputFacts, outputFacts, description, explanation);

// Get summary
const summary = ee.generateSummary();

// Explain specific fact
const explanation = ee.explainWhy(factId, workingMemory);
```

## 🎯 Demo Output

Khi chạy `node demo.js`, bạn sẽ thấy:

### Forward Chaining
```
=== Forward Chaining Inference Loop ===
Initial facts: 12

  Iteration 1: Firing rule R1 (matched 3 rules)
  Iteration 2: Firing rule R8 (matched 2 rules)
  ...

✓ No more rules to fire. Stopping at iteration 3

Inference completed:
  - Total iterations: 3
  - Rules fired: 3
  - Initial facts: 12
  - Final facts: 15
  - New facts created: 3

KẾT QUẢ FORWARD CHAINING
Inference Statistics:
  - Iterations: 3
  - Rules fired: 3
  - Composite risks found: 3

Final Risk Score:
  - Risk Score: 45.23%
  - Risk Level: Medium
  - Total Points: 19/42
```

### Backward Chaining
```
BACKWARD CHAINING QUERIES

Query 1: Tại sao công ty này có rủi ro cao?
✓ Tìm thấy bằng chứng!

Rules sử dụng: R1, R2

=== Chuỗi chứng minh (Backward Chaining) ===

1. Rule R1: Tỷ lệ nợ cao kết hợp với khả năng sinh lời thấp
   ✓ Tất cả điều kiện đều thỏa mãn
2. Fact: B1.risk_level eq High (thực tế: High)
3. Fact: D3.risk_level eq High (thực tế: High)
```

## 📊 So sánh với Python Version

| Tính năng | Python | Node.js |
|-----------|--------|---------|
| Working Memory | ✅ | ✅ |
| Conflict Resolution | ✅ | ✅ |
| Forward Chaining Loop | ✅ | ✅ |
| Backward Chaining | ✅ | ✅ |
| Explanation Engine | ✅ | ✅ |
| Performance | Tốt | Tốt hơn (V8 engine) |
| Code dễ đọc | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔍 Debugging

### Test Working Memory
```javascript
import { WorkingMemory, Fact } from './core/WorkingMemory.js';

const wm = new WorkingMemory();
const fact = new Fact('test_1', 'test_type', { value: 100 });
wm.addFact(fact);

console.log(wm.getFact('test_1')); // Should print fact
console.log(wm.size); // Should be 1
```

### Test Conflict Resolver
```javascript
import { ConflictResolver } from './core/ConflictResolver.js';

const resolver = new ConflictResolver();
const rules = [
  { rule_id: 'R1', conditions: [{}, {}], result: { severity: 'high' } },
  { rule_id: 'R2', conditions: [{}], result: { severity: 'medium' } }
];

const selected = resolver.selectNextRule(rules, {});
console.log(selected.rule_id); // Should be R1 (more specific + higher priority)
```

## 🐛 Troubleshooting

### Error: Cannot find module
```bash
# Đảm bảo đang ở thư mục src/
cd src

# Cài lại dependencies
npm install
```

### Error: ENOENT: no such file or directory
```
Lỗi này xảy ra khi không tìm thấy file composite_rules.json.

Giải pháp:
1. Kiểm tra file tồn tại tại: ../pipeline/4_risk_knowledge_model/composite_rules.json
2. Hoặc sửa đường dẫn trong demo.js
```

### Demo chạy nhưng không có output
```
Kiểm tra:
1. File composite_rules.json có đúng format không?
2. Mock data trong demo.js có đúng không?
3. Console có báo lỗi gì không?
```

## 📚 Tài liệu thêm

- **NODEJS_MIGRATION_PLAN.md** - Plan chi tiết migration
- **Python version** - Xem `knowledge_inferer/` để so sánh

## 🎓 Cho buổi thuyết trình

### Điểm nhấn chính:

1. **Forward Chaining = Vòng lặp suy diễn**
   - Không phải pattern matching 1 lần
   - Rules có thể kích hoạt lẫn nhau
   - Working Memory động

2. **Backward Chaining = Chứng minh mục tiêu**
   - Goal-driven reasoning
   - Proof chain
   - Đệ quy sub-goals

3. **Conflict Resolution**
   - 3 strategies: Refractoriness, Specificity, Priority
   - Chọn rule tốt nhất khi nhiều rules match

4. **Explanation**
   - Inference trace
   - Why/Why-not queries
   - Transparency

### Demo nhanh (2 phút):
```bash
node demo.js forward
```

Chỉ ra:
- Số iterations (vòng lặp)
- Số rules fired
- Composite risks detected
- Inference trace

## 🚀 Next Steps

Nếu muốn mở rộng:

1. **Thêm Phase 1-3** - Data processing, indicator calculation, risk evaluation
2. **Build REST API** - Express.js endpoints
3. **Add Vue frontend** - Giao diện web đẹp
4. **Database integration** - Lưu trữ kết quả
5. **Real-time inference** - WebSocket updates

Nhưng hiện tại, **core inference engine đã hoàn chỉnh** và chạy được!
