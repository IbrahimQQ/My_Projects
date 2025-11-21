"""
Main window for the Arabidopsis Root Tracer application.
"""

import os
from typing import Optional, List, Dict
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QSlider, QLineEdit, QGroupBox, QTableWidget, QTableWidgetItem,
    QFileDialog, QMessageBox, QSpinBox, QSplitter, QStatusBar, QToolBar,
    QComboBox, QDoubleSpinBox, QProgressBar, QFrame, QButtonGroup, QRadioButton,
    QListWidget, QListWidgetItem
)
from PySide6.QtCore import Qt, Slot
from PySide6.QtGui import QAction, QKeySequence, QShortcut

from ui.image_canvas import ImageCanvas
from core.image_handler import ImageHandler
from core.root_tracer import RootTracer, MeasurementCalculator
from utils.export import CSVExporter


class MainWindow(QMainWindow):
    """Main application window."""

    def __init__(self):
        super().__init__()

        self.setWindowTitle("Arabidopsis Root Tracer")
        self.setMinimumSize(1200, 800)

        # Core components
        self._image_handler = ImageHandler()
        self._root_tracer = RootTracer()
        self._measurement_calc = MeasurementCalculator()

        # State
        self._slice_data: Dict[int, List[Dict]] = {}  # slice_index -> list of roots
        self._pending_start_point: Optional[tuple] = None
        self._manual_lateral_start: Optional[tuple] = None

        # Setup UI
        self._setup_ui()
        self._setup_menubar()
        self._setup_toolbar()
        self._setup_statusbar()
        self._setup_shortcuts()
        self._connect_signals()

        self._update_ui_state()

    def _setup_ui(self):
        """Setup the main UI layout."""
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        main_layout = QHBoxLayout(central_widget)

        # Create splitter for resizable panels
        splitter = QSplitter(Qt.Orientation.Horizontal)
        main_layout.addWidget(splitter)

        # Left panel - Image display
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)

        # Image canvas
        self._canvas = ImageCanvas()
        left_layout.addWidget(self._canvas, stretch=1)

        # Slice navigation
        slice_group = QGroupBox("Slice Navigation")
        slice_layout = QHBoxLayout(slice_group)

        self._btn_prev_slice = QPushButton("< (A)")
        self._btn_prev_slice.setFixedWidth(60)
        self._slice_slider = QSlider(Qt.Orientation.Horizontal)
        self._slice_slider.setMinimum(0)
        self._slice_slider.setMaximum(0)
        self._btn_next_slice = QPushButton("> (D)")
        self._btn_next_slice.setFixedWidth(60)
        self._lbl_slice_info = QLabel("Slice: 0/0")
        self._lbl_slice_info.setMinimumWidth(80)

        slice_layout.addWidget(self._btn_prev_slice)
        slice_layout.addWidget(self._slice_slider, stretch=1)
        slice_layout.addWidget(self._btn_next_slice)
        slice_layout.addWidget(self._lbl_slice_info)

        left_layout.addWidget(slice_group)

        splitter.addWidget(left_panel)

        # Right panel - Controls
        right_panel = QWidget()
        right_panel.setMaximumWidth(420)
        right_layout = QVBoxLayout(right_panel)

        # Slice naming
        name_group = QGroupBox("Slice Name")
        name_layout = QHBoxLayout(name_group)
        self._txt_slice_name = QLineEdit()
        self._txt_slice_name.setPlaceholderText("Enter slice name...")
        self._btn_apply_name = QPushButton("Apply")
        name_layout.addWidget(self._txt_slice_name, stretch=1)
        name_layout.addWidget(self._btn_apply_name)
        right_layout.addWidget(name_group)

        # Interaction mode
        mode_group = QGroupBox("Mode (Press key to switch)")
        mode_layout = QVBoxLayout(mode_group)

        self._radio_select = QRadioButton("Select/Trace (S) - Click to set start point")
        self._radio_delete = QRadioButton("Delete (X) - Click on lateral to delete")
        self._radio_manual = QRadioButton("Manual Lateral (M) - Click start, then end")
        self._radio_pan = QRadioButton("Pan (P) - Drag to pan view")

        self._radio_select.setChecked(True)
        mode_layout.addWidget(self._radio_select)
        mode_layout.addWidget(self._radio_delete)
        mode_layout.addWidget(self._radio_manual)
        mode_layout.addWidget(self._radio_pan)

        right_layout.addWidget(mode_group)

        # Tracing controls
        trace_group = QGroupBox("Tracing (Shortcuts shown)")
        trace_layout = QVBoxLayout(trace_group)

        # Threshold control
        thresh_layout = QHBoxLayout()
        thresh_layout.addWidget(QLabel("Threshold:"))
        self._spin_threshold = QSpinBox()
        self._spin_threshold.setRange(1, 255)
        self._spin_threshold.setValue(30)
        thresh_layout.addWidget(self._spin_threshold)
        trace_layout.addLayout(thresh_layout)

        # Tracing buttons
        self._btn_trace_main = QPushButton("Trace Main Root (T)")
        self._btn_trace_laterals = QPushButton("Trace Laterals (L)")
        self._btn_clear_current = QPushButton("Clear Current Root (C)")
        self._btn_clear_all = QPushButton("Clear All Roots")

        trace_layout.addWidget(self._btn_trace_main)
        trace_layout.addWidget(self._btn_trace_laterals)
        trace_layout.addWidget(self._btn_clear_current)
        trace_layout.addWidget(self._btn_clear_all)

        right_layout.addWidget(trace_group)

        # Root list
        roots_group = QGroupBox("Roots in Current Slice")
        roots_layout = QVBoxLayout(roots_group)
        self._list_roots = QListWidget()
        self._list_roots.setMaximumHeight(100)
        roots_layout.addWidget(self._list_roots)

        self._btn_delete_root = QPushButton("Delete Selected Root")
        roots_layout.addWidget(self._btn_delete_root)

        right_layout.addWidget(roots_group)

        # Measurements / Scale
        measure_group = QGroupBox("Scale && Measurements")
        measure_layout = QVBoxLayout(measure_group)

        # Pixel scale setting - pixels per unit
        scale_layout = QHBoxLayout()
        scale_layout.addWidget(QLabel("Scale:"))
        self._spin_pixels_per_unit = QDoubleSpinBox()
        self._spin_pixels_per_unit.setRange(0.1, 10000)
        self._spin_pixels_per_unit.setValue(161.0)  # Default 161 px/cm
        self._spin_pixels_per_unit.setDecimals(1)
        scale_layout.addWidget(self._spin_pixels_per_unit)
        scale_layout.addWidget(QLabel("pixels per"))
        self._cmb_unit = QComboBox()
        self._cmb_unit.addItems(["cm", "mm", "um", "inch"])
        scale_layout.addWidget(self._cmb_unit)
        measure_layout.addLayout(scale_layout)

        # Measurements table
        self._tbl_measurements = QTableWidget()
        self._tbl_measurements.setColumnCount(2)
        self._tbl_measurements.setHorizontalHeaderLabels(["Measurement", "Value"])
        self._tbl_measurements.horizontalHeader().setStretchLastSection(True)
        self._tbl_measurements.setMinimumHeight(150)
        measure_layout.addWidget(self._tbl_measurements)

        right_layout.addWidget(measure_group)

        # Export controls
        export_group = QGroupBox("Export (Ctrl+E)")
        export_layout = QVBoxLayout(export_group)

        self._btn_export_current = QPushButton("Export Current Slice")
        self._btn_export_all = QPushButton("Export All Slices")
        self._btn_export_points = QPushButton("Export Points (CSV)")

        export_layout.addWidget(self._btn_export_current)
        export_layout.addWidget(self._btn_export_all)
        export_layout.addWidget(self._btn_export_points)

        right_layout.addWidget(export_group)

        # Stretch at bottom
        right_layout.addStretch()

        # Shortcuts help
        help_label = QLabel(
            "<b>Shortcuts:</b> O=Open, T=Trace, L=Laterals, C=Clear, "
            "S=Select, X=Delete, M=Manual, P=Pan, A/D=Prev/Next Slice"
        )
        help_label.setWordWrap(True)
        help_label.setStyleSheet("color: #666; font-size: 10px;")
        right_layout.addWidget(help_label)

        splitter.addWidget(right_panel)

        # Set splitter sizes
        splitter.setSizes([800, 420])

    def _setup_menubar(self):
        """Setup the menu bar."""
        menubar = self.menuBar()

        # File menu
        file_menu = menubar.addMenu("&File")

        open_action = QAction("&Open TIFF... (O)", self)
        open_action.setShortcut(QKeySequence.StandardKey.Open)
        open_action.triggered.connect(self._on_open_file)
        file_menu.addAction(open_action)

        file_menu.addSeparator()

        export_action = QAction("&Export All... (Ctrl+E)", self)
        export_action.setShortcut(QKeySequence("Ctrl+E"))
        export_action.triggered.connect(self._on_export_all)
        file_menu.addAction(export_action)

        file_menu.addSeparator()

        exit_action = QAction("E&xit", self)
        exit_action.setShortcut(QKeySequence.StandardKey.Quit)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # View menu
        view_menu = menubar.addMenu("&View")

        fit_action = QAction("&Fit to Window (F)", self)
        fit_action.setShortcut(QKeySequence("F"))
        fit_action.triggered.connect(self._canvas.fit_to_view)
        view_menu.addAction(fit_action)

        reset_zoom_action = QAction("&Reset Zoom (R)", self)
        reset_zoom_action.setShortcut(QKeySequence("R"))
        reset_zoom_action.triggered.connect(self._canvas.reset_zoom)
        view_menu.addAction(reset_zoom_action)

        # Help menu
        help_menu = menubar.addMenu("&Help")

        about_action = QAction("&About", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)

        shortcuts_action = QAction("&Keyboard Shortcuts", self)
        shortcuts_action.triggered.connect(self._show_shortcuts)
        help_menu.addAction(shortcuts_action)

    def _setup_toolbar(self):
        """Setup the toolbar."""
        toolbar = QToolBar("Main Toolbar")
        toolbar.setMovable(False)
        self.addToolBar(toolbar)

        # Open button
        open_action = QAction("Open (O)", self)
        open_action.triggered.connect(self._on_open_file)
        toolbar.addAction(open_action)

        toolbar.addSeparator()

        # Zoom controls
        toolbar.addWidget(QLabel("Zoom: "))
        self._lbl_zoom = QLabel("100%")
        self._lbl_zoom.setMinimumWidth(50)
        toolbar.addWidget(self._lbl_zoom)

        fit_action = QAction("Fit (F)", self)
        fit_action.triggered.connect(self._canvas.fit_to_view)
        toolbar.addAction(fit_action)

        toolbar.addSeparator()

        # Mode indicator
        toolbar.addWidget(QLabel("Mode: "))
        self._lbl_mode = QLabel("Select")
        self._lbl_mode.setMinimumWidth(80)
        self._lbl_mode.setStyleSheet("font-weight: bold; color: green;")
        toolbar.addWidget(self._lbl_mode)

    def _setup_statusbar(self):
        """Setup the status bar."""
        self._statusbar = QStatusBar()
        self.setStatusBar(self._statusbar)
        self._statusbar.showMessage("Ready - Press O to open a TIFF image")

    def _setup_shortcuts(self):
        """Setup keyboard shortcuts."""
        # File operations
        QShortcut(QKeySequence("O"), self, self._on_open_file)

        # Mode shortcuts
        QShortcut(QKeySequence("S"), self, lambda: self._set_mode("select"))
        QShortcut(QKeySequence("X"), self, lambda: self._set_mode("delete"))
        QShortcut(QKeySequence("M"), self, lambda: self._set_mode("manual"))
        QShortcut(QKeySequence("P"), self, lambda: self._set_mode("pan"))

        # Tracing shortcuts
        QShortcut(QKeySequence("T"), self, self._on_trace_main_root)
        QShortcut(QKeySequence("L"), self, self._on_trace_laterals)
        QShortcut(QKeySequence("C"), self, self._on_clear_current_root)

        # Navigation shortcuts
        QShortcut(QKeySequence("A"), self, self._on_prev_slice)
        QShortcut(QKeySequence("D"), self, self._on_next_slice)

        # View shortcuts
        QShortcut(QKeySequence("F"), self, self._canvas.fit_to_view)
        QShortcut(QKeySequence("R"), self, self._canvas.reset_zoom)

        # Escape to cancel
        QShortcut(QKeySequence("Escape"), self, self._on_escape)

    def _connect_signals(self):
        """Connect all signals and slots."""
        # Canvas signals
        self._canvas.point_clicked.connect(self._on_point_clicked)
        self._canvas.delete_requested.connect(self._on_delete_requested)
        self._canvas.manual_lateral_point.connect(self._on_manual_lateral_point)
        self._canvas.zoom_changed.connect(self._on_zoom_changed)

        # Mode radio buttons
        self._radio_select.toggled.connect(lambda c: c and self._set_mode("select"))
        self._radio_delete.toggled.connect(lambda c: c and self._set_mode("delete"))
        self._radio_manual.toggled.connect(lambda c: c and self._set_mode("manual"))
        self._radio_pan.toggled.connect(lambda c: c and self._set_mode("pan"))

        # Slice navigation
        self._btn_prev_slice.clicked.connect(self._on_prev_slice)
        self._btn_next_slice.clicked.connect(self._on_next_slice)
        self._slice_slider.valueChanged.connect(self._on_slice_changed)

        # Slice naming
        self._btn_apply_name.clicked.connect(self._on_apply_slice_name)
        self._txt_slice_name.returnPressed.connect(self._on_apply_slice_name)

        # Tracing controls
        self._spin_threshold.valueChanged.connect(self._on_threshold_changed)
        self._btn_trace_main.clicked.connect(self._on_trace_main_root)
        self._btn_trace_laterals.clicked.connect(self._on_trace_laterals)
        self._btn_clear_current.clicked.connect(self._on_clear_current_root)
        self._btn_clear_all.clicked.connect(self._on_clear_all)

        # Root list
        self._list_roots.currentRowChanged.connect(self._on_root_selected)
        self._btn_delete_root.clicked.connect(self._on_delete_selected_root)

        # Scale changes
        self._spin_pixels_per_unit.valueChanged.connect(self._update_measurements_table)
        self._cmb_unit.currentIndexChanged.connect(self._update_measurements_table)

        # Export
        self._btn_export_current.clicked.connect(self._on_export_current)
        self._btn_export_all.clicked.connect(self._on_export_all)
        self._btn_export_points.clicked.connect(self._on_export_points)

    def _set_mode(self, mode: str):
        """Set interaction mode."""
        mode_map = {
            "select": (ImageCanvas.MODE_SELECT, self._radio_select, "Select"),
            "delete": (ImageCanvas.MODE_DELETE, self._radio_delete, "Delete"),
            "manual": (ImageCanvas.MODE_MANUAL_LATERAL, self._radio_manual, "Manual Lateral"),
            "pan": (ImageCanvas.MODE_PAN, self._radio_pan, "Pan"),
        }

        if mode in mode_map:
            canvas_mode, radio, label = mode_map[mode]
            self._canvas.set_mode(canvas_mode)
            radio.setChecked(True)
            self._lbl_mode.setText(label)
            self._manual_lateral_start = None
            self._canvas.set_manual_lateral_start(None)

            if mode == "select":
                self._statusbar.showMessage("Select mode: Click on root start point")
            elif mode == "delete":
                self._statusbar.showMessage("Delete mode: Click on a lateral root to delete it")
            elif mode == "manual":
                self._statusbar.showMessage("Manual mode: Click lateral start point (near main root)")
            elif mode == "pan":
                self._statusbar.showMessage("Pan mode: Drag to move around")

    def _update_ui_state(self):
        """Update UI elements based on current state."""
        has_image = self._image_handler.is_loaded
        roots = self._root_tracer.get_all_roots()
        has_roots = len(roots) > 0
        current_root_id = self._root_tracer.get_current_root_id()

        # Enable/disable controls
        self._btn_prev_slice.setEnabled(has_image and self._image_handler.current_slice > 0)
        self._btn_next_slice.setEnabled(
            has_image and self._image_handler.current_slice < self._image_handler.num_slices - 1
        )
        self._slice_slider.setEnabled(has_image)
        self._txt_slice_name.setEnabled(has_image)
        self._btn_apply_name.setEnabled(has_image)

        self._btn_trace_main.setEnabled(has_image and self._pending_start_point is not None)
        self._btn_trace_laterals.setEnabled(has_roots)
        self._btn_clear_current.setEnabled(has_roots)
        self._btn_clear_all.setEnabled(has_roots)
        self._btn_delete_root.setEnabled(has_roots)

        self._btn_export_current.setEnabled(has_roots)
        self._btn_export_all.setEnabled(len(self._slice_data) > 0)
        self._btn_export_points.setEnabled(has_roots)

        # Update slice info
        if has_image:
            current = self._image_handler.current_slice + 1
            total = self._image_handler.num_slices
            self._lbl_slice_info.setText(f"Slice: {current}/{total}")
            self._txt_slice_name.setText(self._image_handler.get_slice_name())

        # Update root list
        self._update_root_list()

    def _update_root_list(self):
        """Update the root list widget."""
        self._list_roots.clear()
        roots = self._root_tracer.get_all_roots()
        current_id = self._root_tracer.get_current_root_id()

        for root in roots:
            root_id = root['id']
            num_laterals = len(root.get('laterals', []))
            item = QListWidgetItem(f"Root {root_id} ({num_laterals} laterals)")
            item.setData(Qt.ItemDataRole.UserRole, root_id)
            self._list_roots.addItem(item)

            if root_id == current_id:
                self._list_roots.setCurrentItem(item)

    def _update_canvas_display(self):
        """Update the canvas with current roots."""
        roots = self._root_tracer.get_all_roots()
        self._canvas.set_roots(roots)

    def _update_measurements_table(self):
        """Update the measurements table with current data."""
        self._tbl_measurements.setRowCount(0)

        roots = self._root_tracer.get_all_roots()
        pixels_per_unit = self._spin_pixels_per_unit.value()
        unit = self._cmb_unit.currentText()

        measurements = []

        total_main_length = 0
        total_lateral_count = 0
        total_lateral_length = 0

        for root in roots:
            root_id = root['id']
            main_points = root.get('points', [])
            laterals = root.get('laterals', [])

            if main_points:
                main_length = self._measurement_calc.calculate_path_length(main_points, pixels_per_unit)
                total_main_length += main_length
                measurements.append((f"Root {root_id} Length", f"{main_length:.3f} {unit}"))

            for lat in laterals:
                total_lateral_count += 1
                lat_length = self._measurement_calc.calculate_path_length(
                    lat.get('points', []), pixels_per_unit
                )
                total_lateral_length += lat_length

            measurements.append((f"Root {root_id} Laterals", str(len(laterals))))

        # Summary
        if roots:
            measurements.append(("---", "---"))
            measurements.append(("Total Main Root Length", f"{total_main_length:.3f} {unit}"))
            measurements.append(("Total Lateral Count", str(total_lateral_count)))
            measurements.append(("Total Lateral Length", f"{total_lateral_length:.3f} {unit}"))

        # Populate table
        self._tbl_measurements.setRowCount(len(measurements))
        for i, (name, value) in enumerate(measurements):
            self._tbl_measurements.setItem(i, 0, QTableWidgetItem(name))
            self._tbl_measurements.setItem(i, 1, QTableWidgetItem(value))

    def _save_current_slice_data(self):
        """Save the current slice's tracing data."""
        if not self._image_handler.is_loaded:
            return

        slice_idx = self._image_handler.current_slice
        roots = self._root_tracer.get_all_roots()

        if roots:
            # Deep copy roots data
            import copy
            self._slice_data[slice_idx] = copy.deepcopy(roots)
        elif slice_idx in self._slice_data:
            del self._slice_data[slice_idx]

    def _load_slice_data(self):
        """Load saved data for current slice."""
        slice_idx = self._image_handler.current_slice

        if slice_idx in self._slice_data:
            import copy
            roots = copy.deepcopy(self._slice_data[slice_idx])
            self._root_tracer.set_data(roots)
        else:
            self._root_tracer.clear_tracings()

    @Slot()
    def _on_escape(self):
        """Handle escape key - cancel current operation."""
        self._pending_start_point = None
        self._manual_lateral_start = None
        self._canvas.set_start_point(None)
        self._canvas.set_manual_lateral_start(None)
        self._set_mode("select")
        self._statusbar.showMessage("Cancelled")
        self._update_ui_state()

    @Slot()
    def _on_open_file(self):
        """Handle open file action."""
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "Open TIFF Image",
            "",
            "TIFF Files (*.tif *.tiff);;All Files (*)"
        )

        if file_path:
            self._statusbar.showMessage(f"Loading {file_path}...")

            if self._image_handler.load_tiff(file_path):
                # Reset state
                self._slice_data = {}
                self._root_tracer.clear_tracings()
                self._canvas.clear_tracings()
                self._pending_start_point = None

                # Setup slider
                self._slice_slider.setMaximum(self._image_handler.num_slices - 1)
                self._slice_slider.setValue(0)

                # Display first slice
                self._display_current_slice()

                self._statusbar.showMessage(
                    f"Loaded: {os.path.basename(file_path)} "
                    f"({self._image_handler.num_slices} slices) - Click on root to begin"
                )
            else:
                QMessageBox.critical(self, "Error", "Failed to load TIFF file")
                self._statusbar.showMessage("Failed to load file")

            self._update_ui_state()

    def _display_current_slice(self):
        """Display the current slice."""
        if not self._image_handler.is_loaded:
            return

        img = self._image_handler.normalize_slice()
        if img is not None:
            self._canvas.set_image(img)
            self._root_tracer.set_image(img)
            self._root_tracer.set_threshold(self._spin_threshold.value())

            # Load saved data
            self._load_slice_data()

            # Update display
            self._update_canvas_display()
            self._update_measurements_table()
            self._update_root_list()

    @Slot(int, int)
    def _on_point_clicked(self, x: int, y: int):
        """Handle point click on canvas in select mode."""
        self._pending_start_point = (x, y)
        self._canvas.set_start_point((x, y))
        self._statusbar.showMessage(f"Start point set at ({x}, {y}) - Press T to trace")
        self._update_ui_state()

    @Slot(int, int)
    def _on_delete_requested(self, x: int, y: int):
        """Handle delete click."""
        result = self._root_tracer.find_lateral_at_point(x, y)
        if result:
            root_id, lateral_id = result
            if self._root_tracer.delete_lateral(root_id, lateral_id):
                self._update_canvas_display()
                self._update_measurements_table()
                self._update_root_list()
                self._statusbar.showMessage(f"Deleted lateral {lateral_id} from root {root_id}")
            else:
                self._statusbar.showMessage("Could not delete lateral")
        else:
            self._statusbar.showMessage("No lateral found at that location")

    @Slot(int, int)
    def _on_manual_lateral_point(self, x: int, y: int):
        """Handle manual lateral point click."""
        if self._manual_lateral_start is None:
            # First click - set start point
            self._manual_lateral_start = (x, y)
            self._canvas.set_manual_lateral_start((x, y))
            self._statusbar.showMessage(f"Lateral start at ({x}, {y}) - Click end point")
        else:
            # Second click - create lateral
            current_root_id = self._root_tracer.get_current_root_id()
            if current_root_id == 0:
                # No root selected, try to find one near the start point
                found_root = self._root_tracer.find_main_root_at_point(
                    self._manual_lateral_start[0], self._manual_lateral_start[1], tolerance=30
                )
                if found_root:
                    current_root_id = found_root
                else:
                    QMessageBox.warning(self, "Warning", "No main root found near start point")
                    self._manual_lateral_start = None
                    self._canvas.set_manual_lateral_start(None)
                    return

            result = self._root_tracer.add_manual_lateral(
                current_root_id, self._manual_lateral_start, (x, y)
            )

            if result:
                self._update_canvas_display()
                self._update_measurements_table()
                self._update_root_list()
                self._statusbar.showMessage(f"Added manual lateral to root {current_root_id}")
            else:
                self._statusbar.showMessage("Could not create lateral")

            self._manual_lateral_start = None
            self._canvas.set_manual_lateral_start(None)

    @Slot(float)
    def _on_zoom_changed(self, zoom: float):
        """Handle zoom level change."""
        self._lbl_zoom.setText(f"{zoom * 100:.0f}%")

    @Slot()
    def _on_prev_slice(self):
        """Go to previous slice."""
        if self._image_handler.current_slice > 0:
            self._save_current_slice_data()
            self._pending_start_point = None
            self._canvas.set_start_point(None)
            self._image_handler.current_slice -= 1
            self._slice_slider.setValue(self._image_handler.current_slice)

    @Slot()
    def _on_next_slice(self):
        """Go to next slice."""
        if self._image_handler.current_slice < self._image_handler.num_slices - 1:
            self._save_current_slice_data()
            self._pending_start_point = None
            self._canvas.set_start_point(None)
            self._image_handler.current_slice += 1
            self._slice_slider.setValue(self._image_handler.current_slice)

    @Slot(int)
    def _on_slice_changed(self, value: int):
        """Handle slice slider change."""
        if self._image_handler.current_slice != value:
            self._save_current_slice_data()
            self._pending_start_point = None
            self._canvas.set_start_point(None)
            self._image_handler.current_slice = value
            self._display_current_slice()
            self._update_ui_state()

    @Slot()
    def _on_apply_slice_name(self):
        """Apply the entered slice name."""
        name = self._txt_slice_name.text().strip()
        if name:
            self._image_handler.set_slice_name(name)
            self._statusbar.showMessage(f"Slice name set to: {name}")

    @Slot(int)
    def _on_threshold_changed(self, value: int):
        """Handle threshold change."""
        self._root_tracer.set_threshold(value)

    @Slot(int)
    def _on_root_selected(self, row: int):
        """Handle root selection in list."""
        if row >= 0:
            item = self._list_roots.item(row)
            if item:
                root_id = item.data(Qt.ItemDataRole.UserRole)
                self._root_tracer.set_current_root_id(root_id)

    @Slot()
    def _on_delete_selected_root(self):
        """Delete the selected root."""
        current_item = self._list_roots.currentItem()
        if current_item:
            root_id = current_item.data(Qt.ItemDataRole.UserRole)
            if self._root_tracer.delete_main_root(root_id):
                self._update_canvas_display()
                self._update_measurements_table()
                self._update_root_list()
                self._statusbar.showMessage(f"Deleted root {root_id}")

    @Slot()
    def _on_trace_main_root(self):
        """Trace the main root from start point."""
        if self._pending_start_point is None:
            self._statusbar.showMessage("Click on root start point first")
            return

        self._statusbar.showMessage("Tracing main root...")

        result = self._root_tracer.trace_main_root(self._pending_start_point)

        if result and result.get('points'):
            self._canvas.set_start_point(None)
            self._pending_start_point = None
            self._update_canvas_display()
            self._update_measurements_table()
            self._update_root_list()
            self._statusbar.showMessage(
                f"Traced root {result['id']} with {len(result['points'])} points - "
                "Press L to trace laterals or click another root"
            )
        else:
            QMessageBox.warning(
                self, "Warning",
                "Could not trace root. Try adjusting threshold or clicking closer to the root."
            )
            self._statusbar.showMessage("Tracing failed")

        self._update_ui_state()

    @Slot()
    def _on_trace_laterals(self):
        """Trace lateral roots for current root."""
        current_root_id = self._root_tracer.get_current_root_id()

        if current_root_id == 0:
            roots = self._root_tracer.get_all_roots()
            if roots:
                current_root_id = roots[-1]['id']
            else:
                QMessageBox.warning(self, "Warning", "No main root traced yet")
                return

        self._statusbar.showMessage("Tracing lateral roots...")

        laterals = self._root_tracer.trace_laterals_for_root(current_root_id)

        if laterals:
            self._update_canvas_display()
            self._update_measurements_table()
            self._update_root_list()
            self._statusbar.showMessage(f"Found {len(laterals)} lateral roots")
        else:
            self._statusbar.showMessage("No new lateral roots found")

        self._update_ui_state()

    @Slot()
    def _on_clear_current_root(self):
        """Clear the current/last root."""
        roots = self._root_tracer.get_all_roots()
        if roots:
            current_id = self._root_tracer.get_current_root_id()
            if current_id == 0:
                current_id = roots[-1]['id']

            self._root_tracer.delete_main_root(current_id)
            self._update_canvas_display()
            self._update_measurements_table()
            self._update_root_list()
            self._statusbar.showMessage(f"Cleared root {current_id}")

        self._update_ui_state()

    @Slot()
    def _on_clear_all(self):
        """Clear all tracings."""
        self._root_tracer.clear_tracings()
        self._canvas.clear_tracings()
        self._pending_start_point = None
        self._update_measurements_table()
        self._update_root_list()

        # Remove saved data for current slice
        slice_idx = self._image_handler.current_slice
        if slice_idx in self._slice_data:
            del self._slice_data[slice_idx]

        self._statusbar.showMessage("All tracings cleared")
        self._update_ui_state()

    def _prepare_export_data(self) -> List[Dict]:
        """Prepare data for export."""
        self._save_current_slice_data()

        export_data = []
        pixels_per_unit = self._spin_pixels_per_unit.value()

        for slice_idx, roots in self._slice_data.items():
            slice_name = self._image_handler.get_slice_name(slice_idx)

            for root in roots:
                main_points = root.get('points', [])
                main_length = self._measurement_calc.calculate_path_length(main_points, pixels_per_unit)

                lateral_data = []
                for lat in root.get('laterals', []):
                    lat_length = self._measurement_calc.calculate_path_length(
                        lat.get('points', []), pixels_per_unit
                    )
                    angle = self._measurement_calc.calculate_lateral_angle(
                        main_points, lat.get('points', []), lat.get('start_index', 0)
                    )
                    branch_pos = self._measurement_calc.get_branch_position(
                        main_points, lat.get('start_index', 0), pixels_per_unit
                    )
                    lateral_data.append({
                        'points': lat.get('points', []),
                        'length': lat_length,
                        'angle': angle,
                        'branch_position': branch_pos,
                        'start_index': lat.get('start_index', 0)
                    })

                export_data.append({
                    'slice_name': f"{slice_name}_Root{root['id']}",
                    'main_root_points': main_points,
                    'main_root_length': main_length,
                    'lateral_roots': lateral_data
                })

        return export_data

    @Slot()
    def _on_export_current(self):
        """Export current slice measurements."""
        self._save_current_slice_data()

        slice_idx = self._image_handler.current_slice
        if slice_idx not in self._slice_data:
            QMessageBox.warning(self, "Warning", "No tracing data to export")
            return

        export_data = self._prepare_export_data()
        slice_name = self._image_handler.get_slice_name()

        # Filter to current slice
        current_data = [d for d in export_data if d['slice_name'].startswith(slice_name)]

        if not current_data:
            QMessageBox.warning(self, "Warning", "No tracing data to export")
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Export Measurements",
            f"{slice_name}_measurements.csv",
            "CSV Files (*.csv)"
        )

        if file_path:
            unit = self._cmb_unit.currentText()
            if CSVExporter.export_measurements(file_path, current_data, 1.0, unit):
                self._statusbar.showMessage(f"Exported to {file_path}")
            else:
                QMessageBox.critical(self, "Error", "Failed to export CSV")

    @Slot()
    def _on_export_all(self):
        """Export all slices measurements."""
        export_data = self._prepare_export_data()

        if not export_data:
            QMessageBox.warning(self, "Warning", "No tracing data to export")
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Export All Measurements",
            "root_measurements.csv",
            "CSV Files (*.csv)"
        )

        if file_path:
            unit = self._cmb_unit.currentText()
            if CSVExporter.export_measurements(file_path, export_data, 1.0, unit):
                self._statusbar.showMessage(f"Exported {len(export_data)} roots to {file_path}")
            else:
                QMessageBox.critical(self, "Error", "Failed to export CSV")

    @Slot()
    def _on_export_points(self):
        """Export all traced points."""
        export_data = self._prepare_export_data()

        if not export_data:
            QMessageBox.warning(self, "Warning", "No tracing data to export")
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Export Points",
            "root_points.csv",
            "CSV Files (*.csv)"
        )

        if file_path:
            if CSVExporter.export_points(file_path, export_data, 1.0):
                self._statusbar.showMessage(f"Exported points to {file_path}")
            else:
                QMessageBox.critical(self, "Error", "Failed to export CSV")

    def _show_about(self):
        """Show about dialog."""
        QMessageBox.about(
            self,
            "About Arabidopsis Root Tracer",
            "<h3>Arabidopsis Root Tracer</h3>"
            "<p>A semi-automatic tool for tracing Arabidopsis roots "
            "and lateral roots from plate images.</p>"
            "<p>Supports multiple roots per slice with automatic "
            "lateral detection and manual corrections.</p>"
        )

    def _show_shortcuts(self):
        """Show keyboard shortcuts."""
        QMessageBox.information(
            self,
            "Keyboard Shortcuts",
            "<h3>Keyboard Shortcuts</h3>"
            "<table>"
            "<tr><td><b>O</b></td><td>Open TIFF file</td></tr>"
            "<tr><td><b>T</b></td><td>Trace main root</td></tr>"
            "<tr><td><b>L</b></td><td>Trace lateral roots</td></tr>"
            "<tr><td><b>C</b></td><td>Clear current root</td></tr>"
            "<tr><td><b>S</b></td><td>Select/Trace mode</td></tr>"
            "<tr><td><b>X</b></td><td>Delete mode</td></tr>"
            "<tr><td><b>M</b></td><td>Manual lateral mode</td></tr>"
            "<tr><td><b>P</b></td><td>Pan mode</td></tr>"
            "<tr><td><b>A/D</b></td><td>Previous/Next slice</td></tr>"
            "<tr><td><b>F</b></td><td>Fit to window</td></tr>"
            "<tr><td><b>R</b></td><td>Reset zoom</td></tr>"
            "<tr><td><b>Escape</b></td><td>Cancel current operation</td></tr>"
            "<tr><td><b>Ctrl+E</b></td><td>Export all</td></tr>"
            "</table>"
            "<p><b>Mouse:</b> Scroll wheel = zoom, Middle button = pan</p>"
        )

    def closeEvent(self, event):
        """Handle window close."""
        self._save_current_slice_data()
        event.accept()
