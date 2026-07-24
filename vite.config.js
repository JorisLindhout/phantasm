import { defineConfig } from 'vite'

export default defineConfig({
  // Development server configuration
  server: {
    port: 8080,
    open: true, // Automatically open browser
    host: true, // Allow external connections
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Dev server still serves source maps; omit from production builds
    rollupOptions: {
      output: {
        // Keep asset names predictable for WebGL resources
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    }
  },
  
  // Optimize dependencies for WebGL libraries
  optimizeDeps: {
    include: ['d3-delaunay', 'three']
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  }
})
