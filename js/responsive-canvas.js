/**
 * Responsive Canvas System
 * 
 * This module provides responsive canvas sizing that:
 * 1. Adjusts canvas size to fit viewport on page load
 * 2. Maintains 16:9 aspect ratio
 * 3. Handles coordinate system properly
 * 4. Provides reload mechanism for viewport changes
 */

class ResponsiveCanvas {
    constructor() {
        this.aspectRatio = 16 / 9;
        this.minWidth = 800;
        this.minHeight = 450;
        this.maxWidth = 1920;
        this.maxHeight = 1080;
        
        // Store original canvas settings for fallback
        this.originalWidth = 1200;
        this.originalHeight = 675;
        
        this.isResponsive = true;
        this.viewportSize = null;
    }
    
    /**
     * Calculate optimal canvas size for current viewport
     * @returns {Object} {width, height} in pixels
     */
    calculateOptimalSize() {
        const viewport = this.getViewportSize();
        
        // Calculate available space (accounting for UI elements)
        const availableWidth = viewport.width - 40; // 20px padding on each side
        const availableHeight = viewport.height - 120; // Account for header, controls, etc.
        
        // Calculate size based on width (16:9 aspect ratio)
        let width = availableWidth;
        let height = width / this.aspectRatio;
        
        // If height is too large, scale down based on height
        if (height > availableHeight) {
            height = availableHeight;
            width = height * this.aspectRatio;
        }
        
        // Apply min/max constraints
        width = Math.max(this.minWidth, Math.min(this.maxWidth, width));
        height = Math.max(this.minHeight, Math.min(this.maxHeight, height));
        
        // Ensure we have integer dimensions
        width = Math.floor(width);
        height = Math.floor(height);
        
        return { width, height };
    }
    
    /**
     * Get current viewport size
     * @returns {Object} {width, height} in pixels
     */
    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
    
    /**
     * Check if viewport size has changed significantly
     * @returns {boolean} True if viewport size changed significantly
     */
    hasViewportChanged() {
        const currentViewport = this.getViewportSize();
        
        if (!this.viewportSize) {
            this.viewportSize = currentViewport;
            return false;
        }
        
        const widthDiff = Math.abs(currentViewport.width - this.viewportSize.width);
        const heightDiff = Math.abs(currentViewport.height - this.viewportSize.height);
        
        // Consider changed if difference is more than 50px in any dimension
        const hasChanged = widthDiff > 50 || heightDiff > 50;
        
        if (hasChanged) {
            this.viewportSize = currentViewport;
        }
        
        return hasChanged;
    }
    
    /**
     * Setup responsive canvas sizing
     * @param {HTMLCanvasElement} canvas - The canvas element to resize
     * @param {boolean} forceResponsive - Force responsive mode even if disabled
     */
    setupResponsiveCanvas(canvas, forceResponsive = false) {
        if (!this.isResponsive && !forceResponsive) {
            // Use fixed size
            this.setupFixedCanvas(canvas);
            return;
        }
        
        const optimalSize = this.calculateOptimalSize();
        
        // Set canvas internal resolution
        canvas.width = optimalSize.width;
        canvas.height = optimalSize.height;
        
        // Set canvas display size
        canvas.style.width = optimalSize.width + 'px';
        canvas.style.height = optimalSize.height + 'px';
        
        // Update container to center the canvas
        this.centerCanvasInContainer(canvas);
        
        // Log the change
        console.log(`🎨 Canvas resized to ${optimalSize.width}×${optimalSize.height} (responsive mode)`);

    }
    
    /**
     * Setup fixed canvas sizing (original behavior)
     * @param {HTMLCanvasElement} canvas - The canvas element to resize
     */
    setupFixedCanvas(canvas) {
        canvas.width = this.originalWidth;
        canvas.height = this.originalHeight;
        canvas.style.width = this.originalWidth + 'px';
        canvas.style.height = this.originalHeight + 'px';
        
        this.centerCanvasInContainer(canvas);
        
        console.log(`🎨 Canvas set to fixed size ${this.originalWidth}×${this.originalHeight}`);
    }
    
    /**
     * Center canvas in its container
     * @param {HTMLCanvasElement} canvas - The canvas element
     */
    centerCanvasInContainer(canvas) {
        const container = canvas.closest('.puzzle-container');
        if (container) {
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
        }
    }
    
    /**
     * Enable or disable responsive mode
     * @param {boolean} enabled - Whether to enable responsive mode
     */
    setResponsiveMode(enabled) {
        this.isResponsive = enabled;
        console.log(`🎨 Responsive canvas mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    /**
     * Handle viewport resize - suggest page reload
     */
    handleViewportResize() {
        if (!this.isResponsive) return;
        
        if (this.hasViewportChanged()) {
            console.log('📱 Viewport size changed significantly. Consider reloading the page for optimal experience.');
            
            // Show a subtle notification
            this.showResizeNotification();
        }
    }
    
    /**
     * Show resize notification to user
     */
    showResizeNotification() {
        // Remove existing notification
        const existing = document.querySelector('.resize-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'resize-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--primary-color);
                color: var(--text-color);
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1000;
                box-shadow: 0 4px 12px var(--background-color);
                cursor: pointer;
                transition: opacity 0.3s ease;
            ">
                📱 Viewport changed - <strong>Reload page</strong> for optimal sizing
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Hide on click
        notification.addEventListener('click', () => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    /**
     * Get current canvas size
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @returns {Object} {width, height} in pixels
     */
    getCanvasSize(canvas) {
        return {
            width: canvas.width,
            height: canvas.height
        };
    }
    
    /**
     * Get canvas scale factor (internal resolution vs display size)
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @returns {Object} {scaleX, scaleY}
     */
    getCanvasScale(canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            scaleX: canvas.width / rect.width,
            scaleY: canvas.height / rect.height
        };
    }
}

// Create global instance
window.responsiveCanvas = new ResponsiveCanvas();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveCanvas;
} else {
    window.ResponsiveCanvas = ResponsiveCanvas;
}
