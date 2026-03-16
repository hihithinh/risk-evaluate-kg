"""
Demo script cho Inference Engine V2
Minh họa Forward Chaining, Backward Chaining, và Explanation
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from knowledge_inferer.inference_engine_v2 import InferenceEngineV2


def demo_forward_chaining():
    """
    Demo 1: Forward Chaining - Data-driven reasoning
    
    Minh họa:
    - Inference loop với working memory
    - Conflict resolution
    - Rule firing và fact generation
    - Inference trace
    """
    print("\n" + "="*80)
    print("DEMO 1: FORWARD CHAINING - DATA-DRIVEN REASONING")
    print("="*80)
    print("\nMô tả:")
    print("- Bắt đầu từ dữ liệu (initial facts)")
    print("- Tìm rules có thể kích hoạt")
    print("- Chọn rule tốt nhất (conflict resolution)")
    print("- Kích hoạt rule → tạo facts mới")
    print("- Lặp lại cho đến khi không còn rules nào")
    print("\n" + "-"*80)
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_dir = os.path.join(project_root, 'pipeline', '4_risk_knowledge_model')
    raw_data_path = os.path.join(project_root, 'dataset', 'raw_financial_data.csv')
    
    # Khởi tạo engine với Forward Chaining
    engine = InferenceEngineV2(config_dir, use_forward_chaining=True)
    
    # Chạy inference cho một công ty
    result = engine.infer_single_company(
        raw_data_path=raw_data_path,
        ticker='HPG',
        year=2023,
        quarter=4
    )
    
    # Hiển thị inference trace
    print("\n" + "="*80)
    print("INFERENCE TRACE (Chuỗi suy luận)")
    print("="*80)
    
    if result.get('inference_trace'):
        for i, step in enumerate(result['inference_trace'], 1):
            print(f"\nBước {i}:")
            print(f"  Rule: {step['rule_id']}")
            print(f"  Input facts: {len(step['input_facts'])} facts")
            print(f"  Output facts: {len(step['output_facts'])} facts")
            print(f"  Giải thích: {step['explanation'][:100]}...")
    
    # Hiển thị statistics
    if result.get('inference_stats'):
        stats = result['inference_stats']
        print("\n" + "="*80)
        print("INFERENCE STATISTICS")
        print("="*80)
        print(f"Số vòng lặp: {stats['iterations']}")
        print(f"Số rules đã kích hoạt: {stats['rules_fired']}")
        print(f"Tổng số facts: {stats['total_facts']}")
        print(f"Composite risks phát hiện: {stats['composite_risks_count']}")
    
    return result


def demo_backward_chaining():
    """
    Demo 2: Backward Chaining - Goal-driven reasoning
    
    Minh họa:
    - Bắt đầu từ goal (mục tiêu)
    - Tìm rules có thể suy ra goal
    - Đệ quy chứng minh sub-goals
    - Proof chain (chuỗi chứng minh)
    """
    print("\n" + "="*80)
    print("DEMO 2: BACKWARD CHAINING - GOAL-DRIVEN REASONING")
    print("="*80)
    print("\nMô tả:")
    print("- Bắt đầu từ goal (ví dụ: 'Chứng minh công ty có rủi ro cao')")
    print("- Tìm rules có thể suy ra goal")
    print("- Đệ quy chứng minh các điều kiện (sub-goals)")
    print("- Trả về proof chain nếu thành công")
    print("\n" + "-"*80)
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_dir = os.path.join(project_root, 'pipeline', '4_risk_knowledge_model')
    raw_data_path = os.path.join(project_root, 'dataset', 'raw_financial_data.csv')
    
    engine = InferenceEngineV2(config_dir, use_forward_chaining=True)
    
    # Chạy inference trước
    result = engine.infer_single_company(
        raw_data_path=raw_data_path,
        ticker='HPG',
        year=2023,
        quarter=4
    )
    
    # Backward chaining queries
    print("\n" + "="*80)
    print("BACKWARD CHAINING QUERIES")
    print("="*80)
    
    # Query 1: Tại sao có rủi ro cao?
    print("\nQuery 1: Tại sao công ty này có rủi ro cao?")
    print("-"*80)
    bc_result = result['backward_chaining']['why_high_risk']
    
    if bc_result['success']:
        print("✓ Tìm thấy bằng chứng!")
        print(f"\nRules sử dụng: {', '.join(bc_result['rules_used'])}")
        print(f"\nGiải thích:\n{bc_result['explanation']}")
    else:
        print("✗ Không tìm thấy bằng chứng cho rủi ro cao")
    
    # Query 2: Có rủi ro cụ thể không?
    print("\n" + "-"*80)
    print("Query 2: Công ty có rủi ro 'financial_distress' không?")
    print("-"*80)
    
    fd_result = result['backward_chaining']['financial_distress_query']
    
    if fd_result['has_risk']:
        print("✓ CÓ rủi ro financial_distress")
        print(f"\nGiải thích:\n{fd_result['explanation']}")
    else:
        print("✗ KHÔNG có rủi ro financial_distress")
    
    # Custom query
    print("\n" + "-"*80)
    print("Query 3: Custom goal - Có rủi ro liquidity_crisis không?")
    print("-"*80)
    
    custom_goal = {'risk_type': 'liquidity_crisis'}
    custom_result = engine.query_backward(custom_goal)
    
    if custom_result['success']:
        print("✓ Tìm thấy bằng chứng!")
        print(f"\nProof chain có {len(custom_result['proof_chain'])} bước")
        print(f"\nGiải thích:\n{custom_result['explanation']}")
    else:
        print("✗ Không tìm thấy bằng chứng")
    
    return result


def demo_explanation():
    """
    Demo 3: Explanation Mechanism
    
    Minh họa:
    - Explain why (Tại sao có kết luận này?)
    - Explain why not (Tại sao không có kết luận khác?)
    - Inference trace
    - Justification tree
    """
    print("\n" + "="*80)
    print("DEMO 3: EXPLANATION MECHANISM")
    print("="*80)
    print("\nMô tả:")
    print("- Explain Why: Giải thích tại sao có fact/kết luận này")
    print("- Explain Why Not: Giải thích tại sao rule không kích hoạt")
    print("- Inference Trace: Chuỗi các bước suy diễn")
    print("- Justification Tree: Cây chứng minh")
    print("\n" + "-"*80)
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_dir = os.path.join(project_root, 'pipeline', '4_risk_knowledge_model')
    raw_data_path = os.path.join(project_root, 'dataset', 'raw_financial_data.csv')
    
    engine = InferenceEngineV2(config_dir, use_forward_chaining=True)
    
    result = engine.infer_single_company(
        raw_data_path=raw_data_path,
        ticker='HPG',
        year=2023,
        quarter=4
    )
    
    # Explain composite risks
    print("\n" + "="*80)
    print("GIẢI THÍCH CÁC COMPOSITE RISKS")
    print("="*80)
    
    for i, risk in enumerate(result['composite_risks'][:3], 1):
        print(f"\nComposite Risk #{i}:")
        print(f"  Rule: {risk['rule_id']}")
        print(f"  Type: {risk['risk_type']}")
        print(f"  Severity: {risk['severity']}")
        print(f"  Explanation: {risk['explanation']}")
    
    # Explain specific fact
    print("\n" + "="*80)
    print("EXPLAIN WHY - Giải thích một fact cụ thể")
    print("="*80)
    
    if result['composite_risks']:
        first_risk = result['composite_risks'][0]
        fact_id = f"composite_{first_risk['rule_id']}_0"
        
        print(f"\nGiải thích cho fact: {fact_id}")
        print("-"*80)
        
        explanation = engine.explain_why(fact_id)
        print(explanation)
    
    # Export trace
    print("\n" + "="*80)
    print("EXPORT INFERENCE TRACE")
    print("="*80)
    
    trace_output = os.path.join(project_root, 'output', 'inference_trace.json')
    os.makedirs(os.path.dirname(trace_output), exist_ok=True)
    
    engine.export_inference_trace(trace_output)
    print(f"\nInference trace đã được xuất ra: {trace_output}")
    
    return result


def demo_comparison():
    """
    Demo 4: So sánh Forward Chaining vs Pattern Matching
    
    Minh họa sự khác biệt giữa:
    - Forward Chaining (inference loop thực sự)
    - Pattern Matching (one-pass matching)
    """
    print("\n" + "="*80)
    print("DEMO 4: FORWARD CHAINING vs PATTERN MATCHING")
    print("="*80)
    print("\nMô tả:")
    print("- Forward Chaining: Vòng lặp suy diễn, rules kích hoạt lẫn nhau")
    print("- Pattern Matching: Kiểm tra rules một lần, không có vòng lặp")
    print("\n" + "-"*80)
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_dir = os.path.join(project_root, 'pipeline', '4_risk_knowledge_model')
    raw_data_path = os.path.join(project_root, 'dataset', 'raw_financial_data.csv')
    
    engine = InferenceEngineV2(config_dir, use_forward_chaining=True)
    
    comparison = engine.compare_inference_modes(
        raw_data_path=raw_data_path,
        ticker='HPG',
        year=2023,
        quarter=4
    )
    
    return comparison


def main():
    """Main function để chạy tất cả demos"""
    print("\n" + "="*80)
    print("INFERENCE ENGINE V2 - DEMONSTRATION")
    print("Minh họa Forward Chaining, Backward Chaining, và Explanation")
    print("="*80)
    
    print("\nChọn demo:")
    print("1. Forward Chaining (Data-driven reasoning)")
    print("2. Backward Chaining (Goal-driven reasoning)")
    print("3. Explanation Mechanism")
    print("4. So sánh Forward Chaining vs Pattern Matching")
    print("5. Chạy tất cả demos")
    
    choice = input("\nNhập lựa chọn (1-5): ").strip()
    
    if choice == '1':
        demo_forward_chaining()
    elif choice == '2':
        demo_backward_chaining()
    elif choice == '3':
        demo_explanation()
    elif choice == '4':
        demo_comparison()
    elif choice == '5':
        print("\n" + "="*80)
        print("CHẠY TẤT CẢ DEMOS")
        print("="*80)
        
        demo_forward_chaining()
        input("\nNhấn Enter để tiếp tục sang demo tiếp theo...")
        
        demo_backward_chaining()
        input("\nNhấn Enter để tiếp tục sang demo tiếp theo...")
        
        demo_explanation()
        input("\nNhấn Enter để tiếp tục sang demo tiếp theo...")
        
        demo_comparison()
    else:
        print("Lựa chọn không hợp lệ")
    
    print("\n" + "="*80)
    print("DEMO HOÀN TẤT")
    print("="*80)


if __name__ == '__main__':
    main()
