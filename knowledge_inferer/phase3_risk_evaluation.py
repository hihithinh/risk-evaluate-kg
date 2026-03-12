import pandas as pd
import numpy as np
import json
from typing import Dict, Any, List, Optional


class RiskEvaluator:
    """
    Phase 3: Risk Evaluation
    Đánh giá rủi ro cục bộ cho từng chỉ số
    Áp dụng Heuristic H2 - Sắp xếp ưu tiên luật đơn
    """
    
    def __init__(self, indicator_rules_path: str):
        with open(indicator_rules_path, 'r', encoding='utf-8') as f:
            self.rules = json.load(f)
        
        self.indicator_map = {rule['indicator']: rule for rule in self.rules}
    
    def evaluate_indicator(self, indicator: str, value: float) -> Dict[str, Any]:
        """Đánh giá một chỉ số và trả về kết quả"""
        if indicator not in self.indicator_map:
            return {
                'indicator': indicator,
                'value': value,
                'risk_level': None,
                'risk_point': 0,
                'risk_type': None,
                'explanation': 'Indicator not found'
            }
        
        if pd.isna(value):
            return {
                'indicator': indicator,
                'value': value,
                'risk_level': None,
                'risk_point': 0,
                'risk_type': None,
                'explanation': 'Missing data'
            }
        
        rule = self.indicator_map[indicator]
        ranges = rule['ranges']
        
        for range_def in ranges:
            min_val = range_def.get('min')
            max_val = range_def.get('max')
            
            in_range = True
            
            if min_val is not None and value < min_val:
                in_range = False
            
            if max_val is not None and value >= max_val:
                in_range = False
            
            if in_range:
                return {
                    'indicator': indicator,
                    'value': value,
                    'risk_level': range_def['risk_level'],
                    'risk_point': range_def['risk_point'],
                    'risk_type': range_def.get('risk_type'),
                    'explanation': range_def['explanation'],
                    'category': rule['category'],
                    'name': rule['name']
                }
        
        return {
            'indicator': indicator,
            'value': value,
            'risk_level': 'Unknown',
            'risk_point': 0,
            'risk_type': None,
            'explanation': 'Value out of defined ranges'
        }
    
    def evaluate_all_indicators(self, indicators: Dict[str, float]) -> Dict[str, Dict[str, Any]]:
        """Đánh giá tất cả các chỉ số"""
        evaluations = {}
        
        for indicator, value in indicators.items():
            evaluations[indicator] = self.evaluate_indicator(indicator, value)
        
        return evaluations
    
    def evaluate_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Đánh giá rủi ro cho toàn bộ DataFrame"""
        print("\n=== Phase 3: Risk Evaluation ===")
        
        result_df = df.copy()
        
        indicator_cols = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3']
        
        for indicator in indicator_cols:
            if indicator not in df.columns:
                continue
            
            result_df[f'{indicator}_risk_level'] = df[indicator].apply(
                lambda val: self.evaluate_indicator(indicator, val)['risk_level']
            )
            result_df[f'{indicator}_risk_point'] = df[indicator].apply(
                lambda val: self.evaluate_indicator(indicator, val)['risk_point']
            )
            result_df[f'{indicator}_risk_type'] = df[indicator].apply(
                lambda val: self.evaluate_indicator(indicator, val)['risk_type']
            )
            
            risk_counts = result_df[f'{indicator}_risk_level'].value_counts()
            print(f"✓ {indicator}: {dict(risk_counts)}")
        
        print("✓ Phase 3 completed\n")
        return result_df
    
    def get_risk_summary(self, evaluations: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Tạo tóm tắt đánh giá rủi ro"""
        total_points = sum(eval_result['risk_point'] for eval_result in evaluations.values())
        max_points = len(evaluations) * 2
        
        high_risks = [
            ind for ind, eval_result in evaluations.items()
            if eval_result['risk_level'] == 'High'
        ]
        
        medium_risks = [
            ind for ind, eval_result in evaluations.items()
            if eval_result['risk_level'] == 'Medium'
        ]
        
        good_indicators = [
            ind for ind, eval_result in evaluations.items()
            if eval_result['risk_level'] == 'Good'
        ]
        
        risk_score = total_points / max_points if max_points > 0 else 0
        
        if risk_score >= 0.7:
            overall_level = 'High'
        elif risk_score >= 0.4:
            overall_level = 'Medium'
        else:
            overall_level = 'Good'
        
        return {
            'total_risk_points': total_points,
            'max_risk_points': max_points,
            'risk_score': risk_score,
            'overall_risk_level': overall_level,
            'high_risk_indicators': high_risks,
            'medium_risk_indicators': medium_risks,
            'good_indicators': good_indicators,
            'indicator_count': len(evaluations)
        }
    
    def get_category_summary(self, evaluations: Dict[str, Dict[str, Any]]) -> Dict[str, Dict]:
        """Tóm tắt theo từng nhóm chỉ số"""
        categories = {
            'liquidity': ['A1', 'A2', 'A3'],
            'leverage': ['B1', 'B2', 'B3'],
            'efficiency': ['C1', 'C2', 'C3'],
            'profitability': ['D1', 'D2', 'D3']
        }
        
        summary = {}
        
        for cat_name, indicators in categories.items():
            cat_evals = {ind: evaluations[ind] for ind in indicators if ind in evaluations}
            
            if cat_evals:
                total_points = sum(e['risk_point'] for e in cat_evals.values())
                max_points = len(cat_evals) * 2
                
                summary[cat_name] = {
                    'total_points': total_points,
                    'risk_score': total_points / max_points if max_points > 0 else 0,
                    'indicators': cat_evals
                }
        
        return summary
