"""
Root tracing algorithms for Arabidopsis roots.
Supports semi-automatic tracing of main roots and lateral roots.
"""

import numpy as np
from typing import List, Tuple, Optional, Dict
from scipy import ndimage
from scipy.ndimage import binary_dilation, distance_transform_edt
from skimage.morphology import skeletonize, binary_closing, binary_opening, disk
from skimage.filters import gaussian
from collections import deque
import heapq


class RootTracer:
    """
    Semi-automatic root tracing for white roots on black background.
    """

    def __init__(self):
        self._image: Optional[np.ndarray] = None
        self._skeleton: Optional[np.ndarray] = None
        self._binary_mask: Optional[np.ndarray] = None
        self._main_root_points: List[Tuple[int, int]] = []
        self._lateral_roots: List[Dict] = []  # List of {points: [], start_index: int}
        self._threshold: int = 30

    def set_image(self, image: np.ndarray):
        """Set the image to trace on."""
        self._image = image.copy()
        self._preprocess_image()

    def set_threshold(self, threshold: int):
        """Set the binarization threshold."""
        self._threshold = max(1, min(255, threshold))
        if self._image is not None:
            self._preprocess_image()

    def _preprocess_image(self):
        """Preprocess image for tracing."""
        if self._image is None:
            return

        # Normalize
        img = self._image.astype(np.float64)
        if img.max() > img.min():
            img = (img - img.min()) / (img.max() - img.min()) * 255
        img = img.astype(np.uint8)

        # Apply slight Gaussian blur to reduce noise
        img = gaussian(img, sigma=1, preserve_range=True).astype(np.uint8)

        # Binarize (white roots on black background)
        self._binary_mask = img > self._threshold

        # Clean up with morphological operations
        self._binary_mask = binary_opening(self._binary_mask, disk(1))
        self._binary_mask = binary_closing(self._binary_mask, disk(2))

        # Skeletonize
        self._skeleton = skeletonize(self._binary_mask)

    def trace_main_root(self, start_point: Tuple[int, int]) -> List[Tuple[int, int]]:
        """
        Trace the main root from a starting point.

        The algorithm:
        1. Find nearest skeleton point to click
        2. Trace along skeleton, preferring downward direction (root grows down)
        3. Continue until end of skeleton

        Args:
            start_point: (x, y) starting point from user click

        Returns:
            List of (x, y) points along the main root
        """
        if self._skeleton is None:
            return []

        self._main_root_points = []
        self._lateral_roots = []

        x, y = start_point
        height, width = self._skeleton.shape

        # Clamp to image bounds
        x = max(0, min(width - 1, x))
        y = max(0, min(height - 1, y))

        # Find nearest skeleton point
        start = self._find_nearest_skeleton_point(x, y)
        if start is None:
            return []

        # Trace the main root using weighted path finding
        # Prefer going downward (roots grow down)
        self._main_root_points = self._trace_from_point(start)

        return self._main_root_points.copy()

    def _find_nearest_skeleton_point(self, x: int, y: int,
                                      max_distance: int = 50) -> Optional[Tuple[int, int]]:
        """Find the nearest skeleton point to (x, y)."""
        if self._skeleton is None:
            return None

        height, width = self._skeleton.shape

        # Search in expanding squares
        for d in range(max_distance):
            for dy in range(-d, d + 1):
                for dx in range(-d, d + 1):
                    if abs(dx) == d or abs(dy) == d:  # Only check perimeter
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < height and 0 <= nx < width:
                            if self._skeleton[ny, nx]:
                                return (nx, ny)
        return None

    def _trace_from_point(self, start: Tuple[int, int]) -> List[Tuple[int, int]]:
        """
        Trace along skeleton from start point, preferring downward direction.
        """
        if self._skeleton is None:
            return []

        height, width = self._skeleton.shape
        visited = np.zeros_like(self._skeleton, dtype=bool)
        path = [start]
        visited[start[1], start[0]] = True

        # 8-connectivity neighbors (ordered by preference for downward growth)
        # Down, down-left, down-right, left, right, up-left, up-right, up
        neighbors = [(0, 1), (-1, 1), (1, 1), (-1, 0), (1, 0), (-1, -1), (1, -1), (0, -1)]

        current = start
        while True:
            x, y = current
            best_next = None
            best_score = -1

            for dx, dy in neighbors:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if self._skeleton[ny, nx] and not visited[ny, nx]:
                        # Score based on direction (prefer downward)
                        score = dy + 1  # +2 for down, +1 for horizontal, 0 for up
                        if score > best_score:
                            best_score = score
                            best_next = (nx, ny)

            if best_next is None:
                # Try to jump small gaps
                best_next = self._find_continuation(current, visited, max_gap=5)
                if best_next is None:
                    break

            path.append(best_next)
            visited[best_next[1], best_next[0]] = True
            current = best_next

        return path

    def _find_continuation(self, current: Tuple[int, int], visited: np.ndarray,
                           max_gap: int = 5) -> Optional[Tuple[int, int]]:
        """Find continuation of path after a gap in skeleton."""
        if self._skeleton is None:
            return None

        height, width = self._skeleton.shape
        x, y = current

        # Search in a cone below the current point
        best_point = None
        best_distance = max_gap + 1

        for dy in range(1, max_gap + 1):
            for dx in range(-dy, dy + 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if self._skeleton[ny, nx] and not visited[ny, nx]:
                        dist = abs(dx) + dy
                        if dist < best_distance:
                            best_distance = dist
                            best_point = (nx, ny)

        return best_point

    def trace_lateral_roots(self) -> List[Dict]:
        """
        Trace lateral roots branching from the main root.

        Returns:
            List of dictionaries with:
                - 'points': List of (x, y) points
                - 'start_index': Index on main root where lateral starts
                - 'branch_point': (x, y) where lateral branches from main
        """
        if self._skeleton is None or not self._main_root_points:
            return []

        self._lateral_roots = []
        height, width = self._skeleton.shape

        # Create mask of main root
        main_root_mask = np.zeros_like(self._skeleton, dtype=bool)
        for x, y in self._main_root_points:
            main_root_mask[y, x] = True

        # Dilate main root mask slightly to find branch points
        dilated_main = binary_dilation(main_root_mask, iterations=2)

        # Find skeleton points that are near but not on main root
        branch_candidates = self._skeleton & dilated_main & ~main_root_mask

        # For each main root point, check for branches
        visited_laterals = np.zeros_like(self._skeleton, dtype=bool)

        for idx, (mx, my) in enumerate(self._main_root_points):
            # Check 8-neighborhood for branch points
            for dx in range(-3, 4):
                for dy in range(-3, 4):
                    nx, ny = mx + dx, my + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if (self._skeleton[ny, nx] and
                            not main_root_mask[ny, nx] and
                            not visited_laterals[ny, nx]):
                            # Found a potential lateral root start
                            lateral_points = self._trace_lateral(
                                (nx, ny), main_root_mask, visited_laterals
                            )
                            if len(lateral_points) > 5:  # Minimum length
                                self._lateral_roots.append({
                                    'points': lateral_points,
                                    'start_index': idx,
                                    'branch_point': (mx, my)
                                })

        return self._lateral_roots.copy()

    def _trace_lateral(self, start: Tuple[int, int], main_root_mask: np.ndarray,
                       visited: np.ndarray) -> List[Tuple[int, int]]:
        """Trace a single lateral root."""
        if self._skeleton is None:
            return []

        height, width = self._skeleton.shape
        path = [start]
        visited[start[1], start[0]] = True

        # 8-connectivity
        neighbors = [(0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (-1, 1), (1, -1), (-1, -1)]

        current = start
        while True:
            x, y = current
            next_point = None

            for dx, dy in neighbors:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (self._skeleton[ny, nx] and
                        not visited[ny, nx] and
                        not main_root_mask[ny, nx]):
                        next_point = (nx, ny)
                        break

            if next_point is None:
                break

            path.append(next_point)
            visited[next_point[1], next_point[0]] = True
            current = next_point

        return path

    def get_main_root_points(self) -> List[Tuple[int, int]]:
        """Get the traced main root points."""
        return self._main_root_points.copy()

    def get_lateral_roots(self) -> List[Dict]:
        """Get all traced lateral roots."""
        return self._lateral_roots.copy()

    def get_binary_mask(self) -> Optional[np.ndarray]:
        """Get the binary mask for debugging."""
        return self._binary_mask.copy() if self._binary_mask is not None else None

    def get_skeleton(self) -> Optional[np.ndarray]:
        """Get the skeleton for debugging."""
        return self._skeleton.copy() if self._skeleton is not None else None

    def clear_tracings(self):
        """Clear all tracings."""
        self._main_root_points = []
        self._lateral_roots = []


class MeasurementCalculator:
    """Calculate measurements from traced roots."""

    @staticmethod
    def calculate_path_length(points: List[Tuple[int, int]],
                              pixel_size: float = 1.0) -> float:
        """
        Calculate the length of a path in pixels or real units.

        Args:
            points: List of (x, y) points
            pixel_size: Size of one pixel in real units

        Returns:
            Path length
        """
        if len(points) < 2:
            return 0.0

        length = 0.0
        for i in range(1, len(points)):
            x1, y1 = points[i - 1]
            x2, y2 = points[i]
            length += np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

        return length * pixel_size

    @staticmethod
    def calculate_lateral_angle(main_root_points: List[Tuple[int, int]],
                                 lateral_points: List[Tuple[int, int]],
                                 branch_index: int) -> float:
        """
        Calculate the angle of a lateral root relative to the main root.

        Returns:
            Angle in degrees (0-180)
        """
        if len(main_root_points) < 2 or len(lateral_points) < 2:
            return 0.0

        # Get direction vectors
        # Main root direction at branch point
        idx = branch_index
        if idx < len(main_root_points) - 1:
            main_dx = main_root_points[idx + 1][0] - main_root_points[idx][0]
            main_dy = main_root_points[idx + 1][1] - main_root_points[idx][1]
        elif idx > 0:
            main_dx = main_root_points[idx][0] - main_root_points[idx - 1][0]
            main_dy = main_root_points[idx][1] - main_root_points[idx - 1][1]
        else:
            return 0.0

        # Lateral direction (first segment)
        lat_dx = lateral_points[1][0] - lateral_points[0][0]
        lat_dy = lateral_points[1][1] - lateral_points[0][1]

        # Calculate angle
        main_mag = np.sqrt(main_dx ** 2 + main_dy ** 2)
        lat_mag = np.sqrt(lat_dx ** 2 + lat_dy ** 2)

        if main_mag == 0 or lat_mag == 0:
            return 0.0

        dot = main_dx * lat_dx + main_dy * lat_dy
        cos_angle = dot / (main_mag * lat_mag)
        cos_angle = max(-1, min(1, cos_angle))  # Clamp for numerical stability

        angle = np.degrees(np.arccos(cos_angle))
        return angle

    @staticmethod
    def get_branch_position(main_root_points: List[Tuple[int, int]],
                            branch_index: int,
                            pixel_size: float = 1.0) -> float:
        """
        Get the distance along main root where a lateral branches.

        Returns:
            Distance from main root start to branch point
        """
        if branch_index <= 0:
            return 0.0

        points_to_branch = main_root_points[:branch_index + 1]
        return MeasurementCalculator.calculate_path_length(points_to_branch, pixel_size)
