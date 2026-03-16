"""
Knowledge Inference Engine for Financial Risk Assessment
Implements 4-phase inference pipeline based on Extended Rela-model
With TRUE inference capabilities: Forward Chaining, Backward Chaining, Explanation
"""

from .phase1_data_standardization import DataStandardizer
from .phase2_indicator_calculation import IndicatorCalculator
from .phase3_risk_evaluation import RiskEvaluator
from .phase4_composite_inference import CompositeInferer
from .working_memory import WorkingMemory, Fact
from .conflict_resolver import ConflictResolver, ConflictStrategy
from .explanation_engine import ExplanationEngine
from .forward_chainer import ForwardChainer
from .backward_chainer import BackwardChainer
from .inference_engine import InferenceEngine

__all__ = [
    'DataStandardizer',
    'IndicatorCalculator',
    'RiskEvaluator',
    'CompositeInferer',
    'WorkingMemory',
    'Fact',
    'ConflictResolver',
    'ConflictStrategy',
    'ExplanationEngine',
    'ForwardChainer',
    'BackwardChainer',
    'InferenceEngine'
]
