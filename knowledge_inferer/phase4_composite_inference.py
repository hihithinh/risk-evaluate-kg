import pandas as pd
import numpy as np
import json
from typing import Dict, Any, List, Optional


class CompositeInferer:
    """
    Phase 4: Composite Risk Inference
    Suy luận rủi ro phức hợp dựa trên kết hợp nhiều tín hiệu
    """
    
    def __init__(self, composite_rules_path: str):
        with open(composite_rules_path, 'r', encoding='utf-8') as f:
            self.rules = json.load(f)
    
    def check_condition(self, condition: Dict, evaluations: Dict[str, Dict[str, Any]]) -> bool:
        """Kiểm tra một điều kiện"""
        indicator = condition['indicator']
        
        if indicator not in evaluations:
            return False
        
        eval_result = evaluations[indicator]
        
        if condition.get('source') == 'indicator_rules_output':
            field = condition.get('field', 'risk_level')
            operator = condition['operator']
            expected_value = condition['value']
            
            actual_value = eval_result.get(field)
            
            if operator == 'eq':
                return actual_value == expected_value
            elif operator == 'in':
                return actual_value in expected_value
            elif operator == 'ne':
                return actual_value != expected_value
        
        return False
    
    def check_rule(self, rule: Dict, evaluations: Dict[str, Dict[str, Any]]) -> bool:
        """Kiểm tra xem một luật có được kích hoạt không"""
        conditions = rule['conditions']
        
        for condition in conditions:
            if not self.check_condition(condition, evaluations):
                return False
        
        return True
    
    def infer_composite_risks(self, evaluations: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Suy luận các rủi ro phức hợp"""
        activated_rules = []
        
        for rule in self.rules:
            if self.check_rule(rule, evaluations):
                activated_rules.append({
                    'rule_id': rule['rule_id'],
                    'description': rule['description'],
                    'risk_type': rule['result']['risk_type'],
                    'severity': rule['result']['severity'],
                    'risk_point': rule['result']['risk_point'],
                    'explanation': rule['result']['explanation'],
                    'conditions': rule['conditions']
                })
        
        return activated_rules
    
    def infer_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Suy luận rủi ro phức hợp cho toàn bộ DataFrame"""
        print("\n=== Phase 4: Composite Risk Inference ===")
        
        result_df = df.copy()
        
        indicator_cols = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3']
        
        composite_risks_list = []
        
        for idx, row in df.iterrows():
            evaluations = {}
            
            for indicator in indicator_cols:
                if indicator in df.columns:
                    evaluations[indicator] = {
                        'value': row.get(indicator),
                        'risk_level': row.get(f'{indicator}_risk_level'),
                        'risk_point': row.get(f'{indicator}_risk_point'),
                        'risk_type': row.get(f'{indicator}_risk_type')
                    }
            
            composite_risks = self.infer_composite_risks(evaluations)
            composite_risks_list.append(composite_risks)
        
        result_df['composite_risks'] = composite_risks_list
        result_df['composite_risk_count'] = [len(risks) for risks in composite_risks_list]
        
        total_activated = sum(len(risks) for risks in composite_risks_list)
        print(f"✓ Total composite risks detected: {total_activated}")
        print(f"✓ Average per company: {total_activated / len(df):.2f}")
        
        print("✓ Phase 4 completed\n")
        return result_df
    
    def generate_explanation(self, 
                           evaluations: Dict[str, Dict[str, Any]], 
                           composite_risks: List[Dict[str, Any]]) -> str:
        """Tạo giải thích bằng ngôn ngữ tự nhiên"""
        explanation_parts = []
        
        high_risk_indicators = [
            ind for ind, eval_result in evaluations.items()
            if eval_result.get('risk_level') == 'High'
        ]
        
        if high_risk_indicators:
            explanation_parts.append(
                f"Các chỉ số có rủi ro cao: {', '.join(high_risk_indicators)}"
            )
            
            for ind in high_risk_indicators:
                eval_result = evaluations[ind]
                if 'explanation' in eval_result:
                    explanation_parts.append(f"- {ind}: {eval_result['explanation']}")
        
        if composite_risks:
            explanation_parts.append(
                f"\nPhát hiện {len(composite_risks)} vấn đề phức hợp:"
            )
            
            for risk in composite_risks:
                explanation_parts.append(
                    f"- {risk['risk_type']} ({risk['severity']}): {risk['explanation']}"
                )
        
        return "\n".join(explanation_parts)
    
    def calculate_final_risk_score(self, 
                                   evaluations: Dict[str, Dict[str, Any]], 
                                   composite_risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Tính điểm rủi ro tổng hợp cuối cùng"""
        indicator_points = sum(
            eval_result.get('risk_point', 0) 
            for eval_result in evaluations.values()
        )
        
        composite_points = sum(
            risk.get('risk_point', 0) 
            for risk in composite_risks
        )
        
        total_points = indicator_points + composite_points
        
        max_indicator_points = len(evaluations) * 2
        max_composite_points = len(self.rules) * 4
        max_total_points = max_indicator_points + max_composite_points
        
        risk_score = total_points / max_total_points if max_total_points > 0 else 0
        
        if risk_score >= 0.7:
            risk_level = 'High'
        elif risk_score >= 0.4:
            risk_level = 'Medium'
        else:
            risk_level = 'Good'
        
        return {
            'indicator_risk_points': indicator_points,
            'composite_risk_points': composite_points,
            'total_risk_points': total_points,
            'max_total_points': max_total_points,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'composite_risk_count': len(composite_risks)
        }
