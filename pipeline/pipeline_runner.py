#!/usr/bin/env python
# coding: utf-8

"""
Pipeline Runner - Bulk Processing for Financial Risk Assessment
Xử lý hàng loạt dữ liệu CSV với flow:
1. Phase 1: Data Standardization
2. Phase 2: Indicator Calculation
3. Cronbach Validation + Statistics
4. Phase 3: Risk Evaluation
5. Phase 4: Composite Risk Inference
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from knowledge_inferer.phase1_data_standardization import DataStandardizer
from knowledge_inferer.phase2_indicator_calculation import IndicatorCalculator
from knowledge_inferer.phase3_risk_evaluation import RiskEvaluator
from knowledge_inferer.phase4_composite_inference import CompositeInferer
import pandas as pd
import numpy as np
import json


def cronbach_alpha(df_items: pd.DataFrame) -> float:
    """Tính Cronbach's alpha cho một nhóm biến"""
    k = df_items.shape[1]
    
    if k < 2:
        return np.nan
    
    item_variances = df_items.var(axis=0, ddof=1)
    total_score = df_items.sum(axis=1)
    total_variance = total_score.var(ddof=1)
    
    if total_variance == 0:
        return np.nan
    
    alpha = (k / (k - 1)) * (1 - item_variances.sum() / total_variance)
    return alpha


def validate_indicators(df: pd.DataFrame) -> dict:
    """
    Validation và statistics cho indicators sau Phase 2
    
    Returns:
        Dict chứa cronbach results và descriptive stats
    """
    print("\n=== Cronbach Validation & Statistics ===")
    
    groups = {
        "A": ["A1", "A2", "A3"],
        "B": ["B1", "B2", "B3"],
        "C": ["C1", "C2", "C3"],
        "D": ["D1", "D2", "D3"],
    }
    
    all_indicators = [col for cols in groups.values() for col in cols]
    
    for col in all_indicators:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    
    analysis_df = df[all_indicators].dropna().copy()
    
    cronbach_results = {}
    for group_name, cols in groups.items():
        group_df = analysis_df[cols]
        alpha = cronbach_alpha(group_df)
        
        interpretation = "Good" if alpha >= 0.7 else "Acceptable" if alpha >= 0.6 else "Poor"
        
        cronbach_results[group_name] = {
            'alpha': alpha,
            'interpretation': interpretation,
            'n_items': len(cols),
            'n_samples': len(group_df)
        }
        
        print(f"✓ Group {group_name}: α = {alpha:.4f} ({interpretation})")
    
    descriptive_stats = analysis_df.describe()
    
    print(f"✓ Total samples analyzed: {len(analysis_df)}")
    print("✓ Validation completed\n")
    
    return {
        'cronbach_results': cronbach_results,
        'descriptive_stats': descriptive_stats.to_dict(),
        'n_samples': len(analysis_df)
    }


def run_bulk_pipeline(raw_data_path: str, output_path: str, config_dir: str = 'rules', 
                     validation_output: str = None):
    """
    Chạy pipeline xử lý hàng loạt với cronbach validation
    
    Args:
        raw_data_path: Đường dẫn file CSV raw data
        output_path: Đường dẫn file CSV output
        config_dir: Thư mục chứa các file JSON rules
        validation_output: (Optional) Đường dẫn lưu kết quả validation
    """
    print("\n" + "="*80)
    print("BULK FINANCIAL RISK ASSESSMENT PIPELINE")
    print("="*80)
    
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(project_root, config_dir)
    
    print(f"\n📂 Config directory: {config_path}")
    print(f"📂 Input file: {raw_data_path}")
    print(f"📂 Output file: {output_path}")
    
    schema_path = os.path.join(config_path, 'schema_mapping.json')
    calculation_path = os.path.join(config_path, 'calculation_rules.json')
    indicator_path = os.path.join(config_path, 'indicator_rules.json')
    composite_path = os.path.join(config_path, 'composite_rules.json')
    
    phase1 = DataStandardizer(schema_path)
    phase2 = IndicatorCalculator(calculation_path)
    phase3 = RiskEvaluator(indicator_path)
    phase4 = CompositeInferer(composite_path)
    
    print("\n" + "="*80)
    print("PHASE 1: DATA STANDARDIZATION")
    print("="*80)
    df = phase1.standardize(raw_data_path)
    
    print("\n" + "="*80)
    print("PHASE 2: INDICATOR CALCULATION")
    print("="*80)
    df = phase2.calculate_batch(df)
    
    print("\n" + "="*80)
    print("CRONBACH VALIDATION & STATISTICS")
    print("="*80)
    validation_results = validate_indicators(df)
    
    if validation_output:
        with open(validation_output, 'w', encoding='utf-8') as f:
            json.dump(validation_results, f, ensure_ascii=False, indent=2, default=str)
        print(f"✓ Validation results saved to {validation_output}")
    
    print("\n" + "="*80)
    print("PHASE 3: RISK EVALUATION")
    print("="*80)
    df = phase3.evaluate_batch(df)
    
    print("\n" + "="*80)
    print("PHASE 4: COMPOSITE RISK INFERENCE")
    print("="*80)
    df = phase4.infer_batch(df)
    
    export_df = df.copy()
    export_df['composite_risks_json'] = export_df['composite_risks'].apply(
        lambda x: json.dumps(x, ensure_ascii=False)
    )
    export_df = export_df.drop(columns=['composite_risks'])
    
    export_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"\n✓ Results exported to {output_path}")
    
    print("\n" + "="*80)
    print("PIPELINE STATISTICS")
    print("="*80)
    print(f"Total records processed: {len(df)}")
    print(f"Records with composite risks: {(df['composite_risk_count'] > 0).sum()}")
    print(f"Average composite risks: {df['composite_risk_count'].mean():.2f}")
    
    high_risk_count = sum(
        (df[f'{ind}_risk_level'] == 'High').sum() 
        for ind in ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3']
        if f'{ind}_risk_level' in df.columns
    )
    print(f"Total high-risk indicators detected: {high_risk_count}")
    print("="*80 + "\n")
    
    return df, validation_results


def main():
    """Main entry point"""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    raw_data_path = os.path.join(project_root, 'dataset', 'raw_financial_data.csv')
    output_path = os.path.join(project_root, 'dataset', 'risk_assessment_results.csv')
    validation_output = os.path.join(project_root, 'dataset', 'validation_results.json')
    
    if not os.path.exists(raw_data_path):
        print(f"❌ Error: Input file not found: {raw_data_path}")
        return
    
    results_df, validation_results = run_bulk_pipeline(
        raw_data_path=raw_data_path,
        output_path=output_path,
        config_dir='rules',
        validation_output=validation_output
    )
    
    print(f"\n✅ Pipeline completed successfully!")
    print(f"📊 Processed {len(results_df)} records")
    print(f"📊 Validation results: {validation_output}")


if __name__ == "__main__":
    main()
