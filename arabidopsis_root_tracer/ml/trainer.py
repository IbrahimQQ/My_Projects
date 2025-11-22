"""
Training pipeline for root segmentation model.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, random_split
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
import numpy as np
from typing import Optional, Callable, Dict, List, Tuple
from pathlib import Path
import json
import time


class DiceLoss(nn.Module):
    """Dice loss for segmentation."""

    def __init__(self, smooth: float = 1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        """
        Compute Dice loss.

        Args:
            pred: Predictions (B, C, H, W) - logits
            target: Targets (B, H, W) - class indices
        """
        num_classes = pred.shape[1]
        pred_soft = F.softmax(pred, dim=1)

        # One-hot encode target
        target_one_hot = F.one_hot(target, num_classes).permute(0, 3, 1, 2).float()

        # Compute Dice for each class
        dims = (0, 2, 3)
        intersection = (pred_soft * target_one_hot).sum(dims)
        cardinality = (pred_soft + target_one_hot).sum(dims)

        dice = (2.0 * intersection + self.smooth) / (cardinality + self.smooth)

        return 1.0 - dice.mean()


class CombinedLoss(nn.Module):
    """Combined Dice + Cross Entropy loss with class weights."""

    def __init__(self, dice_weight: float = 0.5, ce_weight: float = 0.5,
                 class_weights: Optional[torch.Tensor] = None):
        super().__init__()
        self.dice_weight = dice_weight
        self.ce_weight = ce_weight
        self.dice_loss = DiceLoss()
        self.ce_loss = nn.CrossEntropyLoss(weight=class_weights)

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        dice = self.dice_loss(pred, target)
        ce = self.ce_loss(pred, target)
        return self.dice_weight * dice + self.ce_weight * ce


class RootTrainer:
    """
    Trainer class for root segmentation model.
    """

    def __init__(self, model: 'RootSegmentationModel',
                 learning_rate: float = 1e-4,
                 class_weights: Optional[List[float]] = None):
        """
        Initialize trainer.

        Args:
            model: RootSegmentationModel to train
            learning_rate: Initial learning rate
            class_weights: Weights for each class [bg, main, lateral]
        """
        self.model = model
        self.device = model.device

        # Set up class weights (roots are typically small portion of image)
        if class_weights is None:
            class_weights = [0.1, 1.0, 1.5]  # Higher weight for roots

        weights = torch.tensor(class_weights, dtype=torch.float32).to(self.device)
        self.criterion = CombinedLoss(class_weights=weights)

        self.optimizer = Adam(model.model.parameters(), lr=learning_rate)
        self.scheduler = ReduceLROnPlateau(
            self.optimizer, mode='min', factor=0.5, patience=5, verbose=True
        )

        self.history = {
            'train_loss': [],
            'val_loss': [],
            'train_iou': [],
            'val_iou': [],
            'lr': []
        }

    def train(self, train_loader: DataLoader, val_loader: Optional[DataLoader] = None,
              epochs: int = 50, save_path: Optional[str] = None,
              progress_callback: Optional[Callable] = None) -> Dict:
        """
        Train the model.

        Args:
            train_loader: Training data loader
            val_loader: Validation data loader
            epochs: Number of epochs
            save_path: Path to save best model
            progress_callback: Callback for progress updates (epoch, metrics)

        Returns:
            Training history dictionary
        """
        best_val_loss = float('inf')
        best_epoch = 0

        for epoch in range(epochs):
            epoch_start = time.time()

            # Training
            train_loss, train_iou = self._train_epoch(train_loader)

            # Validation
            if val_loader is not None:
                val_loss, val_iou = self._validate(val_loader)
                self.scheduler.step(val_loss)
            else:
                val_loss, val_iou = train_loss, train_iou

            # Record history
            current_lr = self.optimizer.param_groups[0]['lr']
            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_loss)
            self.history['train_iou'].append(train_iou)
            self.history['val_iou'].append(val_iou)
            self.history['lr'].append(current_lr)

            epoch_time = time.time() - epoch_start

            # Save best model
            if val_loss < best_val_loss and save_path:
                best_val_loss = val_loss
                best_epoch = epoch
                self.model.save(save_path)

            # Progress callback
            metrics = {
                'epoch': epoch + 1,
                'total_epochs': epochs,
                'train_loss': train_loss,
                'val_loss': val_loss,
                'train_iou': train_iou,
                'val_iou': val_iou,
                'lr': current_lr,
                'time': epoch_time,
                'best_epoch': best_epoch + 1
            }

            if progress_callback:
                progress_callback(metrics)
            else:
                print(f"Epoch {epoch + 1}/{epochs} - "
                      f"Loss: {train_loss:.4f}/{val_loss:.4f} - "
                      f"IoU: {train_iou:.4f}/{val_iou:.4f} - "
                      f"LR: {current_lr:.6f} - "
                      f"Time: {epoch_time:.1f}s")

        return self.history

    def _train_epoch(self, loader: DataLoader) -> Tuple[float, float]:
        """Train for one epoch."""
        self.model.model.train()
        total_loss = 0.0
        total_iou = 0.0
        num_batches = 0

        for images, masks in loader:
            images = images.to(self.device)
            masks = masks.to(self.device)

            self.optimizer.zero_grad()

            outputs = self.model.model(images)
            loss = self.criterion(outputs, masks)

            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()
            total_iou += self._compute_iou(outputs, masks)
            num_batches += 1

        return total_loss / num_batches, total_iou / num_batches

    def _validate(self, loader: DataLoader) -> Tuple[float, float]:
        """Validate the model."""
        self.model.model.eval()
        total_loss = 0.0
        total_iou = 0.0
        num_batches = 0

        with torch.no_grad():
            for images, masks in loader:
                images = images.to(self.device)
                masks = masks.to(self.device)

                outputs = self.model.model(images)
                loss = self.criterion(outputs, masks)

                total_loss += loss.item()
                total_iou += self._compute_iou(outputs, masks)
                num_batches += 1

        return total_loss / num_batches, total_iou / num_batches

    def _compute_iou(self, pred: torch.Tensor, target: torch.Tensor) -> float:
        """Compute mean IoU for root classes (excluding background)."""
        pred_classes = torch.argmax(pred, dim=1)
        num_classes = pred.shape[1]

        ious = []
        for cls in range(1, num_classes):  # Skip background
            pred_mask = (pred_classes == cls)
            target_mask = (target == cls)

            intersection = (pred_mask & target_mask).sum().float()
            union = (pred_mask | target_mask).sum().float()

            if union > 0:
                ious.append((intersection / union).item())

        return np.mean(ious) if ious else 0.0

    def save_history(self, path: str):
        """Save training history to JSON."""
        with open(path, 'w') as f:
            json.dump(self.history, f, indent=2)

    @staticmethod
    def prepare_dataloaders(dataset, batch_size: int = 4,
                            val_split: float = 0.2,
                            num_workers: int = 0) -> Tuple[DataLoader, DataLoader]:
        """
        Prepare train and validation data loaders.

        Args:
            dataset: PyTorch Dataset
            batch_size: Batch size
            val_split: Fraction for validation
            num_workers: Number of data loading workers

        Returns:
            (train_loader, val_loader)
        """
        total = len(dataset)
        val_size = int(total * val_split)
        train_size = total - val_size

        train_dataset, val_dataset = random_split(
            dataset, [train_size, val_size],
            generator=torch.Generator().manual_seed(42)
        )

        train_loader = DataLoader(
            train_dataset, batch_size=batch_size, shuffle=True,
            num_workers=num_workers, pin_memory=True
        )

        val_loader = DataLoader(
            val_dataset, batch_size=batch_size, shuffle=False,
            num_workers=num_workers, pin_memory=True
        )

        return train_loader, val_loader
