#!/usr/bin/env python
# coding: utf-8

"""
Scoring Model - Rule-based Risk Assessment
Tính toán điểm rủi ro cho doanh nghiệp dựa trên các chỉ số tài chính
"""

import pandas as pd
import numpy as np
import json
from typing import Dict, List, Tuple, Optional


class ScoringModel:
    """
    Mô hình scoring dựa trên luật để đánh giá rủi ro tài chính
    """
    
    def __init__(self, indicator_rules_path: str, composite_rules_path: str):
        """
        Khởi tạo scoring model
        
        Args:
            indicator_rules_path: Đường dẫn đến file indicator_rules.json
            composite_rules_path: Đường dẫn đến file composite_rules.json
        """
        with open(indicator_rules_path, 'r', encoding='utf-8') as f:
            self.indicator_rules = json.load(f)
        
        with open(composite_rules_path, 'r', encoding='utf-8') as f:
            self.composite_rules = json.load(f)
        
        # Tạo mapping từ indicator code sang rule
        self.indicator_map = {rule['indicator']: rule for rule in self.indicator_rules}
    
    def evaluate_indicator(self, indicator_code: str, value: float) -> Dict:
        """
        Đánh giá một chỉ số tài chính dựa trên giá trị
        
        Args:
            indicator_code: Mã chỉ số (A1, A2, ..., D3)
            value: Giá trị của chỉ số
            
        Returns:
            Dict chứa risk_level, risk_point, risk_type, explanation
        """
        if pd.isna(value):
            return {
                'indicator': indicator_code,
                'value': None,
                'risk_level': 'Unknown',
                'risk_point': 0,
                'risk_type': None,
                'explanation': 'Không có dữ liệu để đánh giá.'
            }
        
        rule = self.indicator_map.get(indicator_code)
        if not rule:
            return {
                'indicator': indicator_code,
                'value': value,
                'risk_level': 'Unknown',
                'risk_point': 0,
                'risk_type': None,
                'explanation': 'Không tìm thấy rule cho chỉ số này.'
            }
        
        # Tìm range phù hợp
        for range_rule in rule['ranges']:
            min_val = range_rule['min']
            max_val = range_rule['max']
            
            # Check if value falls in this range
            if min_val is None and max_val is None:
                continue
            elif min_val is None:
                if value < max_val:
                    return {
                        'indicator': indicator_code,
                        'value': value,
                        'risk_level': range_rule['risk_level'],
                        'risk_point': range_rule['risk_point'],
                        'risk_type': range_rule['risk_type'],
                        'explanation': range_rule['explanation']
                    }
            elif max_val is None:
                if value >= min_val:
                    return {
                        'indicator': indicator_code,
                        'value': value,
                        'risk_level': range_rule['risk_level'],
                        'risk_point': range_rule['risk_point'],
                        'risk_type': range_rule['risk_type'],
                        'explanation': range_rule['explanation']
                    }
            else:
                if min_val <= value < max_val:
                    return {
                        'indicator': indicator_code,
                        'value': value,
                        'risk_level': range_rule['risk_level'],
                        'risk_point': range_rule['risk_point'],
                        'risk_type': range_rule['risk_type'],
                        'explanation': range_rule['explanation']
                    }
        
        # Default if no range matched
        return {
            'indicator': indicator_code,
            'value': value,
            'risk_level': 'Unknown',
            'risk_point': 0,
            'risk_type': None,
            'explanation': 'Giá trị nằm ngoài các ngưỡng đã định nghĩa.'
        }
    
    def check_composite_rule(self, rule: Dict, indicator_evaluations: Dict) -> bool:
        """
        Kiểm tra xem một composite rule có được kích hoạt không
        
        Args:
            rule: Composite rule cần kiểm tra
            indicator_evaluations: Dict chứa kết quả đánh giá {indicator_code: evaluation_result}
            
        Returns:
            True nếu rule được kích hoạt, False nếu không
        """
        for condition in rule['conditions']:
            indicator = condition['indicator']
            
            eval_result = indicator_evaluations.get(indicator)
            
            if eval_result is None:
                return False
            
            if condition.get('source') == 'indicator_rules_output':
                field = condition.get('field', 'risk_level')
                operator = condition['operator']
                expected_value = condition['value']
                
                actual_value = eval_result.get(field)
                
                if operator == 'eq':
                    if actual_value != expected_value:
                        return False
                elif operator == 'in':
                    if actual_value not in expected_value:
                        return False
                elif operator == 'ne':
                    if actual_value == expected_value:
                        return False
                else:
                    return False
            else:
                return False
        
        return True
    
    def evaluate_composite_rules(self, indicator_evaluations: Dict) -> List[Dict]:
        """
        Đánh giá tất cả composite rules
        
        Args:
            indicator_evaluations: Dict chứa kết quả đánh giá {indicator_code: evaluation_result}
            
        Returns:
            List các composite rules được kích hoạt
        """
        activated_rules = []
        
        for rule in self.composite_rules:
            if self.check_composite_rule(rule, indicator_evaluations):
                activated_rules.append({
                    'rule_id': rule['rule_id'],
                    'description': rule['description'],
                    'risk_type': rule['result']['risk_type'],
                    'severity': rule['result']['severity'],
                    'risk_point': rule['result']['risk_point'],
                    'explanation': rule['result']['explanation']
                })
        
        return activated_rules
    
    def calculate_risk_score(self, indicator_results: List[Dict], 
                            composite_results: List[Dict]) -> Tuple[float, str]:
        """
        Tính toán risk score tổng hợp
        
        Args:
            indicator_results: Kết quả đánh giá các chỉ số đơn lẻ
            composite_results: Kết quả đánh giá composite rules
            
        Returns:
            Tuple (risk_score, risk_label)
            - risk_score: Điểm rủi ro từ 0-1
            - risk_label: Nhãn rủi ro (Good, Medium, High)
        """
        # Tính điểm từ indicator rules
        total_points = 0
        max_points = 0
        
        for result in indicator_results:
            if result['risk_point'] is not None:
                total_points += result['risk_point']
                max_points += 2  # Mỗi indicator có max 2 points
        
        # Tính điểm cơ bản từ indicators (0-1)
        base_score = total_points / max_points if max_points > 0 else 0
        
        # Điều chỉnh điểm dựa trên composite rules
        # Đọc risk_point từ JSON thay vì hard-code
        composite_points = 0
        
        for comp_result in composite_results:
            # Lấy risk_point từ kết quả (đã được load từ JSON)
            risk_point = comp_result.get('risk_point', 0)
            composite_points += risk_point
        
        # Chuẩn hóa composite points (giả sử max composite point là 10)
        composite_adjustment = composite_points / 30.0  # Normalize về 0-0.33
        
        # Tính risk score cuối cùng (giới hạn 0-1)
        risk_score = min(1.0, max(0.0, base_score + composite_adjustment))
        
        # Xác định risk label
        if risk_score >= 0.6:
            risk_label = 'High'
        elif risk_score >= 0.3:
            risk_label = 'Medium'
        else:
            risk_label = 'Good'
        
        return risk_score, risk_label
    
    def score_company(self, row: pd.Series) -> Dict:
        """
        Tính điểm rủi ro cho một công ty trong một kỳ
        
        Args:
            row: Series chứa dữ liệu của công ty (ticker, year, quarter, A1-D3)
            
        Returns:
            Dict chứa kết quả đánh giá đầy đủ
        """
        # Lấy thông tin công ty
        ticker = row['ticker']
        year = row['yearReport']
        quarter = row['lengthReport']
        
        # Lấy giá trị các chỉ số
        indicators = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 
                     'C1', 'C2', 'C3', 'D1', 'D2', 'D3']
        
        indicator_values = {ind: row[ind] for ind in indicators}
        
        # Đánh giá từng chỉ số
        indicator_results = []
        indicator_evaluations = {}
        for ind in indicators:
            result = self.evaluate_indicator(ind, indicator_values[ind])
            indicator_results.append(result)
            indicator_evaluations[ind] = result
        
        # Đánh giá composite rules
        composite_results = self.evaluate_composite_rules(indicator_evaluations)
        
        # Tính risk score
        risk_score, risk_label = self.calculate_risk_score(
            indicator_results, composite_results
        )
        
        # Tạo reasoning (giải thích)
        reasoning_parts = []
        
        # Thêm các chỉ số có rủi ro cao
        high_risk_indicators = [r for r in indicator_results 
                               if r['risk_level'] == 'High']
        if high_risk_indicators:
            reasoning_parts.append(
                f"Các chỉ số có rủi ro cao: " + 
                ", ".join([f"{r['indicator']} ({r['explanation']})" 
                          for r in high_risk_indicators[:3]])
            )
        
        # Thêm composite rules được kích hoạt
        if composite_results:
            reasoning_parts.append(
                f"Phát hiện {len(composite_results)} vấn đề phức hợp: " +
                "; ".join([f"{r['risk_type']} - {r['explanation']}" 
                          for r in composite_results[:2]])
            )
        
        reasoning = " | ".join(reasoning_parts) if reasoning_parts else "Không phát hiện rủi ro đáng kể."
        
        return {
            'ticker': ticker,
            'symbol': row.get('symbol', ticker),
            'yearReport': year,
            'lengthReport': quarter,
            'risk_score': round(risk_score, 4),
            'risk_label': risk_label,
            'risk_reasoning': reasoning,
            'indicator_results': indicator_results,
            'composite_results': composite_results
        }
    
    def score_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Tính điểm rủi ro cho toàn bộ dataset
        
        Args:
            df: DataFrame chứa dữ liệu tài chính
            
        Returns:
            DataFrame chứa kết quả scoring với các cột rủi ro chi tiết
        """
        results = []
        
        for idx, row in df.iterrows():
            try:
                result = self.score_company(row)
                
                # Lấy danh sách các chỉ số có rủi ro cao
                high_risk_indicators = [r['indicator'] for r in result['indicator_results'] 
                                       if r['risk_level'] == 'High']
                
                # Lấy danh sách các chỉ số có rủi ro trung bình
                medium_risk_indicators = [r['indicator'] for r in result['indicator_results'] 
                                         if r['risk_level'] == 'Medium']
                
                # Lấy danh sách composite rules được kích hoạt
                composite_rules_activated = [r['rule_id'] for r in result['composite_results']]
                
                # Lấy các loại rủi ro đã phát hiện
                risk_types = list(set([r['risk_type'] for r in result['composite_results'] 
                                      if r['risk_type']]))
                
                # Tạo mô tả chi tiết các rủi ro
                high_risk_details = []
                for r in result['indicator_results']:
                    if r['risk_level'] == 'High':
                        high_risk_details.append(f"{r['indicator']}: {r['explanation']}")
                
                composite_risk_details = []
                for r in result['composite_results']:
                    composite_risk_details.append(f"{r['rule_id']} ({r['risk_type']}): {r['explanation']}")
                
                results.append({
                    'ticker': result['ticker'],
                    'symbol': result['symbol'],
                    'yearReport': result['yearReport'],
                    'lengthReport': result['lengthReport'],
                    'risk_score': result['risk_score'],
                    'risk_label': result['risk_label'],
                    'risk_reasoning': result['risk_reasoning'],
                    
                    # Các cột mới: thông tin rủi ro chi tiết
                    'high_risk_count': len(high_risk_indicators),
                    'medium_risk_count': len(medium_risk_indicators),
                    'composite_rules_count': len(composite_rules_activated),
                    'high_risk_indicators': ', '.join(high_risk_indicators) if high_risk_indicators else '',
                    'medium_risk_indicators': ', '.join(medium_risk_indicators) if medium_risk_indicators else '',
                    'composite_rules_activated': ', '.join(composite_rules_activated) if composite_rules_activated else '',
                    'risk_types_detected': ', '.join(risk_types) if risk_types else '',
                    'high_risk_details': ' | '.join(high_risk_details) if high_risk_details else '',
                    'composite_risk_details': ' | '.join(composite_risk_details) if composite_risk_details else ''
                })
            except Exception as e:
                print(f"Error processing {row.get('ticker', 'Unknown')} - "
                      f"{row.get('yearReport', 'N/A')}Q{row.get('lengthReport', 'N/A')}: {e}")
                continue
        
        return pd.DataFrame(results)


def main():
    """
    Main function để chạy scoring model
    """
    import os
    
    print("="*80)
    print("SCORING MODEL - RISK ASSESSMENT")
    print("="*80)
    
    # Tạo đường dẫn tới project root (2 cấp lên từ pipeline/3_risk_score_model)
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Load data
    print("\n1. Loading financial features data...")
    data_path = os.path.join(project_root, 'dataset', 'financial_features.csv')
    df = pd.read_csv(data_path)
    print(f"   Loaded {len(df)} records from {data_path}")
    
    # Initialize scoring model
    print("\n2. Initializing scoring model...")
    indicator_rules_path = os.path.join(project_root, 'rules', 'indicator_rules.json')
    composite_rules_path = os.path.join(project_root, 'rules', 'composite_rules.json')
    
    model = ScoringModel(
        indicator_rules_path=indicator_rules_path,
        composite_rules_path=composite_rules_path
    )
    print("   Model initialized successfully")
    
    # Score all companies
    print("\n3. Scoring all companies...")
    results_df = model.score_dataset(df)
    print(f"   Scored {len(results_df)} companies")
    
    # Save results
    print("\n4. Saving results...")
    output_path = os.path.join(project_root, 'dataset', 'risk_scores.csv')
    results_df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"   Results saved to {output_path}")
    
    # Display summary statistics
    print("\n" + "="*80)
    print("SUMMARY STATISTICS")
    print("="*80)
    
    print("\nRisk Label Distribution:")
    print(results_df['risk_label'].value_counts())
    
    print("\nRisk Score Statistics:")
    print(results_df['risk_score'].describe())
    
    print("\nSample Results (first 10 rows):")
    print(results_df[['ticker', 'yearReport', 'lengthReport', 'risk_score', 'risk_label', 
                      'high_risk_count', 'composite_rules_count']].head(10).to_string())
    
    print("\n" + "="*80)
    print("RISK DETECTION SUMMARY")
    print("="*80)
    
    print(f"\nTotal companies with HIGH risk indicators: {(results_df['high_risk_count'] > 0).sum()}")
    print(f"Total companies with MEDIUM risk indicators: {(results_df['medium_risk_count'] > 0).sum()}")
    print(f"Total companies with composite rules triggered: {(results_df['composite_rules_count'] > 0).sum()}")
    
    print("\nMost common high-risk indicators:")
    all_high_risks = results_df['high_risk_indicators'].str.split(', ').explode()
    if not all_high_risks.empty and all_high_risks.str.len().sum() > 0:
        print(all_high_risks.value_counts().head(10))
    else:
        print("  No high-risk indicators detected")
    
    print("\nMost common risk types detected:")
    all_risk_types = results_df['risk_types_detected'].str.split(', ').explode()
    if not all_risk_types.empty and all_risk_types.str.len().sum() > 0:
        print(all_risk_types.value_counts())
    else:
        print("  No composite risk types detected")
    
    print("\n" + "="*80)
    print("SCORING COMPLETE!")
    print("="*80)
    print(f"\n📊 Output columns:")
    print(f"   - Basic: ticker, symbol, yearReport, lengthReport")
    print(f"   - Scores: risk_score, risk_label, risk_reasoning")
    print(f"   - Risk Counts: high_risk_count, medium_risk_count, composite_rules_count")
    print(f"   - Risk Lists: high_risk_indicators, medium_risk_indicators, composite_rules_activated")
    print(f"   - Risk Details: risk_types_detected, high_risk_details, composite_risk_details")
    print(f"\n💾 Total columns in output: {len(results_df.columns)}")


if __name__ == "__main__":
    main()
