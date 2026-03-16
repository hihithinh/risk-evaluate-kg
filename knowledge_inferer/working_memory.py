"""
Working Memory - Bộ nhớ làm việc cho Inference Engine
Lưu trữ và quản lý facts động trong quá trình suy diễn
"""

from typing import Dict, Any, List, Set, Optional
from datetime import datetime
import copy


class Fact:
    """
    Đại diện cho một fact (sự kiện) trong working memory
    """
    
    def __init__(self, fact_id: str, fact_type: str, data: Dict[str, Any], 
                 source: str = 'initial', derived_from: Optional[List[str]] = None):
        """
        Args:
            fact_id: ID duy nhất của fact
            fact_type: Loại fact (indicator_evaluation, composite_risk, etc.)
            data: Dữ liệu của fact
            source: Nguồn gốc ('initial', 'rule_R1', 'rule_R2', etc.)
            derived_from: List các fact_id mà fact này được suy ra từ đó
        """
        self.fact_id = fact_id
        self.fact_type = fact_type
        self.data = data
        self.source = source
        self.derived_from = derived_from or []
        self.timestamp = datetime.now()
    
    def __repr__(self):
        return f"Fact({self.fact_id}, type={self.fact_type}, source={self.source})"
    
    def __eq__(self, other):
        if not isinstance(other, Fact):
            return False
        return self.fact_id == other.fact_id
    
    def __hash__(self):
        return hash(self.fact_id)


class WorkingMemory:
    """
    Working Memory - Quản lý tập hợp các facts trong quá trình suy diễn
    
    Chức năng:
    - Lưu trữ facts (initial facts + derived facts)
    - Thêm/xóa facts
    - Query facts theo điều kiện
    - Track lineage (nguồn gốc) của facts
    """
    
    def __init__(self):
        self.facts: Dict[str, Fact] = {}
        self.facts_by_type: Dict[str, Set[str]] = {}
        self.inference_history: List[Dict[str, Any]] = []
    
    def add_fact(self, fact: Fact) -> bool:
        """
        Thêm một fact vào working memory
        
        Returns:
            True nếu fact mới (chưa tồn tại), False nếu đã có
        """
        if fact.fact_id in self.facts:
            return False
        
        self.facts[fact.fact_id] = fact
        
        if fact.fact_type not in self.facts_by_type:
            self.facts_by_type[fact.fact_type] = set()
        self.facts_by_type[fact.fact_type].add(fact.fact_id)
        
        self.inference_history.append({
            'action': 'add_fact',
            'fact_id': fact.fact_id,
            'fact_type': fact.fact_type,
            'source': fact.source,
            'timestamp': fact.timestamp
        })
        
        return True
    
    def remove_fact(self, fact_id: str) -> bool:
        """Xóa một fact khỏi working memory"""
        if fact_id not in self.facts:
            return False
        
        fact = self.facts[fact_id]
        del self.facts[fact_id]
        
        if fact.fact_type in self.facts_by_type:
            self.facts_by_type[fact.fact_type].discard(fact_id)
        
        self.inference_history.append({
            'action': 'remove_fact',
            'fact_id': fact_id,
            'timestamp': datetime.now()
        })
        
        return True
    
    def get_fact(self, fact_id: str) -> Optional[Fact]:
        """Lấy một fact theo ID"""
        return self.facts.get(fact_id)
    
    def get_facts_by_type(self, fact_type: str) -> List[Fact]:
        """Lấy tất cả facts của một loại"""
        fact_ids = self.facts_by_type.get(fact_type, set())
        return [self.facts[fid] for fid in fact_ids]
    
    def query_facts(self, **conditions) -> List[Fact]:
        """
        Query facts theo điều kiện
        
        Example:
            wm.query_facts(fact_type='indicator_evaluation', risk_level='High')
        """
        results = []
        
        for fact in self.facts.values():
            match = True
            
            if 'fact_type' in conditions and fact.fact_type != conditions['fact_type']:
                match = False
                continue
            
            for key, value in conditions.items():
                if key == 'fact_type':
                    continue
                
                if key not in fact.data or fact.data[key] != value:
                    match = False
                    break
            
            if match:
                results.append(fact)
        
        return results
    
    def get_all_facts(self) -> List[Fact]:
        """Lấy tất cả facts"""
        return list(self.facts.values())
    
    def clear(self):
        """Xóa tất cả facts"""
        self.facts.clear()
        self.facts_by_type.clear()
        self.inference_history.clear()
    
    def get_lineage(self, fact_id: str) -> List[str]:
        """
        Truy vết nguồn gốc của một fact
        
        Returns:
            List các fact_id mà fact này được suy ra từ đó (đệ quy)
        """
        fact = self.get_fact(fact_id)
        if not fact:
            return []
        
        lineage = []
        
        for parent_id in fact.derived_from:
            lineage.append(parent_id)
            lineage.extend(self.get_lineage(parent_id))
        
        return lineage
    
    def get_inference_chain(self, fact_id: str) -> List[Dict[str, Any]]:
        """
        Lấy chuỗi suy diễn dẫn đến một fact
        
        Returns:
            List các bước suy diễn theo thứ tự
        """
        chain = []
        fact = self.get_fact(fact_id)
        
        if not fact:
            return chain
        
        for parent_id in fact.derived_from:
            parent_fact = self.get_fact(parent_id)
            if parent_fact:
                chain.extend(self.get_inference_chain(parent_id))
        
        chain.append({
            'fact_id': fact.fact_id,
            'fact_type': fact.fact_type,
            'source': fact.source,
            'data': fact.data,
            'derived_from': fact.derived_from
        })
        
        return chain
    
    def snapshot(self) -> Dict[str, Any]:
        """Tạo snapshot của working memory hiện tại"""
        return {
            'facts': {fid: {
                'fact_id': f.fact_id,
                'fact_type': f.fact_type,
                'data': copy.deepcopy(f.data),
                'source': f.source,
                'derived_from': f.derived_from.copy()
            } for fid, f in self.facts.items()},
            'total_facts': len(self.facts),
            'facts_by_type': {k: len(v) for k, v in self.facts_by_type.items()},
            'timestamp': datetime.now().isoformat()
        }
    
    def __len__(self):
        return len(self.facts)
    
    def __repr__(self):
        return f"WorkingMemory(facts={len(self.facts)}, types={len(self.facts_by_type)})"
