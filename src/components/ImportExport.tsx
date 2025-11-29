import { useState } from 'react';
import { Download, Upload, FileText, Share2 } from 'lucide-react';
import yaml from 'js-yaml';
import { useStore } from '../store/useStore';
import type { Node, Edge } from '@xyflow/react';
import { TestCase, SimulationResult, ModelCheckerResult, Invariant } from '../types';

export interface AppState {
    variables: any[];
    invariants: Invariant[];
    tree: {
        nodes: Node[];
        edges: Edge[];
    };
    simulation: {
        testCases: TestCase[];
        results: Record<string, SimulationResult>;
    };
    modelChecker: {
        results: ModelCheckerResult[];
    };
}

// Helper to download text as file
const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const ImportExport = () => {
    const [showPanel, setShowPanel] = useState(false);
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

    const handleImport = (file: File) => {
        importStateFromYAML(
            file,
            (newNodes) => setNodes(newNodes),
            (newEdges) => setEdges(newEdges)
        );
    };

    const handleExportDOT = () => {
        let dot = 'digraph DecisionTree {\n';
        dot += '    node [fontname="Arial"];\n';
        dot += '    edge [fontname="Arial"];\n';

        nodes.forEach(node => {
            let label = "";
            let shape = "box";
            let color = "black";
            let style = "";

            if (node.type === 'decision') {
                label = node.data.expression as string || "Condition";
                shape = "diamond";
                color = "blue";
            } else if (node.type === 'leaf') {
                label = node.data.label as string || "Leaf";
                shape = "box";
                style = "rounded";
                color = "green";
            } else if (node.type === 'root') {
                label = "Start";
                shape = "ellipse";
                color = "orange";
            }

            // Escape quotes
            label = label.replace(/"/g, '\\"');

            let attr = `label="${label}", shape=${shape}, color=${color}`;
            if (style) attr += `, style=${style}`;

            dot += `    "${node.id}" [${attr}];\n`;
        });

        edges.forEach(edge => {
            let label = "";
            if (edge.sourceHandle === 'yes') label = "Yes";
            if (edge.sourceHandle === 'no') label = "No";

            dot += `    "${edge.source}" -> "${edge.target}" [label="${label}"];\n`;
        });

        dot += '}';
        downloadFile(dot, 'decision_tree.dot', 'text/vnd.graphviz');
    };

    const handleExportDrawio = () => {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<mxfile host="app.diagrams.net" modified="' + new Date().toISOString() + '" agent="DecisionTreeEditor" etag="1" version="21.0.0">\n';
        xml += '  <diagram id="decision-tree" name="Decision Tree">\n';
        xml += '    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">\n';
        xml += '      <root>\n';
        xml += '        <mxCell id="0" />\n';
        xml += '        <mxCell id="1" parent="0" />\n';

        nodes.forEach(node => {
            let style = "";
            let value = "";
            let width = 120;
            let height = 60;

            if (node.type === 'decision') {
                style = "rhombus;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;";
                value = node.data.expression as string || "Condition";
                width = 160;
                height = 80;
            } else if (node.type === 'leaf') {
                style = "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;";
                value = node.data.label as string || "Leaf";
            } else if (node.type === 'root') {
                style = "ellipse;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;";
                value = "Start";
                width = 80;
                height = 80;
            }

            // Escape XML special characters in value
            value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

            xml += `        <mxCell id="${node.id}" value="${value}" style="${style}" vertex="1" parent="1">\n`;
            xml += `          <mxGeometry x="${node.position.x}" y="${node.position.y}" width="${width}" height="${height}" as="geometry" />\n`;
            xml += `        </mxCell>\n`;
        });

        edges.forEach(edge => {
            let value = "";
            if (edge.sourceHandle === 'yes') value = "Yes";
            if (edge.sourceHandle === 'no') value = "No";

            xml += `        <mxCell id="${edge.id}" value="${value}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="${edge.source}" target="${edge.target}">\n`;
            xml += `          <mxGeometry relative="1" as="geometry" />\n`;
            xml += `        </mxCell>\n`;
        });

        xml += '      </root>\n';
        xml += '    </mxGraphModel>\n';
        xml += '  </diagram>\n';
        xml += '</mxfile>';

        downloadFile(xml, 'decision_tree.drawio', 'application/xml');
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-medium transition-colors"
                title="Import/Export State"
            >
                <FileText size={16} />
                Save/Load
            </button>

            {showPanel && (
                <div className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[300px] z-50">
                    <div className="space-y-3">
                        <div className="text-white font-semibold text-sm mb-3">Import/Export State</div>

                        <div className="space-y-2">
                            <div className="text-xs text-gray-400">
                                Save your variables, decision tree, simulation cases, and model checker results to a YAML file.
                            </div>

                            <button
                                onClick={handleExport}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium transition-colors"
                            >
                                <Download size={16} />
                                Export to YAML
                            </button>

                            <div className="border-t border-gray-700 pt-2">
                                <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors cursor-pointer">
                                    <Upload size={16} />
                                    Import from YAML
                                    <input
                                        type="file"
                                        accept=".yaml,.yml"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleImport(file);
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-3 mt-3">
                            <div className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                                <Share2 size={14} />
                                Export Graph
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleExportDOT}
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                                >
                                    <Download size={14} />
                                    DOT
                                </button>
                                <button
                                    onClick={handleExportDrawio}
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded text-sm font-medium transition-colors"
                                >
                                    <Download size={14} />
                                    Draw.io
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const exportStateToYAML = (
    variables: any[],
    nodes: Node[],
    edges: Edge[],
    invariants: Invariant[],
    testCases: TestCase[],
    simulationResults: Record<string, SimulationResult>,
    modelCheckerResults: ModelCheckerResult[]
) => {
    // Convert Sets to Arrays for serialization
    const serializableSimulationResults: Record<string, any> = {};
    Object.entries(simulationResults).forEach(([key, val]) => {
        serializableSimulationResults[key] = {
            ...val,
            nodeIds: Array.from(val.nodeIds),
            edgeIds: Array.from(val.edgeIds)
        };
    });

    const state: AppState = {
        variables,
        invariants,
        tree: { nodes, edges },
        simulation: {
            testCases,
            results: serializableSimulationResults as any
        },
        modelChecker: {
            results: modelCheckerResults
        }
    };

    const yamlStr = yaml.dump(state, {
        indent: 2,
        lineWidth: -1,
    });

    downloadFile(yamlStr, `decision-tree-${new Date().toISOString().split('T')[0]}.yaml`, 'text/yaml');
};

export const importStateFromYAML = (
    file: File,
    setNodes: (nodes: Node[]) => void,
    setEdges: (edges: Edge[]) => void
) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const yamlStr = e.target?.result as string;
            const state = yaml.load(yamlStr) as any;

            // Convert Arrays back to Sets for simulation results
            const parsedSimulationResults: Record<string, SimulationResult> = {};
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

            if (state.tree) {
                setNodes(state.tree.nodes || []);
                setEdges(state.tree.edges || []);
            }

            alert('State imported successfully!');
        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to import file. Please check the format.');
        }
    };
    reader.readAsText(file);
};
