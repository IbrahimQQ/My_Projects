"""
Dataset classes for root segmentation training.
"""

import numpy as np
import torch
from torch.utils.data import Dataset
from typing import List, Dict, Tuple, Optional, Callable
import json
import os
from pathlib import Path


def create_training_mask(image_shape: Tuple[int, int], roots: List[Dict],
                         main_root_width: int = 5, lateral_width: int = 3) -> np.ndarray:
    """
    Create a segmentation mask from traced root data.

    Args:
        image_shape: (height, width) of the image
        roots: List of root dictionaries with 'points' and 'laterals'
        main_root_width: Width of main root in the mask
        lateral_width: Width of lateral roots in the mask

    Returns:
        Mask array with values: 0=background, 1=main root, 2=lateral root
    """
    mask = np.zeros(image_shape, dtype=np.uint8)

    for root in roots:
        # Draw main root
        main_points = root.get('points', [])
        if main_points:
            _draw_path(mask, main_points, value=1, width=main_root_width)

        # Draw laterals
        for lateral in root.get('laterals', []):
            lat_points = lateral.get('points', [])
            if lat_points:
                _draw_path(mask, lat_points, value=2, width=lateral_width)

    return mask


def _draw_path(mask: np.ndarray, points: List[Tuple[int, int]],
               value: int, width: int):
    """Draw a path on the mask with given width."""
    height, w = mask.shape

    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i + 1]

        # Bresenham's line algorithm with width
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx - dy

        x, y = x1, y1
        while True:
            # Draw circle at each point for width
            for wy in range(-width // 2, width // 2 + 1):
                for wx in range(-width // 2, width // 2 + 1):
                    if wx * wx + wy * wy <= (width // 2) ** 2:
                        py, px = y + wy, x + wx
                        if 0 <= py < height and 0 <= px < w:
                            # Only overwrite background or same class
                            if mask[py, px] == 0 or mask[py, px] == value:
                                mask[py, px] = value

            if x == x2 and y == y2:
                break

            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy


class RootDataset(Dataset):
    """
    PyTorch Dataset for root segmentation training.
    """

    def __init__(self, data_dir: str, transform: Optional[Callable] = None,
                 augment: bool = True):
        """
        Initialize the dataset.

        Args:
            data_dir: Directory containing training data
            transform: Optional transform to apply
            augment: Whether to apply data augmentation
        """
        self.data_dir = Path(data_dir)
        self.transform = transform
        self.augment = augment

        # Load data index
        self.samples = []
        self._load_samples()

    def _load_samples(self):
        """Load sample list from data directory."""
        index_file = self.data_dir / 'index.json'

        if index_file.exists():
            with open(index_file, 'r') as f:
                self.samples = json.load(f)
        else:
            # Scan directory for image-mask pairs
            for img_path in self.data_dir.glob('*.npy'):
                if '_mask' not in img_path.stem:
                    mask_path = img_path.parent / f"{img_path.stem}_mask.npy"
                    if mask_path.exists():
                        self.samples.append({
                            'image': str(img_path),
                            'mask': str(mask_path)
                        })

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        sample = self.samples[idx]

        # Load image and mask
        image = np.load(sample['image'])
        mask = np.load(sample['mask'])

        # Ensure correct dtypes
        image = image.astype(np.float32)
        mask = mask.astype(np.int64)

        # Normalize image
        if image.max() > 0:
            image = image / image.max()

        # Apply augmentation
        if self.augment:
            image, mask = self._augment(image, mask)

        # Apply transform
        if self.transform:
            image, mask = self.transform(image, mask)

        # Convert to tensors
        image_tensor = torch.from_numpy(image).unsqueeze(0)  # Add channel dim
        mask_tensor = torch.from_numpy(mask)

        return image_tensor, mask_tensor

    def _augment(self, image: np.ndarray, mask: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Apply data augmentation."""
        # Random horizontal flip
        if np.random.random() > 0.5:
            image = np.fliplr(image).copy()
            mask = np.fliplr(mask).copy()

        # Random vertical flip
        if np.random.random() > 0.5:
            image = np.flipud(image).copy()
            mask = np.flipud(mask).copy()

        # Random rotation (0, 90, 180, 270)
        k = np.random.randint(0, 4)
        if k > 0:
            image = np.rot90(image, k).copy()
            mask = np.rot90(mask, k).copy()

        # Random brightness/contrast
        if np.random.random() > 0.5:
            # Brightness
            brightness = np.random.uniform(0.8, 1.2)
            image = np.clip(image * brightness, 0, 1)

        if np.random.random() > 0.5:
            # Contrast
            contrast = np.random.uniform(0.8, 1.2)
            mean = image.mean()
            image = np.clip((image - mean) * contrast + mean, 0, 1)

        # Random noise
        if np.random.random() > 0.7:
            noise = np.random.normal(0, 0.02, image.shape)
            image = np.clip(image + noise, 0, 1)

        return image.astype(np.float32), mask

    @staticmethod
    def save_sample(data_dir: str, sample_id: str, image: np.ndarray,
                    roots: List[Dict], main_width: int = 5, lateral_width: int = 3):
        """
        Save a training sample (image + mask).

        Args:
            data_dir: Directory to save to
            sample_id: Unique identifier for this sample
            image: Input image
            roots: List of traced roots
            main_width: Width for main root in mask
            lateral_width: Width for laterals in mask
        """
        os.makedirs(data_dir, exist_ok=True)

        # Save image
        np.save(os.path.join(data_dir, f"{sample_id}.npy"), image)

        # Create and save mask
        mask = create_training_mask(image.shape, roots, main_width, lateral_width)
        np.save(os.path.join(data_dir, f"{sample_id}_mask.npy"), mask)

        # Update index
        index_file = os.path.join(data_dir, 'index.json')
        if os.path.exists(index_file):
            with open(index_file, 'r') as f:
                index = json.load(f)
        else:
            index = []

        # Add new sample
        sample_entry = {
            'image': f"{sample_id}.npy",
            'mask': f"{sample_id}_mask.npy"
        }
        if sample_entry not in index:
            index.append(sample_entry)

        with open(index_file, 'w') as f:
            json.dump(index, f, indent=2)


class InMemoryDataset(Dataset):
    """
    In-memory dataset for quick training from current session data.
    """

    def __init__(self, images: List[np.ndarray], masks: List[np.ndarray],
                 augment: bool = True):
        """
        Initialize with pre-loaded data.

        Args:
            images: List of images
            masks: List of corresponding masks
            augment: Whether to augment
        """
        self.images = images
        self.masks = masks
        self.augment = augment

        assert len(images) == len(masks), "Images and masks must have same length"

    def __len__(self) -> int:
        return len(self.images)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        image = self.images[idx].astype(np.float32)
        mask = self.masks[idx].astype(np.int64)

        if image.max() > 0:
            image = image / image.max()

        if self.augment:
            image, mask = RootDataset._augment(None, image, mask)

        image_tensor = torch.from_numpy(image).unsqueeze(0)
        mask_tensor = torch.from_numpy(mask)

        return image_tensor, mask_tensor
