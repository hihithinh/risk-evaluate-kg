"""
Example usage of the Financial Risk Inference Engine
"""

import os
import sys
from inference_engine import InferenceEngine


def example_batch_inference():
    """Ví dụ: Suy diễn cho toàn bộ dataset"""
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    config_dir = os.path.join(project_root, 'rules')
    raw_data_path = os.path.join(project_root, 'dataset', 'raw_financial_data.csv')
    output_path = os.path.join(project_root, 'dataset', 'risk_assessment_results.csv')
    
    engine = InferenceEngine(config_dir)
    
    results = engine.run_full_pipeline(raw_data_path)
    
    engine.export_results(output_path, format='csv')
    
    stats = engine.get_statistics()
    print("\n=== Statistics ===")
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    return results


def example_single_company():
    """Ví dụ: Suy diễn cho một công ty cụ thể"""
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    config_dir = os.path.join(project_root, 'rules')
    raw_data_path = os.path.join(project_root, 'dataset', 'raw_financial_data.csv')
    
    engine = InferenceEngine(config_dir)
    
    result = engine.infer_single_company(
        raw_data_path=raw_data_path,
        ticker='HPG',
        year=2024,
        quarter=3
    )
    
    print("\n=== Detailed Explanation ===")
    print(result['explanation'])
    
    print("\n=== Risk Summary by Category ===")
    for category, summary in result['category_summary'].items():
        print(f"\n{category.upper()}:")
        print(f"  Risk Score: {summary['risk_score']:.2%}")
        print(f"  Risk Points: {summary['total_points']}")
    
    return result


def example_compare_companies():
    """Ví dụ: So sánh nhiều công ty"""
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    config_dir = os.path.join(project_root, 'rules')
    raw_data_path = os.path.join(project_root, 'dataset', 'raw_financial_data.csv')
    
    engine = InferenceEngine(config_dir)
    
    companies = [
        ('HPG', 2024, 3),
        ('VCB', 2024, 3),
        ('FPT', 2024, 3),
    ]
    
    results = []
    for ticker, year, quarter in companies:
        result = engine.infer_single_company(raw_data_path, ticker, year, quarter)
        results.append(result)
    
    print("\n=== Comparison Summary ===")
    print(f"{'Company':<10} {'Risk Score':<15} {'Risk Level':<15} {'Composite Risks':<20}")
    print("-" * 60)
    
    for result in results:
        if 'error' not in result:
            info = result['company_info']
            score = result['final_score']
            print(f"{info['ticker']:<10} {score['risk_score']:<15.2%} {score['risk_level']:<15} {score['composite_risk_count']:<20}")
    
    return results


if __name__ == '__main__':
    print("Financial Risk Inference Engine - Examples\n")
    print("Choose an example:")
    print("1. Batch inference (all companies)")
    print("2. Single company analysis")
    print("3. Compare multiple companies")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == '1':
        example_batch_inference()
    elif choice == '2':
        example_single_company()
    elif choice == '3':
        example_compare_companies()
    else:
        print("Invalid choice")
