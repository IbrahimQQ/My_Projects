"""
Image canvas widget for displaying and interacting with root images.
"""

import numpy as np
from typing import Optional, List, Tuple, Dict, Callable
from PySide6.QtWidgets import QGraphicsView, QGraphicsScene, QGraphicsPixmapItem
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
    zoom_changed = Signal(float)  # zoom level

    # Interaction modes
    MODE_SELECT = "select"  # Click to set start point, then press T to trace (old method)
    MODE_START_END = "start_end"  # Click start, then click end of root
    MODE_DELETE = "delete"  # Click to delete lateral
    MODE_MANUAL_LATERAL = "manual_lateral"  # Click start then end of lateral
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

            points = root.get('points', [])
            if len(points) > 1:
                for j in range(len(points) - 1):
                    x1, y1 = points[j]
                    x2, y2 = points[j + 1]
                    self._draw_line(result, x1, y1, x2, y2, root_color)

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

        return result

    def _draw_line(self, img: np.ndarray, x1: int, y1: int, x2: int, y2: int,
                   color: Tuple[int, int, int]):
        """Draw a line using Bresenham's algorithm."""
        height, width = img.shape[:2]
        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx - dy

        x, y = x1, y1
        while True:
            for ox in range(-1, 2):
                for oy in range(-1, 2):
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

    def clear_tracings(self):
        """Clear all tracing overlays."""
        self._roots = []
        self._start_point = None
        self._manual_lateral_start = None
        self._highlighted_lateral = None
        self._start_end_first = None
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

        if event.button() == Qt.MouseButton.MiddleButton:
            self.setDragMode(QGraphicsView.DragMode.ScrollHandDrag)

        super().mousePressEvent(event)

    def mouseReleaseEvent(self, event):
        """Handle mouse release."""
        if event.button() == Qt.MouseButton.MiddleButton:
            if self._mode != self.MODE_PAN:
                self.setDragMode(QGraphicsView.DragMode.NoDrag)

        super().mouseReleaseEvent(event)

    def mouseMoveEvent(self, event):
        """Handle mouse move."""
        scene_pos = self.mapToScene(event.pos())
        x, y = int(scene_pos.x()), int(scene_pos.y())

        if self._mode == self.MODE_DELETE and self._image is not None:
            found = self._find_lateral_near(x, y)
            if found != self._highlighted_lateral:
                self._highlighted_lateral = found
                self._update_display()

        super().mouseMoveEvent(event)

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
