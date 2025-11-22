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
        pixels_per_unit: float = 1.0,
        unit: str = "cm"
    ) -> bool:
        """
        Export measurements in the new format:
        Slice Name, Root#, Root Length, Total Lateral Count, Total Lateral Length,
        Lateral Density, Lateral Length per Unit Root

        Args:
            file_path: Output CSV file path
            slice_data: List of dictionaries containing per-root data
            pixels_per_unit: Pixels per unit (e.g., 161 px/cm)
            unit: Unit name for measurements

        Returns:
            True if export successful
        """
        try:
            with open(file_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)

                # New header format
                writer.writerow([
                    'Slice Name',
                    'Root #',
                    f'Root Length ({unit})',
                    'Lateral Count',
                    f'Total Lateral Length ({unit})',
                    f'Lateral Density ({unit}/lateral)',
                    f'Lateral Length per {unit} Root'
                ])

                for slice_info in slice_data:
                    slice_name = slice_info.get('slice_name', 'Unknown')
                    root_length = slice_info.get('main_root_length', 0)
                    laterals = slice_info.get('lateral_roots', [])

                    lat_count = len(laterals)
                    total_lat_length = sum(l.get('length', 0) for l in laterals)

                    # Lateral density = root length / lateral count
                    lat_density = root_length / lat_count if lat_count > 0 else 0

                    # Lateral length per unit root = total lat length / root length
                    lat_per_unit = total_lat_length / root_length if root_length > 0 else 0

                    # Extract root number from slice_name (format: "SliceName_Root1")
                    root_num = 1
                    if '_Root' in slice_name:
                        try:
                            root_num = int(slice_name.split('_Root')[-1])
                            slice_name = slice_name.rsplit('_Root', 1)[0]
                        except ValueError:
                            pass

                    writer.writerow([
                        slice_name,
                        root_num,
                        f'{root_length:.3f}',
                        lat_count,
                        f'{total_lat_length:.3f}',
                        f'{lat_density:.3f}',
                        f'{lat_per_unit:.3f}'
                    ])

            return True

        except Exception as e:
            print(f"Error exporting CSV: {e}")
            return False

    @staticmethod
    def export_points(
        file_path: str,
        slice_data: List[Dict],
        pixels_per_unit: float = 1.0
    ) -> bool:
        """
        Export all traced points to a CSV file.

        Args:
            file_path: Output CSV file path
            slice_data: List of slice data dictionaries
            pixels_per_unit: Pixels per unit (divide to get real units)

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
                    'X (px)',
                    'Y (px)',
                    'X (units)',
                    'Y (units)'
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
                            f'{x / pixels_per_unit:.3f}',
                            f'{y / pixels_per_unit:.3f}'
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
                                f'{x / pixels_per_unit:.3f}',
                                f'{y / pixels_per_unit:.3f}'
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
