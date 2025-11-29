import { useCallback, useState, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    Connection,
    ConnectionMode,
    type Node,
    type Edge,
    type EdgeChange,
    type NodeChange,
    useReactFlow,
    Panel,
    ReactFlowProvider,
    useOnSelectionChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, X, Layout, Undo, Redo, RefreshCw, HelpCircle, CheckCircle } from 'lucide-react';
import { exportStateToYAML, importStateFromYAML } from './ImportExport';
import { useStore } from '../store/useStore';

import { RootNode } from './nodes/RootNode';
import { DecisionNode } from './nodes/DecisionNode';
import { LeafNode } from './nodes/LeafNode';
import { InspectorPanel } from './InspectorPanel';

const nodeTypes = {
    root: RootNode,
    decision: DecisionNode,
    leaf: LeafNode,
};

const initialNodes: Node[] = [
    {
        id: 'root',
        type: 'root',
        position: { x: 250, y: 0 },
        data: { nodeId: 'R0' },
        deletable: false,
    },
];

// History hook for Undo/Redo
const useHistory = (initialNodes: Node[], initialEdges: Edge[]) => {
    const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([
        { nodes: initialNodes, edges: initialEdges },
    ]);
    const [pointer, setPointer] = useState(0);

    const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
        setHistory((prev) => {
            const newHistory = prev.slice(0, pointer + 1);
            newHistory.push({ nodes, edges });
            return newHistory;
        });
        setPointer((prev) => prev + 1);
    }, [pointer]);

    const undo = useCallback(() => {
        if (pointer > 0) {
            setPointer((prev) => prev - 1);
            return history[pointer - 1];
        }
        return null;
    }, [pointer, history]);

    const redo = useCallback(() => {
        if (pointer < history.length - 1) {
            setPointer((prev) => prev + 1);
            return history[pointer + 1];
        }
        return null;
    }, [pointer, history]);

    const canUndo = pointer > 0;
    const canRedo = pointer < history.length - 1;

    return { takeSnapshot, undo, redo, canUndo, canRedo };
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const tree: Record<string, { left?: string; right?: string; center?: string }> = {};
    const root = nodes.find(n => n.type === 'root');

    if (!root) return { nodes, edges };

    // Build tree structure
    nodes.forEach(n => tree[n.id] = {});
    edges.forEach(e => {
        if (e.sourceHandle === 'no') tree[e.source].left = e.target;
        else if (e.sourceHandle === 'yes') tree[e.source].right = e.target;
        else tree[e.source].center = e.target;
    });

    const positions: Record<string, { x: number; y: number }> = {};
    const LEVEL_HEIGHT = 180;

    const getNodeWidth = (type?: string) => {
        if (type === 'decision') return 280;
        if (type === 'root') return 150;
        return 180; // leaf
    };

    const GAP = 80;

    // Store relative offset of children from their parent
    const childOffsets: Record<string, { left?: number; right?: number; center?: number }> = {};

    interface SubtreeDimension {
        left: number;  // Distance from center to left edge
        right: number; // Distance from center to right edge
    }

    const calculateDimensions = (id: string, visited: Set<string>): SubtreeDimension => {
        if (visited.has(id)) return { left: 0, right: 0 };
        visited.add(id);

        const { left, right, center } = tree[id];
        const node = nodes.find(n => n.id === id);
        const nodeWidth = getNodeWidth(node?.type);
        const halfNodeWidth = nodeWidth / 2;

        // Base dimension is the node itself
        let myDims: SubtreeDimension = { left: halfNodeWidth, right: halfNodeWidth };

        if (center) {
            const dimsC = calculateDimensions(center, new Set(visited));
            // Center child is directly below, so we take max width
            myDims.left = Math.max(myDims.left, dimsC.left);
            myDims.right = Math.max(myDims.right, dimsC.right);
            childOffsets[id] = { center: 0 };
        } else if (left || right) {
            const dimsL = left ? calculateDimensions(left, new Set(visited)) : { left: 0, right: 0 };
            const dimsR = right ? calculateDimensions(right, new Set(visited)) : { left: 0, right: 0 };

            let dist = 0;
            if (left && right) {
                // Distance between centers
                dist = dimsL.right + GAP + dimsR.left;

                // Decision node constraint
                // Width 280 -> Handles at +/- 140 (approx). 
                // We want children at +/- 200 to give plenty of space for the curve.
                if (node?.type === 'decision') {
                    dist = Math.max(dist, 400);
                }
            } else if (left) {
                if (node?.type === 'decision') dist = 200;
            } else if (right) {
                if (node?.type === 'decision') dist = 200;
            }

            let offsetL = 0;
            let offsetR = 0;

            if (left && right) {
                offsetL = dist / 2;
                offsetR = dist / 2;
            } else if (left) {
                offsetL = (node?.type === 'decision') ? 200 : 0;
            } else if (right) {
                offsetR = (node?.type === 'decision') ? 200 : 0;
            }

            childOffsets[id] = {
                left: left ? -offsetL : undefined,
                right: right ? offsetR : undefined
            };

            if (left) myDims.left = Math.max(myDims.left, offsetL + dimsL.left);
            if (right) myDims.right = Math.max(myDims.right, offsetR + dimsR.right);
        }

        return myDims;
    };

    calculateDimensions(root.id, new Set());

    const assignPositions = (id: string, x: number, y: number, visited: Set<string>) => {
        if (visited.has(id)) return;
        visited.add(id);

        positions[id] = { x, y };

        const { left, right, center } = tree[id];
        const offsets = childOffsets[id] || {};

        if (center) {
            assignPositions(center, x + (offsets.center || 0), y + LEVEL_HEIGHT, visited);
        }

        if (left) {
            assignPositions(left, x + (offsets.left || 0), y + LEVEL_HEIGHT, visited);
        }

        if (right) {
            assignPositions(right, x + (offsets.right || 0), y + LEVEL_HEIGHT, visited);
        }
    };

    assignPositions(root.id, 0, 0, new Set());

    // Apply positions
    const layoutedNodes = nodes.map(node => {
        const pos = positions[node.id];
        if (pos) {
            let width = 180; // Default (Leaf)
            if (node.type === 'decision') width = 280;
            if (node.type === 'root') width = 150;

            return {
                ...node,
                position: {
                    x: pos.x - width / 2,
                    y: pos.y - 50, // Center vertically (assuming height ~100)
                },
            };
        }
        return node;
    });

    return { nodes: layoutedNodes, edges };
};

const TreeEditor = () => {
    const {
        nodes, edges,
        onNodesChange, onEdgesChange,
        setNodes, setEdges,
        variables,
        invariants,
        testCases,
        simulationResults,
        modelCheckerResults
    } = useStore();

    const { screenToFlowPosition, deleteElements, fitView } = useReactFlow();
    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
    const [showInspector, setShowInspector] = useState(true);
    const [showHelp, setShowHelp] = useState(false);

    // History management
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory(initialNodes, []);
    // Ref to track if change is from undo/redo to avoid loop
    const isUndoingRedoing = useRef(false);

    useOnSelectionChange({
        onChange: ({ nodes, edges }) => {
            setSelectedNodes(nodes);
            setSelectedEdges(edges);
            if (nodes.length > 0 || edges.length > 0) setShowInspector(true);
        },
    });

    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        onNodesChange(changes);
        // Only snapshot on 'dimensions' or 'position' change end (drag end) or 'add'/'remove'
        const significantChange = changes.some(c => c.type === 'add' || c.type === 'remove' || (c.type === 'position' && !c.dragging));
        if (significantChange && !isUndoingRedoing.current) {
            // Logic to handle snapshotting could be improved here
        }
    }, [onNodesChange]);

    const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
        onEdgesChange(changes);
    }, [onEdgesChange]);

    // Snapshot effect
    useEffect(() => {
        if (!isUndoingRedoing.current) {
            const timer = setTimeout(() => {
                takeSnapshot(nodes, edges);
            }, 500); // Debounce snapshots
            return () => clearTimeout(timer);
        }
        isUndoingRedoing.current = false;
    }, [nodes, edges, takeSnapshot]);

    const handleUndo = useCallback(() => {
        const state = undo();
        if (state) {
            isUndoingRedoing.current = true;
            setNodes(state.nodes);
            setEdges(state.edges);
        }
    }, [undo, setNodes, setEdges]);

    const handleRedo = useCallback(() => {
        const state = redo();
        if (state) {
            isUndoingRedoing.current = true;
            setNodes(state.nodes);
            setEdges(state.edges);
        }
    }, [redo, setNodes, setEdges]);

    // Ensure ROOT node always exists
    useEffect(() => {
        const hasRoot = nodes.some(node => node.id === 'root');
        if (!hasRoot) {
            setNodes([
                {
                    id: 'root',
                    type: 'root',
                    position: { x: 250, y: 0 },
                    data: { nodeId: 'R0' },
                    deletable: false,
                },
                ...nodes
            ]);
        }
    }, [nodes, setNodes]);

    useEffect(() => {
        const handleExport = () => {
            exportStateToYAML(
                variables,
                nodes,
                edges,
                invariants,
                testCases,
                simulationResults,
                modelCheckerResults
            );
        };

        const handleImport = (e: Event) => {
            const customEvent = e as CustomEvent<{ file: File }>;
            if (customEvent.detail?.file) {
                importStateFromYAML(
                    customEvent.detail.file,
                    (newNodes: Node[]) => {
                        setNodes(newNodes);
                        takeSnapshot(newNodes, []);
                    },
                    (newEdges: Edge[]) => setEdges(newEdges)
                );
            }
        };

        window.addEventListener('export-tree', handleExport);
        window.addEventListener('import-tree', handleImport as EventListener);

        return () => {
            window.removeEventListener('export-tree', handleExport);
            window.removeEventListener('import-tree', handleImport as EventListener);
        };
    }, [variables, invariants, nodes, edges, testCases, simulationResults, modelCheckerResults, setNodes, setEdges, takeSnapshot]);

    const isValidConnection = useCallback((connection: Connection | Edge) => {
        if (connection.source === connection.target) return false;

        // Allow merging by removing the incoming edge check

        const hasOutgoingEdgeFromHandle = edges.some(e =>
            e.source === connection.source &&
            (
                e.sourceHandle === connection.sourceHandle ||
                (e.sourceHandle === null && connection.sourceHandle === 'out') ||
                (e.sourceHandle === 'out' && connection.sourceHandle === null)
            )
        );

        if (hasOutgoingEdgeFromHandle) return false;

        return true;
    }, [edges]);

    const onConnect = useCallback(
        (params: Connection) => {
            const { sourceHandle } = params;
            const newEdges = addEdge(params, edges);

            const coloredEdges = newEdges.map(edge => {
                if (edge.id === newEdges[newEdges.length - 1].id) {
                    if (sourceHandle === 'yes') {
                        return {
                            ...edge,
                            style: { stroke: '#10b981', strokeWidth: 3 },
                            markerEnd: { type: 'arrowclosed' as const, color: '#10b981' },
                        };
                    } else if (sourceHandle === 'no') {
                        return {
                            ...edge,
                            style: { stroke: '#ef4444', strokeWidth: 3 },
                            markerEnd: { type: 'arrowclosed' as const, color: '#ef4444' },
                        };
                    } else {
                        return {
                            ...edge,
                            style: { stroke: '#a78bfa', strokeWidth: 3 },
                            markerEnd: { type: 'arrowclosed' as const, color: '#a78bfa' },
                        };
                    }
                }
                return edge;
            });

            setEdges(coloredEdges);
        },
        [edges, setEdges],
    );

    const onLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
        window.requestAnimationFrame(() => {
            fitView({ padding: 0.2, duration: 800 });
        });
    }, [nodes, edges, setNodes, setEdges, fitView]);

    const getCenterPosition = useCallback(() => {
        if (selectedNodes.length > 0) {
            return { x: selectedNodes[0].position.x + 50, y: selectedNodes[0].position.y + 100 };
        }
        return { x: 250, y: 200 };
    }, [selectedNodes]);

    const addDecisionNode = useCallback(() => {
        const id = `d_${Date.now()}`;
        const pos = getCenterPosition();
        const newNode: Node = {
            id,
            type: 'decision',
            position: pos,
            data: {
                nodeId: `D${nodes.filter(n => n.type === 'decision').length + 1}`,
                label: 'New Decision',
                expression: ''
            },
        };
        setNodes([...nodes, newNode]);
    }, [nodes, setNodes, getCenterPosition]);

    const addLeafNode = useCallback(() => {
        const id = `l_${Date.now()}`;
        const pos = getCenterPosition();
        const newNode: Node = {
            id,
            type: 'leaf',
            position: pos,
            data: {
                nodeId: `L${nodes.filter(n => n.type === 'leaf').length + 1}`,
                label: 'New Result'
            },
        };
        setNodes([...nodes, newNode]);
    }, [nodes, setNodes, getCenterPosition]);

    const handleDelete = useCallback(() => {
        if (selectedNodes.length === 0) return;

        const nodesToDelete = selectedNodes.filter(n => n.type !== 'root');
        if (nodesToDelete.length === 0) return;

        deleteElements({ nodes: nodesToDelete });
        setSelectedNodes([]);
    }, [selectedNodes, deleteElements]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) return;

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                if (event.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
                event.preventDefault();
                return;
            }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
                handleRedo();
                event.preventDefault();
                return;
            }

            switch (event.key.toLowerCase()) {
                case 'd':
                    addDecisionNode();
                    break;
                case 'l':
                    addLeafNode();
                    break;
                case 'delete':
                case 'backspace':
                    handleDelete();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [addDecisionNode, addLeafNode, handleDelete, handleUndo, handleRedo]);

    const canDelete = selectedNodes.length > 0 && selectedNodes.some(n => n.deletable !== false);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                isValidConnection={isValidConnection}
                nodeTypes={nodeTypes}
                fitView
                colorMode="dark"
                connectionMode={ConnectionMode.Strict}
                deleteKeyCode={null}
                snapToGrid={true}
                snapGrid={[15, 15]}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#6b7280', strokeWidth: 3 },
                    markerEnd: {
                        type: 'arrowclosed',
                        color: '#6b7280',
                    },
                }}
            >
                <Background color="#333" gap={16} />
                <Controls className="bg-gray-800 border-gray-700 fill-white" />
                <MiniMap className="bg-gray-800 border-gray-700" nodeColor="#4b5563" />

                <Panel position="top-left" className="bg-gray-800 p-2 rounded-lg border border-gray-700 shadow-lg">
                    <div className="flex gap-2">
                        <button
                            onClick={handleUndo}
                            disabled={!canUndo}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${canUndo ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo size={16} />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${canRedo ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo size={16} />
                        </button>

                        <div className="w-px bg-gray-600 mx-1" />

                        <button
                            onClick={addDecisionNode}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
                            title="Add Decision Node (D)"
                        >
                            <Plus size={16} />
                            Decision
                        </button>
                        <button
                            onClick={addLeafNode}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-medium transition-colors"
                            title="Add Leaf Node (L)"
                        >
                            <Plus size={16} />
                            Leaf
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={!canDelete}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${canDelete ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                            title="Delete Selected (Del)"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="w-px bg-gray-600 mx-1" />

                        <button
                            onClick={onLayout}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-medium transition-colors"
                            title="Auto Layout"
                        >
                            <Layout size={16} />
                            Auto Layout
                        </button>

                        <div className="w-px bg-gray-600 mx-1" />

                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${showHelp ? 'bg-yellow-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                            title="Help"
                        >
                            <HelpCircle size={16} />
                        </button>
                    </div>

                    {showHelp && (
                        <div className="mt-4 p-4 bg-gray-900 rounded border border-gray-700 text-sm text-gray-300 max-w-md">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-white">Keyboard Shortcuts</h3>
                                <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>
                            <ul className="space-y-1">
                                <li><span className="font-mono bg-gray-800 px-1 rounded">D</span> : Add Decision Node</li>
                                <li><span className="font-mono bg-gray-800 px-1 rounded">L</span> : Add Leaf Node</li>
                                <li><span className="font-mono bg-gray-800 px-1 rounded">Del</span> : Delete Selected</li>
                                <li><span className="font-mono bg-gray-800 px-1 rounded">Ctrl+Z</span> : Undo</li>
                                <li><span className="font-mono bg-gray-800 px-1 rounded">Ctrl+Y</span> : Redo</li>
                            </ul>
                            <div className="mt-3 pt-3 border-t border-gray-700">
                                <div className="font-bold text-white mb-1">Tips</div>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>Drag from <span className="text-green-400">Green (Yes)</span> or <span className="text-red-400">Red (No)</span> handles to connect nodes.</li>
                                    <li>Use Auto Layout to organize your tree.</li>
                                    <li>Define variables in the left panel first.</li>
                                </ul>
                                <div className="text-green-400 mt-2 flex items-center gap-1">
                                    <CheckCircle size={12} /> Auto-saved locally
                                </div>
                            </div>
                        </div>
                    )}
                </Panel>
                {showInspector && (
                    <InspectorPanel
                        selectedNodes={selectedNodes}
                        selectedEdges={selectedEdges}
                        onClose={() => setShowInspector(false)}
                    />
                )}
            </ReactFlow>
        </div>
    );
};

export const TreeEditorWrapper = () => {
    return (
        <ReactFlowProvider>
            <TreeEditor />
        </ReactFlowProvider>
    );
};
