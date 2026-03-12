import pandas as pd
import numpy as np
import json
from typing import Dict, Any, Optional


class IndicatorCalculator:
    """
    Phase 2: Indicator Calculation
    Tính toán các chỉ số tài chính từ A1 đến D3
    Áp dụng Heuristic H4 - Ưu tiên xác định thuộc tính
    """
    
    def __init__(self, calculation_rules_path: str):
        with open(calculation_rules_path, 'r', encoding='utf-8') as f:
            self.rules = json.load(f)
        
        self.calculation_map = {rule['indicator']: rule for rule in self.rules['calculation_rules']}
    
    def safe_divide(self, a: Any, b: Any) -> float:
        """Chia an toàn, trả về NaN nếu mẫu số = 0 hoặc None"""
        try:
            if pd.isna(a) or pd.isna(b) or b == 0:
                return np.nan
            return float(a) / float(b)
        except:
            return np.nan
    
    def safe_subtract(self, a: Any, b: Any) -> float:
        """Trừ an toàn"""
        try:
            if pd.isna(a) or pd.isna(b):
                return np.nan
            return float(a) - float(b)
        except:
            return np.nan
    
    def safe_add(self, a: Any, b: Any) -> float:
        """Cộng an toàn"""
        try:
            if pd.isna(a) or pd.isna(b):
                return np.nan
            return float(a) + float(b)
        except:
            return np.nan
    
    def safe_abs(self, a: Any) -> float:
        """Giá trị tuyệt đối an toàn"""
        try:
            if pd.isna(a):
                return np.nan
            return abs(float(a))
        except:
            return np.nan
    
    def get_field_value(self, data: pd.Series, field_info: Dict) -> float:
        """Lấy giá trị từ field, áp dụng transform nếu có"""
        field_name = field_info['field']
        value = data.get(field_name, np.nan)
        
        if 'transform' in field_info and field_info['transform'] == 'abs':
            value = self.safe_abs(value)
        
        return value
    
    def calculate_indicator(self, indicator: str, data: pd.Series) -> float:
        """Tính toán một chỉ số cụ thể"""
        if indicator not in self.calculation_map:
            return np.nan
        
        rule = self.calculation_map[indicator]
        calc = rule['calculation']
        
        if calc['operation'] == 'divide':
            numerator_info = calc['numerator']
            denominator_info = calc['denominator']
            
            if 'operation' in numerator_info:
                if numerator_info['operation'] == 'subtract':
                    operands = numerator_info['operands']
                    val1 = self.get_field_value(data, operands[0])
                    val2 = self.get_field_value(data, operands[1])
                    numerator = self.safe_subtract(val1, val2)
                elif numerator_info['operation'] == 'add':
                    operands = numerator_info['operands']
                    val1 = self.get_field_value(data, operands[0])
                    val2 = self.get_field_value(data, operands[1])
                    numerator = self.safe_add(val1, val2)
                else:
                    numerator = np.nan
            else:
                numerator = self.get_field_value(data, numerator_info)
            
            denominator = self.get_field_value(data, denominator_info)
            
            result = self.safe_divide(numerator, denominator)
            
            validation = rule.get('validation', {})
            min_val = validation.get('min_value')
            max_val = validation.get('max_value')
            
            if not pd.isna(result):
                if min_val is not None and result < min_val:
                    pass
                if max_val is not None and result > max_val:
                    pass
            
            return result
        
        return np.nan
    
    def calculate_all_indicators(self, data: pd.Series) -> Dict[str, float]:
        """Tính toán tất cả 12 chỉ số"""
        indicators = {}
        
        for indicator in ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3']:
            indicators[indicator] = self.calculate_indicator(indicator, data)
        
        return indicators
    
    def calculate_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Tính toán chỉ số cho toàn bộ DataFrame"""
        print("\n=== Phase 2: Indicator Calculation ===")
        
        result_df = df.copy()
        
        for indicator in ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3']:
            result_df[indicator] = df.apply(
                lambda row: self.calculate_indicator(indicator, row),
                axis=1
            )
            non_null = result_df[indicator].notna().sum()
            print(f"✓ {indicator}: {non_null}/{len(result_df)} calculated")
        
        print("✓ Phase 2 completed\n")
        return result_df
    
    def get_indicator_info(self, indicator: str) -> Optional[Dict]:
        """Lấy thông tin về một chỉ số"""
        return self.calculation_map.get(indicator)
