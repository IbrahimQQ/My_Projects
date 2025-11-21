"""
Image handler for multi-slice TIFF files.
"""

import numpy as np
import tifffile
from typing import Optional, List, Tuple


class ImageHandler:
    """Handles loading and management of multi-slice TIFF images."""

    def __init__(self):
        self._stack: Optional[np.ndarray] = None
        self._file_path: Optional[str] = None
        self._slice_names: List[str] = []
        self._current_slice: int = 0

    def load_tiff(self, file_path: str) -> bool:
        """
        Load a multi-slice TIFF file.

        Args:
            file_path: Path to the TIFF file

        Returns:
            True if loaded successfully, False otherwise
        """
        try:
            self._stack = tifffile.imread(file_path)
            self._file_path = file_path

            # Handle single image vs stack
            if self._stack.ndim == 2:
                # Single image - add dimension
                self._stack = self._stack[np.newaxis, ...]
            elif self._stack.ndim == 3:
                # Could be RGB or stack
                if self._stack.shape[2] in [3, 4]:
                    # RGB/RGBA - convert to grayscale and treat as single
                    self._stack = np.mean(self._stack, axis=2).astype(np.uint8)
                    self._stack = self._stack[np.newaxis, ...]
            elif self._stack.ndim == 4:
                # Stack of RGB - convert each to grayscale
                self._stack = np.mean(self._stack, axis=3).astype(np.uint8)

            # Initialize slice names
            self._slice_names = [f"Slice_{i+1}" for i in range(self.num_slices)]
            self._current_slice = 0

            return True

        except Exception as e:
            print(f"Error loading TIFF: {e}")
            return False

    @property
    def is_loaded(self) -> bool:
        """Check if an image is loaded."""
        return self._stack is not None

    @property
    def num_slices(self) -> int:
        """Get number of slices in the stack."""
        if self._stack is None:
            return 0
        return self._stack.shape[0]

    @property
    def current_slice(self) -> int:
        """Get current slice index."""
        return self._current_slice

    @current_slice.setter
    def current_slice(self, index: int):
        """Set current slice index."""
        if self._stack is not None and 0 <= index < self.num_slices:
            self._current_slice = index

    @property
    def image_size(self) -> Tuple[int, int]:
        """Get image dimensions (height, width)."""
        if self._stack is None:
            return (0, 0)
        return self._stack.shape[1], self._stack.shape[2]

    def get_slice(self, index: Optional[int] = None) -> Optional[np.ndarray]:
        """
        Get a specific slice from the stack.

        Args:
            index: Slice index (default: current slice)

        Returns:
            2D numpy array of the slice, or None if not loaded
        """
        if self._stack is None:
            return None

        if index is None:
            index = self._current_slice

        if 0 <= index < self.num_slices:
            return self._stack[index].copy()
        return None

    def get_slice_name(self, index: Optional[int] = None) -> str:
        """Get the name of a slice."""
        if index is None:
            index = self._current_slice

        if 0 <= index < len(self._slice_names):
            return self._slice_names[index]
        return ""

    def set_slice_name(self, name: str, index: Optional[int] = None):
        """Set the name of a slice."""
        if index is None:
            index = self._current_slice

        if 0 <= index < len(self._slice_names):
            self._slice_names[index] = name

    def get_all_slice_names(self) -> List[str]:
        """Get all slice names."""
        return self._slice_names.copy()

    def normalize_slice(self, index: Optional[int] = None) -> Optional[np.ndarray]:
        """
        Get a normalized (0-255) version of a slice.

        Args:
            index: Slice index (default: current slice)

        Returns:
            Normalized 2D numpy array
        """
        img = self.get_slice(index)
        if img is None:
            return None

        # Normalize to 0-255
        img = img.astype(np.float64)
        if img.max() > img.min():
            img = (img - img.min()) / (img.max() - img.min()) * 255
        return img.astype(np.uint8)
