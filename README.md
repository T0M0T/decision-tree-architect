# Decision Tree Architect

A powerful visual editor for designing, simulating, and verifying decision trees.

## Features

*   **Visual Editor**: Drag-and-drop interface to build decision trees with Decision and Leaf nodes.
*   **Auto Layout**: Intelligent layout algorithm to organize your tree automatically.
*   **Variable Management**: Define boolean, integer, and float variables for your logic.
*   **Simulation & Coverage**: Run test cases and visualize covered paths with a heatmap.
*   **Real-time Validation**: Instant feedback on unreachable nodes and paths.
*   **State Analysis**: Inspect variable states at any point in the tree with the new Inspector Panel.
*   **Model Checker**: Verify invariants and check for unreachable states or conflicting paths.
*   **Code Generation**: Export your decision tree to C++ code.
*   **Import/Export**: Save and load your projects as YAML files.

## Getting Started

1.  Clone the repository.
2.  Run `npm install` to install dependencies.
3.  Run `npm run dev` to start the development server.

## Usage

*   **Add Nodes**: Use the panel on the left or keyboard shortcuts (D for Decision, L for Leaf).
*   **Connect**: Drag from Yes (Green) or No (Red) handles to connect nodes.
*   **Define Logic**: Click on Decision nodes to set their conditions. You can drag variables from the sidebar directly into the expression editor.
*   **Shortcuts**:
    *   `Ctrl+S`: Export to YAML
    *   `Ctrl+O`: Import from YAML
    *   `Ctrl+D`: Duplicate selected nodes
    *   `Ctrl+Z` / `Ctrl+Y`: Undo / Redo
*   **Verify**: Use the Model Checker tab to ensure your tree is logically sound.
