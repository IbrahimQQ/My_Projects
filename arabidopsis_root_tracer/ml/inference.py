"""
Inference and post-processing for root detection.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
from scipy import ndimage
from scipy.ndimage import label, binary_dilation, distance_transform_edt
from skimage.morphology import skeletonize, remove_small_objects
from collections import deque


class RootPredictor:
    """
    Post-process model predictions to extract root structures.
    """

    def __init__(self, model: 'RootSegmentationModel'):
        """
        Initialize predictor with a trained model.

        Args:
            model: Trained RootSegmentationModel
        """
        self.model = model

    def predict_roots(self, image: np.ndarray,
                      min_main_length: int = 50,
                      min_lateral_length: int = 10,
                      confidence_threshold: float = 0.5) -> List[Dict]:
        """
        Predict root structures from an image.

        Args:
            image: Grayscale input image
            min_main_length: Minimum length for main roots
            min_lateral_length: Minimum length for lateral roots
            confidence_threshold: Minimum probability for detection

        Returns:
            List of root dictionaries compatible with the tracer format
        """
        # Get probability maps
        probs = self.model.predict_proba(image)

        # Extract masks
        main_mask = probs[1] > confidence_threshold  # Main root probability
        lateral_mask = probs[2] > confidence_threshold  # Lateral probability

        # Clean up masks
        main_mask = self._clean_mask(main_mask, min_size=min_main_length * 2)
        lateral_mask = self._clean_mask(lateral_mask, min_size=min_lateral_length * 2)

        # Extract main roots
        main_roots = self._extract_main_roots(main_mask, min_main_length)

        # Extract laterals and associate with main roots
        roots = self._associate_laterals(main_roots, lateral_mask, min_lateral_length)

        return roots

    def _clean_mask(self, mask: np.ndarray, min_size: int = 50) -> np.ndarray:
        """Clean up a binary mask by removing small objects."""
        mask = mask.astype(bool)
        mask = remove_small_objects(mask, min_size=min_size)
        return mask

    def _extract_main_roots(self, mask: np.ndarray,
                            min_length: int) -> List[Dict]:
        """
        Extract main roots from mask.

        Args:
            mask: Binary mask of main roots
            min_length: Minimum path length

        Returns:
            List of root dictionaries
        """
        if not mask.any():
            return []

        # Skeletonize
        skeleton = skeletonize(mask)

        # Find connected components
        labeled, num_features = label(skeleton)

        roots = []
        root_id = 1

        for i in range(1, num_features + 1):
            component = (labeled == i)

            # Find endpoints (pixels with only one neighbor)
            endpoints = self._find_endpoints(component)

            if len(endpoints) < 2:
                continue

            # Find the longest path through the component
            points = self._trace_longest_path(component, endpoints)

            if len(points) >= min_length:
                roots.append({
                    'id': root_id,
                    'points': points,
                    'laterals': [],
                    'mask': component  # Keep mask for lateral association
                })
                root_id += 1

        return roots

    def _find_endpoints(self, skeleton: np.ndarray) -> List[Tuple[int, int]]:
        """Find endpoint pixels in a skeleton (pixels with only 1 neighbor)."""
        endpoints = []
        height, width = skeleton.shape

        # 8-connectivity kernel
        kernel = np.array([[1, 1, 1], [1, 0, 1], [1, 1, 1]])

        # Count neighbors for each skeleton pixel
        neighbor_count = ndimage.convolve(skeleton.astype(int), kernel, mode='constant')

        for y in range(height):
            for x in range(width):
                if skeleton[y, x] and neighbor_count[y, x] == 1:
                    endpoints.append((x, y))

        return endpoints

    def _trace_longest_path(self, skeleton: np.ndarray,
                            endpoints: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
        """
        Find the longest path through a skeleton component.
        Uses BFS from each endpoint to find the longest path.
        """
        if len(endpoints) < 2:
            return []

        best_path = []
        height, width = skeleton.shape

        # 8-connectivity
        neighbors = [(0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (-1, 1), (1, -1), (-1, -1)]

        for start in endpoints:
            # BFS to find farthest point
            visited = {start: None}
            queue = deque([start])
            farthest = start

            while queue:
                current = queue.popleft()
                x, y = current
                farthest = current

                for dx, dy in neighbors:
                    nx, ny = x + dx, y + dy
                    next_point = (nx, ny)

                    if (0 <= nx < width and 0 <= ny < height and
                        skeleton[ny, nx] and next_point not in visited):
                        visited[next_point] = current
                        queue.append(next_point)

            # Reconstruct path from farthest to start
            path = []
            current = farthest
            while current is not None:
                path.append(current)
                current = visited[current]

            if len(path) > len(best_path):
                best_path = path

        return best_path

    def _associate_laterals(self, main_roots: List[Dict], lateral_mask: np.ndarray,
                            min_length: int) -> List[Dict]:
        """
        Associate lateral roots with main roots.

        Args:
            main_roots: List of main root dictionaries
            lateral_mask: Binary mask of lateral roots
            min_length: Minimum lateral length

        Returns:
            Updated roots with laterals
        """
        if not lateral_mask.any() or not main_roots:
            # Remove temporary mask data
            for root in main_roots:
                root.pop('mask', None)
            return main_roots

        # Create combined main root mask
        height, width = lateral_mask.shape
        main_combined = np.zeros((height, width), dtype=bool)
        for root in main_roots:
            if 'mask' in root:
                main_combined |= root['mask']

        # Remove main roots from lateral mask
        lateral_only = lateral_mask & ~binary_dilation(main_combined, iterations=3)

        if not lateral_only.any():
            for root in main_roots:
                root.pop('mask', None)
            return main_roots

        # Skeletonize laterals
        lateral_skeleton = skeletonize(lateral_only)

        # Find connected components
        labeled, num_features = label(lateral_skeleton)

        for i in range(1, num_features + 1):
            component = (labeled == i)

            # Find endpoints
            endpoints = self._find_endpoints(component)
            if not endpoints:
                continue

            # Get path
            points = self._trace_longest_path(component, endpoints) if len(endpoints) >= 2 else []
            if len(points) < min_length:
                # Try to get points from component directly
                points = [(x, y) for y, x in zip(*np.where(component))]
                if len(points) < min_length:
                    continue

            # Find which main root this lateral belongs to
            best_root = None
            best_dist = float('inf')
            best_idx = 0

            # Check distance from lateral start to each main root
            lat_start = points[0]

            for root in main_roots:
                main_points = root['points']
                for idx, (mx, my) in enumerate(main_points):
                    dist = (lat_start[0] - mx) ** 2 + (lat_start[1] - my) ** 2
                    if dist < best_dist:
                        best_dist = dist
                        best_root = root
                        best_idx = idx

            # Add lateral to best root if close enough
            if best_root is not None and best_dist < 400:  # Within ~20 pixels
                lateral = {
                    'id': len(best_root['laterals']) + 1,
                    'points': points,
                    'start_index': best_idx,
                    'branch_point': best_root['points'][best_idx] if best_idx < len(best_root['points']) else points[0],
                    'auto_detected': True
                }
                best_root['laterals'].append(lateral)

        # Remove temporary mask data
        for root in main_roots:
            root.pop('mask', None)

        return main_roots

    def predict_mask(self, image: np.ndarray) -> np.ndarray:
        """
        Get raw segmentation mask.

        Args:
            image: Input image

        Returns:
            Segmentation mask (0=bg, 1=main, 2=lateral)
        """
        return self.model.predict(image)

    def predict_overlay(self, image: np.ndarray,
                        alpha: float = 0.5) -> np.ndarray:
        """
        Create an overlay visualization.

        Args:
            image: Grayscale input image
            alpha: Transparency

        Returns:
            RGB overlay image
        """
        mask = self.model.predict(image)

        # Normalize image to 0-255
        img_norm = image.astype(np.float32)
        if img_norm.max() > 0:
            img_norm = img_norm / img_norm.max() * 255

        # Create RGB image
        rgb = np.stack([img_norm, img_norm, img_norm], axis=-1).astype(np.uint8)

        # Color map
        colors = {
            1: (0, 255, 0),     # Main root - green
            2: (255, 165, 0)    # Lateral - orange
        }

        # Apply colors
        for class_id, color in colors.items():
            class_mask = mask == class_id
            for c in range(3):
                rgb[:, :, c] = np.where(
                    class_mask,
                    (1 - alpha) * rgb[:, :, c] + alpha * color[c],
                    rgb[:, :, c]
                )

        return rgb.astype(np.uint8)
