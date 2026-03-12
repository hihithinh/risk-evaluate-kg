import pandas as pd
import numpy as np
import json
import os
from typing import Dict, Any, Optional


class DataStandardizer:
    """
    Phase 1: Data Standardization & Integration
    Chuẩn hóa và hợp nhất dữ liệu từ 3 nguồn báo cáo tài chính
    """
    
    def __init__(self, schema_mapping_path: str):
        with open(schema_mapping_path, 'r', encoding='utf-8') as f:
            self.schema = json.load(f)
        
        self.report_types = self.schema['report_types']
        self.merge_keys = self.schema['merge_keys']
        self.validation_fields = self.schema['validation_fields']
    
    def load_raw_data(self, raw_data_path: str) -> pd.DataFrame:
        """Bước 1: Đọc dữ liệu thô"""
        df = pd.read_csv(raw_data_path)
        print(f"✓ Loaded raw data: {df.shape[0]} rows, {df.shape[1]} columns")
        return df
    
    def split_by_report_type(self, df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """Bước 2: Tách dữ liệu theo loại báo cáo"""
        reports = {}
        
        for report_type in self.report_types:
            reports[report_type] = df[df['report'] == report_type].copy()
            print(f"✓ {report_type}: {reports[report_type].shape[0]} rows")
        
        return reports
    
    def remove_empty_columns(self, reports: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
        """Bước 3: Loại bỏ các cột toàn NaN"""
        cleaned = {}
        
        for report_type, df in reports.items():
            cleaned[report_type] = df.dropna(axis=1, how='all')
            removed = df.shape[1] - cleaned[report_type].shape[1]
            print(f"✓ {report_type}: Removed {removed} empty columns")
        
        return cleaned
    
    def merge_reports(self, reports: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Bước 4: Hợp nhất 3 báo cáo"""
        keys = self.merge_keys
        
        balance = reports['balance_sheet']
        income = reports['income_statement'].drop(columns=['symbol'], errors='ignore')
        cash = reports['cash_flow'].drop(columns=['symbol'], errors='ignore')
        
        merged = (
            balance
            .merge(income, on=keys, how='left', validate='one_to_one')
            .merge(cash, on=keys, how='left', validate='one_to_one')
        )
        
        print(f"✓ Merged data: {merged.shape[0]} rows, {merged.shape[1]} columns")
        return merged
    
    def validate_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Bước 5: Kiểm tra tính hợp lệ của dữ liệu"""
        validation_rules = self.schema.get('validation_rules', [])
        
        for rule in validation_rules:
            rule_name = rule['rule']
            
            if rule_name == 'non_negative_assets':
                for field in rule['fields']:
                    col = self.validation_fields.get(field)
                    if col and col in df.columns:
                        negative_count = (df[col] < 0).sum()
                        if negative_count > 0:
                            print(f"⚠ Warning: {negative_count} negative values in {col}")
            
            elif rule_name == 'non_negative_liabilities':
                for field in rule['fields']:
                    col = self.validation_fields.get(field)
                    if col and col in df.columns:
                        negative_count = (df[col] < 0).sum()
                        if negative_count > 0:
                            print(f"⚠ Warning: {negative_count} negative values in {col}")
            
            elif rule_name == 'balance_equation':
                total_assets_col = self.validation_fields['total_assets']
                total_liabilities_col = self.validation_fields['total_liabilities']
                equity_col = self.validation_fields['owners_equity']
                
                if all(col in df.columns for col in [total_assets_col, total_liabilities_col, equity_col]):
                    tolerance = rule.get('tolerance', 0.01)
                    df['_balance_check'] = df[total_assets_col] - (df[total_liabilities_col] + df[equity_col])
                    violations = (df['_balance_check'].abs() > tolerance).sum()
                    df.drop(columns=['_balance_check'], inplace=True)
                    
                    if violations > 0:
                        print(f"⚠ Warning: {violations} rows violate balance equation")
        
        print(f"✓ Data validation completed")
        return df
    
    def standardize(self, raw_data_path: str) -> pd.DataFrame:
        """Thực hiện toàn bộ quy trình chuẩn hóa"""
        print("\n=== Phase 1: Data Standardization & Integration ===")
        
        df = self.load_raw_data(raw_data_path)
        reports = self.split_by_report_type(df)
        reports = self.remove_empty_columns(reports)
        merged = self.merge_reports(reports)
        validated = self.validate_data(merged)
        
        print("✓ Phase 1 completed\n")
        return validated
    
    def get_company_data(self, df: pd.DataFrame, ticker: str, year: int, quarter: int) -> Optional[pd.Series]:
        """Lấy dữ liệu của một công ty cụ thể"""
        ticker_col, year_col, quarter_col = self.merge_keys
        
        result = df[
            (df[ticker_col] == ticker) &
            (df[year_col] == year) &
            (df[quarter_col] == quarter)
        ]
        
        if result.empty:
            return None
        
        return result.iloc[0]
