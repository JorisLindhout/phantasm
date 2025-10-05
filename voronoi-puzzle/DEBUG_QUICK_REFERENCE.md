# Debug System - Quick Reference Card

## 🚀 Essential Commands

### System Status & Help
```javascript
DebugCommands.info.status()        // Check system status
DebugCommands.info.help()          // Show help
DebugCommands.info.commands()      // List all commands
```

### Quick Mode Switching
```javascript
DebugCommands.quick.silent()       // Silent mode (user messages only)
DebugCommands.quick.full()         // Full debugging
DebugCommands.quick.overlay()      // Show visual overlay
```

### Workflow Automation
```javascript
DebugCommands.workflow.quickDebug()           // Start quick debugging
DebugCommands.workflow.performanceAnalysis()  // Performance analysis
DebugCommands.workflow.hitDetectionDebug()    // Hit detection debugging
DebugCommands.workflow.shutdown()             // Clean shutdown
```

## 🎯 Debug Modes

| Mode | Description | Categories |
|------|-------------|------------|
| `silent` | User messages only | `user-feedback` |
| `drag-debugging` | Drag interactions | `drag-events`, `hit-detection`, `coordinate-transforms` |
| `hit-detection` | Piece selection | `hit-detection`, `coordinate-transforms` |
| `piece-debugging` | Piece states | `piece-states`, `coordinate-transforms` |
| `theme-debugging` | Visual themes | `theme-changes` |
| `debug-tools` | Debug operations | `debug-tools` |
| `performance` | System performance | `initialization`, `performance` |
| `full` | All debugging | All categories |

## 🎮 Contexts

| Context | Description | Auto-Enables |
|---------|-------------|--------------|
| `puzzle-solving` | Puzzle completion focus | `drag-events`, `hit-detection`, `piece-states` |
| `performance-debugging` | Performance monitoring | `initialization`, `performance` |
| `coordinate-issues` | Coordinate problems | `coordinate-transforms`, `hit-detection` |
| `hit-detection-problems` | Selection issues | `hit-detection`, `coordinate-transforms` |
| `theme-development` | Visual themes | `theme-changes` |
| `full-debugging` | All capabilities | All categories |

## 📊 SmartLogger Categories

| Category | Emoji | Description |
|----------|-------|-------------|
| `user-feedback` | 🎉✅⚠️ | User-facing messages |
| `initialization` | 🔍 | System initialization |
| `drag-events` | 🖱️🎯 | Mouse and drag interactions |
| `hit-detection` | 🎯🔍 | Piece selection and hit detection |
| `coordinate-transforms` | 🔄 | Coordinate calculations |
| `piece-states` | 📊✨ | Piece state changes |
| `theme-changes` | 🎨 | Theme and styling |
| `debug-tools` | 🔧 | Debug tool operations |

## 🔧 Manual Control

### Mode Management
```javascript
DebugHub.setMode('drag-debugging')     // Set mode
DebugHub.enableCategory('hit-detection')  // Enable category
DebugHub.disableCategory('piece-states')  // Disable category
DebugHub.listCategories()              // List active categories
```

### Context Management
```javascript
ContextManager.setContext('puzzle-solving')  // Set context
ContextManager.listContexts()                // List contexts
ContextManager.getCurrentContext()           // Get current context
```

### Visual Overlay
```javascript
showDebugOverlay()                    // Show overlay
hideDebugOverlay()                    // Hide overlay
toggleDebugOverlay()                  // Toggle overlay
trackDebugPiece(5)                    // Track piece 5
setDebugOverlayContextAware()         // Make context-aware
```

## 📤 Export & Analysis

### Quick Exports
```javascript
ExportSystem.quick.diagnostics()     // Export diagnostics (JSON)
ExportSystem.quick.logs()            // Export logs (TXT)
ExportSystem.quick.performance()     // Export performance (CSV)
ExportSystem.quick.session()         // Export complete session (JSON)
```

### Custom Exports
```javascript
ExportSystem.exportDiagnostics('csv', 'my-diagnostics')
ExportSystem.exportCompleteSession('html', 'debug-report')
ExportSystem.getSystemInfo()         // Get system information
```

## 🧪 Testing & Quality

### Integration Testing
```javascript
IntegrationTester.runAllTests()      // Run all tests
IntegrationTester.getTestResults()   // Get test results
IntegrationTester.clearTestResults() // Clear results
```

### Diagnostics
```javascript
ResultsAggregator.runAllDiagnostics()  // Run all diagnostics
ResultsAggregator.exportResults()      // Export results
ResultsAggregator.clearResults()       // Clear results
```

## 🆘 Troubleshooting

### Common Issues
```javascript
migrateConsoleLog()                  // Find unmigrated logs
DebugCommands.info.status()          // Check system status
IntegrationTester.runAllTests()      // Test system integrity
```

### Migration Helper
```javascript
// Find unmigrated console.log statements
migrateConsoleLog()

// This will show warnings for any remaining console.log calls
// that haven't been converted to SmartLogger
```

## 📈 Performance Impact

### Before Migration
- **798 console.log statements** always executing
- **High log pollution** making debugging difficult
- **No filtering** - all logs always shown

### After Migration
- **~50 user-facing logs** (essential messages only)
- **~100 contextual debug logs** (only when relevant)
- **~648 logs removed** (pure debug noise eliminated)
- **Zero performance impact** in production

## 🎯 Best Practices

1. **Use workflows** for common tasks: `DebugCommands.workflow.quickDebug()`
2. **Set appropriate contexts**: `ContextManager.setContext('puzzle-solving')`
3. **Export for analysis**: `ExportSystem.quick.session()`
4. **Test regularly**: `IntegrationTester.runAllTests()`
5. **Use specific categories**: `SmartLogger.log('hit-detection', 'message')`

## 🔄 Migration Examples

### Before (Old System)
```javascript
console.log('🔍 WebGL version:', gl.getParameter(gl.VERSION))
console.log('🖱️ Mouse down at (100, 200)')
console.log('🎯 Piece 5 selected')
```

### After (New System)
```javascript
// User-facing (always shown)
console.log('✅ WebGL renderer initialized')

// Contextual (only when relevant)
SmartLogger.log('drag-events', '🖱️ Mouse down at (100, 200)')
SmartLogger.log('hit-detection', '🎯 Piece 5 selected')
```

## 🎉 Quick Start Workflow

1. **Check system**: `DebugCommands.info.status()`
2. **Start debugging**: `DebugCommands.workflow.quickDebug()`
3. **Debug your issue** (logs automatically filtered)
4. **Export session**: `ExportSystem.quick.session()`
5. **Clean shutdown**: `DebugCommands.workflow.shutdown()`

---

**Need more help?** Run `DebugCommands.info.help()` for detailed assistance!
