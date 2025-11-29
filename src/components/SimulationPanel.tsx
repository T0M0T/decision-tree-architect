import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Node
} from '@xyflow/react';
import { Play, RotateCcw, CheckCircle, AlertCircle, Plus, Trash2, Edit, X, Save } from 'lucide-react';
import { TestCase, SimulationResult } from '../types';
import { RootNode } from './nodes/RootNode';
import { DecisionNode } from './nodes/DecisionNode';
import { LeafNode } from './nodes/LeafNode';

const nodeTypes = {
    root: RootNode,
    decision: DecisionNode,
    leaf: LeafNode,
};

// Modal for Adding/Editing Test Case
const TestCaseModal = ({
    isOpen,
    onClose,
    onSave,
    initialCase,
    variables
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, values: Record<string, string>) => void;
    initialCase: TestCase | null;
    variables: any[];
}) => {
    const [name, setName] = useState('');
    const [values, setValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (initialCase) {
                setName(initialCase.name);
                setValues(initialCase.values);
            } else {
                setName('New Case');
                const defaults: Record<string, string> = {};
                variables.forEach(v => {
                    if (v.possibleValues.length > 0) {
                        defaults[v.name] = v.possibleValues[0];
                    }
                });
                setValues(defaults);
            }
        }
    }, [isOpen, initialCase, variables]);

    if (!isOpen) return null;

    const handleValueChange = (varName: string, val: string) => {
        setValues(prev => ({ ...prev, [varName]: val }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-[500px] max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{initialCase ? 'Edit Test Case' : 'Add Test Case'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Case Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Variable Values</label>
                        {variables.length === 0 ? (
                            <div className="text-gray-500 italic text-sm">No variables defined.</div>
                        ) : (
                            variables.map(v => (
                                <div key={v.id} className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-700">
                                    <span className="text-sm text-gray-300 font-mono">{v.name}</span>
                                    <select
                                        value={values[v.name] || ''}
                                        onChange={e => handleValueChange(v.name, e.target.value)}
                                        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 min-w-[120px]"
                                    >
                                        {v.possibleValues.map((val: string) => (
                                            <option key={val} value={val}>{val}</option>
                                        ))}
                                    </select>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(name, values)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-2 transition-colors"
                    >
                        <Save size={16} /> Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SimulationPanel = () => {
    const {
        variables,
        nodes: storeNodes,
        edges: storeEdges,
        testCases,
        simulationResults,
        addTestCase,
        updateTestCase,
        removeTestCase,
        setSimulationResults,
        setTestCases
    } = useStore();

    // State
    const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

    // Helper to get default values
    const getDefaultValues = () => {
        const initialValues: Record<string, string> = {};
        variables.forEach(v => {
            if (v.possibleValues.length > 0) {
                initialValues[v.name] = v.possibleValues[0];
            }
        });
        return initialValues;
    };

    // Add a default case if none exist on mount
    useEffect(() => {
        if (testCases.length === 0 && variables.length > 0) {
            const newCase: TestCase = {
                id: crypto.randomUUID(),
                name: 'Case 1',
                values: getDefaultValues()
            };
            setTestCases([newCase]);
            setActiveCaseId(newCase.id);
        } else if (testCases.length > 0 && !activeCaseId) {
            setActiveCaseId(testCases[0].id);
        }
    }, [variables, testCases.length]); // Only run when variables change or testCases becomes empty

    const handleOpenAddModal = () => {
        setEditingCaseId(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCaseId(id);
        setIsModalOpen(true);
    };

    const handleSaveCase = (name: string, values: Record<string, string>) => {
        if (editingCaseId) {
            // Update existing
            updateTestCase(editingCaseId, { name, values });
            // Clear result for this case
            const nextResults = { ...simulationResults };
            delete nextResults[editingCaseId];
            setSimulationResults(nextResults);
        } else {
            // Add new
            const newCase: TestCase = {
                id: crypto.randomUUID(),
                name: name || `Case ${testCases.length + 1}`,
                values
            };
            addTestCase(newCase);
            setActiveCaseId(newCase.id);
        }
        setIsModalOpen(false);
    };

    const handleRemoveCase = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeTestCase(id);
        if (activeCaseId === id) {
            const remaining = testCases.filter(tc => tc.id !== id);
            setActiveCaseId(remaining.length > 0 ? remaining[0].id : null);
        }
    };

    const runSimulation = (values: Record<string, string>): SimulationResult => {
        const root = storeNodes.find(n => n.type === 'root');
        if (!root) return { nodeIds: new Set(), edgeIds: new Set(), result: 'Error: No Root', display: 'Error: No Root', isError: true };

        const nodeIds = new Set<string>();
        const edgeIds = new Set<string>();
        let currentNode: Node | undefined = root;
        let result: string | null = null;
        let display = '';
        let isError = false;

        const visited = new Set<string>();
        let steps = 0;
        const MAX_STEPS = 100;

        const allEnumValues = new Set<string>();
        variables.forEach(v => v.possibleValues.forEach(val => allEnumValues.add(val)));
        const enumArray = Array.from(allEnumValues);

        while (currentNode && steps < MAX_STEPS) {
            nodeIds.add(currentNode.id);
            if (visited.has(currentNode.id)) {
                result = "Loop Detected";
                display = "Error: Loop Detected";
                isError = true;
                break;
            }
            visited.add(currentNode.id);
            steps++;

            if (currentNode.type === 'leaf') {
                const nodeId = (currentNode.data.nodeId as string) || 'Unknown';
                const label = (currentNode.data.label as string) || 'Leaf';
                result = nodeId;
                display = `${nodeId} (${label})`;
                break;
            }

            if (currentNode.type === 'root') {
                const outEdge = storeEdges.find(e => e.source === currentNode!.id && (e.sourceHandle === 'out' || e.sourceHandle === null));
                if (!outEdge) {
                    result = "Stuck";
                    display = "Stuck at Root";
                    isError = true;
                    break;
                }
                edgeIds.add(outEdge.id);
                currentNode = storeNodes.find(n => n.id === outEdge.target);
                continue;
            }

            if (currentNode.type === 'decision') {
                const expression = currentNode.data.expression as string;
                if (!expression) {
                    result = "Empty Condition";
                    display = "Error: Empty Condition";
                    isError = true;
                    break;
                }

                let evalResult = false;
                try {
                    const argNames = [...Object.keys(values), ...enumArray];
                    const argValues = [...Object.values(values), ...enumArray];
                    const func = new Function(...argNames, `return ${expression};`);
                    evalResult = func(...argValues);
                } catch (e) {
                    result = "Invalid Expression";
                    display = `Error: Invalid Expression (${expression})`;
                    isError = true;
                    break;
                }

                const handleId = evalResult ? 'yes' : 'no';
                const outEdge = storeEdges.find(e => e.source === currentNode!.id && e.sourceHandle === handleId);

                if (!outEdge) {
                    result = "Stuck";
                    display = `Stuck: No path for ${evalResult ? 'YES' : 'NO'}`;
                    isError = true;
                    break;
                }

                edgeIds.add(outEdge.id);
                currentNode = storeNodes.find(n => n.id === outEdge.target);
            }
        }

        if (steps >= MAX_STEPS) {
            result = "Timeout";
            display = "Error: Too many steps";
            isError = true;
        }

        return { nodeIds, edgeIds, result, display, isError };
    };

    const handleRunAll = () => {
        setIsRunning(true);
        setTimeout(() => {
            const newResults: Record<string, SimulationResult> = {};
            testCases.forEach(tc => {
                newResults[tc.id] = runSimulation(tc.values);
            });
            setSimulationResults(newResults);
            setIsRunning(false);
        }, 50);
    };

    const handleRunSingleCase = (tc: TestCase) => {
        const result = runSimulation(tc.values);
        setSimulationResults({
            ...simulationResults,
            [tc.id]: result
        });
        setActiveCaseId(tc.id);
    };

    const activeResult = activeCaseId ? simulationResults[activeCaseId] : null;

    // Prepare nodes and edges for display with highlighting
    const displayNodes = useMemo(() => {
        return storeNodes.map(node => {
            const isVisited = activeResult?.nodeIds.has(node.id);
            const isResult = node.type === 'leaf' && isVisited && activeResult?.result === node.data.nodeId;

            return {
                ...node,
                data: { ...node.data },
                style: {
                    ...node.style,
                    opacity: activeResult ? (isVisited ? 1 : 0.3) : 1,
                    border: isResult ? '3px solid #10b981' : isVisited ? '2px solid #3b82f6' : undefined,
                    boxShadow: isResult ? '0 0 20px rgba(16, 185, 129, 0.5)' : isVisited ? '0 0 15px rgba(59, 130, 246, 0.4)' : undefined,
                }
            };
        });
    }, [storeNodes, activeResult]);

    const displayEdges = useMemo(() => {
        return storeEdges.map(edge => {
            const isTraversed = activeResult?.edgeIds.has(edge.id);

            let markerEnd = edge.markerEnd;
            if (typeof markerEnd === 'object' && markerEnd !== null) {
                markerEnd = { ...markerEnd, color: isTraversed ? '#3b82f6' : '#4b5563' };
            } else {
                markerEnd = { type: 'arrowclosed', color: isTraversed ? '#3b82f6' : '#4b5563' };
            }

            return {
                ...edge,
                animated: isTraversed,
                style: {
                    ...edge.style,
                    stroke: isTraversed ? '#3b82f6' : '#4b5563',
                    strokeWidth: isTraversed ? 3 : 1,
                    opacity: activeResult ? (isTraversed ? 1 : 0.2) : 1,
                },
                markerEnd: markerEnd as any,
            };
        });
    }, [storeEdges, activeResult]);

    const editingCase = editingCaseId ? (testCases.find(c => c.id === editingCaseId) ?? null) : null;

    return (
        <div className="flex h-full bg-gray-900 text-white overflow-hidden">
            {/* Left Panel: Controls */}
            <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col z-10 shadow-xl">

                {/* Header & Run Button */}
                <div className="p-4 border-b border-gray-700 bg-gray-800 shrink-0">
                    <h2 className="text-xl font-bold text-blue-400 mb-2">Simulation</h2>
                    <button
                        onClick={handleRunAll}
                        disabled={testCases.length === 0 || isRunning}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                        {isRunning ? <RotateCcw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                        Run All Cases
                    </button>
                </div>

                {/* Test Cases List */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-2 bg-gray-900/50 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span>Test Cases</span>
                        <button onClick={handleOpenAddModal} className="text-blue-400 hover:text-blue-300 p-1 flex items-center gap-1">
                            <Plus size={14} /> Add
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {testCases.map(tc => {
                            const res = simulationResults[tc.id];
                            return (
                                <div
                                    key={tc.id}
                                    onClick={() => setActiveCaseId(tc.id)}
                                    className={`group flex items-center justify-between p-2 rounded cursor-pointer border transition-all ${activeCaseId === tc.id
                                        ? 'bg-blue-900/30 border-blue-500'
                                        : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {res ? (
                                            res.isError ? <AlertCircle size={14} className="text-red-400 shrink-0" /> : <CheckCircle size={14} className="text-green-400 shrink-0" />
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded-full border border-gray-500 shrink-0" />
                                        )}
                                        <div className="truncate">
                                            <div className="font-medium text-sm text-gray-200">{tc.name}</div>
                                            {res && <div className="text-[10px] text-gray-400 truncate">{res.display}</div>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRunSingleCase(tc);
                                            }}
                                            className="text-gray-400 hover:text-green-400 p-1 transition-colors"
                                            title="Run This Case"
                                        >
                                            <Play size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleOpenEditModal(tc.id, e)}
                                            className="text-gray-400 hover:text-blue-400 p-1 transition-colors"
                                            title="Edit Case"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleRemoveCase(tc.id, e)}
                                            className="text-gray-400 hover:text-red-400 p-1 transition-colors"
                                            title="Delete Case"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Panel: Visualization */}
            <div className="flex-1 relative bg-gray-950">
                <ReactFlow
                    nodes={displayNodes}
                    edges={displayEdges}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.1}
                    maxZoom={2}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={true}
                >
                    <Background color="#333" gap={16} />
                    <Controls />
                    <MiniMap
                        nodeColor={(n) => {
                            if (n.type === 'root') return '#a78bfa';
                            if (n.type === 'decision') return '#3b82f6';
                            return '#10b981';
                        }}
                        maskColor="rgba(0, 0, 0, 0.7)"
                        style={{ backgroundColor: '#1f2937' }}
                    />
                </ReactFlow>

                {/* Overlay Legend or Status */}
                <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur border border-gray-700 p-3 rounded text-xs text-gray-300 pointer-events-none">
                    <div className="font-bold mb-2 text-gray-400 uppercase tracking-wider">Legend</div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Traversed Path</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Final Result</span>
                    </div>
                </div>

                {/* Modal for Add/Edit */}
                <TestCaseModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCase}
                    initialCase={editingCase}
                    variables={variables}
                />
            </div>
        </div>
    );
};
