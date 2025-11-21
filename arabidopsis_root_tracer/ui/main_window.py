"""
Main window for the Arabidopsis Root Tracer application.
"""

import os
from typing import Optional, List, Dict
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QSlider, QLineEdit, QGroupBox, QTableWidget, QTableWidgetItem,
    QFileDialog, QMessageBox, QSpinBox, QSplitter, QStatusBar, QToolBar,
    QComboBox, QDoubleSpinBox, QProgressBar, QFrame
)
from PySide6.QtCore import Qt, Slot
from PySide6.QtGui import QAction, QKeySequence

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
        self._tracing_mode = "main_root"  # "main_root" or "lateral"
        self._slice_data: List[Dict] = []  # Store data for all slices
        self._current_measurements: Dict = {}

        # Setup UI
        self._setup_ui()
        self._setup_menubar()
        self._setup_toolbar()
        self._setup_statusbar()
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

        self._btn_prev_slice = QPushButton("<")
        self._btn_prev_slice.setFixedWidth(40)
        self._slice_slider = QSlider(Qt.Orientation.Horizontal)
        self._slice_slider.setMinimum(0)
        self._slice_slider.setMaximum(0)
        self._btn_next_slice = QPushButton(">")
        self._btn_next_slice.setFixedWidth(40)
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
        right_panel.setMaximumWidth(400)
        right_layout = QVBoxLayout(right_panel)

        # Slice naming
        name_group = QGroupBox("Slice Name")
        name_layout = QVBoxLayout(name_group)
        self._txt_slice_name = QLineEdit()
        self._txt_slice_name.setPlaceholderText("Enter slice name...")
        self._btn_apply_name = QPushButton("Apply Name")
        name_layout.addWidget(self._txt_slice_name)
        name_layout.addWidget(self._btn_apply_name)
        right_layout.addWidget(name_group)

        # Tracing controls
        trace_group = QGroupBox("Tracing Controls")
        trace_layout = QVBoxLayout(trace_group)

        # Instructions
        self._lbl_instructions = QLabel(
            "Ctrl+Click on root start to begin tracing"
        )
        self._lbl_instructions.setWordWrap(True)
        self._lbl_instructions.setStyleSheet("color: #666; font-style: italic;")
        trace_layout.addWidget(self._lbl_instructions)

        # Threshold control
        thresh_layout = QHBoxLayout()
        thresh_layout.addWidget(QLabel("Threshold:"))
        self._spin_threshold = QSpinBox()
        self._spin_threshold.setRange(1, 255)
        self._spin_threshold.setValue(30)
        thresh_layout.addWidget(self._spin_threshold)
        trace_layout.addLayout(thresh_layout)

        # Tracing buttons
        self._btn_trace_main = QPushButton("Trace Main Root")
        self._btn_trace_main.setEnabled(False)
        self._btn_trace_laterals = QPushButton("Trace Lateral Roots")
        self._btn_trace_laterals.setEnabled(False)
        self._btn_clear_tracing = QPushButton("Clear Tracing")

        trace_layout.addWidget(self._btn_trace_main)
        trace_layout.addWidget(self._btn_trace_laterals)
        trace_layout.addWidget(self._btn_clear_tracing)

        right_layout.addWidget(trace_group)

        # Measurements display
        measure_group = QGroupBox("Measurements")
        measure_layout = QVBoxLayout(measure_group)

        # Pixel size setting
        pixel_layout = QHBoxLayout()
        pixel_layout.addWidget(QLabel("Pixel size:"))
        self._spin_pixel_size = QDoubleSpinBox()
        self._spin_pixel_size.setRange(0.001, 1000)
        self._spin_pixel_size.setValue(1.0)
        self._spin_pixel_size.setDecimals(3)
        pixel_layout.addWidget(self._spin_pixel_size)
        self._cmb_unit = QComboBox()
        self._cmb_unit.addItems(["pixels", "um", "mm", "cm"])
        pixel_layout.addWidget(self._cmb_unit)
        measure_layout.addLayout(pixel_layout)

        # Measurements table
        self._tbl_measurements = QTableWidget()
        self._tbl_measurements.setColumnCount(2)
        self._tbl_measurements.setHorizontalHeaderLabels(["Measurement", "Value"])
        self._tbl_measurements.horizontalHeader().setStretchLastSection(True)
        self._tbl_measurements.setMinimumHeight(200)
        measure_layout.addWidget(self._tbl_measurements)

        right_layout.addWidget(measure_group)

        # Export controls
        export_group = QGroupBox("Export")
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

        splitter.addWidget(right_panel)

        # Set splitter sizes
        splitter.setSizes([800, 400])

    def _setup_menubar(self):
        """Setup the menu bar."""
        menubar = self.menuBar()

        # File menu
        file_menu = menubar.addMenu("&File")

        open_action = QAction("&Open TIFF...", self)
        open_action.setShortcut(QKeySequence.StandardKey.Open)
        open_action.triggered.connect(self._on_open_file)
        file_menu.addAction(open_action)

        file_menu.addSeparator()

        export_action = QAction("&Export Measurements...", self)
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

        fit_action = QAction("&Fit to Window", self)
        fit_action.setShortcut(QKeySequence("Ctrl+0"))
        fit_action.triggered.connect(self._canvas.fit_to_view)
        view_menu.addAction(fit_action)

        reset_zoom_action = QAction("&Reset Zoom (100%)", self)
        reset_zoom_action.setShortcut(QKeySequence("Ctrl+1"))
        reset_zoom_action.triggered.connect(self._canvas.reset_zoom)
        view_menu.addAction(reset_zoom_action)

        # Help menu
        help_menu = menubar.addMenu("&Help")

        about_action = QAction("&About", self)
        about_action.triggered.connect(self._show_about)
        help_menu.addAction(about_action)

    def _setup_toolbar(self):
        """Setup the toolbar."""
        toolbar = QToolBar("Main Toolbar")
        toolbar.setMovable(False)
        self.addToolBar(toolbar)

        # Open button
        open_action = QAction("Open", self)
        open_action.triggered.connect(self._on_open_file)
        toolbar.addAction(open_action)

        toolbar.addSeparator()

        # Zoom controls
        toolbar.addWidget(QLabel("Zoom: "))
        self._lbl_zoom = QLabel("100%")
        self._lbl_zoom.setMinimumWidth(50)
        toolbar.addWidget(self._lbl_zoom)

        fit_action = QAction("Fit", self)
        fit_action.triggered.connect(self._canvas.fit_to_view)
        toolbar.addAction(fit_action)

    def _setup_statusbar(self):
        """Setup the status bar."""
        self._statusbar = QStatusBar()
        self.setStatusBar(self._statusbar)
        self._statusbar.showMessage("Ready - Load a TIFF image to begin")

    def _connect_signals(self):
        """Connect all signals and slots."""
        # Canvas signals
        self._canvas.point_clicked.connect(self._on_point_clicked)
        self._canvas.zoom_changed.connect(self._on_zoom_changed)

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
        self._btn_clear_tracing.clicked.connect(self._on_clear_tracing)

        # Export
        self._btn_export_current.clicked.connect(self._on_export_current)
        self._btn_export_all.clicked.connect(self._on_export_all)
        self._btn_export_points.clicked.connect(self._on_export_points)

    def _update_ui_state(self):
        """Update UI elements based on current state."""
        has_image = self._image_handler.is_loaded
        has_main_root = len(self._root_tracer.get_main_root_points()) > 0

        # Enable/disable controls
        self._btn_prev_slice.setEnabled(has_image and self._image_handler.current_slice > 0)
        self._btn_next_slice.setEnabled(
            has_image and self._image_handler.current_slice < self._image_handler.num_slices - 1
        )
        self._slice_slider.setEnabled(has_image)
        self._txt_slice_name.setEnabled(has_image)
        self._btn_apply_name.setEnabled(has_image)

        self._btn_trace_laterals.setEnabled(has_main_root)
        self._btn_export_current.setEnabled(has_main_root)
        self._btn_export_all.setEnabled(len(self._slice_data) > 0)
        self._btn_export_points.setEnabled(has_main_root)

        # Update slice info
        if has_image:
            current = self._image_handler.current_slice + 1
            total = self._image_handler.num_slices
            self._lbl_slice_info.setText(f"Slice: {current}/{total}")
            self._txt_slice_name.setText(self._image_handler.get_slice_name())

        # Update instructions
        if not has_image:
            self._lbl_instructions.setText("Load a TIFF image to begin")
        elif not has_main_root:
            self._lbl_instructions.setText("Ctrl+Click on root start to mark, then click 'Trace Main Root'")
        else:
            self._lbl_instructions.setText("Click 'Trace Lateral Roots' or Ctrl+Click to restart")

    def _update_measurements_table(self):
        """Update the measurements table with current data."""
        self._tbl_measurements.setRowCount(0)

        main_points = self._root_tracer.get_main_root_points()
        laterals = self._root_tracer.get_lateral_roots()
        pixel_size = self._spin_pixel_size.value()
        unit = self._cmb_unit.currentText()

        measurements = []

        if main_points:
            main_length = self._measurement_calc.calculate_path_length(main_points, pixel_size)
            measurements.append(("Main Root Length", f"{main_length:.2f} {unit}"))
            measurements.append(("Main Root Points", str(len(main_points))))

        if laterals:
            measurements.append(("Number of Laterals", str(len(laterals))))

            total_lat_length = 0
            for i, lat in enumerate(laterals):
                lat_length = self._measurement_calc.calculate_path_length(
                    lat['points'], pixel_size
                )
                total_lat_length += lat_length

                angle = self._measurement_calc.calculate_lateral_angle(
                    main_points, lat['points'], lat['start_index']
                )
                branch_pos = self._measurement_calc.get_branch_position(
                    main_points, lat['start_index'], pixel_size
                )

                measurements.append((f"Lateral {i+1} Length", f"{lat_length:.2f} {unit}"))
                measurements.append((f"Lateral {i+1} Angle", f"{angle:.1f} deg"))
                measurements.append((f"Lateral {i+1} Branch Pos", f"{branch_pos:.2f} {unit}"))

            measurements.append(("Total Lateral Length", f"{total_lat_length:.2f} {unit}"))

            if len(laterals) > 0:
                avg_lat_length = total_lat_length / len(laterals)
                measurements.append(("Avg Lateral Length", f"{avg_lat_length:.2f} {unit}"))

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
        main_points = self._root_tracer.get_main_root_points()
        laterals = self._root_tracer.get_lateral_roots()

        if not main_points:
            return

        pixel_size = self._spin_pixel_size.value()

        # Calculate measurements
        main_length = self._measurement_calc.calculate_path_length(main_points)

        lateral_data = []
        for lat in laterals:
            lat_length = self._measurement_calc.calculate_path_length(lat['points'])
            angle = self._measurement_calc.calculate_lateral_angle(
                main_points, lat['points'], lat['start_index']
            )
            branch_pos = self._measurement_calc.get_branch_position(
                main_points, lat['start_index']
            )
            lateral_data.append({
                'points': lat['points'],
                'length': lat_length,
                'angle': angle,
                'branch_position': branch_pos,
                'start_index': lat['start_index']
            })

        slice_data = {
            'slice_index': slice_idx,
            'slice_name': self._image_handler.get_slice_name(),
            'main_root_points': main_points,
            'main_root_length': main_length,
            'lateral_roots': lateral_data
        }

        # Update or add slice data
        found = False
        for i, data in enumerate(self._slice_data):
            if data['slice_index'] == slice_idx:
                self._slice_data[i] = slice_data
                found = True
                break

        if not found:
            self._slice_data.append(slice_data)

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
                self._slice_data = []
                self._root_tracer.clear_tracings()
                self._canvas.clear_tracings()

                # Setup slider
                self._slice_slider.setMaximum(self._image_handler.num_slices - 1)
                self._slice_slider.setValue(0)

                # Display first slice
                self._display_current_slice()

                self._statusbar.showMessage(
                    f"Loaded: {os.path.basename(file_path)} "
                    f"({self._image_handler.num_slices} slices)"
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

            # Load saved tracing data if exists
            slice_idx = self._image_handler.current_slice
            for data in self._slice_data:
                if data['slice_index'] == slice_idx:
                    # Restore tracings
                    main_points = data['main_root_points']
                    self._canvas.set_main_root(main_points)

                    laterals = data['lateral_roots']
                    self._canvas.set_lateral_roots(laterals)

                    # Update tracer state (for measurements)
                    self._root_tracer._main_root_points = main_points
                    self._root_tracer._lateral_roots = [
                        {'points': l['points'], 'start_index': l['start_index'],
                         'branch_point': main_points[l['start_index']] if l['start_index'] < len(main_points) else (0, 0)}
                        for l in laterals
                    ]
                    break
            else:
                # No saved data - clear display
                self._canvas.clear_tracings()
                self._root_tracer.clear_tracings()

            self._update_measurements_table()

    @Slot(int, int)
    def _on_point_clicked(self, x: int, y: int):
        """Handle point click on canvas."""
        self._canvas.set_start_point((x, y))
        self._btn_trace_main.setEnabled(True)
        self._statusbar.showMessage(f"Start point set at ({x}, {y}) - Click 'Trace Main Root'")

    @Slot(float)
    def _on_zoom_changed(self, zoom: float):
        """Handle zoom level change."""
        self._lbl_zoom.setText(f"{zoom * 100:.0f}%")

    @Slot()
    def _on_prev_slice(self):
        """Go to previous slice."""
        self._save_current_slice_data()
        self._image_handler.current_slice -= 1
        self._slice_slider.setValue(self._image_handler.current_slice)

    @Slot()
    def _on_next_slice(self):
        """Go to next slice."""
        self._save_current_slice_data()
        self._image_handler.current_slice += 1
        self._slice_slider.setValue(self._image_handler.current_slice)

    @Slot(int)
    def _on_slice_changed(self, value: int):
        """Handle slice slider change."""
        if self._image_handler.current_slice != value:
            self._save_current_slice_data()
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

            # Update saved data if exists
            slice_idx = self._image_handler.current_slice
            for data in self._slice_data:
                if data['slice_index'] == slice_idx:
                    data['slice_name'] = name
                    break

    @Slot(int)
    def _on_threshold_changed(self, value: int):
        """Handle threshold change."""
        self._root_tracer.set_threshold(value)

    @Slot()
    def _on_trace_main_root(self):
        """Trace the main root from start point."""
        start = self._canvas._start_point
        if start is None:
            QMessageBox.warning(self, "Warning", "Please Ctrl+Click to set a start point first")
            return

        self._statusbar.showMessage("Tracing main root...")

        # Perform tracing
        points = self._root_tracer.trace_main_root(start)

        if points:
            self._canvas.set_main_root(points)
            self._canvas.set_start_point(None)
            self._update_measurements_table()
            self._statusbar.showMessage(f"Main root traced: {len(points)} points")
        else:
            QMessageBox.warning(
                self, "Warning",
                "Could not trace root. Try adjusting threshold or clicking closer to the root."
            )
            self._statusbar.showMessage("Tracing failed")

        self._update_ui_state()

    @Slot()
    def _on_trace_laterals(self):
        """Trace lateral roots from main root."""
        self._statusbar.showMessage("Tracing lateral roots...")

        laterals = self._root_tracer.trace_lateral_roots()

        if laterals:
            self._canvas.set_lateral_roots(laterals)
            self._update_measurements_table()
            self._statusbar.showMessage(f"Found {len(laterals)} lateral roots")
        else:
            QMessageBox.information(
                self, "Info",
                "No lateral roots found. Try adjusting the threshold."
            )
            self._statusbar.showMessage("No lateral roots found")

        self._update_ui_state()

    @Slot()
    def _on_clear_tracing(self):
        """Clear all tracings."""
        self._root_tracer.clear_tracings()
        self._canvas.clear_tracings()
        self._update_measurements_table()

        # Remove saved data for current slice
        slice_idx = self._image_handler.current_slice
        self._slice_data = [d for d in self._slice_data if d['slice_index'] != slice_idx]

        self._statusbar.showMessage("Tracings cleared")
        self._update_ui_state()

    @Slot()
    def _on_export_current(self):
        """Export current slice measurements."""
        self._save_current_slice_data()

        slice_idx = self._image_handler.current_slice
        current_data = None
        for data in self._slice_data:
            if data['slice_index'] == slice_idx:
                current_data = data
                break

        if not current_data:
            QMessageBox.warning(self, "Warning", "No tracing data to export")
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Export Measurements",
            f"{current_data['slice_name']}_measurements.csv",
            "CSV Files (*.csv)"
        )

        if file_path:
            pixel_size = self._spin_pixel_size.value()
            unit = self._cmb_unit.currentText()

            if CSVExporter.export_measurements(file_path, [current_data], pixel_size, unit):
                self._statusbar.showMessage(f"Exported to {file_path}")
            else:
                QMessageBox.critical(self, "Error", "Failed to export CSV")

    @Slot()
    def _on_export_all(self):
        """Export all slices measurements."""
        self._save_current_slice_data()

        if not self._slice_data:
            QMessageBox.warning(self, "Warning", "No tracing data to export")
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Export All Measurements",
            "root_measurements.csv",
            "CSV Files (*.csv)"
        )

        if file_path:
            pixel_size = self._spin_pixel_size.value()
            unit = self._cmb_unit.currentText()

            if CSVExporter.export_measurements(file_path, self._slice_data, pixel_size, unit):
                self._statusbar.showMessage(f"Exported {len(self._slice_data)} slices to {file_path}")
            else:
                QMessageBox.critical(self, "Error", "Failed to export CSV")

    @Slot()
    def _on_export_points(self):
        """Export all traced points."""
        self._save_current_slice_data()

        if not self._slice_data:
            QMessageBox.warning(self, "Warning", "No tracing data to export")
            return

        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "Export Points",
            "root_points.csv",
            "CSV Files (*.csv)"
        )

        if file_path:
            pixel_size = self._spin_pixel_size.value()

            if CSVExporter.export_points(file_path, self._slice_data, pixel_size):
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
            "<p><b>Usage:</b></p>"
            "<ul>"
            "<li>Load a multi-slice TIFF image</li>"
            "<li>Ctrl+Click on the start of the main root</li>"
            "<li>Click 'Trace Main Root' to trace</li>"
            "<li>Click 'Trace Lateral Roots' to find laterals</li>"
            "<li>Export measurements as CSV</li>"
            "</ul>"
            "<p><b>Tips:</b></p>"
            "<ul>"
            "<li>Adjust threshold for better tracing</li>"
            "<li>Name each slice for organized exports</li>"
            "<li>Use mouse wheel to zoom</li>"
            "</ul>"
        )

    def closeEvent(self, event):
        """Handle window close."""
        # Save current data before closing
        self._save_current_slice_data()
        event.accept()
