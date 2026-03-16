"""
Conflict Resolver - Giải quyết xung đột khi nhiều rules cùng match
Implement 3 strategies cơ bản: Refractoriness, Specificity, Priority
"""

from typing import List, Dict, Any, Set, Tuple
from enum import Enum


class ConflictStrategy(Enum):
    """Các chiến lược giải quyết xung đột"""
    REFRACTORINESS = "refractoriness"  # Không kích hoạt rule đã dùng với cùng facts
    SPECIFICITY = "specificity"        # Ưu tiên rules có nhiều conditions hơn
    PRIORITY = "priority"              # Ưu tiên theo severity/priority
    RECENCY = "recency"                # Ưu tiên facts mới nhất


class ConflictResolver:
    """
    Conflict Resolver - Giải quyết xung đột khi nhiều rules cùng được kích hoạt
    
    Trong inference engine, khi nhiều rules cùng match với working memory,
    cần có chiến lược để quyết định rule nào được kích hoạt trước.
    """
    
    def __init__(self, strategies: List[ConflictStrategy] = None):
        """
        Args:
            strategies: Danh sách strategies theo thứ tự ưu tiên
                       Mặc định: [REFRACTORINESS, PRIORITY, SPECIFICITY]
        """
        if strategies is None:
            strategies = [
                ConflictStrategy.REFRACTORINESS,
                ConflictStrategy.PRIORITY,
                ConflictStrategy.SPECIFICITY
            ]
        self.strategies = strategies
        self.fired_rules: Set[Tuple[str, frozenset]] = set()
    
    def resolve(self, 
                candidate_rules: List[Dict[str, Any]], 
                working_memory_snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Giải quyết xung đột và trả về danh sách rules theo thứ tự ưu tiên
        
        Args:
            candidate_rules: Danh sách các rules có thể kích hoạt
            working_memory_snapshot: Snapshot của working memory hiện tại
            
        Returns:
            Danh sách rules đã được sắp xếp theo thứ tự ưu tiên
        """
        if not candidate_rules:
            return []
        
        filtered_rules = candidate_rules.copy()
        
        for strategy in self.strategies:
            if strategy == ConflictStrategy.REFRACTORINESS:
                filtered_rules = self._apply_refractoriness(filtered_rules, working_memory_snapshot)
            elif strategy == ConflictStrategy.SPECIFICITY:
                filtered_rules = self._apply_specificity(filtered_rules)
            elif strategy == ConflictStrategy.PRIORITY:
                filtered_rules = self._apply_priority(filtered_rules)
            elif strategy == ConflictStrategy.RECENCY:
                filtered_rules = self._apply_recency(filtered_rules, working_memory_snapshot)
        
        return filtered_rules
    
    def _apply_refractoriness(self, 
                             rules: List[Dict[str, Any]], 
                             wm_snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Strategy 1: Refractoriness
        Loại bỏ các rules đã được kích hoạt với cùng tập facts
        
        Nguyên tắc: Một rule không được kích hoạt lại với cùng một tập facts
        để tránh vòng lặp vô hạn
        """
        filtered = []
        
        for rule in rules:
            rule_id = rule['rule_id']
            
            matched_fact_ids = frozenset(rule.get('matched_facts', []))
            
            rule_signature = (rule_id, matched_fact_ids)
            
            if rule_signature not in self.fired_rules:
                filtered.append(rule)
        
        return filtered
    
    def _apply_specificity(self, rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Strategy 2: Specificity
        Ưu tiên các rules có nhiều conditions hơn (cụ thể hơn)
        
        Nguyên tắc: Rule càng cụ thể (nhiều điều kiện) thì càng ưu tiên
        """
        if not rules:
            return rules
        
        sorted_rules = sorted(
            rules,
            key=lambda r: len(r.get('conditions', [])),
            reverse=True
        )
        
        return sorted_rules
    
    def _apply_priority(self, rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Strategy 3: Priority
        Ưu tiên theo severity/priority của rule
        
        Nguyên tắc: high > medium > low
        """
        severity_order = {
            'high': 3,
            'medium': 2,
            'low': 1,
            None: 0
        }
        
        sorted_rules = sorted(
            rules,
            key=lambda r: severity_order.get(
                r.get('result', {}).get('severity', None), 0
            ),
            reverse=True
        )
        
        return sorted_rules
    
    def _apply_recency(self, 
                      rules: List[Dict[str, Any]], 
                      wm_snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Strategy 4: Recency
        Ưu tiên rules match với facts mới nhất
        
        Nguyên tắc: Facts càng mới thì càng ưu tiên
        """
        return rules
    
    def mark_rule_fired(self, rule_id: str, matched_facts: List[str]):
        """
        Đánh dấu một rule đã được kích hoạt với tập facts cụ thể
        
        Args:
            rule_id: ID của rule
            matched_facts: Danh sách fact_ids mà rule này match
        """
        rule_signature = (rule_id, frozenset(matched_facts))
        self.fired_rules.add(rule_signature)
    
    def reset(self):
        """Reset lịch sử các rules đã kích hoạt"""
        self.fired_rules.clear()
    
    def get_fired_rules_count(self) -> int:
        """Lấy số lượng rules đã kích hoạt"""
        return len(self.fired_rules)
    
    def select_next_rule(self, 
                        candidate_rules: List[Dict[str, Any]], 
                        working_memory_snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """
        Chọn rule tiếp theo để kích hoạt
        
        Args:
            candidate_rules: Danh sách các rules có thể kích hoạt
            working_memory_snapshot: Snapshot của working memory
            
        Returns:
            Rule được chọn để kích hoạt (hoặc None nếu không có)
        """
        resolved = self.resolve(candidate_rules, working_memory_snapshot)
        
        if not resolved:
            return None
        
        return resolved[0]
    
    def explain_selection(self, 
                         selected_rule: Dict[str, Any], 
                         all_candidates: List[Dict[str, Any]]) -> str:
        """
        Giải thích tại sao rule này được chọn
        
        Returns:
            Chuỗi giải thích
        """
        if not selected_rule:
            return "Không có rule nào được chọn."
        
        explanation_parts = [
            f"Rule {selected_rule['rule_id']} được chọn vì:"
        ]
        
        num_conditions = len(selected_rule.get('conditions', []))
        explanation_parts.append(f"- Có {num_conditions} điều kiện (specificity)")
        
        severity = selected_rule.get('result', {}).get('severity', 'unknown')
        explanation_parts.append(f"- Mức độ nghiêm trọng: {severity} (priority)")
        
        matched_facts = selected_rule.get('matched_facts', [])
        rule_signature = (selected_rule['rule_id'], frozenset(matched_facts))
        if rule_signature not in self.fired_rules:
            explanation_parts.append("- Chưa được kích hoạt với tập facts này (refractoriness)")
        
        other_rules = [r for r in all_candidates if r['rule_id'] != selected_rule['rule_id']]
        if other_rules:
            explanation_parts.append(f"- Ưu tiên hơn {len(other_rules)} rules khác")
        
        return "\n".join(explanation_parts)
    
    def __repr__(self):
        return f"ConflictResolver(strategies={[s.value for s in self.strategies]}, fired={len(self.fired_rules)})"
