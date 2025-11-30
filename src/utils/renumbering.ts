import { Node, Edge } from '@xyflow/react';
import { ModelCheckerResult, SimulationResult } from '../types';

export const renumberNodes = (
    nodes: Node[],
    edges: Edge[],
    modelCheckerResults: ModelCheckerResult[],
    simulationResults: Record<string, SimulationResult>
) => {
    // 1. Separate and Sort Nodes
    const decisionNodes = nodes.filter(n => n.type === 'decision');
    const leafNodes = nodes.filter(n => n.type === 'leaf');

    const sortFn = (a: Node, b: Node) => {
        if (Math.abs(a.position.y - b.position.y) > 50) {
            return a.position.y - b.position.y;
        }
        return a.position.x - b.position.x;
    };

    decisionNodes.sort(sortFn);
    leafNodes.sort(sortFn);

    // 2. Generate ID Mapping (Internal ID -> New ID)
    const idMap = new Map<string, string>();
    // Also map Old Node ID (data.nodeId) -> New ID for Model Checker/Simulation Result strings
    const nodeIdMap = new Map<string, string>();

    decisionNodes.forEach((node, index) => {
        const newId = `D${index + 1}`;
        idMap.set(node.id, newId);
        if (node.data.nodeId) {
            nodeIdMap.set(node.data.nodeId as string, newId);
        }
    });

    leafNodes.forEach((node, index) => {
        const newId = `L${index + 1}`;
        idMap.set(node.id, newId);
        if (node.data.nodeId) {
            nodeIdMap.set(node.data.nodeId as string, newId);
        }
    });

    // 3. Update Nodes
    const newNodes = nodes.map(node => {
        if (idMap.has(node.id)) {
            const newId = idMap.get(node.id)!;
            return {
                ...node,
                id: newId,
                data: {
                    ...node.data,
                    nodeId: newId,
                }
            };
        }
        return node;
    });

    // 4. Update Edges
    const newEdges = edges.map(edge => {
        const newSource = idMap.get(edge.source) || edge.source;
        const newTarget = idMap.get(edge.target) || edge.target;
        return {
            ...edge,
            id: `e${newSource}-${newTarget}`, // Regenerate edge ID to be consistent
            source: newSource,
            target: newTarget
        };
    });

    // 5. Update Model Checker Results
    const newModelCheckerResults = modelCheckerResults.map(res => {
        // Result stores the user-facing ID (data.nodeId)
        if (nodeIdMap.has(res.result)) {
            return {
                ...res,
                result: nodeIdMap.get(res.result)!
            };
        }
        return res;
    });

    // 6. Update Simulation Results
    const newSimulationResults: Record<string, SimulationResult> = {};
    Object.entries(simulationResults).forEach(([key, res]) => {
        const newNodeIds = new Set<string>();
        res.nodeIds.forEach(id => {
            newNodeIds.add(idMap.get(id) || id);
        });

        // Edge IDs need to be updated too?
        // Edge IDs are usually e{source}-{target}.
        // If we regenerated edge IDs, we must update them here.
        // But we don't have a map of Old Edge ID -> New Edge ID easily unless we build it.
        // Let's build it.

        const newEdgeIds = new Set<string>();
        // This is tricky because we need to know which edges were in the path.
        // We can iterate over the edges in the path and map them?
        // Or we can assume edge IDs follow a pattern?
        // The edge IDs in `edges` are being updated.
        // Let's try to map old edge IDs.

        // Actually, let's reconstruct the edge ID map.
        const edgeIdMap = new Map<string, string>();
        edges.forEach(edge => {
            const newSource = idMap.get(edge.source) || edge.source;
            const newTarget = idMap.get(edge.target) || edge.target;
            const newId = `e${newSource}-${newTarget}`;
            edgeIdMap.set(edge.id, newId);
        });

        res.edgeIds.forEach(id => {
            if (edgeIdMap.has(id)) {
                newEdgeIds.add(edgeIdMap.get(id)!);
            } else {
                newEdgeIds.add(id);
            }
        });

        let newResult = res.result;
        if (res.result && nodeIdMap.has(res.result)) {
            newResult = nodeIdMap.get(res.result)!;
        }

        newSimulationResults[key] = {
            ...res,
            nodeIds: newNodeIds,
            edgeIds: newEdgeIds,
            result: newResult
        };
    });

    return {
        newNodes,
        newEdges,
        newModelCheckerResults,
        newSimulationResults
    };
};
