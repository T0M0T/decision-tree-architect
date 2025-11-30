# Changelog


## [1.3.0] - 2025-12-01

### Added
- **Electron Build Support**: Added Electron Forge configuration for building standalone Windows executables.
- **Desktop Application**: Application can now be packaged as a native desktop app (EXE) for Windows.
- **Distribution Package**: ZIP distribution package for easy deployment.

### Changed
- Configured Electron Forge with ZIP maker for simplified build process.
- Added `electron:start`, `electron:package`, and `electron:make` npm scripts.

## [1.2.0] - 2025-11-30

### Added
- **Simulation Coverage Visualization**: Heatmap-style visualization of covered paths and nodes during simulation.
- **Real-time Reachability Analysis**: Visual warnings for unreachable nodes and paths.
- **Drag & Drop Variable Insertion**: Drag variables from the sidebar directly into decision node expressions.
- **Expanded Keyboard Shortcuts**: Added shortcuts for Save (Ctrl+S), Open (Ctrl+O), and Duplicate (Ctrl+D).

## [1.1.0] - 2025-11-30

### Added
- **State Inspector Panel**: Real-time analysis of variable states at any node or edge.
- **Path Merging**: Support for multiple inputs to Decision and Leaf nodes (DAG support).
- **State Analysis**: Logic to calculate possible variable values based on path constraints.

## [1.0.0] - 2025-11-30

### Added
- Visual Decision Tree Editor with React Flow.
- Variable Management (Boolean, Integer, Float).
- Auto Layout algorithm for organized tree structures.
- Simulation panel for testing logic paths.
- Model Checker for verifying invariants and detecting issues.
- C++ Code Generator.
- Import/Export functionality (YAML).
- Undo/Redo support.
