import pandas as pd
import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime

from .phase1_data_standardization import DataStandardizer
from .phase2_indicator_calculation import IndicatorCalculator
from .phase3_risk_evaluation import RiskEvaluator
from .phase4_composite_inference import CompositeInferer


class InferenceEngine:
    """
    Main Inference Engine
    Điều phối toàn bộ quy trình suy diễn 4 pha
    """
    
    def __init__(self, config_dir: str):
        """
        Args:
            config_dir: Thư mục chứa các file cấu hình JSON
        """
        self.config_dir = config_dir
        
        schema_path = os.path.join(config_dir, 'schema_mapping.json')
        calculation_path = os.path.join(config_dir, 'calculation_rules.json')
        indicator_path = os.path.join(config_dir, 'indicator_rules.json')
        composite_path = os.path.join(config_dir, 'composite_rules.json')
        
        self.phase1 = DataStandardizer(schema_path)
        self.phase2 = IndicatorCalculator(calculation_path)
        self.phase3 = RiskEvaluator(indicator_path)
        self.phase4 = CompositeInferer(composite_path)
        
        self.known_facts = None
        self.solution_log = []
    
    def run_full_pipeline(self, raw_data_path: str) -> pd.DataFrame:
        """
        Chạy toàn bộ pipeline suy diễn
        
        Args:
            raw_data_path: Đường dẫn đến file dữ liệu thô
            
        Returns:
            DataFrame chứa kết quả đầy đủ
        """
        print("\n" + "="*60)
        print("FINANCIAL RISK INFERENCE ENGINE")
        print("="*60)
        
        self.known_facts = self.phase1.standardize(raw_data_path)
        
        self.known_facts = self.phase2.calculate_batch(self.known_facts)
        
        self.known_facts = self.phase3.evaluate_batch(self.known_facts)
        
        self.known_facts = self.phase4.infer_batch(self.known_facts)
        
        print("="*60)
        print("INFERENCE COMPLETED SUCCESSFULLY")
        print("="*60 + "\n")
        
        return self.known_facts
    
    def infer_single_company(self, 
                            raw_data_path: str, 
                            ticker: str, 
                            year: int, 
                            quarter: int) -> Dict[str, Any]:
        """
        Suy diễn cho một công ty cụ thể
        
        Args:
            raw_data_path: Đường dẫn đến file dữ liệu thô
            ticker: Mã chứng khoán
            year: Năm báo cáo
            quarter: Quý báo cáo
            
        Returns:
            Dict chứa kết quả suy diễn đầy đủ
        """
        print(f"\n{'='*60}")
        print(f"Analyzing: {ticker} - Q{quarter}/{year}")
        print(f"{'='*60}\n")
        
        standardized_data = self.phase1.standardize(raw_data_path)
        
        company_data = self.phase1.get_company_data(standardized_data, ticker, year, quarter)
        
        if company_data is None:
            return {
                'error': 'Company data not found',
                'ticker': ticker,
                'year': year,
                'quarter': quarter
            }
        
        print("\n=== Phase 2: Calculating Indicators ===")
        indicators = self.phase2.calculate_all_indicators(company_data)
        for ind, val in indicators.items():
            print(f"{ind}: {val:.4f}" if not pd.isna(val) else f"{ind}: N/A")
        
        print("\n=== Phase 3: Evaluating Risks ===")
        evaluations = self.phase3.evaluate_all_indicators(indicators)
        for ind, eval_result in evaluations.items():
            print(f"{ind}: {eval_result['risk_level']} (points: {eval_result['risk_point']})")
        
        risk_summary = self.phase3.get_risk_summary(evaluations)
        category_summary = self.phase3.get_category_summary(evaluations)
        
        print("\n=== Phase 4: Composite Risk Inference ===")
        composite_risks = self.phase4.infer_composite_risks(evaluations)
        print(f"Detected {len(composite_risks)} composite risks:")
        for risk in composite_risks:
            print(f"- [{risk['rule_id']}] {risk['risk_type']} ({risk['severity']})")
        
        final_score = self.phase4.calculate_final_risk_score(evaluations, composite_risks)
        explanation = self.phase4.generate_explanation(evaluations, composite_risks)
        
        result = {
            'company_info': {
                'ticker': ticker,
                'year': year,
                'quarter': quarter
            },
            'indicators': indicators,
            'evaluations': evaluations,
            'risk_summary': risk_summary,
            'category_summary': category_summary,
            'composite_risks': composite_risks,
            'final_score': final_score,
            'explanation': explanation,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"\n{'='*60}")
        print(f"FINAL RISK ASSESSMENT")
        print(f"{'='*60}")
        print(f"Risk Score: {final_score['risk_score']:.2%}")
        print(f"Risk Level: {final_score['risk_level']}")
        print(f"Total Risk Points: {final_score['total_risk_points']}/{final_score['max_total_points']}")
        print(f"Composite Risks: {final_score['composite_risk_count']}")
        print(f"{'='*60}\n")
        
        return result
    
    def export_results(self, output_path: str, format: str = 'csv'):
        """
        Xuất kết quả ra file
        
        Args:
            output_path: Đường dẫn file đầu ra
            format: Định dạng file ('csv', 'excel', 'json')
        """
        if self.known_facts is None:
            print("No data to export. Run inference first.")
            return
        
        if format == 'csv':
            export_df = self.known_facts.copy()
            
            export_df['composite_risks_json'] = export_df['composite_risks'].apply(
                lambda x: json.dumps(x, ensure_ascii=False)
            )
            export_df = export_df.drop(columns=['composite_risks'])
            
            export_df.to_csv(output_path, index=False, encoding='utf-8-sig')
            print(f"✓ Results exported to {output_path}")
        
        elif format == 'excel':
            export_df = self.known_facts.copy()
            export_df['composite_risks_json'] = export_df['composite_risks'].apply(
                lambda x: json.dumps(x, ensure_ascii=False)
            )
            export_df = export_df.drop(columns=['composite_risks'])
            
            export_df.to_excel(output_path, index=False, engine='openpyxl')
            print(f"✓ Results exported to {output_path}")
        
        elif format == 'json':
            export_data = self.known_facts.to_dict(orient='records')
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, ensure_ascii=False, indent=2, default=str)
            print(f"✓ Results exported to {output_path}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Lấy thống kê tổng quan"""
        if self.known_facts is None:
            return {}
        
        df = self.known_facts
        
        stats = {
            'total_companies': len(df),
            'total_records': len(df),
            'risk_level_distribution': df['composite_risk_count'].describe().to_dict(),
            'average_composite_risks': df['composite_risk_count'].mean(),
            'max_composite_risks': df['composite_risk_count'].max(),
            'companies_with_high_risk': (df['composite_risk_count'] >= 3).sum()
        }
        
        return stats
