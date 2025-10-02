# Voronoi Puzzle Prototype

A web-based puzzle prototype featuring animated Voronoi cells with Perlin noise boundaries.

## Features

- **Animated Voronoi Cells**: Irregular cell-like pieces generated from Voronoi diagrams
- **Perlin Noise Animation**: Smooth, organic boundary animation using Perlin noise
- **Canvas 2D Rendering**: Efficient rendering with proper clipping for each cell
- **Interactive Controls**: Adjustable cell count, animation speed, and noise amplitude
- **Background Image Masking**: Each cell acts as a mask for part of a fixed background image

## Implementation Details

### Core Components

1. **Voronoi Generation**: Uses d3-delaunay library for Voronoi diagram generation
2. **Noise Animation**: Custom Perlin noise implementation for smooth boundary animation
3. **Canvas Clipping**: Each Voronoi cell is rendered with proper clipping to show only the background image portion
4. **Optimized Rendering**: Efficient animation loop that redraws only the necessary parts

### Technical Approach

- **Static Background**: The background image is drawn once and stays static
- **Animated Boundaries**: Only the Voronoi cell outlines "pulse" and wiggle using noise functions
- **Consistent Deformation**: Each piece mask deforms consistently while remaining flush with neighbors
- **Shared Border Animation**: Borders between adjacent cells animate in sync

## File Structure

```
voronoi-puzzle/
├── index.html          # Main HTML structure
├── styles.css          # Styling (based on FluidLock theme)
├── noise.js            # Perlin noise implementation
├── voronoi-puzzle.js   # Main application logic
└── README.md           # This file
```

## Usage

1. Open `index.html` in a web browser
2. Use the controls to adjust:
   - **Cell Count**: Number of Voronoi cells (5-50)
   - **Animation Speed**: Speed of boundary animation (0.1-2.0x)
   - **Noise Amplitude**: Intensity of boundary deformation (0-50)
3. Click "Regenerate Puzzle" to create new Voronoi cells
4. Toggle animation on/off as needed

## Future Enhancements

- **Drag and Drop**: Allow players to move pieces around
- **Snap to Location**: Pieces snap to correct positions
- **Puzzle Completion**: Detect when all pieces are in correct positions
- **Performance Optimization**: Further rendering optimizations for larger cell counts

## Dependencies

- **d3-delaunay**: For Voronoi diagram generation (CDN)
- **Canvas 2D API**: For rendering and clipping
- **Custom Noise Implementation**: For smooth boundary animation

## Development Setup

1. **Start development server:**
   ```bash
   npm run dev
   ```
   or
   ```bash
   python3 -m http.server 8080
   ```

2. **Open your browser** to `http://localhost:8080`

## Browser Compatibility

- Modern browsers with Canvas 2D support
- No build step required
- Responsive design for mobile and desktop
