"""
Root tracing algorithms for Arabidopsis roots.
Supports semi-automatic tracing of main roots and lateral roots.
"""

import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from scipy import ndimage
from scipy.ndimage import binary_dilation, distance_transform_edt
from skimage.morphology import skeletonize, binary_closing, binary_opening, disk
from skimage.filters import gaussian
from collections import deque
import heapq


class RootTracer:
    """
    Semi-automatic root tracing for white roots on black background.
    Supports multiple main roots per image.
    """

    def __init__(self):
        self._image: Optional[np.ndarray] = None
        self._skeleton: Optional[np.ndarray] = None
        self._binary_mask: Optional[np.ndarray] = None
        # Support multiple main roots
        self._main_roots: List[Dict] = []  # List of {id: int, points: List, laterals: List}
        self._current_root_id: int = 0
        self._next_root_id: int = 1
        self._threshold: int = 30
        self._invert: bool = False
        # Cache for skeletons per slice
        self._skeleton_cache: Dict[int, np.ndarray] = {}
        self._mask_cache: Dict[int, np.ndarray] = {}
        self._current_slice_idx: int = 0

    def set_image(self, image: np.ndarray, slice_idx: int = 0):
        """Set the image to trace on."""
        self._image = image.copy()
        self._current_slice_idx = slice_idx
        self._preprocess_image()

    def set_threshold(self, threshold: int):
        """Set the binarization threshold."""
        new_threshold = max(1, min(255, threshold))
        if new_threshold != self._threshold:
            self._threshold = new_threshold
            # Clear cache when threshold changes
            self._skeleton_cache.clear()
            self._mask_cache.clear()
            if self._image is not None:
                self._preprocess_image()

    def set_invert(self, invert: bool):
        """Set whether to invert the image (for black roots on white background)."""
        if invert != self._invert:
            self._invert = invert
            # Clear cache when invert changes
            self._skeleton_cache.clear()
            self._mask_cache.clear()
            if self._image is not None:
                self._preprocess_image()

    def _preprocess_image(self):
        """Preprocess image for tracing."""
        if self._image is None:
            return

        # Check cache first
        if self._current_slice_idx in self._skeleton_cache:
            self._skeleton = self._skeleton_cache[self._current_slice_idx]
            self._binary_mask = self._mask_cache[self._current_slice_idx]
            return

        # Normalize
        img = self._image.astype(np.float64)
        if img.max() > img.min():
            img = (img - img.min()) / (img.max() - img.min()) * 255
        img = img.astype(np.uint8)

        # Invert if needed (for black roots on white background)
        if self._invert:
            img = 255 - img

        # Apply slight Gaussian blur to reduce noise
        img = gaussian(img, sigma=1, preserve_range=True).astype(np.uint8)

        # Binarize (white roots on black background after potential inversion)
        self._binary_mask = img > self._threshold

        # Clean up with morphological operations
        self._binary_mask = binary_opening(self._binary_mask, disk(1))
        self._binary_mask = binary_closing(self._binary_mask, disk(2))

        # Skeletonize
        self._skeleton = skeletonize(self._binary_mask)

        # Cache the results
        self._skeleton_cache[self._current_slice_idx] = self._skeleton.copy()
        self._mask_cache[self._current_slice_idx] = self._binary_mask.copy()

    def trace_main_root(self, start_point: Tuple[int, int]) -> Dict:
        """
        Trace a main root from a starting point.
        Adds to the list of main roots (supports multiple roots per slice).

        Args:
            start_point: (x, y) starting point from user click

        Returns:
            Dict with root data {id, points, laterals}
        """
        if self._skeleton is None:
            return {}

        x, y = start_point
        height, width = self._skeleton.shape

        # Clamp to image bounds
        x = max(0, min(width - 1, x))
        y = max(0, min(height - 1, y))

        # Find nearest skeleton point
        start = self._find_nearest_skeleton_point(x, y)
        if start is None:
            return {}

        # Get existing main root masks to avoid
        existing_mask = self._get_all_main_roots_mask()

        # Trace the main root - improved algorithm
        points = self._trace_main_root_improved(start, existing_mask)

        if not points:
            return {}

        # Create new root entry
        root_data = {
            'id': self._next_root_id,
            'points': points,
            'laterals': []
        }
        self._main_roots.append(root_data)
        self._current_root_id = self._next_root_id
        self._next_root_id += 1

        return root_data

    def _get_all_main_roots_mask(self) -> np.ndarray:
        """Get mask of all existing main root points."""
        if self._skeleton is None:
            return np.array([])

        mask = np.zeros_like(self._skeleton, dtype=bool)
        for root in self._main_roots:
            for x, y in root['points']:
                if 0 <= y < mask.shape[0] and 0 <= x < mask.shape[1]:
                    mask[y, x] = True
        return mask

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

    def _trace_main_root_improved(self, start: Tuple[int, int],
                                   avoid_mask: np.ndarray) -> List[Tuple[int, int]]:
        """
        Improved main root tracing that follows the main stem.
        Uses direction momentum to avoid branching into laterals.
        """
        if self._skeleton is None:
            return []

        height, width = self._skeleton.shape
        visited = np.zeros_like(self._skeleton, dtype=bool)

        # Also avoid already traced roots
        if avoid_mask.size > 0:
            visited = visited | avoid_mask

        path = [start]
        visited[start[1], start[0]] = True

        # 8-connectivity neighbors
        neighbors = [(0, 1), (-1, 1), (1, 1), (-1, 0), (1, 0), (-1, -1), (1, -1), (0, -1)]

        current = start
        # Initial direction - assume downward
        prev_direction = (0, 1)

        while True:
            x, y = current
            best_next = None
            best_score = -float('inf')

            candidates = []
            for dx, dy in neighbors:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if self._skeleton[ny, nx] and not visited[ny, nx]:
                        candidates.append((nx, ny, dx, dy))

            if not candidates:
                # Try to jump small gaps in the downward direction
                best_next = self._find_continuation_improved(current, visited, prev_direction)
                if best_next is None:
                    break
                path.append(best_next)
                visited[best_next[1], best_next[0]] = True
                current = best_next
                continue

            # Score each candidate based on:
            # 1. Continuation of direction (momentum)
            # 2. Preference for downward movement
            # 3. Avoid sharp turns
            for nx, ny, dx, dy in candidates:
                # Direction similarity to previous direction
                direction_score = prev_direction[0] * dx + prev_direction[1] * dy

                # Strong preference for downward (roots grow down)
                downward_score = dy * 3  # +3 for down, 0 for horizontal, -3 for up

                # Slight preference for straight lines
                straight_score = 1 if (dx == prev_direction[0] and dy == prev_direction[1]) else 0

                total_score = direction_score * 2 + downward_score + straight_score

                if total_score > best_score:
                    best_score = total_score
                    best_next = (nx, ny)
                    new_direction = (dx, dy)

            if best_next is None:
                break

            path.append(best_next)
            visited[best_next[1], best_next[0]] = True

            # Update direction with some smoothing
            prev_direction = new_direction
            current = best_next

        return path

    def _find_continuation_improved(self, current: Tuple[int, int], visited: np.ndarray,
                                     direction: Tuple[int, int], max_gap: int = 8) -> Optional[Tuple[int, int]]:
        """Find continuation of path after a gap, preferring current direction."""
        if self._skeleton is None:
            return None

        height, width = self._skeleton.shape
        x, y = current
        dx_dir, dy_dir = direction

        best_point = None
        best_score = -float('inf')

        # Search in a larger area, but score by alignment with direction
        for dist in range(1, max_gap + 1):
            for dy in range(-dist, dist + 1):
                for dx in range(-dist, dist + 1):
                    if abs(dx) <= dist and abs(dy) <= dist:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if self._skeleton[ny, nx] and not visited[ny, nx]:
                                # Score by alignment with direction and distance
                                if dx != 0 or dy != 0:
                                    mag = np.sqrt(dx*dx + dy*dy)
                                    alignment = (dx * dx_dir + dy * dy_dir) / mag
                                else:
                                    alignment = 0

                                # Prefer downward continuation
                                down_bonus = dy * 2 if dy > 0 else 0

                                score = alignment * 3 + down_bonus - dist * 0.5

                                if score > best_score:
                                    best_score = score
                                    best_point = (nx, ny)

        return best_point

    def trace_laterals_for_root(self, root_id: int) -> List[Dict]:
        """
        Trace lateral roots for a specific main root.

        Args:
            root_id: ID of the main root

        Returns:
            List of lateral root dictionaries
        """
        if self._skeleton is None:
            return []

        # Find the root
        root = None
        root_idx = -1
        for i, r in enumerate(self._main_roots):
            if r['id'] == root_id:
                root = r
                root_idx = i
                break

        if root is None or not root['points']:
            return []

        main_points = root['points']
        height, width = self._skeleton.shape

        # Create mask of this main root
        main_root_mask = np.zeros_like(self._skeleton, dtype=bool)
        for x, y in main_points:
            main_root_mask[y, x] = True

        # Dilate main root mask slightly
        dilated_main = binary_dilation(main_root_mask, iterations=2)

        # Track visited for laterals
        visited_laterals = np.zeros_like(self._skeleton, dtype=bool)

        # Mark existing laterals as visited
        for lat in root['laterals']:
            for px, py in lat['points']:
                if 0 <= py < height and 0 <= px < width:
                    visited_laterals[py, px] = True

        new_laterals = []

        for idx, (mx, my) in enumerate(main_points):
            # Check neighborhood for branch points
            for dx in range(-3, 4):
                for dy in range(-3, 4):
                    nx, ny = mx + dx, my + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if (self._skeleton[ny, nx] and
                            not main_root_mask[ny, nx] and
                            not visited_laterals[ny, nx]):
                            # Trace lateral
                            lateral_points = self._trace_lateral(
                                (nx, ny), main_root_mask, visited_laterals
                            )
                            if len(lateral_points) > 5:  # Minimum length
                                lateral_data = {
                                    'id': len(root['laterals']) + len(new_laterals) + 1,
                                    'points': lateral_points,
                                    'start_index': idx,
                                    'branch_point': (mx, my)
                                }
                                new_laterals.append(lateral_data)

        # Add new laterals to the root
        root['laterals'].extend(new_laterals)

        return new_laterals

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

    def add_manual_lateral(self, root_id: int, start_point: Tuple[int, int],
                           end_point: Tuple[int, int]) -> Optional[Dict]:
        """
        Add a manual lateral root by tracing between two points.

        Args:
            root_id: ID of the main root to attach to
            start_point: Start point (should be near main root)
            end_point: End point of lateral

        Returns:
            Lateral data dict or None
        """
        if self._skeleton is None:
            return None

        # Find the root
        root = None
        for r in self._main_roots:
            if r['id'] == root_id:
                root = r
                break

        if root is None:
            return None

        # Find nearest point on main root
        main_points = root['points']
        min_dist = float('inf')
        branch_idx = 0
        branch_point = main_points[0] if main_points else start_point

        for idx, (mx, my) in enumerate(main_points):
            dist = (mx - start_point[0])**2 + (my - start_point[1])**2
            if dist < min_dist:
                min_dist = dist
                branch_idx = idx
                branch_point = (mx, my)

        # Find skeleton path from start to end
        start_skel = self._find_nearest_skeleton_point(start_point[0], start_point[1])
        end_skel = self._find_nearest_skeleton_point(end_point[0], end_point[1])

        if start_skel is None or end_skel is None:
            # Fall back to straight line
            points = self._generate_line_points(start_point, end_point)
        else:
            # Try to trace along skeleton
            points = self._trace_between_points(start_skel, end_skel)
            if not points:
                points = self._generate_line_points(start_point, end_point)

        if len(points) < 2:
            return None

        lateral_data = {
            'id': len(root['laterals']) + 1,
            'points': points,
            'start_index': branch_idx,
            'branch_point': branch_point,
            'manual': True
        }
        root['laterals'].append(lateral_data)

        return lateral_data

    def _generate_line_points(self, start: Tuple[int, int],
                               end: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Generate points along a straight line."""
        x1, y1 = start
        x2, y2 = end

        points = []
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx - dy

        x, y = x1, y1
        while True:
            points.append((x, y))
            if x == x2 and y == y2:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy

        return points

    def _trace_between_points(self, start: Tuple[int, int],
                               end: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Trace skeleton between two points using BFS."""
        if self._skeleton is None:
            return []

        height, width = self._skeleton.shape
        visited = np.zeros_like(self._skeleton, dtype=bool)
        parent = {}

        queue = deque([start])
        visited[start[1], start[0]] = True
        parent[start] = None

        neighbors = [(0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (-1, 1), (1, -1), (-1, -1)]

        found = False
        while queue and not found:
            current = queue.popleft()

            if current == end:
                found = True
                break

            x, y = current
            for dx, dy in neighbors:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if self._skeleton[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        parent[(nx, ny)] = current
                        queue.append((nx, ny))

                        if (nx, ny) == end:
                            found = True
                            break

        if not found:
            return []

        # Reconstruct path
        path = []
        current = end
        while current is not None:
            path.append(current)
            current = parent.get(current)

        return list(reversed(path))

    def delete_lateral(self, root_id: int, lateral_id: int) -> bool:
        """
        Delete a lateral root.

        Args:
            root_id: ID of the main root
            lateral_id: ID of the lateral to delete

        Returns:
            True if deleted successfully
        """
        for root in self._main_roots:
            if root['id'] == root_id:
                for i, lat in enumerate(root['laterals']):
                    if lat['id'] == lateral_id:
                        root['laterals'].pop(i)
                        return True
        return False

    def delete_main_root(self, root_id: int) -> bool:
        """Delete a main root and all its laterals."""
        for i, root in enumerate(self._main_roots):
            if root['id'] == root_id:
                self._main_roots.pop(i)
                return True
        return False

    def find_lateral_at_point(self, x: int, y: int, tolerance: int = 10) -> Optional[Tuple[int, int]]:
        """
        Find a lateral root near a point.

        Args:
            x, y: Point coordinates
            tolerance: Search radius

        Returns:
            Tuple of (root_id, lateral_id) or None
        """
        for root in self._main_roots:
            for lat in root['laterals']:
                for px, py in lat['points']:
                    if abs(px - x) <= tolerance and abs(py - y) <= tolerance:
                        return (root['id'], lat['id'])
        return None

    def find_main_root_at_point(self, x: int, y: int, tolerance: int = 10) -> Optional[int]:
        """
        Find a main root near a point.

        Returns:
            Root ID or None
        """
        for root in self._main_roots:
            for px, py in root['points']:
                if abs(px - x) <= tolerance and abs(py - y) <= tolerance:
                    return root['id']
        return None

    def get_all_roots(self) -> List[Dict]:
        """Get all main roots with their laterals."""
        return self._main_roots.copy()

    def get_root(self, root_id: int) -> Optional[Dict]:
        """Get a specific root by ID."""
        for root in self._main_roots:
            if root['id'] == root_id:
                return root.copy()
        return None

    def get_current_root_id(self) -> int:
        """Get the current active root ID."""
        return self._current_root_id

    def set_current_root_id(self, root_id: int):
        """Set the current active root ID."""
        for root in self._main_roots:
            if root['id'] == root_id:
                self._current_root_id = root_id
                return

    def get_binary_mask(self) -> Optional[np.ndarray]:
        """Get the binary mask for debugging."""
        return self._binary_mask.copy() if self._binary_mask is not None else None

    def get_skeleton(self) -> Optional[np.ndarray]:
        """Get the skeleton for debugging."""
        return self._skeleton.copy() if self._skeleton is not None else None

    def clear_tracings(self):
        """Clear all tracings."""
        self._main_roots = []
        self._current_root_id = 0
        self._next_root_id = 1

    def clear_cache(self):
        """Clear the skeleton cache (call when loading new image)."""
        self._skeleton_cache.clear()
        self._mask_cache.clear()

    def set_data(self, roots: List[Dict]):
        """Restore root data (for loading saved state)."""
        self._main_roots = roots
        if roots:
            max_id = max(r['id'] for r in roots)
            self._next_root_id = max_id + 1
            self._current_root_id = roots[-1]['id']
        else:
            self._current_root_id = 0
            self._next_root_id = 1

    def trace_between_points(self, start_point: Tuple[int, int],
                              end_point: Tuple[int, int]) -> List[Tuple[int, int]]:
        """
        Trace a root path between two user-specified points.
        Uses A* pathfinding along the skeleton.

        Args:
            start_point: (x, y) starting point
            end_point: (x, y) ending point

        Returns:
            List of (x, y) points along the traced path
        """
        if self._skeleton is None:
            return []

        # Find nearest skeleton points
        start = self._find_nearest_skeleton_point(start_point[0], start_point[1], max_distance=50)
        end = self._find_nearest_skeleton_point(end_point[0], end_point[1], max_distance=50)

        if start is None or end is None:
            return []

        # Use A* to find path
        path = self._astar_trace(start, end)
        return path

    def get_live_trace_preview(self, start_point: Tuple[int, int],
                                end_point: Tuple[int, int]) -> List[Tuple[int, int]]:
        """
        Get a live preview trace from start to end point.
        Used for interactive tracing where user drags to define the root.

        Args:
            start_point: (x, y) starting point
            end_point: (x, y) current mouse position

        Returns:
            List of (x, y) points along the traced path
        """
        if self._skeleton is None:
            return []

        height, width = self._skeleton.shape

        # Find nearest skeleton points
        start = self._find_nearest_skeleton_point(start_point[0], start_point[1], max_distance=30)
        end = self._find_nearest_skeleton_point(end_point[0], end_point[1], max_distance=30)

        if start is None:
            return []

        if end is None:
            # If end not on skeleton, trace downward from start toward end
            return self._trace_toward_point(start, end_point)

        # Use A* pathfinding along skeleton
        path = self._astar_trace(start, end)
        return path

    def _trace_toward_point(self, start: Tuple[int, int],
                            target: Tuple[int, int]) -> List[Tuple[int, int]]:
        """Trace along skeleton toward a target point."""
        if self._skeleton is None:
            return []

        height, width = self._skeleton.shape
        visited = np.zeros_like(self._skeleton, dtype=bool)
        path = [start]
        visited[start[1], start[0]] = True

        neighbors = [(0, 1), (-1, 1), (1, 1), (-1, 0), (1, 0), (-1, -1), (1, -1), (0, -1)]
        current = start
        target_y = target[1]

        # Trace until we pass the target Y or run out of skeleton
        while current[1] < target_y + 20:
            x, y = current
            best_next = None
            best_score = -float('inf')

            for dx, dy in neighbors:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if self._skeleton[ny, nx] and not visited[ny, nx]:
                        # Score: prefer moving toward target
                        dist_to_target = abs(nx - target[0]) + abs(ny - target[1])
                        downward_bonus = dy * 5  # Strong downward preference
                        score = -dist_to_target + downward_bonus

                        if score > best_score:
                            best_score = score
                            best_next = (nx, ny)

            if best_next is None:
                break

            path.append(best_next)
            visited[best_next[1], best_next[0]] = True
            current = best_next

        return path

    def _astar_trace(self, start: Tuple[int, int],
                     end: Tuple[int, int]) -> List[Tuple[int, int]]:
        """A* pathfinding along skeleton from start to end."""
        if self._skeleton is None:
            return []

        height, width = self._skeleton.shape

        def heuristic(a, b):
            return abs(a[0] - b[0]) + abs(a[1] - b[1])

        open_set = [(0, start)]
        came_from = {}
        g_score = {start: 0}
        f_score = {start: heuristic(start, end)}

        neighbors = [(0, 1), (-1, 1), (1, 1), (-1, 0), (1, 0), (-1, -1), (1, -1), (0, -1)]

        while open_set:
            _, current = heapq.heappop(open_set)

            if current == end:
                # Reconstruct path
                path = [current]
                while current in came_from:
                    current = came_from[current]
                    path.append(current)
                return list(reversed(path))

            x, y = current
            for dx, dy in neighbors:
                nx, ny = x + dx, y + dy
                neighbor = (nx, ny)

                if 0 <= nx < width and 0 <= ny < height and self._skeleton[ny, nx]:
                    # Cost: 1 for cardinal, 1.414 for diagonal
                    move_cost = 1.414 if (dx != 0 and dy != 0) else 1.0
                    tentative_g = g_score[current] + move_cost

                    if neighbor not in g_score or tentative_g < g_score[neighbor]:
                        came_from[neighbor] = current
                        g_score[neighbor] = tentative_g
                        f = tentative_g + heuristic(neighbor, end)
                        f_score[neighbor] = f
                        heapq.heappush(open_set, (f, neighbor))

        # No path found - return trace toward end
        return self._trace_toward_point(start, end)

    def add_root_from_points(self, points: List[Tuple[int, int]]) -> Dict:
        """
        Add a root directly from a list of points (for live trace mode).

        Args:
            points: List of (x, y) points defining the root

        Returns:
            Dict with root data
        """
        if not points:
            return {}

        root_data = {
            'id': self._next_root_id,
            'points': points,
            'laterals': []
        }
        self._main_roots.append(root_data)
        self._current_root_id = self._next_root_id
        self._next_root_id += 1

        return root_data


class MeasurementCalculator:
    """Calculate measurements from traced roots."""

    @staticmethod
    def calculate_path_length(points: List[Tuple[int, int]],
                              pixels_per_unit: float = 1.0) -> float:
        """
        Calculate the length of a path in real units.

        Args:
            points: List of (x, y) points
            pixels_per_unit: Number of pixels per unit (e.g., 161 px/cm)

        Returns:
            Path length in real units
        """
        if len(points) < 2:
            return 0.0

        length_pixels = 0.0
        for i in range(1, len(points)):
            x1, y1 = points[i - 1]
            x2, y2 = points[i]
            length_pixels += np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

        # Convert pixels to units
        if pixels_per_unit > 0:
            return length_pixels / pixels_per_unit
        return length_pixels

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
        idx = branch_index
        if idx < len(main_root_points) - 1:
            main_dx = main_root_points[idx + 1][0] - main_root_points[idx][0]
            main_dy = main_root_points[idx + 1][1] - main_root_points[idx][1]
        elif idx > 0:
            main_dx = main_root_points[idx][0] - main_root_points[idx - 1][0]
            main_dy = main_root_points[idx][1] - main_root_points[idx - 1][1]
        else:
            return 0.0

        # Lateral direction (average of first few segments for stability)
        lat_dx, lat_dy = 0, 0
        num_segs = min(5, len(lateral_points) - 1)
        for i in range(num_segs):
            lat_dx += lateral_points[i + 1][0] - lateral_points[i][0]
            lat_dy += lateral_points[i + 1][1] - lateral_points[i][1]

        # Calculate angle
        main_mag = np.sqrt(main_dx ** 2 + main_dy ** 2)
        lat_mag = np.sqrt(lat_dx ** 2 + lat_dy ** 2)

        if main_mag == 0 or lat_mag == 0:
            return 0.0

        dot = main_dx * lat_dx + main_dy * lat_dy
        cos_angle = dot / (main_mag * lat_mag)
        cos_angle = max(-1, min(1, cos_angle))

        angle = np.degrees(np.arccos(cos_angle))
        return angle

    @staticmethod
    def get_branch_position(main_root_points: List[Tuple[int, int]],
                            branch_index: int,
                            pixels_per_unit: float = 1.0) -> float:
        """
        Get the distance along main root where a lateral branches.

        Returns:
            Distance from main root start to branch point in real units
        """
        if branch_index <= 0:
            return 0.0

        points_to_branch = main_root_points[:branch_index + 1]
        return MeasurementCalculator.calculate_path_length(points_to_branch, pixels_per_unit)

    @staticmethod
    def calculate_root_angle(points: List[Tuple[int, int]]) -> float:
        """
        Calculate the overall angle of a root from vertical (0 = straight down).

        Returns:
            Angle in degrees from vertical (-180 to 180, 0 = straight down)
        """
        if len(points) < 2:
            return 0.0

        # Use start and end points for overall direction
        x1, y1 = points[0]
        x2, y2 = points[-1]

        dx = x2 - x1
        dy = y2 - y1

        if dx == 0 and dy == 0:
            return 0.0

        # Calculate angle from vertical (positive y is down in image coords)
        # atan2(dx, dy) gives angle from positive y-axis (down)
        angle = np.degrees(np.arctan2(dx, dy))
        return angle

    @staticmethod
    def calculate_segment_angle(p1: Tuple[int, int], p2: Tuple[int, int]) -> float:
        """
        Calculate angle of a line segment from vertical.

        Returns:
            Angle in degrees from vertical
        """
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]

        if dx == 0 and dy == 0:
            return 0.0

        return np.degrees(np.arctan2(dx, dy))

    @staticmethod
    def classify_lateral_side(main_root_points: List[Tuple[int, int]],
                              lateral_points: List[Tuple[int, int]],
                              branch_index: int) -> str:
        """
        Determine if a lateral is on the left or right side of the main root.

        Returns:
            'left', 'right', or 'unknown'
        """
        if len(main_root_points) < 2 or len(lateral_points) < 2:
            return 'unknown'

        # Get main root direction at branch point
        idx = branch_index
        if idx < len(main_root_points) - 1:
            main_dx = main_root_points[idx + 1][0] - main_root_points[idx][0]
            main_dy = main_root_points[idx + 1][1] - main_root_points[idx][1]
        elif idx > 0:
            main_dx = main_root_points[idx][0] - main_root_points[idx - 1][0]
            main_dy = main_root_points[idx][1] - main_root_points[idx - 1][1]
        else:
            return 'unknown'

        # Get initial lateral direction
        lat_dx = lateral_points[1][0] - lateral_points[0][0]
        lat_dy = lateral_points[1][1] - lateral_points[0][1]

        # Cross product to determine side (positive = right, negative = left)
        # In image coordinates, y increases downward
        cross = main_dx * lat_dy - main_dy * lat_dx

        if cross > 0:
            return 'right'
        elif cross < 0:
            return 'left'
        else:
            return 'unknown'

    @staticmethod
    def calculate_lateral_tip_angle(lateral_points: List[Tuple[int, int]]) -> float:
        """
        Calculate the angle of a lateral root at its tip (growth direction).
        Similar to main root angle - measures from vertical.

        Returns:
            Angle in degrees from vertical (-180 to 180, 0 = straight down)
        """
        if len(lateral_points) < 2:
            return 0.0

        # Use start and end points for overall direction
        x1, y1 = lateral_points[0]
        x2, y2 = lateral_points[-1]

        dx = x2 - x1
        dy = y2 - y1

        if dx == 0 and dy == 0:
            return 0.0

        # Calculate angle from vertical (positive y is down in image coords)
        angle = np.degrees(np.arctan2(dx, dy))
        return angle

    @staticmethod
    def calculate_left_right_lateral_angles(main_root_points: List[Tuple[int, int]],
                                            laterals: List[Dict],
                                            use_tip_angle: bool = False) -> Dict[str, float]:
        """
        Calculate mean lateral angles for left and right sides separately.

        Args:
            main_root_points: Points of the main root
            laterals: List of lateral root data
            use_tip_angle: If True, use tip angle (growth direction). If False, use branch angle.

        Returns:
            Dict with 'left_mean', 'right_mean', 'left_count', 'right_count'
        """
        left_angles = []
        right_angles = []

        for lat in laterals:
            lat_points = lat.get('points', [])
            branch_idx = lat.get('start_index', 0)

            if len(lat_points) < 2:
                continue

            # Determine side
            side = MeasurementCalculator.classify_lateral_side(
                main_root_points, lat_points, branch_idx
            )

            # Calculate angle based on mode
            if use_tip_angle:
                angle = MeasurementCalculator.calculate_lateral_tip_angle(lat_points)
            else:
                angle = MeasurementCalculator.calculate_lateral_angle(
                    main_root_points, lat_points, branch_idx
                )

            if side == 'left':
                left_angles.append(angle)
            elif side == 'right':
                right_angles.append(angle)

        return {
            'left_mean': np.mean(left_angles) if left_angles else 0.0,
            'right_mean': np.mean(right_angles) if right_angles else 0.0,
            'left_count': len(left_angles),
            'right_count': len(right_angles)
        }
