"""
Export functionality for root tracing data.
"""

import csv
from typing import List, Dict, Tuple, Optional
from datetime import datetime


class CSVExporter:
    """Export root tracing data to CSV format."""

    @staticmethod
    def export_measurements(
        file_path: str,
        slice_data: List[Dict],
        pixel_size: float = 1.0,
        unit: str = "pixels"
    ) -> bool:
        """
        Export all measurements to a CSV file.

        Args:
            file_path: Output CSV file path
            slice_data: List of dictionaries containing:
                - slice_name: Name of the slice
                - main_root_length: Length of main root
                - main_root_points: List of (x, y) points
                - lateral_roots: List of lateral root data
            pixel_size: Size of one pixel in real units
            unit: Unit name for measurements

        Returns:
            True if export successful
        """
        try:
            with open(file_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)

                # Header
                writer.writerow([
                    'Slice Name',
                    'Root Type',
                    'Root ID',
                    f'Length ({unit})',
                    'Branch Position ({})'.format(unit),
                    'Branch Angle (degrees)',
                    'Start X',
                    'Start Y',
                    'End X',
                    'End Y',
                    'Number of Points'
                ])

                for slice_info in slice_data:
                    slice_name = slice_info.get('slice_name', 'Unknown')
                    main_points = slice_info.get('main_root_points', [])
                    main_length = slice_info.get('main_root_length', 0)
                    laterals = slice_info.get('lateral_roots', [])

                    # Main root row
                    if main_points:
                        writer.writerow([
                            slice_name,
                            'Main Root',
                            1,
                            f'{main_length * pixel_size:.2f}',
                            '-',
                            '-',
                            main_points[0][0],
                            main_points[0][1],
                            main_points[-1][0],
                            main_points[-1][1],
                            len(main_points)
                        ])

                    # Lateral roots
                    for i, lateral in enumerate(laterals):
                        points = lateral.get('points', [])
                        length = lateral.get('length', 0)
                        branch_pos = lateral.get('branch_position', 0)
                        angle = lateral.get('angle', 0)

                        if points:
                            writer.writerow([
                                slice_name,
                                'Lateral Root',
                                i + 1,
                                f'{length * pixel_size:.2f}',
                                f'{branch_pos * pixel_size:.2f}',
                                f'{angle:.1f}',
                                points[0][0],
                                points[0][1],
                                points[-1][0],
                                points[-1][1],
                                len(points)
                            ])

            return True

        except Exception as e:
            print(f"Error exporting CSV: {e}")
            return False

    @staticmethod
    def export_points(
        file_path: str,
        slice_data: List[Dict],
        pixel_size: float = 1.0
    ) -> bool:
        """
        Export all traced points to a CSV file.

        Args:
            file_path: Output CSV file path
            slice_data: List of slice data dictionaries
            pixel_size: Size of one pixel in real units

        Returns:
            True if export successful
        """
        try:
            with open(file_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)

                # Header
                writer.writerow([
                    'Slice Name',
                    'Root Type',
                    'Root ID',
                    'Point Index',
                    'X',
                    'Y',
                    'X (scaled)',
                    'Y (scaled)'
                ])

                for slice_info in slice_data:
                    slice_name = slice_info.get('slice_name', 'Unknown')
                    main_points = slice_info.get('main_root_points', [])
                    laterals = slice_info.get('lateral_roots', [])

                    # Main root points
                    for idx, (x, y) in enumerate(main_points):
                        writer.writerow([
                            slice_name,
                            'Main Root',
                            1,
                            idx,
                            x,
                            y,
                            f'{x * pixel_size:.2f}',
                            f'{y * pixel_size:.2f}'
                        ])

                    # Lateral root points
                    for i, lateral in enumerate(laterals):
                        points = lateral.get('points', [])
                        for idx, (x, y) in enumerate(points):
                            writer.writerow([
                                slice_name,
                                'Lateral Root',
                                i + 1,
                                idx,
                                x,
                                y,
                                f'{x * pixel_size:.2f}',
                                f'{y * pixel_size:.2f}'
                            ])

            return True

        except Exception as e:
            print(f"Error exporting points CSV: {e}")
            return False

    @staticmethod
    def export_summary(
        file_path: str,
        slice_data: List[Dict],
        pixel_size: float = 1.0,
        unit: str = "pixels"
    ) -> bool:
        """
        Export a summary of all measurements.

        Args:
            file_path: Output CSV file path
            slice_data: List of slice data dictionaries
            pixel_size: Size of one pixel in real units
            unit: Unit name

        Returns:
            True if export successful
        """
        try:
            with open(file_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)

                # Header
                writer.writerow([
                    'Slice Name',
                    f'Main Root Length ({unit})',
                    'Number of Laterals',
                    f'Total Lateral Length ({unit})',
                    f'Mean Lateral Length ({unit})',
                    'Mean Branch Angle (degrees)'
                ])

                for slice_info in slice_data:
                    slice_name = slice_info.get('slice_name', 'Unknown')
                    main_length = slice_info.get('main_root_length', 0) * pixel_size
                    laterals = slice_info.get('lateral_roots', [])

                    num_laterals = len(laterals)
                    total_lat_length = sum(l.get('length', 0) for l in laterals) * pixel_size
                    mean_lat_length = total_lat_length / num_laterals if num_laterals > 0 else 0

                    angles = [l.get('angle', 0) for l in laterals]
                    mean_angle = sum(angles) / len(angles) if angles else 0

                    writer.writerow([
                        slice_name,
                        f'{main_length:.2f}',
                        num_laterals,
                        f'{total_lat_length:.2f}',
                        f'{mean_lat_length:.2f}',
                        f'{mean_angle:.1f}'
                    ])

            return True

        except Exception as e:
            print(f"Error exporting summary CSV: {e}")
            return False
