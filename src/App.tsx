import { useState, useEffect } from 'react';
import { VariableManager } from './components/VariableManager';
import { TreeEditorWrapper } from './components/TreeEditor';
import { ImportExport } from './components/ImportExport';
import { ModelChecker } from './components/ModelChecker';
import { SimulationPanel } from './components/SimulationPanel';
import { CppGenerator } from './components/CppGenerator';
import { Edit3, Table, PlayCircle, Code } from 'lucide-react';
import { useStore } from './store/useStore';
import { Node } from '@xyflow/react';

import pkg from '../package.json';

function App() {
    const [activeTab, setActiveTab] = useState<'editor' | 'checker' | 'simulation' | 'codegen'>('editor');
    const {
        variables,
        nodes,
        edges,
        invariants,
        testCases,
        simulationResults,
        modelCheckerResults,
        setNodes,
        setEdges
    } = useStore();
    const [isInitialized, setIsInitialized] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('decision-tree-state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                if (state.tree?.nodes) {
                    const hasRoot = state.tree.nodes.some((n: Node) => n.id === 'root');
                    if (!hasRoot) {
                        state.tree.nodes.unshift({
                            id: 'root',
                            type: 'root',
                            position: { x: 250, y: 0 },
                            data: { nodeId: 'R0' },
                            deletable: false,
                        });
                    }
                    setNodes(state.tree.nodes);
                }
                if (state.tree?.edges) setEdges(state.tree.edges);

                // Convert Arrays back to Sets for simulation results
                const parsedSimulationResults: Record<string, any> = {};
                if (state.simulation?.results) {
                    Object.entries(state.simulation.results).forEach(([key, val]: [string, any]) => {
                        parsedSimulationResults[key] = {
                            ...val,
                            nodeIds: new Set(val.nodeIds),
                            edgeIds: new Set(val.edgeIds)
                        };
                    });
                }

                useStore.setState({
                    variables: state.variables || [],
                    invariants: state.invariants || [],
                    testCases: state.simulation?.testCases || [],
                    simulationResults: parsedSimulationResults,
                    modelCheckerResults: state.modelChecker?.results || []
                });
            } catch (e) {
                console.error('Failed to load state:', e);
            }
        }
        setIsInitialized(true);
    }, [setNodes, setEdges]);

    // Save state to localStorage on change
    useEffect(() => {
        if (!isInitialized) return;

        // Convert Sets to Arrays for serialization
        const serializableSimulationResults: Record<string, any> = {};
        Object.entries(simulationResults).forEach(([key, val]) => {
            serializableSimulationResults[key] = {
                ...val,
                nodeIds: Array.from(val.nodeIds),
                edgeIds: Array.from(val.edgeIds)
            };
        });

        const state = {
            variables,
            invariants,
            tree: { nodes, edges },
            simulation: {
                testCases,
                results: serializableSimulationResults
            },
            modelChecker: {
                results: modelCheckerResults
            }
        };
        localStorage.setItem('decision-tree-state', JSON.stringify(state));
    }, [variables, invariants, nodes, edges, testCases, simulationResults, modelCheckerResults, isInitialized]);

    return (
        <div className="w-full h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
            <header className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-800 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Decision Tree Architect
                        </h1>
                        <span className="text-xs text-gray-500 font-mono">v{pkg.version}</span>
                    </div>

                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'editor'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <Edit3 size={14} />
                            Editor
                        </button>
                        <button
                            onClick={() => setActiveTab('checker')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'checker'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <Table size={14} />
                            Model Checker
                        </button>
                        <button
                            onClick={() => setActiveTab('simulation')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'simulation'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <PlayCircle size={14} />
                            Simulation
                        </button>
                        <button
                            onClick={() => setActiveTab('codegen')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'codegen'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <Code size={14} />
                            Code Gen
                        </button>
                    </div>
                </div>
                <ImportExport />
            </header>

            <main className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
                {activeTab === 'editor' ? (
                    <>
                        {/* Sidebar */}
                        <aside className="w-80 border-r border-gray-700 bg-gray-900/50 flex flex-col overflow-y-auto p-4 gap-6 shrink-0">
                            <VariableManager />
                        </aside>

                        {/* Main Content Area (Tree Editor) */}
                        <section className="flex-1 bg-gray-950 relative min-h-0">
                            <div className="absolute inset-0">
                                <TreeEditorWrapper />
                            </div>
                        </section>
                    </>
                ) : activeTab === 'checker' ? (
                    <div className="flex-1 overflow-hidden">
                        <ModelChecker />
                    </div>
                ) : activeTab === 'simulation' ? (
                    <div className="flex-1 overflow-hidden">
                        <SimulationPanel />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden">
                        <CppGenerator />
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
