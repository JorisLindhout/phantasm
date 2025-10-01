# FluidLock

A responsive canvas application that displays an SVG at double size using HTML5 Canvas with draggable grid pieces and smart snapping.

## Features

- **Responsive Canvas**: Automatically adjusts to different screen sizes
- **2x Scale Display**: SVG (850×478px) displayed at 1700×956px
- **Template Canvas**: Reference image with grid overlay showing target pattern
- **Workspace Canvas**: Interactive area where you arrange puzzle pieces
- **Draggable Pieces**: 16 individual pieces that can be moved freely
- **Smart Snapping**: 85% overlap threshold for grid alignment
- **Completion Detection**: Neon green glow when all pieces are correctly positioned
- **Z-Index Management**: Last clicked piece always on top
- **High-DPI Support**: Crisp rendering on retina displays
- **Modern UI**: Dark theme with cyan accents and green snap highlights
- **Vite Development Server**: No CORS issues with local development

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
FluidLock/
├── assets/
│   └── base-image-cube.svg    # Original SVG file
├── index.html                 # Main HTML file
├── styles.css                # CSS styles with CSS variables
├── app.js                    # Main JavaScript application
├── config.js                 # Configuration variables
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
└── README.md                 # This file
```

## Configuration

### Easy Customization

Edit `config.js` to customize the application:

```javascript
const CONFIG = {
    // Snap Settings
    SNAP_THRESHOLD: 85, // Percentage overlap required for snapping (0-100)
    
    // Colors
    COLORS: {
        PRIMARY: '#00DDFF',
        SNAP_HIGHLIGHT_BG: 'rgba(0, 255, 100, 0.3)',
        SNAP_HIGHLIGHT_BORDER: '#00FF64',
        // ... more color options
    },
    
    // Grid Settings
    GRID: {
        SIZE: 4, // 4x4 grid
        GAP: 2 // Gap between pieces in pixels
    },
    
    // Canvas Settings
    CANVAS: {
        ORIGINAL_WIDTH: 850,
        ORIGINAL_HEIGHT: 478,
        SCALE: 2 // Display at 2x size
    }
};
```

### CSS Variables

Edit `styles.css` to customize colors and styling:

```css
:root {
    --primary-color: #00DDFF;
    --snap-highlight-bg: rgba(0, 255, 100, 0.3);
    --snap-highlight-border: #00FF64;
    /* ... more CSS variables */
}
```

## Technical Details

- **Original SVG**: 850×478 pixels
- **Canvas Display**: 1700×956 pixels (exactly 2x scale)
- **Grid Pieces**: 16 individual pieces (A1-D4)
- **Smart Snapping**: 85% overlap threshold for grid alignment
- **Responsive**: Automatically scales down on smaller screens
- **Performance**: Uses HTML5 Canvas for smooth rendering
- **Development**: Vite server for hot reloading and CORS-free development

## How It Works

1. **Template Canvas**: Shows the full SVG with 4x4 grid overlay as a reference
2. **Workspace Canvas**: 16 individual pieces that can be arranged to match the template
3. **Dragging**: Pieces can be moved freely with mouse or touch
4. **Smart Snapping**: When 85%+ of a piece overlaps with a grid slot, it highlights
5. **Snapping**: Drop in highlighted slot to snap to grid position
6. **Completion Detection**: Workspace canvas glows neon green when all pieces are correctly positioned
7. **Z-Index**: Last clicked piece always appears on top

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## Troubleshooting

If you encounter CORS errors when opening `index.html` directly in the browser, use the Vite development server instead:

```bash
npm run dev
```

## Customization Examples

### Change Snap Threshold
```javascript
// In config.js
SNAP_THRESHOLD: 75, // More forgiving snapping
```

### Change Colors
```javascript
// In config.js
COLORS: {
    SNAP_HIGHLIGHT_BG: 'rgba(255, 165, 0, 0.3)', // Orange highlight
    SNAP_HIGHLIGHT_BORDER: '#FFA500',
}
```

### Change Grid Size
```javascript
// In config.js
GRID: {
    SIZE: 3, // 3x3 grid instead of 4x4
}
```
