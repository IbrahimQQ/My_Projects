"""
Image canvas widget for displaying and interacting with root images.
"""

import numpy as np
from typing import Optional, List, Tuple, Dict, Callable
from PySide6.QtWidgets import QGraphicsView, QGraphicsScene, QGraphicsPixmapItem
from PySide6.QtCore import Qt, Signal, QPointF
from PySide6.QtGui import QImage, QPixmap, QPainter, QPen, QColor, QBrush


class ImageCanvas(QGraphicsView):
    """
    Custom canvas for displaying images and root tracings.
    Supports zoom, pan, and click interactions.
    """

    # Signals
    point_clicked = Signal(int, int)  # x, y coordinates
    zoom_changed = Signal(float)  # zoom level

    def __init__(self, parent=None):
        super().__init__(parent)

        self._scene = QGraphicsScene(self)
        self.setScene(self._scene)

        self._pixmap_item: Optional[QGraphicsPixmapItem] = None
        self._image: Optional[np.ndarray] = None
        self._zoom_level: float = 1.0
        self._min_zoom: float = 0.1
        self._max_zoom: float = 10.0

        # Tracing data to display
        self._main_root_points: List[Tuple[int, int]] = []
        self._lateral_roots: List[Dict] = []
        self._start_point: Optional[Tuple[int, int]] = None

        # Display settings
        self._main_root_color = QColor(0, 255, 0)  # Green
        self._lateral_color = QColor(255, 165, 0)  # Orange
        self._start_point_color = QColor(255, 0, 0)  # Red
        self._line_width = 2

        # Setup
        self.setRenderHint(QPainter.RenderHint.Antialiasing)
        self.setDragMode(QGraphicsView.DragMode.ScrollHandDrag)
        self.setTransformationAnchor(QGraphicsView.ViewportAnchor.AnchorUnderMouse)
        self.setResizeAnchor(QGraphicsView.ViewportAnchor.AnchorUnderMouse)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.setBackgroundBrush(QBrush(QColor(50, 50, 50)))

    def set_image(self, image: np.ndarray):
        """Set the image to display."""
        self._image = image.copy()
        self._update_display()

    def _update_display(self):
        """Update the displayed image with tracings."""
        if self._image is None:
            return

        # Create QImage from numpy array
        img = self._image
        if img.dtype != np.uint8:
            img = ((img - img.min()) / (img.max() - img.min() + 1e-10) * 255).astype(np.uint8)

        height, width = img.shape[:2]

        # Convert grayscale to RGB for colored overlays
        if len(img.shape) == 2:
            rgb_img = np.stack([img, img, img], axis=2)
        else:
            rgb_img = img.copy()

        # Draw tracings on the image
        rgb_img = self._draw_tracings(rgb_img)

        # Create QImage
        bytes_per_line = 3 * width
        q_image = QImage(
            rgb_img.data,
            width,
            height,
            bytes_per_line,
            QImage.Format.Format_RGB888
        )

        # Create pixmap and add to scene
        pixmap = QPixmap.fromImage(q_image)

        self._scene.clear()
        self._pixmap_item = self._scene.addPixmap(pixmap)
        self._scene.setSceneRect(0, 0, width, height)

    def _draw_tracings(self, img: np.ndarray) -> np.ndarray:
        """Draw root tracings on the image."""
        result = img.copy()

        # Draw main root
        if len(self._main_root_points) > 1:
            for i in range(len(self._main_root_points) - 1):
                x1, y1 = self._main_root_points[i]
                x2, y2 = self._main_root_points[i + 1]
                self._draw_line(result, x1, y1, x2, y2, (0, 255, 0))

        # Draw lateral roots
        for lateral in self._lateral_roots:
            points = lateral.get('points', [])
            if len(points) > 1:
                for i in range(len(points) - 1):
                    x1, y1 = points[i]
                    x2, y2 = points[i + 1]
                    self._draw_line(result, x1, y1, x2, y2, (255, 165, 0))

        # Draw start point
        if self._start_point is not None:
            x, y = self._start_point
            self._draw_circle(result, x, y, 5, (255, 0, 0))

        return result

    def _draw_line(self, img: np.ndarray, x1: int, y1: int, x2: int, y2: int,
                   color: Tuple[int, int, int]):
        """Draw a line on the image using Bresenham's algorithm."""
        height, width = img.shape[:2]

        dx = abs(x2 - x1)
        dy = abs(y2 - y1)
        sx = 1 if x1 < x2 else -1
        sy = 1 if y1 < y2 else -1
        err = dx - dy

        x, y = x1, y1
        while True:
            # Draw thick line
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
        """Draw a filled circle on the image."""
        height, width = img.shape[:2]
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if 0 <= x < width and 0 <= y < height:
                    if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                        img[y, x] = color

    def set_main_root(self, points: List[Tuple[int, int]]):
        """Set the main root points to display."""
        self._main_root_points = points
        self._update_display()

    def set_lateral_roots(self, laterals: List[Dict]):
        """Set the lateral roots to display."""
        self._lateral_roots = laterals
        self._update_display()

    def set_start_point(self, point: Optional[Tuple[int, int]]):
        """Set the start point marker."""
        self._start_point = point
        self._update_display()

    def clear_tracings(self):
        """Clear all tracing overlays."""
        self._main_root_points = []
        self._lateral_roots = []
        self._start_point = None
        self._update_display()

    def wheelEvent(self, event):
        """Handle mouse wheel for zooming."""
        # Zoom factor
        factor = 1.15

        if event.angleDelta().y() > 0:
            # Zoom in
            new_zoom = self._zoom_level * factor
            if new_zoom <= self._max_zoom:
                self._zoom_level = new_zoom
                self.scale(factor, factor)
        else:
            # Zoom out
            new_zoom = self._zoom_level / factor
            if new_zoom >= self._min_zoom:
                self._zoom_level = new_zoom
                self.scale(1 / factor, 1 / factor)

        self.zoom_changed.emit(self._zoom_level)

    def mousePressEvent(self, event):
        """Handle mouse press for point selection."""
        if event.button() == Qt.MouseButton.LeftButton:
            if event.modifiers() & Qt.KeyboardModifier.ControlModifier:
                # Ctrl+Click to select point
                scene_pos = self.mapToScene(event.pos())
                x, y = int(scene_pos.x()), int(scene_pos.y())

                if self._image is not None:
                    height, width = self._image.shape[:2]
                    if 0 <= x < width and 0 <= y < height:
                        self.point_clicked.emit(x, y)
                return

        super().mousePressEvent(event)

    def fit_to_view(self):
        """Fit the image to the view."""
        if self._pixmap_item is not None:
            self.fitInView(self._pixmap_item, Qt.AspectRatioMode.KeepAspectRatio)
            # Calculate actual zoom level
            transform = self.transform()
            self._zoom_level = transform.m11()
            self.zoom_changed.emit(self._zoom_level)

    def reset_zoom(self):
        """Reset zoom to 100%."""
        self.resetTransform()
        self._zoom_level = 1.0
        self.zoom_changed.emit(self._zoom_level)

    def get_zoom_level(self) -> float:
        """Get current zoom level."""
        return self._zoom_level
