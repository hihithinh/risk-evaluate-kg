"""
Backward Chainer - Suy diễn lùi (Goal-driven reasoning)
Bắt đầu từ mục tiêu và tìm kiếm ngược lại để chứng minh
"""

from typing import Dict, Any, List, Optional, Set, Tuple
import copy


class BackwardChainer:
    """
    Backward Chaining Engine - Suy diễn lùi
    
    Khác với forward chaining (data-driven), backward chaining là goal-driven:
    - Bắt đầu từ một goal (mục tiêu cần chứng minh)
    - Tìm rules có thể suy ra goal đó
    - Đệ quy chứng minh các sub-goals (điều kiện của rules)
    - Backtracking khi gặp dead-end
    
    Use case: "Chứng minh rằng công ty X có rủi ro cao"
    """
    
    def __init__(self, rules: List[Dict[str, Any]]):
        """
        Args:
            rules: Danh sách composite rules
        """
        self.rules = rules
        self.proof_trace: List[Dict[str, Any]] = []
        self.visited_goals: Set[str] = set()
    
    def prove_goal(self, 
                   goal: Dict[str, Any], 
                   evaluations: Dict[str, Dict[str, Any]],
                   depth: int = 0,
                   max_depth: int = 10) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Chứng minh một goal
        
        Args:
            goal: Mục tiêu cần chứng minh
                  Ví dụ: {'risk_type': 'financial_distress', 'severity': 'high'}
            evaluations: Kết quả đánh giá các chỉ số
            depth: Độ sâu hiện tại (để tránh đệ quy vô hạn)
            max_depth: Độ sâu tối đa
            
        Returns:
            (success, proof_chain)
            - success: True nếu chứng minh được
            - proof_chain: Chuỗi chứng minh (danh sách các bước)
        """
        if depth > max_depth:
            return False, []
        
        goal_signature = self._goal_signature(goal)
        
        if goal_signature in self.visited_goals:
            return False, []
        
        self.visited_goals.add(goal_signature)
        
        matching_rules = self._find_rules_for_goal(goal)
        
        if not matching_rules:
            return False, []
        
        for rule in matching_rules:
            success, proof = self._try_prove_with_rule(
                rule, evaluations, depth
            )
            
            if success:
                proof_step = {
                    'goal': goal,
                    'rule_id': rule['rule_id'],
                    'description': rule['description'],
                    'proof_chain': proof,
                    'depth': depth
                }
                
                self.proof_trace.append(proof_step)
                
                return True, [proof_step] + proof
        
        return False, []
    
    def _find_rules_for_goal(self, goal: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Tìm các rules có thể suy ra goal
        
        Args:
            goal: Mục tiêu cần tìm rules
            
        Returns:
            Danh sách rules match với goal
        """
        matching_rules = []
        
        for rule in self.rules:
            result = rule.get('result', {})
            
            match = True
            for key, value in goal.items():
                if key not in result or result[key] != value:
                    match = False
                    break
            
            if match:
                matching_rules.append(rule)
        
        return matching_rules
    
    def _try_prove_with_rule(self, 
                            rule: Dict[str, Any], 
                            evaluations: Dict[str, Dict[str, Any]],
                            depth: int) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Thử chứng minh goal bằng một rule cụ thể
        
        Args:
            rule: Rule để thử
            evaluations: Kết quả đánh giá
            depth: Độ sâu hiện tại
            
        Returns:
            (success, proof_chain)
        """
        conditions = rule.get('conditions', [])
        
        all_conditions_met = True
        proof_chain = []
        
        for condition in conditions:
            condition_met, sub_proof = self._check_condition(
                condition, evaluations, depth + 1
            )
            
            if not condition_met:
                all_conditions_met = False
                break
            
            if sub_proof:
                proof_chain.extend(sub_proof)
        
        if all_conditions_met:
            proof_step = {
                'rule_id': rule['rule_id'],
                'description': rule['description'],
                'conditions': conditions,
                'all_met': True
            }
            return True, [proof_step] + proof_chain
        
        return False, []
    
    def _check_condition(self, 
                        condition: Dict[str, Any], 
                        evaluations: Dict[str, Dict[str, Any]],
                        depth: int) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Kiểm tra một điều kiện
        
        Args:
            condition: Điều kiện cần kiểm tra
            evaluations: Kết quả đánh giá
            depth: Độ sâu
            
        Returns:
            (met, proof_chain)
        """
        indicator = condition['indicator']
        
        if indicator not in evaluations:
            return False, []
        
        eval_result = evaluations[indicator]
        
        if condition.get('source') == 'indicator_rules_output':
            field = condition.get('field', 'risk_level')
            operator = condition['operator']
            expected_value = condition['value']
            
            actual_value = eval_result.get(field)
            
            if operator == 'eq':
                met = actual_value == expected_value
            elif operator == 'in':
                met = actual_value in expected_value
            elif operator == 'ne':
                met = actual_value != expected_value
            else:
                met = False
            
            if met:
                proof_step = {
                    'type': 'fact',
                    'indicator': indicator,
                    'field': field,
                    'expected': expected_value,
                    'actual': actual_value,
                    'operator': operator
                }
                return True, [proof_step]
        
        return False, []
    
    def _goal_signature(self, goal: Dict[str, Any]) -> str:
        """Tạo signature duy nhất cho goal"""
        items = sorted(goal.items())
        return str(items)
    
    def explain_proof(self, proof_chain: List[Dict[str, Any]]) -> str:
        """
        Tạo giải thích cho chuỗi chứng minh
        
        Args:
            proof_chain: Chuỗi chứng minh từ prove_goal
            
        Returns:
            Giải thích bằng ngôn ngữ tự nhiên
        """
        if not proof_chain:
            return "Không thể chứng minh được mục tiêu."
        
        explanation_parts = [
            "=== Chuỗi chứng minh (Backward Chaining) ===\n"
        ]
        
        for i, step in enumerate(proof_chain, 1):
            if step.get('type') == 'fact':
                explanation_parts.append(
                    f"{i}. Fact: {step['indicator']}.{step['field']} "
                    f"{step['operator']} {step['expected']} "
                    f"(thực tế: {step['actual']})"
                )
            else:
                explanation_parts.append(
                    f"{i}. Rule {step['rule_id']}: {step['description']}"
                )
                if step.get('all_met'):
                    explanation_parts.append("   ✓ Tất cả điều kiện đều thỏa mãn")
        
        return "\n".join(explanation_parts)
    
    def find_all_proofs(self, 
                       goal: Dict[str, Any], 
                       evaluations: Dict[str, Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Tìm tất cả các cách chứng minh một goal
        
        Args:
            goal: Mục tiêu
            evaluations: Kết quả đánh giá
            
        Returns:
            Danh sách các proof chains khác nhau
        """
        all_proofs = []
        
        matching_rules = self._find_rules_for_goal(goal)
        
        for rule in matching_rules:
            self.visited_goals.clear()
            success, proof = self._try_prove_with_rule(rule, evaluations, 0)
            
            if success:
                all_proofs.append(proof)
        
        return all_proofs
    
    def query_why_high_risk(self, evaluations: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Trả lời câu hỏi: "Tại sao công ty này có rủi ro cao?"
        
        Args:
            evaluations: Kết quả đánh giá
            
        Returns:
            Dict chứa proof và explanation
        """
        goal = {'severity': 'high'}
        
        self.visited_goals.clear()
        self.proof_trace.clear()
        
        success, proof_chain = self.prove_goal(goal, evaluations)
        
        if success:
            return {
                'success': True,
                'goal': goal,
                'proof_chain': proof_chain,
                'explanation': self.explain_proof(proof_chain),
                'rules_used': list(set(
                    step.get('rule_id') for step in proof_chain 
                    if 'rule_id' in step
                ))
            }
        else:
            return {
                'success': False,
                'goal': goal,
                'explanation': "Không tìm thấy bằng chứng cho rủi ro cao."
            }
    
    def query_specific_risk(self, 
                           risk_type: str, 
                           evaluations: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Trả lời câu hỏi: "Công ty có rủi ro [risk_type] không?"
        
        Args:
            risk_type: Loại rủi ro cần kiểm tra
            evaluations: Kết quả đánh giá
            
        Returns:
            Dict chứa kết quả và giải thích
        """
        goal = {'risk_type': risk_type}
        
        self.visited_goals.clear()
        self.proof_trace.clear()
        
        success, proof_chain = self.prove_goal(goal, evaluations)
        
        if success:
            return {
                'success': True,
                'risk_type': risk_type,
                'has_risk': True,
                'proof_chain': proof_chain,
                'explanation': self.explain_proof(proof_chain)
            }
        else:
            return {
                'success': False,
                'risk_type': risk_type,
                'has_risk': False,
                'explanation': f"Không tìm thấy bằng chứng cho rủi ro {risk_type}."
            }
    
    def reset(self):
        """Reset backward chainer"""
        self.proof_trace.clear()
        self.visited_goals.clear()
    
    def __repr__(self):
        return f"BackwardChainer(rules={len(self.rules)}, proofs={len(self.proof_trace)})"
