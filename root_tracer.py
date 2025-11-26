#!/usr/bin/env python3
"""
Root Tracing Tool for Arabidopsis Images

A comprehensive tool for tracing and measuring root systems in plant images.
Features:
- Main root and lateral root tracing
- Real-time measurement updates
- Tip-based angle measurement (vertex at curvature start)
- Manual 3-point angle measurement
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
import math
import json
from datetime import datetime
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass, field
from enum import Enum, auto


class Mode(Enum):
    """Tool operation modes"""
    SELECT = auto()
    TRACE_MAIN = auto()
    TRACE_LATERAL = auto()
    MANUAL_ANGLE = auto()
    DELETE = auto()


@dataclass
class Point:
    """Represents a 2D point"""
    x: float
    y: float

    def distance_to(self, other: 'Point') -> float:
        """Calculate Euclidean distance to another point"""
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)

    def to_tuple(self) -> Tuple[float, float]:
        return (self.x, self.y)


@dataclass
class Root:
    """Represents a traced root"""
    id: int
    points: List[Point] = field(default_factory=list)
    is_main: bool = True
    parent_id: Optional[int] = None  # For laterals, ID of parent root
    branch_point_idx: Optional[int] = None  # Index on parent where this branches
    canvas_ids: List[int] = field(default_factory=list)  # Canvas item IDs for drawing
    point_marker_ids: List[int] = field(default_factory=list)

    def get_length(self) -> float:
        """Calculate total length of root"""
        if len(self.points) < 2:
            return 0.0
        total = 0.0
        for i in range(len(self.points) - 1):
            total += self.points[i].distance_to(self.points[i + 1])
        return total

    def get_tip(self) -> Optional[Point]:
        """Get the tip (last point) of the root"""
        return self.points[-1] if self.points else None

    def get_base(self) -> Optional[Point]:
        """Get the base (first point) of the root"""
        return self.points[0] if self.points else None


@dataclass
class ManualAngle:
    """Represents a manual 3-point angle measurement"""
    id: int
    point_a: Point  # First point
    point_b: Point  # Vertex (second point clicked)
    point_c: Point  # Third point
    canvas_ids: List[int] = field(default_factory=list)

    def get_angle(self) -> float:
        """
        Calculate angle at vertex B (second point) in degrees.
        Returns angle ABC where B is the vertex.
        """
        # Vectors from B to A and B to C
        ba_x = self.point_a.x - self.point_b.x
        ba_y = self.point_a.y - self.point_b.y
        bc_x = self.point_c.x - self.point_b.x
        bc_y = self.point_c.y - self.point_b.y

        # Calculate angle using dot product
        dot = ba_x * bc_x + ba_y * bc_y
        mag_ba = math.sqrt(ba_x ** 2 + ba_y ** 2)
        mag_bc = math.sqrt(bc_x ** 2 + bc_y ** 2)

        if mag_ba == 0 or mag_bc == 0:
            return 0.0

        cos_angle = dot / (mag_ba * mag_bc)
        # Clamp to avoid numerical errors
        cos_angle = max(-1.0, min(1.0, cos_angle))
        angle_rad = math.acos(cos_angle)
        return math.degrees(angle_rad)


class MeasurementPanel(ttk.Frame):
    """Panel displaying real-time measurements"""

    def __init__(self, parent):
        super().__init__(parent)
        self.setup_ui()

    def setup_ui(self):
        # Title
        title = ttk.Label(self, text="Measurements", font=('Helvetica', 12, 'bold'))
        title.pack(pady=(5, 10))

        # Main root measurements frame
        main_frame = ttk.LabelFrame(self, text="Main Root")
        main_frame.pack(fill=tk.X, padx=5, pady=5)

        self.main_length_var = tk.StringVar(value="Length: -- px")
        self.main_angle_var = tk.StringVar(value="Tip Angle: -- deg")

        ttk.Label(main_frame, textvariable=self.main_length_var).pack(anchor=tk.W, padx=5)
        ttk.Label(main_frame, textvariable=self.main_angle_var).pack(anchor=tk.W, padx=5)

        # Lateral roots measurements frame
        lateral_frame = ttk.LabelFrame(self, text="Lateral Roots")
        lateral_frame.pack(fill=tk.X, padx=5, pady=5)

        self.lateral_count_var = tk.StringVar(value="Count: 0")
        self.lateral_total_var = tk.StringVar(value="Total Length: -- px")
        self.lateral_avg_var = tk.StringVar(value="Avg Length: -- px")
        self.lateral_density_var = tk.StringVar(value="Density: -- /px")

        ttk.Label(lateral_frame, textvariable=self.lateral_count_var).pack(anchor=tk.W, padx=5)
        ttk.Label(lateral_frame, textvariable=self.lateral_total_var).pack(anchor=tk.W, padx=5)
        ttk.Label(lateral_frame, textvariable=self.lateral_avg_var).pack(anchor=tk.W, padx=5)
        ttk.Label(lateral_frame, textvariable=self.lateral_density_var).pack(anchor=tk.W, padx=5)

        # Manual angles frame
        angles_frame = ttk.LabelFrame(self, text="Manual Angles")
        angles_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Scrollable list for manual angles
        self.angles_list = ttk.Treeview(angles_frame, columns=('angle',), show='headings', height=5)
        self.angles_list.heading('angle', text='Angle (degrees)')
        self.angles_list.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Individual laterals list
        details_frame = ttk.LabelFrame(self, text="Lateral Details")
        details_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self.laterals_tree = ttk.Treeview(details_frame, columns=('id', 'length', 'angle'),
                                           show='headings', height=6)
        self.laterals_tree.heading('id', text='ID')
        self.laterals_tree.heading('length', text='Length (px)')
        self.laterals_tree.heading('angle', text='Angle (deg)')
        self.laterals_tree.column('id', width=40)
        self.laterals_tree.column('length', width=80)
        self.laterals_tree.column('angle', width=80)

        scrollbar = ttk.Scrollbar(details_frame, orient=tk.VERTICAL, command=self.laterals_tree.yview)
        self.laterals_tree.configure(yscrollcommand=scrollbar.set)

        self.laterals_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y, pady=5)

    def update_main_root(self, length: float, angle: Optional[float]):
        """Update main root measurements"""
        self.main_length_var.set(f"Length: {length:.1f} px")
        if angle is not None:
            self.main_angle_var.set(f"Tip Angle: {angle:.1f} deg")
        else:
            self.main_angle_var.set("Tip Angle: -- deg")

    def update_laterals(self, laterals: List[Root], main_root: Optional[Root]):
        """Update lateral root measurements"""
        count = len(laterals)
        self.lateral_count_var.set(f"Count: {count}")

        if count > 0:
            total_length = sum(lat.get_length() for lat in laterals)
            avg_length = total_length / count
            self.lateral_total_var.set(f"Total Length: {total_length:.1f} px")
            self.lateral_avg_var.set(f"Avg Length: {avg_length:.1f} px")

            # Calculate density (laterals per unit length of main root)
            if main_root and main_root.get_length() > 0:
                density = count / main_root.get_length()
                self.lateral_density_var.set(f"Density: {density:.4f} /px")
            else:
                self.lateral_density_var.set("Density: -- /px")
        else:
            self.lateral_total_var.set("Total Length: -- px")
            self.lateral_avg_var.set("Avg Length: -- px")
            self.lateral_density_var.set("Density: -- /px")

        # Update detailed list
        for item in self.laterals_tree.get_children():
            self.laterals_tree.delete(item)

        for lat in laterals:
            length = lat.get_length()
            angle = self._calculate_lateral_angle(lat, main_root)
            angle_str = f"{angle:.1f}" if angle is not None else "--"
            self.laterals_tree.insert('', tk.END, values=(lat.id, f"{length:.1f}", angle_str))

    def update_manual_angles(self, angles: List[ManualAngle]):
        """Update manual angle measurements list"""
        for item in self.angles_list.get_children():
            self.angles_list.delete(item)

        for ma in angles:
            angle = ma.get_angle()
            self.angles_list.insert('', tk.END, values=(f"{angle:.2f}",))

    def _calculate_lateral_angle(self, lateral: Root, main_root: Optional[Root]) -> Optional[float]:
        """Calculate the emergence angle of a lateral from the main root"""
        if not main_root or len(lateral.points) < 2:
            return None

        if lateral.branch_point_idx is None or lateral.branch_point_idx >= len(main_root.points) - 1:
            return None

        # Get direction vector of main root at branch point
        idx = lateral.branch_point_idx
        if idx < len(main_root.points) - 1:
            main_dx = main_root.points[idx + 1].x - main_root.points[idx].x
            main_dy = main_root.points[idx + 1].y - main_root.points[idx].y
        else:
            main_dx = main_root.points[idx].x - main_root.points[idx - 1].x
            main_dy = main_root.points[idx].y - main_root.points[idx - 1].y

        # Get direction vector of lateral root at its base
        lat_dx = lateral.points[1].x - lateral.points[0].x
        lat_dy = lateral.points[1].y - lateral.points[0].y

        # Calculate angle between vectors
        dot = main_dx * lat_dx + main_dy * lat_dy
        mag_main = math.sqrt(main_dx ** 2 + main_dy ** 2)
        mag_lat = math.sqrt(lat_dx ** 2 + lat_dy ** 2)

        if mag_main == 0 or mag_lat == 0:
            return None

        cos_angle = dot / (mag_main * mag_lat)
        cos_angle = max(-1.0, min(1.0, cos_angle))
        angle_rad = math.acos(cos_angle)
        return math.degrees(angle_rad)


class RootTracerApp:
    """Main application class for root tracing"""

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Arabidopsis Root Tracer")
        self.root.geometry("1400x900")

        # Data structures
        self.roots: Dict[int, Root] = {}
        self.manual_angles: List[ManualAngle] = []
        self.next_root_id = 1
        self.next_angle_id = 1
        self.main_root_id: Optional[int] = None

        # Current mode and state
        self.mode = Mode.SELECT
        self.current_tracing_root: Optional[Root] = None
        self.temp_canvas_ids: List[int] = []

        # Manual angle measurement state
        self.manual_angle_points: List[Point] = []
        self.manual_angle_temp_ids: List[int] = []

        # Image data
        self.image: Optional[Image.Image] = None
        self.photo_image: Optional[ImageTk.PhotoImage] = None
        self.image_id: Optional[int] = None

        # Zoom and pan
        self.zoom_level = 1.0
        self.pan_offset = (0, 0)

        # Selection
        self.selected_root_id: Optional[int] = None
        self.selected_angle_id: Optional[int] = None

        self.setup_ui()
        self.bind_events()

    def setup_ui(self):
        """Set up the user interface"""
        # Main container
        main_container = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        main_container.pack(fill=tk.BOTH, expand=True)

        # Left panel - Canvas
        canvas_frame = ttk.Frame(main_container)
        main_container.add(canvas_frame, weight=3)

        # Toolbar
        toolbar = ttk.Frame(canvas_frame)
        toolbar.pack(fill=tk.X, pady=5, padx=5)

        ttk.Button(toolbar, text="Load Image", command=self.load_image).pack(side=tk.LEFT, padx=2)
        ttk.Separator(toolbar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=5)

        self.mode_var = tk.StringVar(value="select")
        modes = [
            ("Select", "select", Mode.SELECT),
            ("Trace Main Root", "main", Mode.TRACE_MAIN),
            ("Trace Lateral", "lateral", Mode.TRACE_LATERAL),
            ("Manual Angle", "angle", Mode.MANUAL_ANGLE),
            ("Delete", "delete", Mode.DELETE),
        ]

        for text, value, mode in modes:
            rb = ttk.Radiobutton(toolbar, text=text, variable=self.mode_var,
                                value=value, command=lambda m=mode: self.set_mode(m))
            rb.pack(side=tk.LEFT, padx=2)

        ttk.Separator(toolbar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=5)

        ttk.Button(toolbar, text="Zoom In", command=lambda: self.zoom(1.2)).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Zoom Out", command=lambda: self.zoom(0.8)).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Fit", command=self.fit_image).pack(side=tk.LEFT, padx=2)

        ttk.Separator(toolbar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=5)

        ttk.Button(toolbar, text="Export Data", command=self.export_data).pack(side=tk.LEFT, padx=2)
        ttk.Button(toolbar, text="Clear All", command=self.clear_all).pack(side=tk.LEFT, padx=2)

        # Canvas with scrollbars
        canvas_container = ttk.Frame(canvas_frame)
        canvas_container.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self.canvas = tk.Canvas(canvas_container, bg='gray20', cursor='crosshair')
        h_scroll = ttk.Scrollbar(canvas_container, orient=tk.HORIZONTAL, command=self.canvas.xview)
        v_scroll = ttk.Scrollbar(canvas_container, orient=tk.VERTICAL, command=self.canvas.yview)

        self.canvas.configure(xscrollcommand=h_scroll.set, yscrollcommand=v_scroll.set)

        self.canvas.grid(row=0, column=0, sticky='nsew')
        h_scroll.grid(row=1, column=0, sticky='ew')
        v_scroll.grid(row=0, column=1, sticky='ns')

        canvas_container.grid_rowconfigure(0, weight=1)
        canvas_container.grid_columnconfigure(0, weight=1)

        # Status bar
        self.status_var = tk.StringVar(value="Load an image to begin tracing")
        status_bar = ttk.Label(canvas_frame, textvariable=self.status_var, relief=tk.SUNKEN)
        status_bar.pack(fill=tk.X, padx=5, pady=2)

        # Right panel - Measurements
        self.measurement_panel = MeasurementPanel(main_container)
        main_container.add(self.measurement_panel, weight=1)

        # Instructions label
        instructions = ttk.LabelFrame(self.measurement_panel, text="Instructions")
        instructions.pack(fill=tk.X, padx=5, pady=5, side=tk.BOTTOM)

        inst_text = """
• Trace Main Root: Click points along the main root (base to tip)
• Trace Lateral: Click on main root first, then trace lateral
• Manual Angle: Click 3 points (A, B=vertex, C) to measure angle
• Delete: Click on a root or angle to delete it
• Right-click or Escape to finish tracing

Tip Angle: Measured from where curvature starts at the tip
        """
        ttk.Label(instructions, text=inst_text, justify=tk.LEFT).pack(padx=5, pady=5)

    def bind_events(self):
        """Bind mouse and keyboard events"""
        self.canvas.bind('<Button-1>', self.on_left_click)
        self.canvas.bind('<Button-3>', self.on_right_click)
        self.canvas.bind('<Motion>', self.on_mouse_move)
        self.canvas.bind('<MouseWheel>', self.on_mouse_wheel)
        self.canvas.bind('<Button-4>', lambda e: self.zoom(1.1))  # Linux scroll up
        self.canvas.bind('<Button-5>', lambda e: self.zoom(0.9))  # Linux scroll down

        self.root.bind('<Escape>', self.on_escape)
        self.root.bind('<Delete>', self.delete_selected)
        self.root.bind('<BackSpace>', self.delete_selected)

    def set_mode(self, mode: Mode):
        """Set the current operation mode"""
        # Finish any current tracing
        if self.current_tracing_root:
            self.finish_tracing()

        # Clear manual angle temp points
        self.clear_manual_angle_temp()

        self.mode = mode
        self.update_status()

    def update_status(self):
        """Update the status bar based on current mode"""
        status_messages = {
            Mode.SELECT: "Select mode: Click to select roots or angles",
            Mode.TRACE_MAIN: "Trace Main Root: Click points from base to tip, right-click to finish",
            Mode.TRACE_LATERAL: "Trace Lateral: Click on main root first, then trace the lateral",
            Mode.MANUAL_ANGLE: f"Manual Angle: Click 3 points (have {len(self.manual_angle_points)}/3)",
            Mode.DELETE: "Delete mode: Click on a root or angle to delete it",
        }
        self.status_var.set(status_messages.get(self.mode, ""))

    def load_image(self):
        """Load an image file"""
        filetypes = [
            ("Image files", "*.png *.jpg *.jpeg *.tif *.tiff *.bmp"),
            ("All files", "*.*")
        ]
        filepath = filedialog.askopenfilename(filetypes=filetypes)

        if filepath:
            try:
                self.image = Image.open(filepath)
                self.display_image()
                self.status_var.set(f"Loaded: {filepath}")
            except Exception as e:
                messagebox.showerror("Error", f"Could not load image: {e}")

    def display_image(self):
        """Display the loaded image on the canvas"""
        if self.image is None:
            return

        # Apply zoom
        new_size = (int(self.image.width * self.zoom_level),
                   int(self.image.height * self.zoom_level))

        resized = self.image.resize(new_size, Image.Resampling.LANCZOS)
        self.photo_image = ImageTk.PhotoImage(resized)

        # Clear canvas and redraw
        self.canvas.delete('all')
        self.image_id = self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo_image)

        # Update scroll region
        self.canvas.configure(scrollregion=(0, 0, new_size[0], new_size[1]))

        # Redraw all roots and angles
        self.redraw_all()

    def redraw_all(self):
        """Redraw all traced roots and manual angles"""
        for root in self.roots.values():
            self.draw_root(root)

        for angle in self.manual_angles:
            self.draw_manual_angle(angle)

    def draw_root(self, root: Root):
        """Draw a root on the canvas"""
        # Remove old drawings
        for cid in root.canvas_ids:
            self.canvas.delete(cid)
        for cid in root.point_marker_ids:
            self.canvas.delete(cid)
        root.canvas_ids.clear()
        root.point_marker_ids.clear()

        if len(root.points) < 2:
            # Just draw point markers for single points
            for p in root.points:
                x, y = p.x * self.zoom_level, p.y * self.zoom_level
                marker_id = self.canvas.create_oval(x-3, y-3, x+3, y+3,
                                                     fill='yellow', outline='black')
                root.point_marker_ids.append(marker_id)
            return

        # Determine color based on root type and selection
        if root.is_main:
            color = 'lime' if root.id != self.selected_root_id else 'cyan'
            width = 3
        else:
            color = 'orange' if root.id != self.selected_root_id else 'cyan'
            width = 2

        # Draw line segments
        for i in range(len(root.points) - 1):
            x1, y1 = root.points[i].x * self.zoom_level, root.points[i].y * self.zoom_level
            x2, y2 = root.points[i+1].x * self.zoom_level, root.points[i+1].y * self.zoom_level
            line_id = self.canvas.create_line(x1, y1, x2, y2, fill=color, width=width)
            root.canvas_ids.append(line_id)

        # Draw point markers
        for i, p in enumerate(root.points):
            x, y = p.x * self.zoom_level, p.y * self.zoom_level

            # Different marker for tip
            if i == len(root.points) - 1:  # Tip
                marker_id = self.canvas.create_polygon(
                    x, y-5, x-4, y+3, x+4, y+3,
                    fill='red', outline='white'
                )
            elif i == 0:  # Base
                marker_id = self.canvas.create_rectangle(
                    x-4, y-4, x+4, y+4,
                    fill='blue', outline='white'
                )
            else:
                marker_id = self.canvas.create_oval(
                    x-3, y-3, x+3, y+3,
                    fill='yellow', outline='black'
                )
            root.point_marker_ids.append(marker_id)

        # Draw tip angle indicator for main root
        if root.is_main and len(root.points) >= 3:
            self.draw_tip_angle_indicator(root)

    def draw_tip_angle_indicator(self, root: Root):
        """Draw an indicator showing the tip angle measurement"""
        # Find curvature point - where the tip curvature starts
        # We look at the last few segments and find where direction changes significantly

        curvature_point, tip_point, reference_point = self.find_tip_angle_points(root)

        if curvature_point is None or tip_point is None or reference_point is None:
            return

        # Draw the angle arc
        cx, cy = curvature_point.x * self.zoom_level, curvature_point.y * self.zoom_level
        tx, ty = tip_point.x * self.zoom_level, tip_point.y * self.zoom_level
        rx, ry = reference_point.x * self.zoom_level, reference_point.y * self.zoom_level

        # Draw lines showing the angle
        line1 = self.canvas.create_line(cx, cy, rx, ry, fill='magenta', width=1, dash=(3,3))
        line2 = self.canvas.create_line(cx, cy, tx, ty, fill='magenta', width=1, dash=(3,3))
        root.canvas_ids.extend([line1, line2])

        # Draw arc
        arc_radius = 20
        # Calculate angles for arc
        angle1 = math.atan2(ry - cy, rx - cx)
        angle2 = math.atan2(ty - cy, tx - cx)

        # Convert to degrees for tkinter
        start_angle = math.degrees(angle1)
        extent = math.degrees(angle2 - angle1)

        # Normalize extent
        while extent > 180:
            extent -= 360
        while extent < -180:
            extent += 360

        arc = self.canvas.create_arc(
            cx - arc_radius, cy - arc_radius, cx + arc_radius, cy + arc_radius,
            start=start_angle, extent=extent, style=tk.ARC, outline='magenta', width=2
        )
        root.canvas_ids.append(arc)

        # Draw label with angle value
        angle = self.calculate_tip_angle(root)
        if angle is not None:
            label_x = cx + 30
            label_y = cy - 10
            label = self.canvas.create_text(label_x, label_y, text=f"{angle:.1f}°",
                                            fill='magenta', font=('Helvetica', 10, 'bold'))
            root.canvas_ids.append(label)

    def find_tip_angle_points(self, root: Root) -> Tuple[Optional[Point], Optional[Point], Optional[Point]]:
        """
        Find the three points for tip angle measurement:
        - Tip point (end of root)
        - Curvature point (vertex/B - where curvature starts)
        - Reference point (point before curvature, representing the straight portion)

        The vertex is where the curvature starts, so if a root grows straight down
        and the tip curves left, the curvature start point is the vertex.
        """
        if len(root.points) < 3:
            return None, None, None

        tip_point = root.points[-1]

        # Find where curvature starts by looking at direction changes
        # We'll use the angle change between consecutive segments

        # Start from the tip and work backwards to find where the direction stabilizes
        threshold_angle = 10  # degrees - angle change threshold to detect curvature

        # Calculate directions between consecutive points
        directions = []
        for i in range(len(root.points) - 1):
            dx = root.points[i + 1].x - root.points[i].x
            dy = root.points[i + 1].y - root.points[i].y
            angle = math.degrees(math.atan2(dy, dx))
            directions.append(angle)

        # Work backwards from tip to find curvature start
        curvature_idx = len(root.points) - 2  # Start one before tip

        for i in range(len(directions) - 1, 0, -1):
            angle_diff = abs(directions[i] - directions[i - 1])
            # Normalize angle difference
            while angle_diff > 180:
                angle_diff -= 360
            angle_diff = abs(angle_diff)

            if angle_diff < threshold_angle:
                # Direction is stable here, curvature starts after this
                curvature_idx = i
                break

        # Ensure we have valid indices
        curvature_idx = max(1, min(curvature_idx, len(root.points) - 2))

        curvature_point = root.points[curvature_idx]

        # Reference point is some distance back from curvature point along straight portion
        ref_idx = max(0, curvature_idx - 2)
        reference_point = root.points[ref_idx]

        return curvature_point, tip_point, reference_point

    def calculate_tip_angle(self, root: Root) -> Optional[float]:
        """
        Calculate the tip angle.
        The angle is measured at the curvature start point (vertex B).
        Points: A (reference before curvature), B (curvature start/vertex), C (tip)
        """
        curvature_point, tip_point, reference_point = self.find_tip_angle_points(root)

        if curvature_point is None or tip_point is None or reference_point is None:
            return None

        # Calculate angle ABC where B is curvature_point (vertex)
        # Vectors from B to A and B to C
        ba_x = reference_point.x - curvature_point.x
        ba_y = reference_point.y - curvature_point.y
        bc_x = tip_point.x - curvature_point.x
        bc_y = tip_point.y - curvature_point.y

        # Calculate angle using dot product
        dot = ba_x * bc_x + ba_y * bc_y
        mag_ba = math.sqrt(ba_x ** 2 + ba_y ** 2)
        mag_bc = math.sqrt(bc_x ** 2 + bc_y ** 2)

        if mag_ba == 0 or mag_bc == 0:
            return None

        cos_angle = dot / (mag_ba * mag_bc)
        cos_angle = max(-1.0, min(1.0, cos_angle))
        angle_rad = math.acos(cos_angle)

        return math.degrees(angle_rad)

    def draw_manual_angle(self, angle: ManualAngle):
        """Draw a manual angle measurement on the canvas"""
        # Remove old drawings
        for cid in angle.canvas_ids:
            self.canvas.delete(cid)
        angle.canvas_ids.clear()

        # Get scaled coordinates
        ax, ay = angle.point_a.x * self.zoom_level, angle.point_a.y * self.zoom_level
        bx, by = angle.point_b.x * self.zoom_level, angle.point_b.y * self.zoom_level
        cx, cy = angle.point_c.x * self.zoom_level, angle.point_c.y * self.zoom_level

        # Determine color based on selection
        color = 'cyan' if angle.id == self.selected_angle_id else 'yellow'

        # Draw lines from vertex to other points
        line1 = self.canvas.create_line(bx, by, ax, ay, fill=color, width=2)
        line2 = self.canvas.create_line(bx, by, cx, cy, fill=color, width=2)
        angle.canvas_ids.extend([line1, line2])

        # Draw point markers
        for px, py, label in [(ax, ay, 'A'), (bx, by, 'B'), (cx, cy, 'C')]:
            if label == 'B':  # Vertex
                marker = self.canvas.create_oval(px-5, py-5, px+5, py+5,
                                                  fill=color, outline='white', width=2)
            else:
                marker = self.canvas.create_oval(px-4, py-4, px+4, py+4,
                                                  fill=color, outline='black')
            text = self.canvas.create_text(px+10, py-10, text=label, fill=color,
                                           font=('Helvetica', 9, 'bold'))
            angle.canvas_ids.extend([marker, text])

        # Draw arc at vertex
        arc_radius = 25
        angle_to_a = math.atan2(ay - by, ax - bx)
        angle_to_c = math.atan2(cy - by, cx - bx)

        start_angle = math.degrees(angle_to_a)
        extent = math.degrees(angle_to_c - angle_to_a)

        # Normalize extent
        while extent > 180:
            extent -= 360
        while extent < -180:
            extent += 360

        arc = self.canvas.create_arc(
            bx - arc_radius, by - arc_radius, bx + arc_radius, by + arc_radius,
            start=start_angle, extent=extent, style=tk.ARC, outline=color, width=2
        )
        angle.canvas_ids.append(arc)

        # Draw angle value
        angle_value = angle.get_angle()
        mid_angle = angle_to_a + math.radians(extent / 2)
        label_x = bx + 35 * math.cos(mid_angle)
        label_y = by + 35 * math.sin(mid_angle)

        label = self.canvas.create_text(label_x, label_y, text=f"{angle_value:.1f}°",
                                         fill=color, font=('Helvetica', 11, 'bold'))
        angle.canvas_ids.append(label)

    def on_left_click(self, event):
        """Handle left mouse button click"""
        # Get canvas coordinates
        canvas_x = self.canvas.canvasx(event.x)
        canvas_y = self.canvas.canvasy(event.y)

        # Convert to image coordinates (accounting for zoom)
        img_x = canvas_x / self.zoom_level
        img_y = canvas_y / self.zoom_level

        point = Point(img_x, img_y)

        if self.mode == Mode.SELECT:
            self.handle_select(point, canvas_x, canvas_y)
        elif self.mode == Mode.TRACE_MAIN:
            self.handle_trace_main(point)
        elif self.mode == Mode.TRACE_LATERAL:
            self.handle_trace_lateral(point)
        elif self.mode == Mode.MANUAL_ANGLE:
            self.handle_manual_angle(point)
        elif self.mode == Mode.DELETE:
            self.handle_delete(canvas_x, canvas_y)

    def handle_select(self, point: Point, canvas_x: float, canvas_y: float):
        """Handle selection of roots or angles"""
        # Find closest item
        items = self.canvas.find_overlapping(canvas_x - 5, canvas_y - 5,
                                             canvas_x + 5, canvas_y + 5)

        # Clear previous selection
        self.selected_root_id = None
        self.selected_angle_id = None

        for item in items:
            # Check if it's part of a root
            for root in self.roots.values():
                if item in root.canvas_ids or item in root.point_marker_ids:
                    self.selected_root_id = root.id
                    break

            # Check if it's part of an angle
            for angle in self.manual_angles:
                if item in angle.canvas_ids:
                    self.selected_angle_id = angle.id
                    break

        # Redraw to show selection
        self.redraw_all()

    def handle_trace_main(self, point: Point):
        """Handle main root tracing"""
        if self.current_tracing_root is None:
            # Start new main root
            if self.main_root_id is not None:
                # Ask to replace existing main root
                if not messagebox.askyesno("Replace Main Root",
                                           "A main root already exists. Replace it?"):
                    return
                # Delete existing main root
                old_root = self.roots.pop(self.main_root_id, None)
                if old_root:
                    for cid in old_root.canvas_ids + old_root.point_marker_ids:
                        self.canvas.delete(cid)

            self.current_tracing_root = Root(id=self.next_root_id, is_main=True)
            self.next_root_id += 1

        # Add point to current root
        self.current_tracing_root.points.append(point)

        # Draw temporary visualization
        self.draw_root(self.current_tracing_root)

        # Update measurements in real-time
        self.update_measurements()

        self.status_var.set(f"Tracing main root: {len(self.current_tracing_root.points)} points")

    def handle_trace_lateral(self, point: Point):
        """Handle lateral root tracing"""
        if self.main_root_id is None:
            messagebox.showwarning("No Main Root",
                                   "Please trace a main root first before adding laterals.")
            return

        main_root = self.roots.get(self.main_root_id)
        if main_root is None:
            return

        if self.current_tracing_root is None:
            # First click - should be on main root
            # Find closest point on main root
            min_dist = float('inf')
            closest_idx = 0

            for i, mp in enumerate(main_root.points):
                dist = point.distance_to(mp)
                if dist < min_dist:
                    min_dist = dist
                    closest_idx = i

            if min_dist > 20 / self.zoom_level:  # 20 pixels threshold
                self.status_var.set("Click closer to the main root to start a lateral")
                return

            # Start new lateral from this point
            self.current_tracing_root = Root(
                id=self.next_root_id,
                is_main=False,
                parent_id=self.main_root_id,
                branch_point_idx=closest_idx
            )
            self.next_root_id += 1

            # First point is on the main root
            self.current_tracing_root.points.append(main_root.points[closest_idx])
            self.status_var.set("Lateral started - click to add points, right-click to finish")
        else:
            # Add point to current lateral
            self.current_tracing_root.points.append(point)

        # Draw temporary visualization
        self.draw_root(self.current_tracing_root)

        # Update measurements in real-time
        self.update_measurements()

    def handle_manual_angle(self, point: Point):
        """Handle manual 3-point angle measurement"""
        self.manual_angle_points.append(point)

        # Draw temporary marker
        x, y = point.x * self.zoom_level, point.y * self.zoom_level
        labels = ['A', 'B (vertex)', 'C']
        label = labels[len(self.manual_angle_points) - 1]

        marker = self.canvas.create_oval(x-4, y-4, x+4, y+4, fill='yellow', outline='white')
        text = self.canvas.create_text(x+15, y-10, text=label, fill='yellow',
                                        font=('Helvetica', 9, 'bold'))
        self.manual_angle_temp_ids.extend([marker, text])

        # Draw connecting line
        if len(self.manual_angle_points) >= 2:
            p1 = self.manual_angle_points[-2]
            x1, y1 = p1.x * self.zoom_level, p1.y * self.zoom_level
            line = self.canvas.create_line(x1, y1, x, y, fill='yellow', width=2, dash=(3,3))
            self.manual_angle_temp_ids.append(line)

        self.update_status()

        if len(self.manual_angle_points) == 3:
            # Create the angle measurement
            angle = ManualAngle(
                id=self.next_angle_id,
                point_a=self.manual_angle_points[0],
                point_b=self.manual_angle_points[1],  # Vertex
                point_c=self.manual_angle_points[2]
            )
            self.next_angle_id += 1
            self.manual_angles.append(angle)

            # Clear temp drawings
            self.clear_manual_angle_temp()

            # Draw the final angle
            self.draw_manual_angle(angle)

            # Update measurements
            self.update_measurements()

            angle_value = angle.get_angle()
            self.status_var.set(f"Angle measured: {angle_value:.2f}° (B is vertex)")

    def clear_manual_angle_temp(self):
        """Clear temporary manual angle drawings"""
        for cid in self.manual_angle_temp_ids:
            self.canvas.delete(cid)
        self.manual_angle_temp_ids.clear()
        self.manual_angle_points.clear()

    def handle_delete(self, canvas_x: float, canvas_y: float):
        """Handle deletion of roots or angles"""
        items = self.canvas.find_overlapping(canvas_x - 5, canvas_y - 5,
                                             canvas_x + 5, canvas_y + 5)

        deleted = False

        for item in items:
            # Check if it's part of a root
            for root_id, root in list(self.roots.items()):
                if item in root.canvas_ids or item in root.point_marker_ids:
                    # Delete this root
                    for cid in root.canvas_ids + root.point_marker_ids:
                        self.canvas.delete(cid)
                    del self.roots[root_id]

                    if root.is_main:
                        self.main_root_id = None
                        # Also delete all laterals
                        laterals_to_delete = [rid for rid, r in self.roots.items()
                                              if r.parent_id == root_id]
                        for lat_id in laterals_to_delete:
                            lat = self.roots.pop(lat_id)
                            for cid in lat.canvas_ids + lat.point_marker_ids:
                                self.canvas.delete(cid)

                    deleted = True
                    break

            if deleted:
                break

            # Check if it's part of an angle
            for angle in list(self.manual_angles):
                if item in angle.canvas_ids:
                    for cid in angle.canvas_ids:
                        self.canvas.delete(cid)
                    self.manual_angles.remove(angle)
                    deleted = True
                    break

            if deleted:
                break

        if deleted:
            # Update measurements in real-time
            self.update_measurements()
            self.status_var.set("Item deleted - measurements updated")

    def on_right_click(self, event):
        """Handle right mouse button click - finish tracing"""
        self.finish_tracing()

    def on_escape(self, event):
        """Handle Escape key - cancel or finish current operation"""
        if self.current_tracing_root:
            if len(self.current_tracing_root.points) >= 2:
                self.finish_tracing()
            else:
                # Cancel tracing
                for cid in self.current_tracing_root.canvas_ids + self.current_tracing_root.point_marker_ids:
                    self.canvas.delete(cid)
                self.current_tracing_root = None
                self.status_var.set("Tracing cancelled")

        if self.manual_angle_points:
            self.clear_manual_angle_temp()
            self.update_status()

    def finish_tracing(self):
        """Finish the current root tracing"""
        if self.current_tracing_root is None:
            return

        if len(self.current_tracing_root.points) < 2:
            # Not enough points
            for cid in self.current_tracing_root.canvas_ids + self.current_tracing_root.point_marker_ids:
                self.canvas.delete(cid)
            self.current_tracing_root = None
            self.status_var.set("Need at least 2 points - tracing cancelled")
            return

        # Add to roots dictionary
        root = self.current_tracing_root
        self.roots[root.id] = root

        if root.is_main:
            self.main_root_id = root.id

        # Final draw
        self.draw_root(root)

        self.current_tracing_root = None

        # Update measurements
        self.update_measurements()

        root_type = "main root" if root.is_main else "lateral root"
        self.status_var.set(f"Finished tracing {root_type} (ID: {root.id})")

    def on_mouse_move(self, event):
        """Handle mouse movement for preview during tracing"""
        if self.current_tracing_root and len(self.current_tracing_root.points) > 0:
            # Show preview line
            canvas_x = self.canvas.canvasx(event.x)
            canvas_y = self.canvas.canvasy(event.y)

            # Clear old preview
            for cid in self.temp_canvas_ids:
                self.canvas.delete(cid)
            self.temp_canvas_ids.clear()

            # Draw preview line from last point
            last_point = self.current_tracing_root.points[-1]
            lx, ly = last_point.x * self.zoom_level, last_point.y * self.zoom_level

            preview = self.canvas.create_line(lx, ly, canvas_x, canvas_y,
                                              fill='white', width=1, dash=(3, 3))
            self.temp_canvas_ids.append(preview)

    def on_mouse_wheel(self, event):
        """Handle mouse wheel for zooming"""
        if event.delta > 0:
            self.zoom(1.1)
        else:
            self.zoom(0.9)

    def zoom(self, factor: float):
        """Apply zoom factor"""
        new_zoom = self.zoom_level * factor
        if 0.1 <= new_zoom <= 10.0:
            self.zoom_level = new_zoom
            if self.image:
                self.display_image()

    def fit_image(self):
        """Fit image to canvas"""
        if self.image is None:
            return

        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()

        if canvas_width <= 1 or canvas_height <= 1:
            return

        width_ratio = canvas_width / self.image.width
        height_ratio = canvas_height / self.image.height

        self.zoom_level = min(width_ratio, height_ratio) * 0.95
        self.display_image()

    def delete_selected(self, event=None):
        """Delete the currently selected item"""
        if self.selected_root_id is not None:
            root = self.roots.pop(self.selected_root_id, None)
            if root:
                for cid in root.canvas_ids + root.point_marker_ids:
                    self.canvas.delete(cid)

                if root.is_main:
                    self.main_root_id = None
                    # Delete all laterals too
                    laterals_to_delete = [rid for rid, r in self.roots.items()
                                          if r.parent_id == self.selected_root_id]
                    for lat_id in laterals_to_delete:
                        lat = self.roots.pop(lat_id)
                        for cid in lat.canvas_ids + lat.point_marker_ids:
                            self.canvas.delete(cid)

            self.selected_root_id = None
            self.update_measurements()

        if self.selected_angle_id is not None:
            for angle in list(self.manual_angles):
                if angle.id == self.selected_angle_id:
                    for cid in angle.canvas_ids:
                        self.canvas.delete(cid)
                    self.manual_angles.remove(angle)
                    break

            self.selected_angle_id = None
            self.update_measurements()

    def update_measurements(self):
        """Update all measurements in real-time"""
        main_root = self.roots.get(self.main_root_id) if self.main_root_id else None

        # Update main root measurements
        if main_root:
            length = main_root.get_length()
            angle = self.calculate_tip_angle(main_root)
            self.measurement_panel.update_main_root(length, angle)
        else:
            self.measurement_panel.update_main_root(0, None)

        # Update lateral measurements
        laterals = [r for r in self.roots.values() if not r.is_main]
        self.measurement_panel.update_laterals(laterals, main_root)

        # Update manual angles
        self.measurement_panel.update_manual_angles(self.manual_angles)

    def clear_all(self):
        """Clear all traced roots and angles"""
        if messagebox.askyesno("Clear All", "Are you sure you want to clear all traced data?"):
            # Clear canvas drawings
            for root in self.roots.values():
                for cid in root.canvas_ids + root.point_marker_ids:
                    self.canvas.delete(cid)

            for angle in self.manual_angles:
                for cid in angle.canvas_ids:
                    self.canvas.delete(cid)

            # Clear data
            self.roots.clear()
            self.manual_angles.clear()
            self.main_root_id = None
            self.current_tracing_root = None
            self.selected_root_id = None
            self.selected_angle_id = None

            # Update measurements
            self.update_measurements()

            self.status_var.set("All data cleared")

    def export_data(self):
        """Export measurement data to JSON"""
        filepath = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )

        if not filepath:
            return

        main_root = self.roots.get(self.main_root_id) if self.main_root_id else None
        laterals = [r for r in self.roots.values() if not r.is_main]

        data = {
            "export_date": datetime.now().isoformat(),
            "main_root": None,
            "lateral_roots": [],
            "manual_angles": []
        }

        if main_root:
            tip_angle = self.calculate_tip_angle(main_root)
            data["main_root"] = {
                "id": main_root.id,
                "length_px": main_root.get_length(),
                "tip_angle_deg": tip_angle,
                "point_count": len(main_root.points),
                "points": [p.to_tuple() for p in main_root.points]
            }

        for lat in laterals:
            lat_angle = self.measurement_panel._calculate_lateral_angle(lat, main_root)
            data["lateral_roots"].append({
                "id": lat.id,
                "length_px": lat.get_length(),
                "emergence_angle_deg": lat_angle,
                "branch_point_idx": lat.branch_point_idx,
                "point_count": len(lat.points),
                "points": [p.to_tuple() for p in lat.points]
            })

        for angle in self.manual_angles:
            data["manual_angles"].append({
                "id": angle.id,
                "angle_deg": angle.get_angle(),
                "point_a": angle.point_a.to_tuple(),
                "point_b_vertex": angle.point_b.to_tuple(),
                "point_c": angle.point_c.to_tuple()
            })

        # Add summary statistics
        if laterals:
            data["summary"] = {
                "lateral_count": len(laterals),
                "total_lateral_length_px": sum(lat.get_length() for lat in laterals),
                "avg_lateral_length_px": sum(lat.get_length() for lat in laterals) / len(laterals),
                "lateral_density_per_px": len(laterals) / main_root.get_length() if main_root and main_root.get_length() > 0 else None
            }

        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            self.status_var.set(f"Data exported to {filepath}")
        except Exception as e:
            messagebox.showerror("Export Error", f"Could not export data: {e}")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = RootTracerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
