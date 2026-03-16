# Hướng dẫn cài đặt và chạy - Node.js Version

## 📦 Cài đặt

### Bước 1: Di chuyển vào thư mục src
```bash
cd /Users/linoedge/study/study-projects/knowledge-graph/src
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

Hoặc nếu dùng pnpm (nhanh hơn):
```bash
pnpm install
```

## 🚀 Chạy demo

### Chạy tất cả demos
```bash
node demo.js
```

### Chạy từng demo riêng
```bash
# Forward Chaining only
node demo.js forward

# Backward Chaining only
node demo.js backward

# Comparison
node demo.js comparison
```

## ✅ Kiểm tra cài đặt thành công

Nếu chạy `node demo.js` và thấy output như sau là thành công:

```
================================================================================
KNOWLEDGE INFERENCE ENGINE - NODE.JS VERSION
================================================================================
Demo các tính năng của Inference Engine V2

================================================================================
DEMO 1: FORWARD CHAINING - DATA-DRIVEN REASONING
================================================================================

Mô tả:
- Bắt đầu từ dữ liệu (initial facts)
- Tìm rules có thể kích hoạt
- Chọn rule tốt nhất (conflict resolution)
- Kích hoạt rule → tạo facts mới
- Lặp lại cho đến khi không còn rules nào

=== Forward Chaining Inference Loop ===
Initial facts: 12
  Iteration 1: Firing rule R1 (matched 3 rules)
  ...
```

## 🔧 Troubleshooting

### Lỗi: Cannot find module
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
```

**Giải pháp**:
1. Kiểm tra đang ở đúng thư mục `src/`
2. Chạy `npm install` lại
3. Kiểm tra Node.js version >= 18

### Lỗi: ENOENT composite_rules.json
```
Error: ENOENT: no such file or directory, open '.../composite_rules.json'
```

**Giải pháp**:
File `composite_rules.json` cần tồn tại tại:
```
/Users/linoedge/study/study-projects/knowledge-graph/pipeline/4_risk_knowledge_model/composite_rules.json
```

Nếu không có, demo sẽ chạy với mock data và báo lỗi nhẹ (không ảnh hưởng logic).

### Kiểm tra Node.js version
```bash
node --version
# Cần >= v18.0.0
```

Nếu version cũ, cài Node.js mới:
```bash
# macOS
brew install node

# Hoặc dùng nvm
nvm install 18
nvm use 18
```

## 📝 Files đã tạo

```
src/
├── core/
│   ├── Fact.js                 ✅ Fact model
│   ├── WorkingMemory.js        ✅ Working memory
│   ├── ConflictResolver.js     ✅ Conflict resolution
│   ├── ExplanationEngine.js    ✅ Explanation
│   ├── ForwardChainer.js       ✅ Forward chaining
│   └── BackwardChainer.js      ✅ Backward chaining
├── demo.js                      ✅ Demo script
├── package.json                 ✅ Dependencies
├── README.md                    ✅ Documentation
└── SETUP.md                     ✅ This file
```

## 🎯 Cho buổi thuyết trình

### Chuẩn bị trước (5 phút trước thuyết trình):

1. **Mở terminal** tại thư mục `src/`
2. **Chạy thử** `node demo.js` để đảm bảo hoạt động
3. **Chuẩn bị slides** với các điểm chính:
   - Forward Chaining = Vòng lặp suy diễn
   - Backward Chaining = Chứng minh mục tiêu
   - Conflict Resolution = 3 strategies

### Kịch bản demo (2-3 phút):

```bash
# 1. Giới thiệu
"Đây là Knowledge Inference Engine được viết lại bằng Node.js"

# 2. Chạy Forward Chaining
node demo.js forward

# 3. Chỉ ra các điểm quan trọng:
"- Có vòng lặp suy diễn (iterations)
 - Rules được kích hoạt tuần tự (rules fired)
 - Tạo ra facts mới (new facts created)
 - Đây là suy diễn thực sự, không phải pattern matching"

# 4. Chạy Backward Chaining
node demo.js backward

# 5. Chỉ ra:
"- Chứng minh được goal (tìm thấy bằng chứng)
 - Có proof chain (chuỗi chứng minh)
 - Goal-driven reasoning"
```

### Câu hỏi có thể gặp:

**Q: Khác gì với Python version?**
A: Logic hoàn toàn giống nhau, chỉ khác ngôn ngữ. Node.js dễ đọc hơn với JavaScript.

**Q: Tại sao chuyển sang Node.js?**
A: JavaScript dễ hiểu hơn Python đối với em, và có thể tích hợp frontend Vue dễ dàng.

**Q: Forward Chaining khác Pattern Matching như thế nào?**
A: Pattern Matching chỉ check rules 1 lần. Forward Chaining có vòng lặp, rules có thể kích hoạt lẫn nhau.

## ✨ Tính năng đã implement

✅ **Working Memory** - Quản lý facts động  
✅ **Conflict Resolution** - 3 strategies (Refractoriness, Specificity, Priority)  
✅ **Forward Chaining** - Vòng lặp suy diễn thực sự  
✅ **Backward Chaining** - Goal-driven reasoning  
✅ **Explanation Engine** - Trace và justification  
✅ **Demo Script** - Chạy được ngay với mock data  

## 🎓 Tóm tắt

**Đã hoàn thành**:
- ✅ Core inference engine (5 components)
- ✅ Demo script với mock data
- ✅ Documentation đầy đủ

**Chưa làm** (để sau):
- ⏸️ Phase 1-3 (Data processing)
- ⏸️ REST API
- ⏸️ Vue frontend

**Kết luận**: Core inference engine đã hoàn chỉnh và chạy được. Đủ để demo và thuyết trình!
