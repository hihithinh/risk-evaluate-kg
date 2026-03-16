"""
Explanation Engine - Tạo giải thích cho quá trình suy diễn
Trace chuỗi suy luận và tạo justification tree
"""

from typing import Dict, Any, List, Optional, Set
from datetime import datetime
import json


class InferenceStep:
    """Đại diện cho một bước suy diễn"""
    
    def __init__(self, step_id: int, rule_id: str, 
                 input_facts: List[str], output_facts: List[str],
                 rule_description: str, explanation: str):
        self.step_id = step_id
        self.rule_id = rule_id
        self.input_facts = input_facts
        self.output_facts = output_facts
        self.rule_description = rule_description
        self.explanation = explanation
        self.timestamp = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'step_id': self.step_id,
            'rule_id': self.rule_id,
            'input_facts': self.input_facts,
            'output_facts': self.output_facts,
            'rule_description': self.rule_description,
            'explanation': self.explanation,
            'timestamp': self.timestamp.isoformat()
        }


class JustificationNode:
    """Node trong cây justification"""
    
    def __init__(self, fact_id: str, fact_data: Dict[str, Any], 
                 justification: str, children: List['JustificationNode'] = None):
        self.fact_id = fact_id
        self.fact_data = fact_data
        self.justification = justification
        self.children = children or []
    
    def add_child(self, child: 'JustificationNode'):
        self.children.append(child)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'fact_id': self.fact_id,
            'fact_data': self.fact_data,
            'justification': self.justification,
            'children': [child.to_dict() for child in self.children]
        }


class ExplanationEngine:
    """
    Explanation Engine - Tạo giải thích cho quá trình suy diễn
    
    Chức năng:
    1. Trace inference chain (chuỗi suy luận)
    2. Build justification tree (cây chứng minh)
    3. Answer "Why?" queries (Tại sao có kết luận này?)
    4. Answer "Why not?" queries (Tại sao không có kết luận khác?)
    5. Generate natural language explanation
    """
    
    def __init__(self):
        self.inference_trace: List[InferenceStep] = []
        self.step_counter = 0
    
    def record_step(self, rule_id: str, input_facts: List[str], 
                   output_facts: List[str], rule_description: str, 
                   explanation: str):
        """
        Ghi lại một bước suy diễn
        
        Args:
            rule_id: ID của rule được kích hoạt
            input_facts: Danh sách fact_ids làm input
            output_facts: Danh sách fact_ids được tạo ra
            rule_description: Mô tả rule
            explanation: Giải thích bước này
        """
        step = InferenceStep(
            step_id=self.step_counter,
            rule_id=rule_id,
            input_facts=input_facts,
            output_facts=output_facts,
            rule_description=rule_description,
            explanation=explanation
        )
        self.inference_trace.append(step)
        self.step_counter += 1
    
    def get_inference_trace(self) -> List[Dict[str, Any]]:
        """Lấy toàn bộ chuỗi suy diễn"""
        return [step.to_dict() for step in self.inference_trace]
    
    def build_justification_tree(self, fact_id: str, 
                                working_memory) -> JustificationNode:
        """
        Xây dựng cây justification cho một fact
        
        Args:
            fact_id: ID của fact cần giải thích
            working_memory: Working memory instance
            
        Returns:
            Root node của justification tree
        """
        fact = working_memory.get_fact(fact_id)
        
        if not fact:
            return None
        
        if fact.source == 'initial':
            justification = f"Fact ban đầu từ dữ liệu đầu vào"
        else:
            justification = f"Suy ra từ rule {fact.source}"
        
        node = JustificationNode(
            fact_id=fact.fact_id,
            fact_data=fact.data,
            justification=justification
        )
        
        for parent_id in fact.derived_from:
            parent_node = self.build_justification_tree(parent_id, working_memory)
            if parent_node:
                node.add_child(parent_node)
        
        return node
    
    def explain_why(self, fact_id: str, working_memory) -> str:
        """
        Trả lời câu hỏi "Tại sao có fact này?"
        
        Args:
            fact_id: ID của fact cần giải thích
            working_memory: Working memory instance
            
        Returns:
            Giải thích bằng ngôn ngữ tự nhiên
        """
        fact = working_memory.get_fact(fact_id)
        
        if not fact:
            return f"Không tìm thấy fact {fact_id}"
        
        explanation_parts = [
            f"=== Giải thích cho {fact_id} ===\n"
        ]
        
        if fact.source == 'initial':
            explanation_parts.append(
                f"Đây là fact ban đầu từ dữ liệu đầu vào.\n"
            )
            explanation_parts.append(f"Dữ liệu: {json.dumps(fact.data, ensure_ascii=False, indent=2)}")
        else:
            explanation_parts.append(
                f"Fact này được suy ra từ rule: {fact.source}\n"
            )
            
            if fact.derived_from:
                explanation_parts.append("Dựa trên các facts sau:")
                for parent_id in fact.derived_from:
                    parent_fact = working_memory.get_fact(parent_id)
                    if parent_fact:
                        explanation_parts.append(
                            f"  - {parent_id}: {parent_fact.data.get('risk_level', 'N/A')}"
                        )
            
            explanation_parts.append(f"\nKết quả: {json.dumps(fact.data, ensure_ascii=False, indent=2)}")
        
        inference_chain = working_memory.get_inference_chain(fact_id)
        if len(inference_chain) > 1:
            explanation_parts.append(f"\nChuỗi suy diễn ({len(inference_chain)} bước):")
            for i, step in enumerate(inference_chain, 1):
                explanation_parts.append(
                    f"  {i}. {step['fact_id']} (từ {step['source']})"
                )
        
        return "\n".join(explanation_parts)
    
    def explain_why_not(self, rule_id: str, evaluations: Dict[str, Any], 
                       rule_definition: Dict[str, Any]) -> str:
        """
        Trả lời câu hỏi "Tại sao rule này không được kích hoạt?"
        
        Args:
            rule_id: ID của rule
            evaluations: Kết quả đánh giá hiện tại
            rule_definition: Định nghĩa của rule
            
        Returns:
            Giải thích tại sao rule không match
        """
        explanation_parts = [
            f"=== Tại sao {rule_id} không được kích hoạt? ===\n"
        ]
        
        conditions = rule_definition.get('conditions', [])
        failed_conditions = []
        
        for condition in conditions:
            indicator = condition['indicator']
            
            if indicator not in evaluations:
                failed_conditions.append(
                    f"  ✗ {indicator}: Không có dữ liệu"
                )
                continue
            
            eval_result = evaluations[indicator]
            
            if condition.get('source') == 'indicator_rules_output':
                field = condition.get('field', 'risk_level')
                operator = condition['operator']
                expected = condition['value']
                actual = eval_result.get(field)
                
                if operator == 'eq' and actual != expected:
                    failed_conditions.append(
                        f"  ✗ {indicator}.{field}: Cần '{expected}', thực tế '{actual}'"
                    )
                elif operator == 'in' and actual not in expected:
                    failed_conditions.append(
                        f"  ✗ {indicator}.{field}: Cần trong {expected}, thực tế '{actual}'"
                    )
        
        if failed_conditions:
            explanation_parts.append("Các điều kiện không thỏa mãn:")
            explanation_parts.extend(failed_conditions)
        else:
            explanation_parts.append("Tất cả điều kiện đều thỏa mãn, nhưng rule có thể đã bị loại bỏ do conflict resolution.")
        
        return "\n".join(explanation_parts)
    
    def generate_summary(self) -> str:
        """Tạo tóm tắt toàn bộ quá trình suy diễn"""
        if not self.inference_trace:
            return "Không có bước suy diễn nào được thực hiện."
        
        summary_parts = [
            f"=== Tóm tắt quá trình suy diễn ===",
            f"Tổng số bước: {len(self.inference_trace)}",
            ""
        ]
        
        rules_used = set()
        total_facts_generated = 0
        
        for step in self.inference_trace:
            rules_used.add(step.rule_id)
            total_facts_generated += len(step.output_facts)
        
        summary_parts.append(f"Số rules được kích hoạt: {len(rules_used)}")
        summary_parts.append(f"Số facts mới được tạo: {total_facts_generated}")
        summary_parts.append("")
        summary_parts.append("Chi tiết từng bước:")
        
        for step in self.inference_trace:
            summary_parts.append(
                f"  Bước {step.step_id + 1}: {step.rule_id} - {step.rule_description}"
            )
            summary_parts.append(f"    Input: {len(step.input_facts)} facts")
            summary_parts.append(f"    Output: {len(step.output_facts)} facts")
        
        return "\n".join(summary_parts)
    
    def generate_natural_language_explanation(self, 
                                             final_conclusion: Dict[str, Any],
                                             working_memory) -> str:
        """
        Tạo giải thích bằng ngôn ngữ tự nhiên cho kết luận cuối cùng
        
        Args:
            final_conclusion: Kết luận cuối cùng (risk assessment)
            working_memory: Working memory instance
            
        Returns:
            Giải thích chi tiết bằng tiếng Việt
        """
        explanation_parts = []
        
        risk_score = final_conclusion.get('risk_score', 0)
        risk_level = final_conclusion.get('risk_level', 'Unknown')
        
        explanation_parts.append(
            f"Kết luận: Doanh nghiệp có mức độ rủi ro {risk_level} "
            f"với điểm số {risk_score:.2%}.\n"
        )
        
        high_risk_indicators = final_conclusion.get('high_risk_indicators', [])
        if high_risk_indicators:
            explanation_parts.append(
                f"Phát hiện {len(high_risk_indicators)} chỉ số có rủi ro cao:"
            )
            for ind in high_risk_indicators:
                fact = working_memory.get_fact(f"eval_{ind}")
                if fact:
                    explanation_parts.append(
                        f"  - {ind}: {fact.data.get('explanation', 'N/A')}"
                    )
        
        composite_risks = final_conclusion.get('composite_risks', [])
        if composite_risks:
            explanation_parts.append(
                f"\nPhát hiện {len(composite_risks)} vấn đề phức hợp:"
            )
            for risk in composite_risks:
                explanation_parts.append(
                    f"  - {risk['risk_type']} ({risk['severity']}): {risk['explanation']}"
                )
        
        if self.inference_trace:
            explanation_parts.append(
                f"\nQuá trình suy diễn đã trải qua {len(self.inference_trace)} bước, "
                f"kích hoạt {len(set(s.rule_id for s in self.inference_trace))} rules khác nhau."
            )
        
        return "\n".join(explanation_parts)
    
    def export_trace(self, output_path: str):
        """Xuất inference trace ra file JSON"""
        trace_data = {
            'total_steps': len(self.inference_trace),
            'steps': self.get_inference_trace()
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(trace_data, f, ensure_ascii=False, indent=2)
    
    def reset(self):
        """Reset explanation engine"""
        self.inference_trace.clear()
        self.step_counter = 0
    
    def __repr__(self):
        return f"ExplanationEngine(steps={len(self.inference_trace)})"
