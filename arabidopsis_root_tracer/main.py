#!/usr/bin/env python3
"""
Arabidopsis Root Tracer

A PySide6 application for semi-automatic tracing of Arabidopsis roots
and lateral roots from plate images.

Usage:
    python main.py

Features:
    - Load multi-slice TIFF images
    - Semi-automatic main root tracing
    - Automatic lateral root detection
    - Per-slice naming
    - CSV export of measurements and points
"""

import sys
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt

from ui.main_window import MainWindow


def main():
    """Main entry point for the application."""
    # Enable high DPI scaling
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )

    app = QApplication(sys.argv)

    # Set application metadata
    app.setApplicationName("Arabidopsis Root Tracer")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("Plant Biology Tools")

    # Apply a clean style
    app.setStyle("Fusion")

    # Create and show main window
    window = MainWindow()
    window.show()

    # Run the application
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
