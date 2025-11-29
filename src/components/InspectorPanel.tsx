import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useStore } from '../store/useStore';
import { calculateNodeState, formatState, NodeState } from '../utils/stateAnalysis';
import { X } from 'lucide-react';

interface InspectorPanelProps {
    selectedNodes: Node[];
    selectedEdges: Edge[];
    onClose: () => void;
}

// Re-implement applyExpression logic locally or export it? 
// I should probably export it from stateAnalysis to avoid duplication.
// But for now I'll just rely on calculateNodeState for nodes.
// For edges, I need to apply one more step.

// Let's duplicate the apply logic or move it to public export in stateAnalysis.
// I'll modify stateAnalysis to export applyExpression or similar helper.
// Actually, I can just use a trick:
// To get state at Edge (Source -> Target), I can pretend I am calculating state for Target, 
// but ONLY considering the path through this Edge?
// No, that's complicated.

// Better: Update stateAnalysis to export `applyConstraint` logic.
// Or just copy the simple logic here since it's small.
// Actually, I'll update stateAnalysis to export `applyEdgeConstraint`.

export const InspectorPanel = ({ selectedNodes, selectedEdges, onClose }: InspectorPanelProps) => {
    const { nodes, edges, variables } = useStore();

    const analysis = useMemo(() => {
        if (selectedNodes.length > 0) {
            const node = selectedNodes[0];
            const state = calculateNodeState(node.id, nodes, edges, variables);
            return {
                title: `Node Analysis: ${node.data.label || node.data.nodeId}`,
                lines: formatState(state, variables)
            };
        } else if (selectedEdges.length > 0) {
            const edge = selectedEdges[0];
            const sourceNode = nodes.find(n => n.id === edge.source);

            // Calculate state at source
            const sourceState = calculateNodeState(edge.source, nodes, edges, variables);

            // Apply edge constraint
            // We need to replicate the logic from stateAnalysis
            // Since I can't easily import the internal helper, I will do a quick implementation here
            // or I should have exported it.
            // Let's assume I can modify stateAnalysis.ts in the next step if needed.
            // But for now, let's just implement the specific logic for this edge.

            let edgeState = { ...sourceState };

            if (sourceNode?.type === 'decision') {
                const expression = sourceNode.data.expression as string;
                const isYes = edge.sourceHandle === 'yes';
                const isNo = edge.sourceHandle === 'no';

                if (isYes || isNo) {
                    // We need to apply the constraint
                    // This is duplicating logic, which is bad.
                    // But for this turn, I will duplicate the simple regex logic.

                    // Helper to apply
                    const apply = (s: NodeState, varName: string, op: string, val: string) => {
                        const v = variables.find(v => v.name === varName);
                        if (!v || !s[v.id]) return;

                        let newSet = new Set(s[v.id].possibleValues);
                        const cleanVal = val.trim().replace(/^['"]|['"]$/g, '');

                        if (op === '==') {
                            if (newSet.has(cleanVal)) newSet = new Set([cleanVal]);
                            else newSet = new Set();
                        } else if (op === '!=') {
                            newSet.delete(cleanVal);
                        }
                        s[v.id] = { possibleValues: newSet };
                    };

                    if (isYes && expression) {
                        const parts = expression.split('&&');
                        parts.forEach(part => {
                            const m = part.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(==|!=)\s*(.+)/);
                            if (m) apply(edgeState, m[1].trim(), m[2], m[3]);
                        });
                    } else if (isNo && expression) {
                        if (!expression.includes('&&') && !expression.includes('||')) {
                            const m = expression.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(==|!=)\s*(.+)/);
                            if (m) {
                                const op = m[2] === '==' ? '!=' : '==';
                                apply(edgeState, m[1].trim(), op, m[3]);
                            }
                        }
                    }
                }
            }

            return {
                title: `Edge Analysis`,
                subtitle: `From ${sourceNode?.data.nodeId || 'Unknown'} (${edge.sourceHandle})`,
                lines: formatState(edgeState, variables)
            };
        }
        return null;
    }, [selectedNodes, selectedEdges, nodes, edges, variables]);

    if (!analysis) return null;

    return (
        <div className="absolute top-4 right-4 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-bold text-white">{analysis.title}</h3>
                    {'subtitle' in analysis && (
                        <div className="text-xs text-gray-400">{(analysis as any).subtitle}</div>
                    )}
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                    {analysis.lines.map((line, i) => {
                        const isDetermined = line.includes('=') && !line.includes('|');
                        const isImpossible = line.includes('Impossible');
                        return (
                            <div
                                key={i}
                                className={`text-xs px-2 py-1.5 rounded border ${isImpossible ? 'bg-red-900/20 border-red-800 text-red-300' :
                                    isDetermined ? 'bg-green-900/20 border-green-800 text-green-300' :
                                        'bg-gray-800 border-gray-700 text-gray-300'
                                    }`}
                            >
                                {line}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
