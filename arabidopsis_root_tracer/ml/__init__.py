"""
Machine learning module for root detection.
"""

from .model import RootSegmentationModel
from .trainer import RootTrainer
from .dataset import RootDataset, create_training_mask
from .inference import RootPredictor

__all__ = ['RootSegmentationModel', 'RootTrainer', 'RootDataset', 'create_training_mask', 'RootPredictor']
