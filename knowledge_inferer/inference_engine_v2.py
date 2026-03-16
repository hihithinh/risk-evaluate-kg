"""
Inference Engine V2 - Nâng cấp với Forward Chaining và Backward Chaining thực sự
"""

import pandas as pd
import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime

from .phase1_data_standardization import DataStandardizer
from .phase2_indicator_calculation import IndicatorCalculator
from .phase3_risk_evaluation import RiskEvaluator
from .forward_chainer import ForwardChainer
from .backward_chainer import BackwardChainer


class InferenceEngineV2:
    """
    Inference Engine V2 - TRUE Inference Engine
    
    Khác biệt với version cũ:
    - ✅ Forward Chaining với inference loop thực sự
    - ✅ Backward Chaining cho goal-driven reasoning
    - ✅ Working Memory động
    - ✅ Conflict Resolution
    - ✅ Explanation với trace và justification
    """
    
    def __init__(self, config_dir: str, use_forward_chaining: bool = True):
        """
        Args:
            config_dir: Thư mục chứa các file cấu hình JSON
            use_forward_chaining: True = dùng ForwardChainer, False = dùng CompositeInferer cũ
        """
        self.config_dir = config_dir
        self.use_forward_chaining = use_forward_chaining
        
        schema_path = os.path.join(config_dir, 'schema_mapping.json')
        calculation_path = os.path.join(config_dir, 'calculation_rules.json')
        indicator_path = os.path.join(config_dir, 'indicator_rules.json')
        composite_path = os.path.join(config_dir, 'composite_rules.json')
        
        self.phase1 = DataStandardizer(schema_path)
        self.phase2 = IndicatorCalculator(calculation_path)
        self.phase3 = RiskEvaluator(indicator_path)
        
        if use_forward_chaining:
            self.forward_chainer = ForwardChainer(composite_path)
        
        self.backward_chainer = BackwardChainer(
            json.load(open(composite_path, 'r', encoding='utf-8'))
        )
        
        self.known_facts = None
        self.last_inference_result = None
    
    def infer_single_company(self, 
                            raw_data_path: str, 
                            ticker: str, 
                            year: int, 
                            quarter: int,
                            use_forward_chaining: Optional[bool] = None) -> Dict[str, Any]:
        """
        Suy diễn cho một công ty với TRUE inference engine
        
        Args:
            raw_data_path: Đường dẫn đến file dữ liệu thô
            ticker: Mã chứng khoán
            year: Năm báo cáo
            quarter: Quý báo cáo
            use_forward_chaining: Override setting để chọn engine
            
        Returns:
            Dict chứa kết quả suy diễn đầy đủ với trace
        """
        use_fc = use_forward_chaining if use_forward_chaining is not None else self.use_forward_chaining
        
        print(f"\n{'='*70}")
        print(f"INFERENCE ENGINE V2 - TRUE REASONING")
        print(f"Company: {ticker} - Q{quarter}/{year}")
        print(f"Mode: {'Forward Chaining' if use_fc else 'Pattern Matching'}")
        print(f"{'='*70}\n")
        
        # Phase 1: Data Standardization
        standardized_data = self.phase1.standardize(raw_data_path)
        company_data = self.phase1.get_company_data(standardized_data, ticker, year, quarter)
        
        if company_data is None:
            return {
                'error': 'Company data not found',
                'ticker': ticker,
                'year': year,
                'quarter': quarter
            }
        
        # Phase 2: Indicator Calculation
        print("\n=== Phase 2: Calculating Indicators ===")
        indicators = self.phase2.calculate_all_indicators(company_data)
        for ind, val in indicators.items():
            print(f"{ind}: {val:.4f}" if not pd.isna(val) else f"{ind}: N/A")
        
        # Phase 3: Risk Evaluation
        print("\n=== Phase 3: Evaluating Risks ===")
        evaluations = self.phase3.evaluate_all_indicators(indicators)
        for ind, eval_result in evaluations.items():
            print(f"{ind}: {eval_result['risk_level']} (points: {eval_result['risk_point']})")
        
        risk_summary = self.phase3.get_risk_summary(evaluations)
        category_summary = self.phase3.get_category_summary(evaluations)
        
        # Phase 4: Composite Inference (Forward Chaining)
        if use_fc:
            print("\n=== Phase 4: Forward Chaining Inference ===")
            fc_result = self.forward_chainer.inference_loop(evaluations)
            
            composite_risks = fc_result['composite_risks']
            final_score = fc_result['final_score']
            inference_stats = fc_result['inference_stats']
            inference_trace = fc_result['inference_trace']
            
            print(f"\n✓ Forward chaining completed:")
            print(f"  - Iterations: {inference_stats['iterations']}")
            print(f"  - Rules fired: {inference_stats['rules_fired']}")
            print(f"  - Composite risks found: {len(composite_risks)}")
            
            explanation = self.forward_chainer.get_explanation()
        else:
            from .phase4_composite_inference import CompositeInferer
            phase4 = CompositeInferer(os.path.join(self.config_dir, 'composite_rules.json'))
            
            composite_risks = phase4.infer_composite_risks(evaluations)
            final_score = phase4.calculate_final_risk_score(evaluations, composite_risks)
            explanation = phase4.generate_explanation(evaluations, composite_risks)
            inference_stats = None
            inference_trace = None
        
        # Backward Chaining Queries
        print("\n=== Backward Chaining Queries ===")
        
        # Query 1: Tại sao có rủi ro cao?
        why_high_risk = self.backward_chainer.query_why_high_risk(evaluations)
        if why_high_risk['success']:
            print(f"✓ Found proof for high risk (used {len(why_high_risk['rules_used'])} rules)")
        else:
            print("✗ No proof found for high risk")
        
        # Query 2: Có rủi ro financial_distress không?
        financial_distress_query = self.backward_chainer.query_specific_risk(
            'financial_distress', evaluations
        )
        
        # Build final result
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
            'timestamp': datetime.now().isoformat(),
            
            # NEW: Inference engine specific data
            'inference_mode': 'forward_chaining' if use_fc else 'pattern_matching',
            'inference_stats': inference_stats,
            'inference_trace': inference_trace,
            
            # NEW: Backward chaining results
            'backward_chaining': {
                'why_high_risk': why_high_risk,
                'financial_distress_query': financial_distress_query
            }
        }
        
        self.last_inference_result = result
        
        # Print final summary
        print(f"\n{'='*70}")
        print(f"FINAL RISK ASSESSMENT")
        print(f"{'='*70}")
        print(f"Risk Score: {final_score['risk_score']:.2%}")
        print(f"Risk Level: {final_score['risk_level']}")
        print(f"Total Risk Points: {final_score['total_risk_points']}/{final_score['max_total_points']}")
        print(f"Composite Risks: {final_score['composite_risk_count']}")
        
        if use_fc and inference_stats:
            print(f"\nInference Statistics:")
            print(f"  - Iterations: {inference_stats['iterations']}")
            print(f"  - Rules fired: {inference_stats['rules_fired']}")
            print(f"  - Total facts: {inference_stats['total_facts']}")
        
        print(f"{'='*70}\n")
        
        return result
    
    def explain_why(self, fact_id: str) -> str:
        """
        Giải thích tại sao có fact này (sử dụng explanation engine)
        
        Args:
            fact_id: ID của fact cần giải thích
            
        Returns:
            Giải thích chi tiết
        """
        if not self.use_forward_chaining:
            return "Explanation chỉ khả dụng khi dùng Forward Chaining mode"
        
        return self.forward_chainer.explain_fact(fact_id)
    
    def query_backward(self, goal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Thực hiện backward chaining query
        
        Args:
            goal: Mục tiêu cần chứng minh
            
        Returns:
            Kết quả backward chaining
        """
        if self.last_inference_result is None:
            return {'error': 'No inference result available. Run infer_single_company first.'}
        
        evaluations = self.last_inference_result['evaluations']
        
        self.backward_chainer.reset()
        success, proof_chain = self.backward_chainer.prove_goal(goal, evaluations)
        
        return {
            'success': success,
            'goal': goal,
            'proof_chain': proof_chain,
            'explanation': self.backward_chainer.explain_proof(proof_chain)
        }
    
    def get_inference_trace(self) -> List[Dict[str, Any]]:
        """Lấy trace của quá trình suy diễn"""
        if not self.use_forward_chaining:
            return []
        
        return self.forward_chainer.explanation_engine.get_inference_trace()
    
    def export_inference_trace(self, output_path: str):
        """Xuất inference trace ra file"""
        if not self.use_forward_chaining:
            print("Inference trace chỉ khả dụng khi dùng Forward Chaining mode")
            return
        
        self.forward_chainer.explanation_engine.export_trace(output_path)
        print(f"✓ Inference trace exported to {output_path}")
    
    def compare_inference_modes(self, 
                               raw_data_path: str, 
                               ticker: str, 
                               year: int, 
                               quarter: int) -> Dict[str, Any]:
        """
        So sánh kết quả giữa Forward Chaining và Pattern Matching
        
        Returns:
            Dict chứa kết quả của cả 2 modes
        """
        print("\n" + "="*70)
        print("COMPARING INFERENCE MODES")
        print("="*70)
        
        # Run with Forward Chaining
        print("\n### Running with Forward Chaining ###")
        fc_result = self.infer_single_company(
            raw_data_path, ticker, year, quarter, 
            use_forward_chaining=True
        )
        
        # Run with Pattern Matching
        print("\n### Running with Pattern Matching ###")
        pm_result = self.infer_single_company(
            raw_data_path, ticker, year, quarter, 
            use_forward_chaining=False
        )
        
        # Compare
        comparison = {
            'forward_chaining': {
                'risk_score': fc_result['final_score']['risk_score'],
                'risk_level': fc_result['final_score']['risk_level'],
                'composite_risks_count': len(fc_result['composite_risks']),
                'iterations': fc_result['inference_stats']['iterations'] if fc_result['inference_stats'] else 0,
                'rules_fired': fc_result['inference_stats']['rules_fired'] if fc_result['inference_stats'] else 0
            },
            'pattern_matching': {
                'risk_score': pm_result['final_score']['risk_score'],
                'risk_level': pm_result['final_score']['risk_level'],
                'composite_risks_count': len(pm_result['composite_risks'])
            },
            'differences': {
                'risk_score_diff': abs(fc_result['final_score']['risk_score'] - pm_result['final_score']['risk_score']),
                'composite_risks_diff': len(fc_result['composite_risks']) - len(pm_result['composite_risks'])
            }
        }
        
        print("\n" + "="*70)
        print("COMPARISON RESULTS")
        print("="*70)
        print(f"\nForward Chaining:")
        print(f"  Risk Score: {comparison['forward_chaining']['risk_score']:.2%}")
        print(f"  Composite Risks: {comparison['forward_chaining']['composite_risks_count']}")
        print(f"  Iterations: {comparison['forward_chaining']['iterations']}")
        
        print(f"\nPattern Matching:")
        print(f"  Risk Score: {comparison['pattern_matching']['risk_score']:.2%}")
        print(f"  Composite Risks: {comparison['pattern_matching']['composite_risks_count']}")
        
        print(f"\nDifferences:")
        print(f"  Risk Score Diff: {comparison['differences']['risk_score_diff']:.4f}")
        print(f"  Composite Risks Diff: {comparison['differences']['composite_risks_diff']}")
        print("="*70 + "\n")
        
        return comparison
