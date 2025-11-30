"""
Image canvas widget for displaying and interacting with root images.
"""

import numpy as np
from typing import Optional, List, Tuple, Dict, Callable
from PySide6.QtWidgets import QGraphicsView, QGraphicsScene, QGraphicsPixmapItem, QToolTip
from PySide6.QtCore import Qt, Signal, QPointF, QTimer
from PySide6.QtGui import QImage, QPixmap, QPainter, QPen, QColor, QBrush


class ImageCanvas(QGraphicsView):
    """
    Custom canvas for displaying images and root tracings.
    Supports zoom, pan, and click interactions.
    """

    # Signals
    point_clicked = Signal(int, int)  # x, y coordinates for setting start point (MODE_SELECT)
    start_end_point = Signal(int, int)  # x, y for start_end mode
    delete_requested = Signal(int, int)  # x, y for delete mode
    manual_lateral_point = Signal(int, int)  # x, y for manual lateral mode
    angle_point = Signal(int, int)  # x, y for angle measurement mode
    crop_rect_changed = Signal(int, int, int, int)  # x1, y1, x2, y2 for crop rectangle
    zoom_changed = Signal(float)  # zoom level

    # Interaction modes
    MODE_SELECT = "select"  # Click to set start point, then press T to trace (old method)
    MODE_START_END = "start_end"  # Click start, then click end of root
    MODE_DELETE = "delete"  # Click to delete lateral
    MODE_MANUAL_LATERAL = "manual_lateral"  # Click start then end of lateral
    MODE_ANGLE_MEASURE = "angle_measure"  # Click 3 points to measure angle
    MODE_CROP_RECT = "crop_rect"  # Draw rectangle for clear outside
    MODE_PAN = "pan"  # Pan mode

    def __init__(self, parent=None):
        super().__init__(parent)

        self._scene = QGraphicsScene(self)
        self.setScene(self._scene)

        self._pixmap_item: Optional[QGraphicsPixmapItem] = None
        self._image: Optional[np.ndarray] = None
        self._zoom_level: float = 1.0
        self._min_zoom: float = 0.1
        self._max_zoom: float = 10.0

        # Interaction mode
        self._mode = self.MODE_SELECT

        # Tracing data to display - supports multiple roots
        self._roots: List[Dict] = []
        self._start_point: Optional[Tuple[int, int]] = None
        self._manual_lateral_start: Optional[Tuple[int, int]] = None
        self._start_end_first: Optional[Tuple[int, int]] = None  # First point for start_end mode

        # Highlight for selected/hovered items
        self._highlighted_lateral: Optional[Tuple[int, int]] = None
        self._highlighted_root: Optional[int] = None  # Root ID to highlight

        # Measurement data for tooltips (set from main window)
        self._root_measurements: Dict[int, Dict] = {}  # root_id -> {length, angle, laterals: [...]}
        self._pixels_per_unit: float = 161.0
        self._unit: str = "cm"

        # Hover state for angle visualization
        self._hovered_item: Optional[Dict] = None  # {type: 'root'/'lateral', root_id, lat_id, points, angle}

        # Angle measurement state
        self._angle_points: List[Tuple[int, int]] = []  # Points clicked for angle measurement
        self._angle_measurement: Optional[Dict] = None  # {angle: float, points: List}

        # Crop rectangle state (for clear outside)
        self._crop_rect: Optional[Tuple[int, int, int, int]] = None  # (x1, y1, x2, y2)
        self._crop_rect_dragging: bool = False
        self._crop_rect_drag_corner: Optional[str] = None  # 'tl', 'tr', 'bl', 'br', 'move'
        self._crop_rect_drag_start: Optional[Tuple[int, int]] = None

        # Colors for different roots
        self._root_colors = [
            (0, 255, 0),    # Green
            (0, 200, 255),  # Cyan
            (255, 0, 255),  # Magenta
            (255, 255, 0),  # Yellow
            (0, 255, 200),  # Teal
            (200, 100, 255), # Purple
        ]
        self._lateral_color = (255, 165, 0)  # Orange
        self._lateral_highlight_color = (255, 0, 0)  # Red
        self._start_point_color = (255, 0, 0)  # Red
        self._manual_point_color = (0, 100, 255)  # Blue
        self._start_end_color = (0, 255, 255)  # Cyan for start_end first point

        # Setup
        self.setRenderHint(QPainter.RenderHint.Antialiasing)
        self.setDragMode(QGraphicsView.DragMode.NoDrag)
        self.setTransformationAnchor(QGraphicsView.ViewportAnchor.AnchorUnderMouse)
        self.setResizeAnchor(QGraphicsView.ViewportAnchor.AnchorUnderMouse)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.setBackgroundBrush(QBrush(QColor(50, 50, 50)))
        self.setMouseTracking(True)

    def set_mode(self, mode: str):
        """Set the interaction mode."""
        self._mode = mode
        self._manual_lateral_start = None
        self._start_end_first = None
        self._angle_points = []
        self._angle_measurement = None

        if mode == self.MODE_PAN:
            self.setDragMode(QGraphicsView.DragMode.ScrollHandDrag)
            self.setCursor(Qt.CursorShape.OpenHandCursor)
        elif mode == self.MODE_DELETE:
            self.setDragMode(QGraphicsView.DragMode.NoDrag)
            self.setCursor(Qt.CursorShape.CrossCursor)
        else:
            self.setDragMode(QGraphicsView.DragMode.NoDrag)
            self.setCursor(Qt.CursorShape.CrossCursor)

        self._update_display()

    def get_mode(self) -> str:
        return self._mode

    def set_image(self, image: np.ndarray):
        """Set the image to display."""
        self._image = image.copy()
        self._update_display()

    def _update_display(self):
        """Update the displayed image with tracings."""
        if self._image is None:
            return

        img = self._image
        if img.dtype != np.uint8:
            img = ((img - img.min()) / (img.max() - img.min() + 1e-10) * 255).astype(np.uint8)

        height, width = img.shape[:2]

        if len(img.shape) == 2:
            rgb_img = np.stack([img, img, img], axis=2)
        else:
            rgb_img = img.copy()

        rgb_img = self._draw_tracings(rgb_img)

        bytes_per_line = 3 * width
        q_image = QImage(
            rgb_img.data,
            width,
            height,
            bytes_per_line,
            QImage.Format.Format_RGB888
        )

        pixmap = QPixmap.fromImage(q_image)
        self._scene.clear()
        self._pixmap_item = self._scene.addPixmap(pixmap)
        self._scene.setSceneRect(0, 0, width, height)

    def _draw_tracings(self, img: np.ndarray) -> np.ndarray:
        """Draw root tracings on the image."""
        result = img.copy()

        # Draw each root
        for i, root in enumerate(self._roots):
            root_id = root.get('id', i)
            color_idx = i % len(self._root_colors)
            root_color = self._root_colors[color_idx]

            # Check if this root is highlighted (selected in list)
            is_highlighted_root = (self._highlighted_root is not None and
                                   self._highlighted_root == root_id)

            # Use brighter color for highlighted root
            if is_highlighted_root:
                # Brighten the color for highlighted root
                root_color = (
                    min(255, root_color[0] + 100),
                    min(255, root_color[1] + 100),
                    min(255, root_color[2] + 100)
                )

            points = root.get('points', [])
            if len(points) > 1:
                # Draw thicker line for highlighted root
                for j in range(len(points) - 1):
                    x1, y1 = points[j]
                    x2, y2 = points[j + 1]
                    self._draw_line(result, x1, y1, x2, y2, root_color,
                                   thick=is_highlighted_root)

            laterals = root.get('laterals', [])
            for lat in laterals:
                lat_id = lat.get('id', 0)
                lat_points = lat.get('points', [])

                is_highlighted = (self._highlighted_lateral is not None and
                                 self._highlighted_lateral == (root_id, lat_id))
                color = self._lateral_highlight_color if is_highlighted else self._lateral_color

                if len(lat_points) > 1:
                    for j in range(len(lat_points) - 1):
                        x1, y1 = lat_points[j]
                        x2, y2 = lat_points[j + 1]
                        self._draw_line(result, x1, y1, x2, y2, color)

        # Draw start point (for MODE_SELECT)
        if self._start_point is not None:
            x, y = self._start_point
            self._draw_circle(result, x, y, 5, self._start_point_color)

        # Draw start_end first point
        if self._start_end_first is not None:
            x, y = self._start_end_first
            self._draw_circle(result, x, y, 6, self._start_end_color)

        # Draw manual lateral start point
        if self._manual_lateral_start is not None:
            x, y = self._manual_lateral_start
            self._draw_circle(result, x, y, 5, self._manual_point_color)

        # Draw angle visualization for hovered item
        if self._hovered_item is not None:
            self._draw_angle_visualization(result, self._hovered_item)

        # Draw angle measurement points
        if self._angle_points:
            angle_point_color = (255, 255, 0)  # Yellow
            vertex_color = (255, 0, 255)  # Magenta for vertex (2nd point)
            for i, (ax, ay) in enumerate(self._angle_points):
                color = vertex_color if i == 1 else angle_point_color
                self._draw_circle(result, ax, ay, 6, color)
                # Draw labels
                if i == 0:
                    self._draw_text_marker(result, ax - 10, ay - 10, "A", angle_point_color)
                elif i == 1:
                    self._draw_text_marker(result, ax - 10, ay - 10, "B", vertex_color)
                elif i == 2:
                    self._draw_text_marker(result, ax - 10, ay - 10, "C", angle_point_color)

            # Draw lines connecting points
            if len(self._angle_points) >= 2:
                p1, p2 = self._angle_points[0], self._angle_points[1]
                self._draw_line(result, p1[0], p1[1], p2[0], p2[1], angle_point_color)
            if len(self._angle_points) >= 3:
                p2, p3 = self._angle_points[1], self._angle_points[2]
                self._draw_line(result, p2[0], p2[1], p3[0], p3[1], angle_point_color)

        # Draw completed angle measurement
        if self._angle_measurement is not None:
            self._draw_angle_measurement(result, self._angle_measurement)

        # Draw crop rectangle
        if self._crop_rect is not None:
            self._draw_crop_rect(result, self._crop_rect)

        return result

    def _draw_line(self, img: np.ndarray, x1: int, y1: int, x2: int, y2: int,
                   color: Tuple[int, int, int], thick: bool = False):
        """Draw a line using Bresenham's algorithm."""
        height, width = img.shape[:2]
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx - dy

        # Thicker line for highlighted root
        radius = 2 if thick else 1

        x, y = x1, y1
        while True:
            for ox in range(-radius, radius + 1):
                for oy in range(-radius, radius + 1):
                    px, py = x + ox, y + oy
                    if 0 <= px < width and 0 <= py < height:
                        img[py, px] = color

            if x == x2 and y == y2:
                break

            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy

    def _draw_circle(self, img: np.ndarray, cx: int, cy: int, radius: int,
                     color: Tuple[int, int, int]):
        """Draw a filled circle."""
        height, width = img.shape[:2]
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if 0 <= x < width and 0 <= y < height:
                    if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                        img[y, x] = color

    def _draw_angle_visualization(self, img: np.ndarray, item: Dict):
        """Draw a protractor-like visualization showing the angle measurement."""
        import math

        item_type = item.get('type')
        points = item.get('points', [])
        angle = item.get('angle', 0)

        if not points or len(points) < 2:
            return

        height, width = img.shape[:2]

        if item_type == 'root':
            # For main root: show angle from vertical at the tip (end point)
            # Use last point as center
            cx, cy = points[-1]

            # Reference line: vertical (downward)
            ref_angle = 90  # degrees, pointing down in screen coords

            # Draw protractor arc
            arc_radius = 30
            arc_color = (255, 255, 0)  # Yellow

            # Draw vertical reference line (dotted)
            for i in range(0, 40, 4):
                px = cx
                py = cy - i
                if 0 <= px < width and 0 <= py < height:
                    self._draw_circle(img, px, py, 1, (200, 200, 200))

            # Draw arc from vertical to root direction
            start_angle_rad = math.radians(90)  # Start from vertical (pointing down)
            end_angle_rad = math.radians(90 + angle)  # Root direction

            # Draw arc
            num_points = 30
            for i in range(num_points + 1):
                t = i / num_points
                a = start_angle_rad + t * (end_angle_rad - start_angle_rad)
                x = int(cx + arc_radius * math.cos(a))
                y = int(cy - arc_radius * math.sin(a))  # Negative because y increases downward
                if 0 <= x < width and 0 <= y < height:
                    self._draw_circle(img, x, y, 1, arc_color)

            # Draw root direction line
            end_x = int(cx + 40 * math.sin(math.radians(angle)))
            end_y = int(cy + 40 * math.cos(math.radians(angle)))
            if 0 <= end_x < width and 0 <= end_y < height:
                self._draw_line(img, cx, cy, end_x, end_y, arc_color)

        elif item_type == 'lateral':
            # For lateral: show angle from main root at branch point
            # Use first point (branch point) as center
            cx, cy = points[0]

            main_root_points = item.get('main_root_points', [])
            branch_idx = item.get('branch_idx', 0)

            if not main_root_points or branch_idx >= len(main_root_points):
                return

            # Get main root direction at branch point
            if branch_idx < len(main_root_points) - 1:
                main_dx = main_root_points[branch_idx + 1][0] - main_root_points[branch_idx][0]
                main_dy = main_root_points[branch_idx + 1][1] - main_root_points[branch_idx][1]
            elif branch_idx > 0:
                main_dx = main_root_points[branch_idx][0] - main_root_points[branch_idx - 1][0]
                main_dy = main_root_points[branch_idx][1] - main_root_points[branch_idx - 1][1]
            else:
                return

            main_angle = math.degrees(math.atan2(main_dy, main_dx))

            # Get lateral direction
            if len(points) >= 2:
                lat_dx = points[1][0] - points[0][0]
                lat_dy = points[1][1] - points[0][1]
                lat_angle = math.degrees(math.atan2(lat_dy, lat_dx))
            else:
                return

            # Draw arc
            arc_radius = 25
            arc_color = (255, 165, 0)  # Orange

            # Draw main root direction line
            main_end_x = int(cx + 35 * math.cos(math.radians(main_angle)))
            main_end_y = int(cy + 35 * math.sin(math.radians(main_angle)))
            if 0 <= main_end_x < width and 0 <= main_end_y < height:
                self._draw_line(img, cx, cy, main_end_x, main_end_y, (180, 180, 180))

            # Draw arc from main root to lateral
            num_points = 20
            for i in range(num_points + 1):
                t = i / num_points
                a = math.radians(main_angle + t * (lat_angle - main_angle))
                x = int(cx + arc_radius * math.cos(a))
                y = int(cy + arc_radius * math.sin(a))
                if 0 <= x < width and 0 <= y < height:
                    self._draw_circle(img, x, y, 1, arc_color)

            # Draw lateral direction line
            lat_end_x = int(cx + 35 * math.cos(math.radians(lat_angle)))
            lat_end_y = int(cy + 35 * math.sin(math.radians(lat_angle)))
            if 0 <= lat_end_x < width and 0 <= lat_end_y < height:
                self._draw_line(img, cx, cy, lat_end_x, lat_end_y, arc_color)

    def _draw_text_marker(self, img: np.ndarray, x: int, y: int, text: str,
                          color: Tuple[int, int, int]):
        """Draw a simple text marker (just a filled square with letter indication)."""
        height, width = img.shape[:2]
        # Draw a small filled square as a marker
        size = 8
        for dy in range(-size // 2, size // 2 + 1):
            for dx in range(-size // 2, size // 2 + 1):
                px, py = x + dx, y + dy
                if 0 <= px < width and 0 <= py < height:
                    # Create a simple letter pattern
                    if text == "A":
                        # Simple 'A' pattern
                        if (abs(dx) == size // 2 and dy > -size // 2) or (dy == -size // 2 and abs(dx) < size // 2) or (dy == 0 and abs(dx) < size // 2):
                            img[py, px] = color
                    elif text == "B":
                        # Simple 'B' pattern
                        if dx == -size // 2 or (abs(dy) == size // 2 and dx < size // 3) or (dy == 0 and dx < size // 3):
                            img[py, px] = color
                    elif text == "C":
                        # Simple 'C' pattern
                        if dx == -size // 2 or (abs(dy) == size // 2 and dx < 0):
                            img[py, px] = color

    def _draw_angle_measurement(self, img: np.ndarray, measurement: Dict):
        """Draw the completed angle measurement visualization."""
        import math

        points = measurement.get('points', [])
        angle = measurement.get('angle', 0)

        if len(points) != 3:
            return

        height, width = img.shape[:2]
        p1, p2, p3 = points  # A, B (vertex), C

        # Colors
        line_color = (0, 255, 255)  # Cyan
        arc_color = (255, 255, 0)  # Yellow
        vertex_color = (255, 0, 255)  # Magenta

        # Draw lines BA and BC
        self._draw_line(img, p2[0], p2[1], p1[0], p1[1], line_color)
        self._draw_line(img, p2[0], p2[1], p3[0], p3[1], line_color)

        # Draw points
        self._draw_circle(img, p1[0], p1[1], 5, line_color)
        self._draw_circle(img, p2[0], p2[1], 7, vertex_color)  # Larger vertex
        self._draw_circle(img, p3[0], p3[1], 5, line_color)

        # Draw arc at vertex to show angle
        bx, by = p2
        ax, ay = p1
        cx, cy = p3

        # Calculate angles of BA and BC from B
        angle_ba = math.atan2(ay - by, ax - bx)
        angle_bc = math.atan2(cy - by, cx - bx)

        # Draw arc from BA to BC
        arc_radius = 30
        num_points = 30

        # Ensure we draw the shorter arc
        start_angle = angle_ba
        end_angle = angle_bc

        # Normalize angle difference
        diff = end_angle - start_angle
        while diff > math.pi:
            diff -= 2 * math.pi
        while diff < -math.pi:
            diff += 2 * math.pi

        for i in range(num_points + 1):
            t = i / num_points
            a = start_angle + t * diff
            x = int(bx + arc_radius * math.cos(a))
            y = int(by + arc_radius * math.sin(a))
            if 0 <= x < width and 0 <= y < height:
                self._draw_circle(img, x, y, 1, arc_color)

    def _draw_crop_rect(self, img: np.ndarray, rect: Tuple[int, int, int, int]):
        """Draw the crop rectangle with handles for resizing."""
        x1, y1, x2, y2 = rect
        height, width = img.shape[:2]

        # Ensure coordinates are valid
        x1, x2 = min(x1, x2), max(x1, x2)
        y1, y2 = min(y1, y2), max(y1, y2)

        rect_color = (0, 255, 255)  # Cyan
        handle_color = (255, 0, 255)  # Magenta
        outside_color = (100, 100, 100)  # Gray overlay for outside

        # Draw semi-transparent overlay outside rectangle
        # Top region
        for y in range(0, min(y1, height)):
            for x in range(width):
                img[y, x] = tuple(int(c * 0.5) for c in img[y, x])
        # Bottom region
        for y in range(max(y2, 0), height):
            for x in range(width):
                img[y, x] = tuple(int(c * 0.5) for c in img[y, x])
        # Left region (between top and bottom)
        for y in range(max(y1, 0), min(y2, height)):
            for x in range(0, min(x1, width)):
                img[y, x] = tuple(int(c * 0.5) for c in img[y, x])
        # Right region (between top and bottom)
        for y in range(max(y1, 0), min(y2, height)):
            for x in range(max(x2, 0), width):
                img[y, x] = tuple(int(c * 0.5) for c in img[y, x])

        # Draw rectangle border
        # Top edge
        for x in range(max(0, x1), min(width, x2)):
            if 0 <= y1 < height:
                img[y1, x] = rect_color
            if 0 <= y2 - 1 < height:
                img[y2 - 1, x] = rect_color
        # Left and right edges
        for y in range(max(0, y1), min(height, y2)):
            if 0 <= x1 < width:
                img[y, x1] = rect_color
            if 0 <= x2 - 1 < width:
                img[y, x2 - 1] = rect_color

        # Draw corner handles
        handle_size = 8
        corners = [(x1, y1), (x2, y1), (x1, y2), (x2, y2)]
        for cx, cy in corners:
            for dy in range(-handle_size // 2, handle_size // 2 + 1):
                for dx in range(-handle_size // 2, handle_size // 2 + 1):
                    px, py = cx + dx, cy + dy
                    if 0 <= px < width and 0 <= py < height:
                        img[py, px] = handle_color

    def set_roots(self, roots: List[Dict]):
        """Set all root data to display."""
        self._roots = roots
        self._update_display()

    def set_start_point(self, point: Optional[Tuple[int, int]]):
        """Set start point for MODE_SELECT."""
        self._start_point = point
        self._update_display()

    def set_start_end_first(self, point: Optional[Tuple[int, int]]):
        """Set first point for MODE_START_END."""
        self._start_end_first = point
        self._update_display()

    def set_manual_lateral_start(self, point: Optional[Tuple[int, int]]):
        self._manual_lateral_start = point
        self._update_display()

    def set_highlighted_lateral(self, root_id: Optional[int], lateral_id: Optional[int]):
        if root_id is not None and lateral_id is not None:
            self._highlighted_lateral = (root_id, lateral_id)
        else:
            self._highlighted_lateral = None
        self._update_display()

    def set_highlighted_root(self, root_id: Optional[int]):
        """Set which root is highlighted (selected in list)."""
        self._highlighted_root = root_id
        self._update_display()

    def set_angle_points(self, points: List[Tuple[int, int]]):
        """Set the points for angle measurement."""
        self._angle_points = points.copy() if points else []
        self._update_display()

    def set_angle_measurement(self, angle: float, points: List[Tuple[int, int]]):
        """Set the completed angle measurement to display."""
        self._angle_measurement = {
            'angle': angle,
            'points': points.copy()
        }
        self._update_display()

    def set_crop_rect(self, rect: Optional[Tuple[int, int, int, int]]):
        """Set the crop rectangle (x1, y1, x2, y2)."""
        self._crop_rect = rect
        self._update_display()

    def get_crop_rect(self) -> Optional[Tuple[int, int, int, int]]:
        """Get the current crop rectangle."""
        return self._crop_rect

    def set_measurements(self, measurements: Dict[int, Dict], pixels_per_unit: float, unit: str):
        """Set measurement data for tooltips."""
        self._root_measurements = measurements
        self._pixels_per_unit = pixels_per_unit
        self._unit = unit

    def clear_tracings(self):
        """Clear all tracing overlays."""
        self._roots = []
        self._start_point = None
        self._manual_lateral_start = None
        self._highlighted_lateral = None
        self._start_end_first = None
        self._angle_points = []
        self._angle_measurement = None
        self._update_display()

    def wheelEvent(self, event):
        """Handle mouse wheel for zooming."""
        factor = 1.15

        if event.angleDelta().y() > 0:
            new_zoom = self._zoom_level * factor
            if new_zoom <= self._max_zoom:
                self._zoom_level = new_zoom
                self.scale(factor, factor)
        else:
            new_zoom = self._zoom_level / factor
            if new_zoom >= self._min_zoom:
                self._zoom_level = new_zoom
                self.scale(1 / factor, 1 / factor)

        self.zoom_changed.emit(self._zoom_level)

    def mousePressEvent(self, event):
        """Handle mouse press."""
        if event.button() == Qt.MouseButton.LeftButton:
            scene_pos = self.mapToScene(event.pos())
            x, y = int(scene_pos.x()), int(scene_pos.y())

            if self._image is not None:
                height, width = self._image.shape[:2]
                if 0 <= x < width and 0 <= y < height:
                    if self._mode == self.MODE_SELECT:
                        # Old method: click to set start point
                        self.point_clicked.emit(x, y)
                        return
                    elif self._mode == self.MODE_START_END:
                        # New method: click start, then click end
                        self.start_end_point.emit(x, y)
                        return
                    elif self._mode == self.MODE_DELETE:
                        self.delete_requested.emit(x, y)
                        return
                    elif self._mode == self.MODE_MANUAL_LATERAL:
                        self.manual_lateral_point.emit(x, y)
                        return
                    elif self._mode == self.MODE_ANGLE_MEASURE:
                        self.angle_point.emit(x, y)
                        return
                    elif self._mode == self.MODE_CROP_RECT:
                        # Check if clicking on a corner handle
                        corner = self._get_crop_rect_corner(x, y)
                        if corner:
                            self._crop_rect_dragging = True
                            self._crop_rect_drag_corner = corner
                            self._crop_rect_drag_start = (x, y)
                        else:
                            # Start new rectangle
                            self._crop_rect = (x, y, x, y)
                            self._crop_rect_dragging = True
                            self._crop_rect_drag_corner = 'br'  # Bottom-right
                            self._crop_rect_drag_start = (x, y)
                            self._update_display()
                        return

        if event.button() == Qt.MouseButton.MiddleButton:
            self.setDragMode(QGraphicsView.DragMode.ScrollHandDrag)

        super().mousePressEvent(event)

    def mouseReleaseEvent(self, event):
        """Handle mouse release."""
        if event.button() == Qt.MouseButton.LeftButton:
            if self._crop_rect_dragging:
                self._crop_rect_dragging = False
                self._crop_rect_drag_corner = None
                self._crop_rect_drag_start = None
                # Emit the final rectangle
                if self._crop_rect:
                    x1, y1, x2, y2 = self._crop_rect
                    # Normalize coordinates
                    x1, x2 = min(x1, x2), max(x1, x2)
                    y1, y2 = min(y1, y2), max(y1, y2)
                    self._crop_rect = (x1, y1, x2, y2)
                    self.crop_rect_changed.emit(x1, y1, x2, y2)

        if event.button() == Qt.MouseButton.MiddleButton:
            if self._mode != self.MODE_PAN:
                self.setDragMode(QGraphicsView.DragMode.NoDrag)

        super().mouseReleaseEvent(event)

    def _get_crop_rect_corner(self, x: int, y: int, tolerance: int = 15) -> Optional[str]:
        """Check if position is near a crop rectangle corner."""
        if self._crop_rect is None:
            return None

        x1, y1, x2, y2 = self._crop_rect
        x1, x2 = min(x1, x2), max(x1, x2)
        y1, y2 = min(y1, y2), max(y1, y2)

        # Check corners
        if abs(x - x1) < tolerance and abs(y - y1) < tolerance:
            return 'tl'
        if abs(x - x2) < tolerance and abs(y - y1) < tolerance:
            return 'tr'
        if abs(x - x1) < tolerance and abs(y - y2) < tolerance:
            return 'bl'
        if abs(x - x2) < tolerance and abs(y - y2) < tolerance:
            return 'br'
        # Check if inside rectangle (for moving)
        if x1 < x < x2 and y1 < y < y2:
            return 'move'

        return None

    def mouseMoveEvent(self, event):
        """Handle mouse move."""
        scene_pos = self.mapToScene(event.pos())
        x, y = int(scene_pos.x()), int(scene_pos.y())

        # Handle crop rectangle dragging
        if self._crop_rect_dragging and self._crop_rect is not None:
            x1, y1, x2, y2 = self._crop_rect
            corner = self._crop_rect_drag_corner

            if corner == 'tl':
                self._crop_rect = (x, y, x2, y2)
            elif corner == 'tr':
                self._crop_rect = (x1, y, x, y2)
            elif corner == 'bl':
                self._crop_rect = (x, y1, x2, y)
            elif corner == 'br':
                self._crop_rect = (x1, y1, x, y)
            elif corner == 'move' and self._crop_rect_drag_start:
                # Move entire rectangle
                dx = x - self._crop_rect_drag_start[0]
                dy = y - self._crop_rect_drag_start[1]
                self._crop_rect = (x1 + dx, y1 + dy, x2 + dx, y2 + dy)
                self._crop_rect_drag_start = (x, y)

            self._update_display()
            return

        # Update cursor for crop mode
        if self._mode == self.MODE_CROP_RECT and self._image is not None:
            corner = self._get_crop_rect_corner(x, y)
            if corner in ('tl', 'br'):
                self.setCursor(Qt.CursorShape.SizeFDiagCursor)
            elif corner in ('tr', 'bl'):
                self.setCursor(Qt.CursorShape.SizeBDiagCursor)
            elif corner == 'move':
                self.setCursor(Qt.CursorShape.SizeAllCursor)
            else:
                self.setCursor(Qt.CursorShape.CrossCursor)

        if self._mode == self.MODE_DELETE and self._image is not None:
            found = self._find_lateral_near(x, y)
            if found != self._highlighted_lateral:
                self._highlighted_lateral = found
                self._update_display()

        # Show tooltip and angle visualization when hovering over roots or laterals
        if self._image is not None and self._root_measurements:
            tooltip, hovered_item = self._get_tooltip_and_hover_data(x, y)
            if tooltip:
                QToolTip.showText(event.globalPosition().toPoint(), tooltip, self)
                if hovered_item != self._hovered_item:
                    self._hovered_item = hovered_item
                    self._update_display()
            else:
                QToolTip.hideText()
                if self._hovered_item is not None:
                    self._hovered_item = None
                    self._update_display()

        super().mouseMoveEvent(event)

    def _get_tooltip_and_hover_data(self, x: int, y: int, tolerance: int = 8) -> Tuple[Optional[str], Optional[Dict]]:
        """Get tooltip text and hover data for item at position."""
        # Check laterals first (smaller, on top)
        for root in self._roots:
            root_id = root.get('id', 0)
            main_points = root.get('points', [])
            for lat in root.get('laterals', []):
                lat_id = lat.get('id', 0)
                lat_points = lat.get('points', [])
                for px, py in lat_points:
                    if abs(px - x) <= tolerance and abs(py - y) <= tolerance:
                        # Found lateral
                        tooltip = f"Lateral {lat_id}"
                        hover_data = None

                        if root_id in self._root_measurements:
                            lat_data = self._root_measurements[root_id].get('laterals', {})
                            if lat_id in lat_data:
                                data = lat_data[lat_id]
                                tooltip = (f"Lateral {lat_id}\n"
                                          f"Length: {data.get('length', 0):.3f} {self._unit}\n"
                                          f"Angle: {data.get('angle', 0):.1f}°")

                                # Create hover data for visualization
                                hover_data = {
                                    'type': 'lateral',
                                    'root_id': root_id,
                                    'lat_id': lat_id,
                                    'points': lat_points,
                                    'angle': data.get('angle', 0),
                                    'main_root_points': main_points,
                                    'branch_idx': lat.get('start_index', 0)
                                }

                        return tooltip, hover_data

        # Check main roots
        for root in self._roots:
            root_id = root.get('id', 0)
            root_points = root.get('points', [])
            for px, py in root_points:
                if abs(px - x) <= tolerance and abs(py - y) <= tolerance:
                    # Found main root
                    tooltip = f"Root {root_id}"
                    hover_data = None

                    if root_id in self._root_measurements:
                        data = self._root_measurements[root_id]
                        tooltip = (f"Root {root_id}\n"
                                  f"Length: {data.get('length', 0):.3f} {self._unit}\n"
                                  f"Angle: {data.get('angle', 0):.1f}°\n"
                                  f"Laterals: {data.get('lat_count', 0)}")

                        # Create hover data for visualization
                        hover_data = {
                            'type': 'root',
                            'root_id': root_id,
                            'points': root_points,
                            'angle': data.get('angle', 0)
                        }

                    return tooltip, hover_data

        return None, None

    def _find_lateral_near(self, x: int, y: int, tolerance: int = 10) -> Optional[Tuple[int, int]]:
        """Find lateral near a point."""
        for root in self._roots:
            root_id = root.get('id', 0)
            for lat in root.get('laterals', []):
                lat_id = lat.get('id', 0)
                for px, py in lat.get('points', []):
                    if abs(px - x) <= tolerance and abs(py - y) <= tolerance:
                        return (root_id, lat_id)
        return None

    def fit_to_view(self):
        if self._pixmap_item is not None:
            self.fitInView(self._pixmap_item, Qt.AspectRatioMode.KeepAspectRatio)
            transform = self.transform()
            self._zoom_level = transform.m11()
            self.zoom_changed.emit(self._zoom_level)

    def reset_zoom(self):
        self.resetTransform()
        self._zoom_level = 1.0
        self.zoom_changed.emit(self._zoom_level)

    def get_zoom_level(self) -> float:
        return self._zoom_level
