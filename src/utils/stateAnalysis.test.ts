import { describe, it, expect } from 'vitest';
import { analyzeReachability } from './stateAnalysis';
import { Node, Edge } from '@xyflow/react';

describe('analyzeReachability', () => {
    it('should identify all nodes as reachable in a simple linear tree', () => {
        const nodes: Node[] = [
            { id: 'root', type: 'root', position: { x: 0, y: 0 }, data: { nodeId: 'R0' } },
            { id: 'd1', type: 'decision', position: { x: 0, y: 100 }, data: { nodeId: 'D1', expression: '' } },
            { id: 'l1', type: 'leaf', position: { x: 0, y: 200 }, data: { nodeId: 'L1' } },
        ];
        const edges: Edge[] = [
            { id: 'e1', source: 'root', target: 'd1' },
            { id: 'e2', source: 'd1', target: 'l1', sourceHandle: 'yes' },
        ];

        const reachable = analyzeReachability(nodes, edges, []);
        expect(reachable.has('root')).toBe(true);
        expect(reachable.has('d1')).toBe(true);
        expect(reachable.has('l1')).toBe(true);
    });

    it('should identify unreachable nodes', () => {
        const nodes: Node[] = [
            { id: 'root', type: 'root', position: { x: 0, y: 0 }, data: { nodeId: 'R0' } },
            { id: 'd1', type: 'decision', position: { x: 0, y: 100 }, data: { nodeId: 'D1', expression: '' } },
            { id: 'unreachable', type: 'leaf', position: { x: 100, y: 100 }, data: { nodeId: 'L1' } },
        ];
        const edges: Edge[] = [
            { id: 'e1', source: 'root', target: 'd1' },
        ];

        const reachable = analyzeReachability(nodes, edges, []);
        expect(reachable.has('root')).toBe(true);
        expect(reachable.has('d1')).toBe(true);
        expect(reachable.has('unreachable')).toBe(false);
    });

    it('should handle cycles gracefully', () => {
        const nodes: Node[] = [
            { id: 'root', type: 'root', position: { x: 0, y: 0 }, data: { nodeId: 'R0' } },
            { id: 'd1', type: 'decision', position: { x: 0, y: 100 }, data: { nodeId: 'D1', expression: '' } },
            { id: 'd2', type: 'decision', position: { x: 0, y: 200 }, data: { nodeId: 'D2', expression: '' } },
        ];
        const edges: Edge[] = [
            { id: 'e1', source: 'root', target: 'd1' },
            { id: 'e2', source: 'd1', target: 'd2', sourceHandle: 'yes' },
            { id: 'e3', source: 'd2', target: 'd1', sourceHandle: 'no' }, // Cycle
        ];

        const reachable = analyzeReachability(nodes, edges, []);
        expect(reachable.has('root')).toBe(true);
        expect(reachable.has('d1')).toBe(true);
        expect(reachable.has('d2')).toBe(true);
    });

    it('should handle disconnected subgraphs', () => {
        const nodes: Node[] = [
            { id: 'root', type: 'root', position: { x: 0, y: 0 }, data: { nodeId: 'R0' } },
            { id: 'd1', type: 'decision', position: { x: 0, y: 100 }, data: { nodeId: 'D1', expression: '' } },
            { id: 'd2', type: 'decision', position: { x: 200, y: 100 }, data: { nodeId: 'D2', expression: '' } },
            { id: 'l1', type: 'leaf', position: { x: 200, y: 200 }, data: { nodeId: 'L1' } },
        ];
        const edges: Edge[] = [
            { id: 'e1', source: 'root', target: 'd1' },
            { id: 'e2', source: 'd2', target: 'l1', sourceHandle: 'yes' }, // Disconnected from root
        ];

        const reachable = analyzeReachability(nodes, edges, []);
        expect(reachable.has('root')).toBe(true);
        expect(reachable.has('d1')).toBe(true);
        expect(reachable.has('d2')).toBe(false);
        expect(reachable.has('l1')).toBe(false);
    });
});
