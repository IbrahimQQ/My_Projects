# Arabidopsis Root Tracer

A comprehensive tool for tracing and measuring root systems in Arabidopsis plant images.

## Features

### Real-time Measurements
- All measurements update automatically when you add or delete roots
- Instant feedback on main root length, lateral count, and statistics
- Lateral root density calculations

### Tip-Based Angle Measurement
- Measures the tip angle with the vertex at the **curvature start point**
- If a root grows straight down and the tip curves slightly left, the angle is measured where the curvature begins
- The curvature start point is automatically detected as the vertex (B in angle ABC)
- Visual indicator shows the angle measurement on the canvas

### Manual 3-Point Angle Measurement
- Click three points to measure any angle
- The **second point clicked is the vertex** (B in angle ABC)
- Useful for measuring specific angles of interest

### Root Tracing
- **Main Root**: Trace from base to tip
- **Lateral Roots**: Click on main root to start, then trace the lateral
- Points can be added with left-click, finish with right-click or Escape

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd My_Projects

# Install dependencies
pip install -r requirements.txt

# Run the application
python root_tracer.py
```

## Usage

### Toolbar Modes

| Mode | Description |
|------|-------------|
| **Select** | Click to select roots or angles for deletion |
| **Trace Main Root** | Click points along the main root from base to tip |
| **Trace Lateral** | First click on main root, then trace lateral points |
| **Manual Angle** | Click 3 points (A, B=vertex, C) to measure angle |
| **Delete** | Click on any root or angle to delete it |

### Controls

- **Left-click**: Add point or select item
- **Right-click / Escape**: Finish current tracing
- **Delete / Backspace**: Delete selected item
- **Mouse wheel**: Zoom in/out
- **Zoom In/Out buttons**: Adjust zoom level
- **Fit button**: Fit image to canvas

### Measurements Panel

The right panel shows real-time measurements:

- **Main Root**
  - Length (pixels)
  - Tip Angle (degrees) - measured at curvature start point

- **Lateral Roots**
  - Count
  - Total length
  - Average length
  - Density (laterals per pixel of main root)

- **Manual Angles**
  - List of all manually measured angles

- **Lateral Details**
  - Individual lateral measurements with ID, length, and emergence angle

### Data Export

Click "Export Data" to save all measurements to a JSON file including:
- All point coordinates
- Calculated lengths and angles
- Summary statistics

## Tip Angle Measurement Explained

The tip angle measurement is designed to capture how much the root tip has curved:

```
    A (reference point - straight portion)
    |
    |
    B (vertex - where curvature starts) <-- This is where the angle is measured
     \
      \
       C (tip of root)

Angle ABC is measured at point B
```

The algorithm:
1. Starts from the tip and works backwards
2. Detects where the direction stabilizes (curvature ends)
3. Uses that point as the vertex (B)
4. Reference point (A) is from the straight portion before curvature
5. Tip point (C) is the end of the root

## Dependencies

- Python 3.7+
- Pillow (PIL) for image handling
- tkinter (included with Python)

## License

MIT License
