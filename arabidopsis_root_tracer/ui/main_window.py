"""
Main window for the Arabidopsis Root Tracer application.
"""

import os
import copy
from typing import Optional, List, Dict, Tuple
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QSlider, QLineEdit, QGroupBox, QTableWidget, QTableWidgetItem,
    QFileDialog, QMessageBox, QSpinBox, QSplitter, QStatusBar, QToolBar,
    QComboBox, QDoubleSpinBox, QFrame, QRadioButton, QListWidget, QListWidgetItem,
    QHeaderView
)
from PySide6.QtCore import Qt, Slot, QTimer
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

        # State - slice data stored separately from tracer
        self._slice_data: Dict[int, List[Dict]] = {}
        self._start_point: Optional[tuple] = None  # For MODE_SELECT
        self._start_end_first: Optional[tuple] = None  # For MODE_START_END
        self._manual_lateral_start: Optional[tuple] = None
        self._angle_points: List[tuple] = []  # For MODE_ANGLE_MEASURE (3 points)
        self._crop_rect: Optional[Tuple[int, int, int, int]] = None  # For clear outside

        # ML components (lazy loaded)
        self._ml_model = None
        self._ml_predictor = None

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

        splitter = QSplitter(Qt.Orientation.Horizontal)
        main_layout.addWidget(splitter)

        # Left panel - Image display
        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)

        self._canvas = ImageCanvas()
        left_layout.addWidget(self._canvas, stretch=1)

        # Slice navigation
        slice_group = QGroupBox("Slice Navigation (A/D)")
        slice_layout = QHBoxLayout(slice_group)

        self._btn_prev_slice = QPushButton("< Prev")
        self._btn_prev_slice.setFixedWidth(70)
        self._slice_slider = QSlider(Qt.Orientation.Horizontal)
        self._slice_slider.setMinimum(0)
        self._slice_slider.setMaximum(0)
        self._btn_next_slice = QPushButton("Next >")
        self._btn_next_slice.setFixedWidth(70)
        self._lbl_slice_info = QLabel("0/0")
        self._lbl_slice_info.setMinimumWidth(50)

        slice_layout.addWidget(self._btn_prev_slice)
        slice_layout.addWidget(self._slice_slider, stretch=1)
        slice_layout.addWidget(self._btn_next_slice)
        slice_layout.addWidget(self._lbl_slice_info)

        left_layout.addWidget(slice_group)
        splitter.addWidget(left_panel)

        # Right panel - Controls
        right_panel = QWidget()
        right_panel.setMaximumWidth(450)
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
        mode_group = QGroupBox("Mode")
        mode_layout = QVBoxLayout(mode_group)

        self._radio_select = QRadioButton("Click Start (S) - Click start, then T to trace")
        self._radio_start_end = QRadioButton("Start+End (E) - Click start, then click end")
        self._radio_delete = QRadioButton("Delete (X) - Click lateral to delete")
        self._radio_manual = QRadioButton("Manual Lateral (M) - Click start, then end")
        self._radio_angle = QRadioButton("Measure Angle (G) - Click 3 pts, 2nd is vertex")
        self._radio_crop = QRadioButton("Clear Outside (K) - Draw rectangle to keep")
        self._radio_pan = QRadioButton("Pan (P) - Drag to pan")

        self._radio_select.setChecked(True)
        mode_layout.addWidget(self._radio_select)
        mode_layout.addWidget(self._radio_start_end)
        mode_layout.addWidget(self._radio_delete)
        mode_layout.addWidget(self._radio_manual)
        mode_layout.addWidget(self._radio_angle)
        mode_layout.addWidget(self._radio_crop)
        mode_layout.addWidget(self._radio_pan)

        right_layout.addWidget(mode_group)

        # Tracing controls - compact layout
        trace_group = QGroupBox("Tracing")
        trace_layout = QVBoxLayout(trace_group)
        trace_layout.setSpacing(4)

        # Threshold and invert in one row
        thresh_layout = QHBoxLayout()
        thresh_layout.addWidget(QLabel("Thresh:"))
        self._spin_threshold = QSpinBox()
        self._spin_threshold.setRange(1, 255)
        self._spin_threshold.setValue(30)
        self._spin_threshold.setFixedWidth(60)
        thresh_layout.addWidget(self._spin_threshold)

        from PySide6.QtWidgets import QCheckBox, QToolButton, QMenu
        self._chk_invert = QCheckBox("Invert")
        thresh_layout.addWidget(self._chk_invert)
        thresh_layout.addStretch()
        trace_layout.addLayout(thresh_layout)

        # Lateral buttons in row
        lat_layout = QHBoxLayout()
        self._btn_trace_laterals = QPushButton("Laterals (L)")
        self._btn_trace_all_laterals = QPushButton("All Lat (⇧L)")
        lat_layout.addWidget(self._btn_trace_laterals)
        lat_layout.addWidget(self._btn_trace_all_laterals)
        trace_layout.addLayout(lat_layout)

        # Clear buttons in row
        clear_layout = QHBoxLayout()
        self._btn_clear_current = QPushButton("Clear Root (C)")
        self._btn_clear_all = QPushButton("Clear All")
        clear_layout.addWidget(self._btn_clear_current)
        clear_layout.addWidget(self._btn_clear_all)
        trace_layout.addLayout(clear_layout)

        right_layout.addWidget(trace_group)

        # Root list
        roots_group = QGroupBox("Roots")
        roots_layout = QVBoxLayout(roots_group)
        self._list_roots = QListWidget()
        self._list_roots.setMaximumHeight(80)
        roots_layout.addWidget(self._list_roots)
        self._btn_delete_root = QPushButton("Delete Selected Root")
        roots_layout.addWidget(self._btn_delete_root)
        right_layout.addWidget(roots_group)

        # Scale settings
        scale_group = QGroupBox("Scale & Angle Mode")
        scale_layout = QVBoxLayout(scale_group)

        # Scale controls
        scale_row = QHBoxLayout()
        self._spin_pixels_per_unit = QDoubleSpinBox()
        self._spin_pixels_per_unit.setRange(0.1, 10000)
        self._spin_pixels_per_unit.setValue(161.0)
        self._spin_pixels_per_unit.setDecimals(1)
        scale_row.addWidget(self._spin_pixels_per_unit)
        scale_row.addWidget(QLabel("px /"))
        self._cmb_unit = QComboBox()
        self._cmb_unit.addItems(["cm", "mm", "um", "inch"])
        scale_row.addWidget(self._cmb_unit)
        scale_layout.addLayout(scale_row)

        # Main root tip angle mode
        self._chk_main_root_tip_angle = QCheckBox("Main Root Tip Angle (curvature)")
        self._chk_main_root_tip_angle.setToolTip(
            "Checked: Measure angle at tip where curvature begins (∠ABC where B is curvature point)\n"
            "Unchecked: Measure overall angle from start to end"
        )
        scale_layout.addWidget(self._chk_main_root_tip_angle)

        # Lateral angle mode
        self._chk_lateral_tip_angle = QCheckBox("LR Tip Angle (vs Branch Angle)")
        self._chk_lateral_tip_angle.setToolTip(
            "Checked: Measure lateral angle at tip (growth direction)\n"
            "Unchecked: Measure lateral angle at branch point"
        )
        scale_layout.addWidget(self._chk_lateral_tip_angle)

        right_layout.addWidget(scale_group)

        # Measurements table - new format
        measure_group = QGroupBox("Measurements")
        measure_layout = QVBoxLayout(measure_group)

        self._tbl_measurements = QTableWidget()
        self._tbl_measurements.setColumnCount(10)
        self._tbl_measurements.setHorizontalHeaderLabels([
            "Slice", "Root#", "Length", "Angle", "Lat.Cnt", "Lat.Len", "Density", "Lat/Unit", "L-Ang", "R-Ang"
        ])
        self._tbl_measurements.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self._tbl_measurements.setMinimumHeight(150)
        measure_layout.addWidget(self._tbl_measurements)

        right_layout.addWidget(measure_group)

        # Export and ML in one group with dropdown
        actions_group = QGroupBox("Actions")
        actions_layout = QVBoxLayout(actions_group)
        actions_layout.setSpacing(4)

        # Export buttons in row
        export_layout = QHBoxLayout()
        self._btn_export_all = QPushButton("Export CSV")
        self._btn_export_points = QPushButton("Export Points")
        export_layout.addWidget(self._btn_export_all)
        export_layout.addWidget(self._btn_export_points)
        actions_layout.addLayout(export_layout)

        # ML buttons - use dropdown menu
        ml_layout = QHBoxLayout()
        self._btn_auto_detect = QPushButton("Auto-Detect")
        self._btn_auto_detect.setEnabled(False)

        # ML menu button
        self._btn_ml_menu = QToolButton()
        self._btn_ml_menu.setText("ML ▼")
        self._btn_ml_menu.setPopupMode(QToolButton.ToolButtonPopupMode.InstantPopup)
        ml_menu = QMenu(self._btn_ml_menu)
        self._action_export_training = ml_menu.addAction("Export Training Data")
        self._action_train_model = ml_menu.addAction("Train Model...")
        self._action_load_model = ml_menu.addAction("Load Model...")
        self._btn_ml_menu.setMenu(ml_menu)

        ml_layout.addWidget(self._btn_auto_detect)
        ml_layout.addWidget(self._btn_ml_menu)
        actions_layout.addLayout(ml_layout)

        right_layout.addWidget(actions_group)

        right_layout.addStretch()

        # Shortcuts help
        help_label = QLabel(
            "<small><b>Keys:</b> S=Click Start, E=Start+End, T=Trace, "
            "L=Laterals, X=Delete, M=Manual, G=Angle, K=Crop, P=Pan, A/D=Slice</small>"
        )
        help_label.setWordWrap(True)
        right_layout.addWidget(help_label)

        splitter.addWidget(right_panel)
        splitter.setSizes([800, 450])

    def _setup_menubar(self):
        menubar = self.menuBar()

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

        import_points_action = QAction("&Import Points...", self)
        import_points_action.triggered.connect(self._on_import_points)
        file_menu.addAction(import_points_action)

        file_menu.addSeparator()
        exit_action = QAction("E&xit", self)
        exit_action.setShortcut(QKeySequence.StandardKey.Quit)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # Image menu
        image_menu = menubar.addMenu("&Image")
        clear_outside_action = QAction("&Clear Outside Rectangle (Apply)", self)
        clear_outside_action.triggered.connect(self._on_apply_clear_outside)
        image_menu.addAction(clear_outside_action)
        cancel_crop_action = QAction("Cancel &Rectangle", self)
        cancel_crop_action.triggered.connect(self._on_cancel_crop_rect)
        image_menu.addAction(cancel_crop_action)

        view_menu = menubar.addMenu("&View")
        fit_action = QAction("&Fit to Window (F)", self)
        fit_action.triggered.connect(self._canvas.fit_to_view)
        view_menu.addAction(fit_action)
        reset_action = QAction("&Reset Zoom (R)", self)
        reset_action.triggered.connect(self._canvas.reset_zoom)
        view_menu.addAction(reset_action)

        help_menu = menubar.addMenu("&Help")
        about_action = QAction("&About", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)

    def _setup_toolbar(self):
        toolbar = QToolBar()
        toolbar.setMovable(False)
        self.addToolBar(toolbar)

        open_action = QAction("Open", self)
        open_action.triggered.connect(self._on_open_file)
        toolbar.addAction(open_action)
        toolbar.addSeparator()

        toolbar.addWidget(QLabel("Zoom: "))
        self._lbl_zoom = QLabel("100%")
        self._lbl_zoom.setMinimumWidth(50)
        toolbar.addWidget(self._lbl_zoom)

        fit_action = QAction("Fit", self)
        fit_action.triggered.connect(self._canvas.fit_to_view)
        toolbar.addAction(fit_action)

        toolbar.addSeparator()
        toolbar.addWidget(QLabel("Mode: "))
        self._lbl_mode = QLabel("Click Start")
        self._lbl_mode.setStyleSheet("font-weight: bold; color: green;")
        toolbar.addWidget(self._lbl_mode)

    def _setup_statusbar(self):
        self._statusbar = QStatusBar()
        self.setStatusBar(self._statusbar)
        self._statusbar.showMessage("Press O to open a TIFF image")

    def _setup_shortcuts(self):
        QShortcut(QKeySequence("O"), self, self._on_open_file)
        QShortcut(QKeySequence("S"), self, lambda: self._set_mode("select"))
        QShortcut(QKeySequence("E"), self, lambda: self._set_mode("start_end"))
        QShortcut(QKeySequence("T"), self, self._on_trace_from_start)  # Trace from clicked start
        QShortcut(QKeySequence("X"), self, lambda: self._set_mode("delete"))
        QShortcut(QKeySequence("M"), self, lambda: self._set_mode("manual"))
        QShortcut(QKeySequence("G"), self, lambda: self._set_mode("angle"))  # Angle measurement
        QShortcut(QKeySequence("K"), self, lambda: self._set_mode("crop"))  # Crop/clear outside
        QShortcut(QKeySequence("P"), self, lambda: self._set_mode("pan"))
        QShortcut(QKeySequence("L"), self, self._on_trace_laterals)
        QShortcut(QKeySequence("Shift+L"), self, self._on_trace_all_laterals)
        QShortcut(QKeySequence("C"), self, self._on_clear_current_root)
        QShortcut(QKeySequence("A"), self, self._on_prev_slice)
        QShortcut(QKeySequence("D"), self, self._on_next_slice)
        QShortcut(QKeySequence("F"), self, self._canvas.fit_to_view)
        QShortcut(QKeySequence("R"), self, self._canvas.reset_zoom)
        QShortcut(QKeySequence("Escape"), self, self._on_escape)

    def _connect_signals(self):
        # Canvas signals
        self._canvas.zoom_changed.connect(self._on_zoom_changed)
        self._canvas.point_clicked.connect(self._on_point_clicked)
        self._canvas.start_end_point.connect(self._on_start_end_point)
        self._canvas.delete_requested.connect(self._on_delete_requested)
        self._canvas.manual_lateral_point.connect(self._on_manual_lateral_point)
        self._canvas.angle_point.connect(self._on_angle_point)
        self._canvas.crop_rect_changed.connect(self._on_crop_rect_changed)

        # Mode radio buttons
        self._radio_select.toggled.connect(lambda c: c and self._set_mode("select"))
        self._radio_start_end.toggled.connect(lambda c: c and self._set_mode("start_end"))
        self._radio_delete.toggled.connect(lambda c: c and self._set_mode("delete"))
        self._radio_manual.toggled.connect(lambda c: c and self._set_mode("manual"))
        self._radio_angle.toggled.connect(lambda c: c and self._set_mode("angle"))
        self._radio_crop.toggled.connect(lambda c: c and self._set_mode("crop"))
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
        self._chk_invert.stateChanged.connect(self._on_invert_changed)
        self._btn_trace_laterals.clicked.connect(self._on_trace_laterals)
        self._btn_clear_current.clicked.connect(self._on_clear_current_root)
        self._btn_clear_all.clicked.connect(self._on_clear_all)

        # Root list
        self._list_roots.currentRowChanged.connect(self._on_root_selected)
        self._btn_delete_root.clicked.connect(self._on_delete_selected_root)
        self._btn_trace_all_laterals.clicked.connect(self._on_trace_all_laterals)

        # Scale and angle mode changes
        self._spin_pixels_per_unit.valueChanged.connect(self._update_measurements_table)
        self._cmb_unit.currentIndexChanged.connect(self._update_measurements_table)
        self._chk_main_root_tip_angle.stateChanged.connect(self._on_main_root_angle_mode_changed)
        self._chk_lateral_tip_angle.stateChanged.connect(self._on_lateral_angle_mode_changed)

        # Export
        self._btn_export_all.clicked.connect(self._on_export_all)
        self._btn_export_points.clicked.connect(self._on_export_points)

        # Machine Learning (menu actions)
        self._action_export_training.triggered.connect(self._on_export_training_data)
        self._action_train_model.triggered.connect(self._on_train_model)
        self._action_load_model.triggered.connect(self._on_load_model)
        self._btn_auto_detect.clicked.connect(self._on_auto_detect)

    def _set_mode(self, mode: str):
        mode_map = {
            "select": (ImageCanvas.MODE_SELECT, self._radio_select, "Click Start"),
            "start_end": (ImageCanvas.MODE_START_END, self._radio_start_end, "Start+End"),
            "delete": (ImageCanvas.MODE_DELETE, self._radio_delete, "Delete"),
            "manual": (ImageCanvas.MODE_MANUAL_LATERAL, self._radio_manual, "Manual"),
            "angle": (ImageCanvas.MODE_ANGLE_MEASURE, self._radio_angle, "Angle"),
            "crop": (ImageCanvas.MODE_CROP_RECT, self._radio_crop, "Crop"),
            "pan": (ImageCanvas.MODE_PAN, self._radio_pan, "Pan"),
        }

        if mode in mode_map:
            canvas_mode, radio, label = mode_map[mode]
            self._canvas.set_mode(canvas_mode)
            radio.setChecked(True)
            self._lbl_mode.setText(label)
            self._manual_lateral_start = None
            self._start_end_first = None
            self._angle_points = []
            self._canvas.set_manual_lateral_start(None)
            self._canvas.set_start_end_first(None)
            self._canvas.set_angle_points([])

            messages = {
                "select": "Click on root start, then press T to trace",
                "start_end": "Click start of root, then click end of root",
                "delete": "Click on a lateral to delete it",
                "manual": "Click start near main root, then click end",
                "angle": "Click 3 points to measure angle (2nd point is vertex)",
                "crop": "Draw rectangle, then Image > Clear Outside to apply to all slices",
                "pan": "Drag to pan the view",
            }
            self._statusbar.showMessage(messages.get(mode, ""))

    def _update_ui_state(self):
        has_image = self._image_handler.is_loaded
        roots = self._root_tracer.get_all_roots()
        has_roots = len(roots) > 0

        self._btn_prev_slice.setEnabled(has_image and self._image_handler.current_slice > 0)
        self._btn_next_slice.setEnabled(
            has_image and self._image_handler.current_slice < self._image_handler.num_slices - 1
        )
        self._slice_slider.setEnabled(has_image)
        self._txt_slice_name.setEnabled(has_image)
        self._btn_apply_name.setEnabled(has_image)

        self._btn_trace_laterals.setEnabled(has_roots)
        self._btn_clear_current.setEnabled(has_roots)
        self._btn_clear_all.setEnabled(has_roots)
        self._btn_delete_root.setEnabled(has_roots)
        self._btn_export_all.setEnabled(len(self._slice_data) > 0 or has_roots)
        self._btn_export_points.setEnabled(len(self._slice_data) > 0 or has_roots)

        if has_image:
            current = self._image_handler.current_slice + 1
            total = self._image_handler.num_slices
            self._lbl_slice_info.setText(f"{current}/{total}")
            self._txt_slice_name.setText(self._image_handler.get_slice_name())

        self._update_root_list()

    def _update_root_list(self):
        self._list_roots.clear()
        roots = self._root_tracer.get_all_roots()
        current_id = self._root_tracer.get_current_root_id()

        for root in roots:
            root_id = root['id']
            num_laterals = len(root.get('laterals', []))
            item = QListWidgetItem(f"Root {root_id} ({num_laterals} lat)")
            item.setData(Qt.ItemDataRole.UserRole, root_id)
            self._list_roots.addItem(item)
            if root_id == current_id:
                self._list_roots.setCurrentItem(item)

    def _update_canvas_display(self):
        roots = self._root_tracer.get_all_roots()
        self._canvas.set_roots(roots)
        self._update_canvas_measurements()

    def _update_canvas_measurements(self):
        """Update measurement data for canvas tooltips."""
        pixels_per_unit = self._spin_pixels_per_unit.value()
        unit = self._cmb_unit.currentText()
        roots = self._root_tracer.get_all_roots()
        use_lateral_tip_angle = self._chk_lateral_tip_angle.isChecked()
        use_main_root_tip_angle = self._chk_main_root_tip_angle.isChecked()

        measurements = {}
        for root in roots:
            root_id = root['id']
            main_points = root.get('points', [])
            laterals = root.get('laterals', [])

            root_length = self._measurement_calc.calculate_path_length(main_points, pixels_per_unit)

            # Use tip curvature angle or overall angle based on checkbox
            if use_main_root_tip_angle:
                root_angle, vertex_idx = self._measurement_calc.calculate_root_tip_angle(main_points)
            else:
                root_angle = self._measurement_calc.calculate_root_angle(main_points)

            lat_data = {}
            for lat in laterals:
                lat_id = lat.get('id', 0)
                lat_points = lat.get('points', [])
                lat_length = self._measurement_calc.calculate_path_length(lat_points, pixels_per_unit)

                # Use tip angle or branch angle based on checkbox
                if use_lateral_tip_angle:
                    lat_angle = self._measurement_calc.calculate_lateral_tip_angle(lat_points)
                else:
                    lat_angle = self._measurement_calc.calculate_lateral_angle(
                        main_points, lat_points, lat.get('start_index', 0)
                    )

                lat_data[lat_id] = {'length': lat_length, 'angle': lat_angle}

            measurements[root_id] = {
                'length': root_length,
                'angle': root_angle,
                'lat_count': len(laterals),
                'laterals': lat_data
            }

        self._canvas.set_measurements(measurements, pixels_per_unit, unit)

    def _update_measurements_table(self):
        """Update measurements with new column format including angle."""
        self._tbl_measurements.setRowCount(0)

        # Gather all data
        self._save_current_slice_data()
        all_data = []

        pixels_per_unit = self._spin_pixels_per_unit.value()
        unit = self._cmb_unit.currentText()
        use_lateral_tip_angle = self._chk_lateral_tip_angle.isChecked()
        use_main_root_tip_angle = self._chk_main_root_tip_angle.isChecked()

        for slice_idx in sorted(self._slice_data.keys()):
            roots = self._slice_data[slice_idx]
            slice_name = self._image_handler.get_slice_name(slice_idx)

            for root in roots:
                root_id = root['id']
                main_points = root.get('points', [])
                laterals = root.get('laterals', [])

                root_length = self._measurement_calc.calculate_path_length(main_points, pixels_per_unit)

                # Use tip curvature angle or overall angle based on checkbox
                if use_main_root_tip_angle:
                    root_angle, vertex_idx = self._measurement_calc.calculate_root_tip_angle(main_points)
                else:
                    root_angle = self._measurement_calc.calculate_root_angle(main_points)

                lat_count = len(laterals)

                total_lat_length = 0
                for lat in laterals:
                    total_lat_length += self._measurement_calc.calculate_path_length(
                        lat.get('points', []), pixels_per_unit
                    )

                # Lateral density = root length / lateral count
                lat_density = root_length / lat_count if lat_count > 0 else 0

                # Lateral length per unit root = total lat length / root length
                lat_per_unit = total_lat_length / root_length if root_length > 0 else 0

                # Left/right lateral angles - use tip angle or branch angle based on checkbox
                lr_angles = self._measurement_calc.calculate_left_right_lateral_angles(
                    main_points, laterals, use_tip_angle=use_lateral_tip_angle
                )

                all_data.append({
                    'slice': slice_name,
                    'root': root_id,
                    'length': root_length,
                    'angle': root_angle,
                    'lat_count': lat_count,
                    'lat_length': total_lat_length,
                    'density': lat_density,
                    'lat_per_unit': lat_per_unit,
                    'left_angle': lr_angles['left_mean'],
                    'right_angle': lr_angles['right_mean'],
                })

        # Populate table
        self._tbl_measurements.setRowCount(len(all_data))
        for i, row in enumerate(all_data):
            self._tbl_measurements.setItem(i, 0, QTableWidgetItem(row['slice']))
            self._tbl_measurements.setItem(i, 1, QTableWidgetItem(str(row['root'])))
            self._tbl_measurements.setItem(i, 2, QTableWidgetItem(f"{row['length']:.3f}"))
            self._tbl_measurements.setItem(i, 3, QTableWidgetItem(f"{row['angle']:.1f}"))
            self._tbl_measurements.setItem(i, 4, QTableWidgetItem(str(row['lat_count'])))
            self._tbl_measurements.setItem(i, 5, QTableWidgetItem(f"{row['lat_length']:.3f}"))
            self._tbl_measurements.setItem(i, 6, QTableWidgetItem(f"{row['density']:.3f}"))
            self._tbl_measurements.setItem(i, 7, QTableWidgetItem(f"{row['lat_per_unit']:.3f}"))
            self._tbl_measurements.setItem(i, 8, QTableWidgetItem(f"{row['left_angle']:.1f}"))
            self._tbl_measurements.setItem(i, 9, QTableWidgetItem(f"{row['right_angle']:.1f}"))

    def _save_current_slice_data(self):
        """Save current slice data - ISOLATED from other slices."""
        if not self._image_handler.is_loaded:
            return

        slice_idx = self._image_handler.current_slice
        roots = self._root_tracer.get_all_roots()

        if roots:
            self._slice_data[slice_idx] = copy.deepcopy(roots)
        elif slice_idx in self._slice_data:
            del self._slice_data[slice_idx]

    def _load_slice_data(self):
        """Load data for current slice - FRESH tracer state."""
        slice_idx = self._image_handler.current_slice

        # Always clear tracer first
        self._root_tracer.clear_tracings()

        if slice_idx in self._slice_data:
            roots = copy.deepcopy(self._slice_data[slice_idx])
            self._root_tracer.set_data(roots)

    @Slot()
    def _on_escape(self):
        self._start_point = None
        self._start_end_first = None
        self._manual_lateral_start = None
        self._angle_points = []
        self._canvas.set_start_point(None)
        self._canvas.set_start_end_first(None)
        self._canvas.set_manual_lateral_start(None)
        self._canvas.set_angle_points([])
        self._set_mode("select")
        self._statusbar.showMessage("Cancelled")
        self._update_ui_state()

    @Slot()
    def _on_open_file(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Open TIFF Image", "", "TIFF Files (*.tif *.tiff);;All Files (*)"
        )

        if file_path:
            self._statusbar.showMessage(f"Loading {file_path}...")

            if self._image_handler.load_tiff(file_path):
                self._slice_data = {}
                self._root_tracer.clear_tracings()
                self._root_tracer.clear_cache()  # Clear skeleton cache for new image
                self._canvas.clear_tracings()

                self._slice_slider.setMaximum(self._image_handler.num_slices - 1)
                self._slice_slider.setValue(0)

                self._display_current_slice()

                self._statusbar.showMessage(
                    f"Loaded: {os.path.basename(file_path)} ({self._image_handler.num_slices} slices)"
                )
            else:
                QMessageBox.critical(self, "Error", "Failed to load TIFF file")

            self._update_ui_state()

    def _display_current_slice(self):
        """Display current slice - optimized with caching."""
        if not self._image_handler.is_loaded:
            return

        img = self._image_handler.normalize_slice()
        if img is not None:
            slice_idx = self._image_handler.current_slice
            self._canvas.set_image(img)
            self._root_tracer.set_image(img, slice_idx)

            # Load saved data for THIS slice only
            self._load_slice_data()

            self._update_canvas_display()
            self._update_root_list()

    @Slot(int, int)
    def _on_point_clicked(self, x: int, y: int):
        """Handle click in MODE_SELECT - sets start point for tracing."""
        self._start_point = (x, y)
        self._canvas.set_start_point((x, y))
        self._statusbar.showMessage(f"Start point set at ({x}, {y}) - Press T to trace")

    @Slot()
    def _on_trace_from_start(self):
        """Trace main root from the clicked start point (T shortcut)."""
        if self._start_point is None:
            self._statusbar.showMessage("Click on root start first (S mode), then press T")
            return

        result = self._root_tracer.trace_main_root(self._start_point)
        if result and result.get('points'):
            self._update_canvas_display()
            self._update_root_list()
            self._update_measurements_table()
            self._statusbar.showMessage(
                f"Traced root {result['id']} ({len(result['points'])} pts) - Press L for laterals"
            )
        else:
            self._statusbar.showMessage("No root found from start point")

        self._start_point = None
        self._canvas.set_start_point(None)
        self._update_ui_state()

    @Slot(int, int)
    def _on_start_end_point(self, x: int, y: int):
        """Handle click in MODE_START_END - first click sets start, second traces to end."""
        if self._start_end_first is None:
            # First click - set start point
            self._start_end_first = (x, y)
            self._canvas.set_start_end_first((x, y))
            self._statusbar.showMessage(f"Start set at ({x}, {y}) - Click on root end")
        else:
            # Second click - trace from start to end
            points = self._root_tracer.trace_between_points(self._start_end_first, (x, y))
            if points and len(points) > 5:
                result = self._root_tracer.add_root_from_points(points)
                if result:
                    self._update_canvas_display()
                    self._update_root_list()
                    self._update_measurements_table()
                    self._statusbar.showMessage(
                        f"Traced root {result['id']} ({len(points)} pts) - Press L for laterals"
                    )
                else:
                    self._statusbar.showMessage("Failed to add root")
            else:
                self._statusbar.showMessage("No path found between points")

            self._start_end_first = None
            self._canvas.set_start_end_first(None)
            self._update_ui_state()

    @Slot(int, int)
    def _on_delete_requested(self, x: int, y: int):
        result = self._root_tracer.find_lateral_at_point(x, y)
        if result:
            root_id, lateral_id = result
            if self._root_tracer.delete_lateral(root_id, lateral_id):
                self._update_canvas_display()
                self._update_root_list()
                self._update_measurements_table()  # Real-time measurement update
                self._statusbar.showMessage(f"Deleted lateral {lateral_id}")

    @Slot(int, int)
    def _on_manual_lateral_point(self, x: int, y: int):
        if self._manual_lateral_start is None:
            self._manual_lateral_start = (x, y)
            self._canvas.set_manual_lateral_start((x, y))
            self._statusbar.showMessage(f"Start at ({x}, {y}) - click end point")
        else:
            current_root_id = self._root_tracer.get_current_root_id()
            if current_root_id == 0:
                found = self._root_tracer.find_main_root_at_point(
                    self._manual_lateral_start[0], self._manual_lateral_start[1], tolerance=30
                )
                if found:
                    current_root_id = found
                else:
                    self._statusbar.showMessage("No main root found near start")
                    self._manual_lateral_start = None
                    self._canvas.set_manual_lateral_start(None)
                    return

            result = self._root_tracer.add_manual_lateral(
                current_root_id, self._manual_lateral_start, (x, y)
            )

            if result:
                self._update_canvas_display()
                self._update_root_list()
                self._update_measurements_table()  # Real-time measurement update
                self._statusbar.showMessage(f"Added lateral to root {current_root_id}")

            self._manual_lateral_start = None
            self._canvas.set_manual_lateral_start(None)

    @Slot(int, int)
    def _on_angle_point(self, x: int, y: int):
        """Handle click in angle measurement mode."""
        self._angle_points.append((x, y))
        self._canvas.set_angle_points(self._angle_points.copy())

        if len(self._angle_points) == 1:
            self._statusbar.showMessage(f"Point A set at ({x}, {y}) - Click point B (vertex)")
        elif len(self._angle_points) == 2:
            self._statusbar.showMessage(f"Vertex B set at ({x}, {y}) - Click point C")
        elif len(self._angle_points) == 3:
            # Calculate and display the angle
            p1, p2, p3 = self._angle_points
            angle = self._measurement_calc.calculate_three_point_angle(p1, p2, p3)

            # Display result
            abs_angle = abs(angle)
            direction = "left" if angle > 0 else "right" if angle < 0 else ""
            self._statusbar.showMessage(
                f"Angle: {abs_angle:.1f}° ({direction}bend) - Click to start new measurement"
            )

            # Store the measurement for display
            self._canvas.set_angle_measurement(angle, self._angle_points.copy())

            # Reset for next measurement
            self._angle_points = []
            self._canvas.set_angle_points([])

    @Slot(int, int, int, int)
    def _on_crop_rect_changed(self, x1: int, y1: int, x2: int, y2: int):
        """Handle crop rectangle change from canvas."""
        self._crop_rect = (x1, y1, x2, y2)
        self._statusbar.showMessage(
            f"Rectangle: ({x1}, {y1}) to ({x2}, {y2}) - "
            f"Size: {x2-x1}x{y2-y1} - Use Image > Clear Outside to apply"
        )

    @Slot()
    def _on_apply_clear_outside(self):
        """Apply clear outside to all slices."""
        rect = self._canvas.get_crop_rect()
        if rect is None:
            QMessageBox.warning(
                self, "No Rectangle",
                "Please draw a rectangle first using the Clear Outside mode (K)"
            )
            return

        x1, y1, x2, y2 = rect
        x1, x2 = min(x1, x2), max(x1, x2)
        y1, y2 = min(y1, y2), max(y1, y2)

        reply = QMessageBox.question(
            self, "Clear Outside",
            f"This will turn everything outside the rectangle ({x1},{y1}) to ({x2},{y2}) "
            f"to white on ALL {self._image_handler.num_slices} slices.\n\n"
            "This cannot be undone. Continue?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply != QMessageBox.StandardButton.Yes:
            return

        try:
            import numpy as np

            # Apply to all slices
            for i in range(self._image_handler.num_slices):
                img = self._image_handler.get_slice(i)
                if img is not None:
                    # Create mask - set outside region to white (255)
                    # Top
                    img[:y1, :] = 255
                    # Bottom
                    img[y2:, :] = 255
                    # Left
                    img[y1:y2, :x1] = 255
                    # Right
                    img[y1:y2, x2:] = 255

            # Clear the rectangle and refresh display
            self._canvas.set_crop_rect(None)
            self._crop_rect = None
            self._display_current_slice()
            self._statusbar.showMessage(
                f"Cleared outside rectangle on {self._image_handler.num_slices} slices"
            )

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to apply clear outside: {e}")

    @Slot()
    def _on_cancel_crop_rect(self):
        """Cancel the current crop rectangle."""
        self._canvas.set_crop_rect(None)
        self._crop_rect = None
        self._statusbar.showMessage("Rectangle cancelled")

    @Slot()
    def _on_import_points(self):
        """Import previously exported points CSV file."""
        if not self._image_handler.is_loaded:
            QMessageBox.warning(self, "Warning", "Please open an image first")
            return

        file_path, _ = QFileDialog.getOpenFileName(
            self, "Import Points CSV", "", "CSV Files (*.csv);;All Files (*)"
        )

        if not file_path:
            return

        try:
            import csv

            # Read the CSV file
            with open(file_path, 'r') as f:
                reader = csv.DictReader(f)
                rows = list(reader)

            if not rows:
                QMessageBox.warning(self, "Warning", "CSV file is empty")
                return

            # Group points by slice and root
            slice_roots = {}  # {slice_name: {root_type_id: [(x, y), ...]}}

            for row in rows:
                slice_name = row.get('Slice Name', 'Unknown')
                root_type = row.get('Root Type', 'Main Root')
                root_id = int(row.get('Root ID', 1))
                x = int(row.get('X (px)', 0))
                y = int(row.get('Y (px)', 0))

                if slice_name not in slice_roots:
                    slice_roots[slice_name] = {}

                key = (root_type, root_id)
                if key not in slice_roots[slice_name]:
                    slice_roots[slice_name][key] = []

                slice_roots[slice_name][key].append((x, y))

            # Match slice names to slice indices
            imported_count = 0
            for slice_idx in range(self._image_handler.num_slices):
                slice_name = self._image_handler.get_slice_name(slice_idx)

                # Try to find matching data
                matching_data = None
                for csv_slice_name in slice_roots.keys():
                    # Check if slice name matches (may have _Root suffix)
                    base_name = csv_slice_name.split('_Root')[0]
                    if base_name == slice_name or csv_slice_name == slice_name:
                        matching_data = slice_roots[csv_slice_name]
                        break

                if matching_data:
                    roots = []
                    root_id_counter = 1

                    # First add main roots
                    for (root_type, rid), points in matching_data.items():
                        if root_type == 'Main Root' and len(points) > 1:
                            roots.append({
                                'id': root_id_counter,
                                'points': points,
                                'laterals': []
                            })
                            root_id_counter += 1
                            imported_count += 1

                    # Then add laterals to the first main root (if any)
                    if roots:
                        lat_id = 1
                        for (root_type, rid), points in matching_data.items():
                            if root_type == 'Lateral Root' and len(points) > 1:
                                roots[0]['laterals'].append({
                                    'id': lat_id,
                                    'points': points,
                                    'start_index': 0,
                                    'manual': True
                                })
                                lat_id += 1

                    if roots:
                        self._slice_data[slice_idx] = roots

            # Load current slice data
            self._load_slice_data(self._image_handler.current_slice)
            self._update_canvas_display()
            self._update_root_list()
            self._update_measurements_table()

            self._statusbar.showMessage(f"Imported {imported_count} roots from {file_path}")
            QMessageBox.information(
                self, "Import Complete",
                f"Imported {imported_count} roots from the CSV file."
            )

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to import points: {e}")

    @Slot(float)
    def _on_zoom_changed(self, zoom: float):
        self._lbl_zoom.setText(f"{zoom * 100:.0f}%")

    @Slot()
    def _on_prev_slice(self):
        if self._image_handler.current_slice > 0:
            self._save_current_slice_data()
            new_slice = self._image_handler.current_slice - 1
            self._slice_slider.blockSignals(True)
            self._slice_slider.setValue(new_slice)
            self._slice_slider.blockSignals(False)
            self._image_handler.current_slice = new_slice
            self._display_current_slice()
            self._update_ui_state()
            self._update_measurements_table()

    @Slot()
    def _on_next_slice(self):
        if self._image_handler.current_slice < self._image_handler.num_slices - 1:
            self._save_current_slice_data()
            new_slice = self._image_handler.current_slice + 1
            self._slice_slider.blockSignals(True)
            self._slice_slider.setValue(new_slice)
            self._slice_slider.blockSignals(False)
            self._image_handler.current_slice = new_slice
            self._display_current_slice()
            self._update_ui_state()
            self._update_measurements_table()

    @Slot(int)
    def _on_slice_changed(self, value: int):
        if self._image_handler.current_slice != value:
            self._save_current_slice_data()
            self._image_handler.current_slice = value
            self._display_current_slice()
            self._update_ui_state()
            self._update_measurements_table()

    @Slot()
    def _on_apply_slice_name(self):
        name = self._txt_slice_name.text().strip()
        if name:
            self._image_handler.set_slice_name(name)
            self._statusbar.showMessage(f"Slice name: {name}")

    @Slot(int)
    def _on_threshold_changed(self, value: int):
        self._root_tracer.set_threshold(value)

    @Slot(int)
    def _on_invert_changed(self, state: int):
        self._root_tracer.set_invert(state != 0)
        self._statusbar.showMessage("Invert changed - re-click start point to trace")

    @Slot(int)
    def _on_main_root_angle_mode_changed(self, state: int):
        """Handle main root angle mode change (overall angle vs tip curvature angle)."""
        use_tip_angle = self._chk_main_root_tip_angle.isChecked()
        mode_name = "tip curvature angle" if use_tip_angle else "overall angle"
        self._statusbar.showMessage(f"Main root angle mode: {mode_name}")
        # Update canvas measurements and table
        self._update_canvas_measurements()
        self._update_measurements_table()

    @Slot(int)
    def _on_lateral_angle_mode_changed(self, state: int):
        """Handle lateral angle mode change (branch angle vs tip angle)."""
        use_tip_angle = self._chk_lateral_tip_angle.isChecked()
        mode_name = "tip angle" if use_tip_angle else "branch angle"
        self._statusbar.showMessage(f"Lateral angle mode: {mode_name}")
        # Update canvas measurements and table
        self._update_canvas_measurements()
        self._update_measurements_table()

    @Slot(int)
    def _on_root_selected(self, row: int):
        if row >= 0:
            item = self._list_roots.item(row)
            if item:
                root_id = item.data(Qt.ItemDataRole.UserRole)
                self._root_tracer.set_current_root_id(root_id)
                # Highlight selected root on canvas
                self._canvas.set_highlighted_root(root_id)
        else:
            self._canvas.set_highlighted_root(None)

    @Slot()
    def _on_delete_selected_root(self):
        item = self._list_roots.currentItem()
        if item:
            root_id = item.data(Qt.ItemDataRole.UserRole)
            if self._root_tracer.delete_main_root(root_id):
                self._update_canvas_display()
                self._update_root_list()
                self._statusbar.showMessage(f"Deleted root {root_id}")

    @Slot()
    def _on_trace_laterals(self):
        current_id = self._root_tracer.get_current_root_id()
        if current_id == 0:
            roots = self._root_tracer.get_all_roots()
            if roots:
                current_id = roots[-1]['id']
            else:
                self._statusbar.showMessage("No main root traced")
                return

        laterals = self._root_tracer.trace_laterals_for_root(current_id)
        self._update_canvas_display()
        self._update_root_list()
        self._update_measurements_table()
        self._statusbar.showMessage(f"Found {len(laterals)} laterals")
        self._update_ui_state()

    @Slot()
    def _on_trace_all_laterals(self):
        """Trace laterals for all roots on current slice."""
        roots = self._root_tracer.get_all_roots()
        if not roots:
            self._statusbar.showMessage("No roots traced")
            return

        total_laterals = 0
        for root in roots:
            laterals = self._root_tracer.trace_laterals_for_root(root['id'])
            total_laterals += len(laterals)

        self._update_canvas_display()
        self._update_root_list()
        self._update_measurements_table()
        self._statusbar.showMessage(f"Found {total_laterals} laterals across {len(roots)} roots")
        self._update_ui_state()

    @Slot()
    def _on_clear_current_root(self):
        roots = self._root_tracer.get_all_roots()
        if roots:
            current_id = self._root_tracer.get_current_root_id()
            if current_id == 0:
                current_id = roots[-1]['id']
            self._root_tracer.delete_main_root(current_id)
            self._update_canvas_display()
            self._update_root_list()
        self._update_ui_state()

    @Slot()
    def _on_clear_all(self):
        self._root_tracer.clear_tracings()
        self._canvas.clear_tracings()

        slice_idx = self._image_handler.current_slice
        if slice_idx in self._slice_data:
            del self._slice_data[slice_idx]

        self._update_root_list()
        self._statusbar.showMessage("Cleared all roots")
        self._update_ui_state()

    def _prepare_export_data(self) -> List[Dict]:
        self._save_current_slice_data()
        export_data = []
        pixels_per_unit = self._spin_pixels_per_unit.value()
        use_lateral_tip_angle = self._chk_lateral_tip_angle.isChecked()
        use_main_root_tip_angle = self._chk_main_root_tip_angle.isChecked()

        for slice_idx in sorted(self._slice_data.keys()):
            roots = self._slice_data[slice_idx]
            slice_name = self._image_handler.get_slice_name(slice_idx)

            for root in roots:
                main_points = root.get('points', [])
                main_length = self._measurement_calc.calculate_path_length(main_points, pixels_per_unit)

                # Use tip curvature angle or overall angle based on checkbox
                if use_main_root_tip_angle:
                    root_angle, _ = self._measurement_calc.calculate_root_tip_angle(main_points)
                else:
                    root_angle = self._measurement_calc.calculate_root_angle(main_points)

                laterals = root.get('laterals', [])

                # Calculate left/right lateral angles - use tip angle or branch angle based on checkbox
                lr_angles = self._measurement_calc.calculate_left_right_lateral_angles(
                    main_points, laterals, use_tip_angle=use_lateral_tip_angle
                )

                lateral_data = []
                for lat in laterals:
                    lat_length = self._measurement_calc.calculate_path_length(
                        lat.get('points', []), pixels_per_unit
                    )
                    # Use tip angle or branch angle based on checkbox
                    if use_lateral_tip_angle:
                        angle = self._measurement_calc.calculate_lateral_tip_angle(lat.get('points', []))
                    else:
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
                    })

                export_data.append({
                    'slice_name': f"{slice_name}_Root{root['id']}",
                    'main_root_points': main_points,
                    'main_root_length': main_length,
                    'root_angle': root_angle,
                    'lateral_roots': lateral_data,
                    'lr_angles': lr_angles
                })

        return export_data

    @Slot()
    def _on_export_all(self):
        export_data = self._prepare_export_data()
        if not export_data:
            QMessageBox.warning(self, "Warning", "No data to export")
            return

        # Use image name as default filename
        default_name = self._image_handler.file_name or "root_measurements"
        default_path = f"{default_name}_measurements.csv"

        file_path, _ = QFileDialog.getSaveFileName(
            self, "Export Measurements", default_path, "CSV Files (*.csv)"
        )

        if file_path:
            unit = self._cmb_unit.currentText()
            pixels_per_unit = self._spin_pixels_per_unit.value()
            if CSVExporter.export_measurements(file_path, export_data, pixels_per_unit, unit):
                self._statusbar.showMessage(f"Exported to {file_path}")

    @Slot()
    def _on_export_points(self):
        export_data = self._prepare_export_data()
        if not export_data:
            QMessageBox.warning(self, "Warning", "No data to export")
            return

        # Use image name as default filename
        default_name = self._image_handler.file_name or "root_points"
        default_path = f"{default_name}_points.csv"

        file_path, _ = QFileDialog.getSaveFileName(
            self, "Export Points", default_path, "CSV Files (*.csv)"
        )

        if file_path:
            pixels_per_unit = self._spin_pixels_per_unit.value()
            if CSVExporter.export_points(file_path, export_data, pixels_per_unit):
                self._statusbar.showMessage(f"Exported to {file_path}")

    def _show_about(self):
        QMessageBox.about(
            self,
            "Arabidopsis Root Tracer",
            "<h3>Arabidopsis Root Tracer</h3>"
            "<p>Semi-automatic root tracing for Arabidopsis plates.</p>"
            "<p><b>Click Start (S):</b> Click start point, then press T to trace</p>"
            "<p><b>Start+End (E):</b> Click start, then click end of root</p>"
            "<p><b>Delete (X):</b> Click laterals to remove</p>"
            "<p><b>Manual (M):</b> Click start/end for laterals</p>"
            "<p><b>Shortcuts:</b> L=Laterals, A/D=Slices, F=Fit</p>"
        )

    # ==================== Machine Learning Methods ====================

    @Slot()
    def _on_export_training_data(self):
        """Export current tracings as training data for ML model."""
        self._save_current_slice_data()

        if not self._slice_data:
            QMessageBox.warning(self, "Warning", "No traced data to export")
            return

        # Choose output directory
        dir_path = QFileDialog.getExistingDirectory(
            self, "Select Training Data Directory", ""
        )

        if not dir_path:
            return

        try:
            # Export as numpy arrays (no PyTorch dependency)
            import numpy as np
            import json

            count = 0
            index = []

            for slice_idx, roots in self._slice_data.items():
                if not roots:
                    continue

                # Get image for this slice
                img = self._image_handler.normalize_slice(slice_idx)
                if img is None:
                    continue

                # Generate sample ID
                slice_name = self._image_handler.get_slice_name(slice_idx)
                sample_id = f"{self._image_handler.file_name}_{slice_name}".replace(" ", "_")

                # Save image
                np.save(os.path.join(dir_path, f"{sample_id}.npy"), img)

                # Create mask from traced roots
                mask = self._create_training_mask(img.shape, roots)
                np.save(os.path.join(dir_path, f"{sample_id}_mask.npy"), mask)

                index.append({
                    'image': f"{sample_id}.npy",
                    'mask': f"{sample_id}_mask.npy"
                })
                count += 1

            # Save index
            with open(os.path.join(dir_path, 'index.json'), 'w') as f:
                json.dump(index, f, indent=2)

            self._statusbar.showMessage(f"Exported {count} training samples to {dir_path}")
            QMessageBox.information(
                self, "Export Complete",
                f"Exported {count} training samples.\n\n"
                f"You can now use 'Train Model' to train on this data.\n"
                f"Note: Training requires PyTorch to be installed."
            )

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to export training data: {e}")

    def _create_training_mask(self, shape, roots, main_width=5, lateral_width=3):
        """Create a segmentation mask from traced roots."""
        import numpy as np

        mask = np.zeros(shape, dtype=np.uint8)

        for root in roots:
            # Draw main root
            main_points = root.get('points', [])
            if main_points:
                self._draw_path_on_mask(mask, main_points, value=1, width=main_width)

            # Draw laterals
            for lateral in root.get('laterals', []):
                lat_points = lateral.get('points', [])
                if lat_points:
                    self._draw_path_on_mask(mask, lat_points, value=2, width=lateral_width)

        return mask

    def _draw_path_on_mask(self, mask, points, value, width):
        """Draw a path on the mask."""
        height, w = mask.shape

        for i in range(len(points) - 1):
            x1, y1 = points[i]
            x2, y2 = points[i + 1]

            # Bresenham's line
            dx = abs(x2 - x1)
            dy = abs(y2 - y1)
            sx = 1 if x1 < x2 else -1
            sy = 1 if y1 < y2 else -1
            err = dx - dy

            x, y = x1, y1
            while True:
                # Draw circle for width
                for wy in range(-width // 2, width // 2 + 1):
                    for wx in range(-width // 2, width // 2 + 1):
                        if wx * wx + wy * wy <= (width // 2) ** 2:
                            py, px = y + wy, x + wx
                            if 0 <= py < height and 0 <= px < w:
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

    @Slot()
    def _on_train_model(self):
        """Open training dialog."""
        from PySide6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QProgressBar, QTextEdit
        from PySide6.QtCore import QThread, Signal as QSignal, QObject

        # Training dialog
        dialog = QDialog(self)
        dialog.setWindowTitle("Train Root Detection Model")
        dialog.setMinimumSize(500, 400)

        layout = QVBoxLayout(dialog)

        # Data directory selection
        data_layout = QHBoxLayout()
        data_layout.addWidget(QLabel("Training Data:"))
        data_path_edit = QLineEdit()
        data_path_edit.setPlaceholderText("Select training data directory...")
        btn_browse = QPushButton("Browse...")
        data_layout.addWidget(data_path_edit, stretch=1)
        data_layout.addWidget(btn_browse)
        layout.addLayout(data_layout)

        def browse_data():
            path = QFileDialog.getExistingDirectory(dialog, "Select Training Data")
            if path:
                data_path_edit.setText(path)

        btn_browse.clicked.connect(browse_data)

        # Parameters
        param_layout = QHBoxLayout()
        param_layout.addWidget(QLabel("Epochs:"))
        epochs_spin = QSpinBox()
        epochs_spin.setRange(10, 500)
        epochs_spin.setValue(50)
        param_layout.addWidget(epochs_spin)
        param_layout.addWidget(QLabel("Batch Size:"))
        batch_spin = QSpinBox()
        batch_spin.setRange(1, 32)
        batch_spin.setValue(4)
        param_layout.addWidget(batch_spin)
        param_layout.addStretch()
        layout.addLayout(param_layout)

        # Progress
        progress = QProgressBar()
        progress.setRange(0, 100)
        layout.addWidget(progress)

        # Log output
        log_text = QTextEdit()
        log_text.setReadOnly(True)
        log_text.setMaximumHeight(200)
        layout.addWidget(log_text)

        # Buttons
        btn_layout = QHBoxLayout()
        btn_train = QPushButton("Start Training")
        btn_close = QPushButton("Close")
        btn_layout.addStretch()
        btn_layout.addWidget(btn_train)
        btn_layout.addWidget(btn_close)
        layout.addLayout(btn_layout)

        btn_close.clicked.connect(dialog.close)

        # Training thread
        class TrainingWorker(QObject):
            progress_signal = QSignal(dict)
            finished_signal = QSignal(str)
            error_signal = QSignal(str)

            def __init__(self, data_dir, epochs, batch_size, save_path):
                super().__init__()
                self.data_dir = data_dir
                self.epochs = epochs
                self.batch_size = batch_size
                self.save_path = save_path

            def run(self):
                try:
                    from ml.model import RootSegmentationModel
                    from ml.trainer import RootTrainer
                    from ml.dataset import RootDataset

                    # Load dataset
                    dataset = RootDataset(self.data_dir, augment=True)
                    if len(dataset) == 0:
                        self.error_signal.emit("No training samples found in directory")
                        return

                    # Prepare data loaders
                    train_loader, val_loader = RootTrainer.prepare_dataloaders(
                        dataset, batch_size=self.batch_size, val_split=0.2
                    )

                    # Create model and trainer
                    model = RootSegmentationModel(n_classes=3)
                    trainer = RootTrainer(model)

                    # Train with progress callback
                    def on_progress(metrics):
                        self.progress_signal.emit(metrics)

                    trainer.train(
                        train_loader, val_loader,
                        epochs=self.epochs,
                        save_path=self.save_path,
                        progress_callback=on_progress
                    )

                    self.finished_signal.emit(self.save_path)

                except Exception as e:
                    self.error_signal.emit(str(e))

        training_thread = None
        worker = None

        def start_training():
            nonlocal training_thread, worker

            data_dir = data_path_edit.text()
            if not data_dir or not os.path.isdir(data_dir):
                QMessageBox.warning(dialog, "Warning", "Please select a valid training data directory")
                return

            # Save path
            save_path = os.path.join(data_dir, "root_model.pth")

            btn_train.setEnabled(False)
            log_text.clear()
            log_text.append(f"Starting training with {epochs_spin.value()} epochs...")

            # Create worker thread
            worker = TrainingWorker(
                data_dir, epochs_spin.value(), batch_spin.value(), save_path
            )
            training_thread = QThread()
            worker.moveToThread(training_thread)

            training_thread.started.connect(worker.run)
            # Use QueuedConnection to ensure slots run on main thread
            worker.progress_signal.connect(on_training_progress, Qt.ConnectionType.QueuedConnection)
            worker.finished_signal.connect(on_training_finished, Qt.ConnectionType.QueuedConnection)
            worker.error_signal.connect(on_training_error, Qt.ConnectionType.QueuedConnection)
            worker.finished_signal.connect(training_thread.quit, Qt.ConnectionType.QueuedConnection)
            worker.error_signal.connect(training_thread.quit, Qt.ConnectionType.QueuedConnection)

            training_thread.start()

        def on_training_progress(metrics):
            epoch = metrics['epoch']
            total = metrics['total_epochs']
            progress.setValue(int(epoch / total * 100))
            log_text.append(
                f"Epoch {epoch}/{total} - "
                f"Loss: {metrics['train_loss']:.4f}/{metrics['val_loss']:.4f} - "
                f"IoU: {metrics['train_iou']:.4f}/{metrics['val_iou']:.4f}"
            )

        def on_training_finished(save_path):
            btn_train.setEnabled(True)
            log_text.append(f"\n*** Training complete! ***")
            log_text.append(f"Model saved to: {save_path}")
            log_text.append("You can now use 'Auto-Detect Roots' to detect roots automatically.")
            progress.setValue(100)

            # Load the trained model
            self._load_ml_model(save_path)

        def on_training_error(error):
            btn_train.setEnabled(True)
            log_text.append(f"\n*** ERROR ***")
            log_text.append(f"{error}")

        btn_train.clicked.connect(start_training)

        dialog.exec()

    @Slot()
    def _on_load_model(self):
        """Let user browse for and load a trained ML model."""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Load ML Model", "", "PyTorch Model (*.pth *.pt);;All Files (*)"
        )
        if file_path:
            self._load_ml_model(file_path)

    def _load_ml_model(self, path: str):
        """Load a trained ML model."""
        try:
            from ml.model import RootSegmentationModel
            from ml.inference import RootPredictor

            self._ml_model = RootSegmentationModel(n_classes=3)
            self._ml_model.load(path)
            self._ml_predictor = RootPredictor(self._ml_model)
            self._btn_auto_detect.setEnabled(True)
            self._statusbar.showMessage(f"ML model loaded from {path}")

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load model: {e}")

    @Slot()
    def _on_auto_detect(self):
        """Auto-detect roots using ML model."""
        if self._ml_predictor is None:
            # Try to load model from default location
            default_paths = [
                "training_data/root_model.pth",
                "root_model.pth",
            ]
            for path in default_paths:
                if os.path.exists(path):
                    self._load_ml_model(path)
                    break

        if self._ml_predictor is None:
            QMessageBox.warning(
                self, "No Model",
                "No trained model loaded. Please train a model first or load an existing one."
            )
            return

        if not self._image_handler.is_loaded:
            QMessageBox.warning(self, "Warning", "No image loaded")
            return

        self._statusbar.showMessage("Detecting roots...")

        try:
            # Get current image
            img = self._image_handler.normalize_slice()

            # Detect roots
            detected_roots = self._ml_predictor.predict_roots(
                img,
                min_main_length=50,
                min_lateral_length=10,
                confidence_threshold=0.5
            )

            if not detected_roots:
                self._statusbar.showMessage("No roots detected")
                QMessageBox.information(self, "Detection", "No roots detected in this image.")
                return

            # Add detected roots to tracer
            for root in detected_roots:
                # Add main root
                result = self._root_tracer.add_root_from_points(root['points'])
                if result:
                    # Add laterals
                    for lateral in root.get('laterals', []):
                        self._root_tracer.add_manual_lateral(
                            result['id'],
                            lateral['points'][0],
                            lateral['points'][-1]
                        )

            self._update_canvas_display()
            self._update_root_list()
            self._update_measurements_table()

            num_roots = len(detected_roots)
            num_laterals = sum(len(r.get('laterals', [])) for r in detected_roots)
            self._statusbar.showMessage(
                f"Detected {num_roots} roots with {num_laterals} laterals"
            )

        except Exception as e:
            self._statusbar.showMessage("Detection failed")
            QMessageBox.critical(self, "Error", f"Auto-detection failed: {e}")

    def closeEvent(self, event):
        self._save_current_slice_data()
        event.accept()
