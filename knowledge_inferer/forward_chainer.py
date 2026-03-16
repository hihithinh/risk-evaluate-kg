"""
Forward Chainer - Suy diễn tiến (Data-driven reasoning)
Implement vòng lặp suy diễn thực sự với Working Memory và Conflict Resolution
"""

from typing import Dict, Any, List, Optional, Set
import json
from .working_memory import WorkingMemory, Fact
from .conflict_resolver import ConflictResolver, ConflictStrategy
from .explanation_engine import ExplanationEngine


class ForwardChainer:
    """
    Forward Chaining Engine - Suy diễn tiến thực sự
    
    Khác với pattern matching đơn giản, forward chaining thực sự:
    1. Bắt đầu từ initial facts (dữ liệu đầu vào)
    2. Tìm tất cả rules có thể kích hoạt
    3. Chọn rule tốt nhất (conflict resolution)
    4. Kích hoạt rule → tạo facts mới
    5. Thêm facts mới vào working memory
    6. Lặp lại bước 2-5 cho đến khi không còn rules nào kích hoạt
    
    Đây là vòng lặp suy diễn (inference loop) thực sự!
    """
    
    def __init__(self, 
                 composite_rules_path: str,
                 max_iterations: int = 100,
                 conflict_strategies: List[ConflictStrategy] = None):
        """
        Args:
            composite_rules_path: Đường dẫn đến file composite rules
            max_iterations: Số vòng lặp tối đa (tránh vô hạn)
            conflict_strategies: Danh sách strategies cho conflict resolution
        """
        with open(composite_rules_path, 'r', encoding='utf-8') as f:
            self.rules = json.load(f)
        
        self.max_iterations = max_iterations
        self.working_memory = WorkingMemory()
        self.conflict_resolver = ConflictResolver(conflict_strategies)
        self.explanation_engine = ExplanationEngine()
        
        self.iteration_count = 0
        self.total_rules_fired = 0
    
    def initialize_working_memory(self, evaluations: Dict[str, Dict[str, Any]]):
        """
        Khởi tạo working memory với initial facts từ Phase 3
        
        Args:
            evaluations: Kết quả đánh giá từ Phase 3
        """
        self.working_memory.clear()
        
        for indicator, eval_result in evaluations.items():
            fact = Fact(
                fact_id=f"eval_{indicator}",
                fact_type="indicator_evaluation",
                data=eval_result,
                source="initial"
            )
            self.working_memory.add_fact(fact)
    
    def find_matching_rules(self) -> List[Dict[str, Any]]:
        """
        Tìm tất cả rules có thể kích hoạt với working memory hiện tại
        
        Returns:
            Danh sách rules match với facts hiện tại
        """
        matching_rules = []
        
        for rule in self.rules:
            matched_facts = self._check_rule_match(rule)
            
            if matched_facts is not None:
                rule_with_facts = rule.copy()
                rule_with_facts['matched_facts'] = matched_facts
                matching_rules.append(rule_with_facts)
        
        return matching_rules
    
    def _check_rule_match(self, rule: Dict[str, Any]) -> Optional[List[str]]:
        """
        Kiểm tra xem rule có match với working memory không
        
        Args:
            rule: Rule cần kiểm tra
            
        Returns:
            List fact_ids nếu match, None nếu không match
        """
        conditions = rule.get('conditions', [])
        matched_facts = []
        
        for condition in conditions:
            indicator = condition['indicator']
            fact_id = f"eval_{indicator}"
            
            fact = self.working_memory.get_fact(fact_id)
            
            if not fact:
                return None
            
            if not self._check_condition(condition, fact.data):
                return None
            
            matched_facts.append(fact_id)
        
        return matched_facts
    
    def _check_condition(self, condition: Dict[str, Any], fact_data: Dict[str, Any]) -> bool:
        """Kiểm tra một điều kiện với fact data"""
        if condition.get('source') == 'indicator_rules_output':
            field = condition.get('field', 'risk_level')
            operator = condition['operator']
            expected_value = condition['value']
            
            actual_value = fact_data.get(field)
            
            if operator == 'eq':
                return actual_value == expected_value
            elif operator == 'in':
                return actual_value in expected_value
            elif operator == 'ne':
                return actual_value != expected_value
        
        return False
    
    def fire_rule(self, rule: Dict[str, Any]) -> List[Fact]:
        """
        Kích hoạt một rule và tạo facts mới
        
        Args:
            rule: Rule cần kích hoạt
            
        Returns:
            Danh sách facts mới được tạo ra
        """
        rule_id = rule['rule_id']
        result = rule['result']
        matched_facts = rule.get('matched_facts', [])
        
        new_fact_id = f"composite_{rule_id}_{self.iteration_count}"
        
        new_fact = Fact(
            fact_id=new_fact_id,
            fact_type="composite_risk",
            data={
                'rule_id': rule_id,
                'description': rule['description'],
                'risk_type': result['risk_type'],
                'severity': result['severity'],
                'risk_point': result['risk_point'],
                'explanation': result['explanation']
            },
            source=rule_id,
            derived_from=matched_facts
        )
        
        self.explanation_engine.record_step(
            rule_id=rule_id,
            input_facts=matched_facts,
            output_facts=[new_fact_id],
            rule_description=rule['description'],
            explanation=result['explanation']
        )
        
        return [new_fact]
    
    def inference_loop(self, evaluations: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Vòng lặp suy diễn chính (FORWARD CHAINING LOOP)
        
        Đây là trái tim của inference engine!
        
        Args:
            evaluations: Initial facts từ Phase 3
            
        Returns:
            Kết quả suy diễn cuối cùng
        """
        print("\n=== Forward Chaining Inference Loop ===")
        
        self.initialize_working_memory(evaluations)
        self.conflict_resolver.reset()
        self.explanation_engine.reset()
        self.iteration_count = 0
        self.total_rules_fired = 0
        
        initial_facts = len(self.working_memory)
        print(f"Initial facts: {initial_facts}")
        
        while self.iteration_count < self.max_iterations:
            self.iteration_count += 1
            
            matching_rules = self.find_matching_rules()
            
            if not matching_rules:
                print(f"✓ No more rules to fire. Stopping at iteration {self.iteration_count}")
                break
            
            wm_snapshot = self.working_memory.snapshot()
            selected_rule = self.conflict_resolver.select_next_rule(
                matching_rules, wm_snapshot
            )
            
            if not selected_rule:
                print(f"✓ No rule selected by conflict resolver. Stopping at iteration {self.iteration_count}")
                break
            
            print(f"  Iteration {self.iteration_count}: Firing rule {selected_rule['rule_id']} "
                  f"(matched {len(matching_rules)} rules)")
            
            new_facts = self.fire_rule(selected_rule)
            
            facts_added = 0
            for fact in new_facts:
                if self.working_memory.add_fact(fact):
                    facts_added += 1
            
            self.conflict_resolver.mark_rule_fired(
                selected_rule['rule_id'],
                selected_rule.get('matched_facts', [])
            )
            
            self.total_rules_fired += 1
            
            if facts_added == 0:
                print(f"✓ No new facts added. Stopping at iteration {self.iteration_count}")
                break
        
        if self.iteration_count >= self.max_iterations:
            print(f"⚠ Reached max iterations ({self.max_iterations})")
        
        final_facts = len(self.working_memory)
        print(f"\nInference completed:")
        print(f"  - Total iterations: {self.iteration_count}")
        print(f"  - Rules fired: {self.total_rules_fired}")
        print(f"  - Initial facts: {initial_facts}")
        print(f"  - Final facts: {final_facts}")
        print(f"  - New facts created: {final_facts - initial_facts}")
        
        return self._build_result()
    
    def _build_result(self) -> Dict[str, Any]:
        """Tạo kết quả cuối cùng từ working memory"""
        composite_risks = []
        
        for fact in self.working_memory.get_facts_by_type("composite_risk"):
            composite_risks.append(fact.data)
        
        indicator_evaluations = {}
        for fact in self.working_memory.get_facts_by_type("indicator_evaluation"):
            indicator = fact.fact_id.replace("eval_", "")
            indicator_evaluations[indicator] = fact.data
        
        final_score = self._calculate_final_score(
            indicator_evaluations, composite_risks
        )
        
        return {
            'composite_risks': composite_risks,
            'indicator_evaluations': indicator_evaluations,
            'final_score': final_score,
            'inference_stats': {
                'iterations': self.iteration_count,
                'rules_fired': self.total_rules_fired,
                'total_facts': len(self.working_memory),
                'composite_risks_count': len(composite_risks)
            },
            'working_memory_snapshot': self.working_memory.snapshot(),
            'inference_trace': self.explanation_engine.get_inference_trace()
        }
    
    def _calculate_final_score(self, 
                              evaluations: Dict[str, Dict[str, Any]], 
                              composite_risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Tính điểm rủi ro tổng hợp"""
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
        
        high_risk_indicators = [
            ind for ind, eval_result in evaluations.items()
            if eval_result.get('risk_level') == 'High'
        ]
        
        return {
            'indicator_risk_points': indicator_points,
            'composite_risk_points': composite_points,
            'total_risk_points': total_points,
            'max_total_points': max_total_points,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'composite_risk_count': len(composite_risks),
            'high_risk_indicators': high_risk_indicators
        }
    
    def get_explanation(self) -> str:
        """Lấy giải thích cho quá trình suy diễn"""
        return self.explanation_engine.generate_summary()
    
    def explain_fact(self, fact_id: str) -> str:
        """Giải thích một fact cụ thể"""
        return self.explanation_engine.explain_why(fact_id, self.working_memory)
    
    def reset(self):
        """Reset forward chainer"""
        self.working_memory.clear()
        self.conflict_resolver.reset()
        self.explanation_engine.reset()
        self.iteration_count = 0
        self.total_rules_fired = 0
