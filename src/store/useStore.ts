import { create } from 'zustand';
import {
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge
} from '@xyflow/react';
import { Variable, Invariant, TestCase, SimulationResult, ModelCheckerResult } from '../types';

interface AppState {
    variables: Variable[];
    invariants: Invariant[];
    nodes: Node[];
    edges: Edge[];

    // Simulation State
    testCases: TestCase[];
    simulationResults: Record<string, SimulationResult>;
    activeSimulationId: string | null;

    // Model Checker State
    modelCheckerResults: ModelCheckerResult[];

    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;

    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;

    addVariable: (variable: Omit<Variable, 'id'>) => void;
    updateVariable: (id: string, variable: Partial<Variable>) => void;
    removeVariable: (id: string) => void;

    addInvariant: (invariant: Omit<Invariant, 'id'>) => void;
    updateInvariant: (id: string, invariant: Partial<Invariant>) => void;
    removeInvariant: (id: string) => void;

    updateNodeData: (id: string, data: Record<string, any>) => void;

    // Simulation Actions
    setTestCases: (testCases: TestCase[]) => void;
    addTestCase: (testCase: TestCase) => void;
    updateTestCase: (id: string, testCase: Partial<TestCase>) => void;
    removeTestCase: (id: string) => void;
    setSimulationResults: (results: Record<string, SimulationResult>) => void;
    setActiveSimulationId: (id: string | null) => void;

    // Model Checker Actions
    setModelCheckerResults: (results: ModelCheckerResult[]) => void;
}

export const useStore = create<AppState>((set, get) => ({
    variables: [],
    invariants: [],
    nodes: [],
    edges: [],
    testCases: [],
    simulationResults: {},
    activeSimulationId: null,
    modelCheckerResults: [],

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    addVariable: (variable) => set((state) => ({
        variables: [...state.variables, { ...variable, id: crypto.randomUUID() }]
    })),

    updateVariable: (id, updatedVariable) => set((state) => ({
        variables: state.variables.map((v) =>
            v.id === id ? { ...v, ...updatedVariable } : v
        )
    })),

    removeVariable: (id) => set((state) => ({
        variables: state.variables.filter((v) => v.id !== id)
    })),

    addInvariant: (invariant) => set((state) => ({
        invariants: [...state.invariants, { ...invariant, id: crypto.randomUUID() }]
    })),

    updateInvariant: (id, updatedInvariant) => set((state) => ({
        invariants: state.invariants.map((inv) =>
            inv.id === id ? { ...inv, ...updatedInvariant } : inv
        )
    })),

    removeInvariant: (id) => set((state) => ({
        invariants: state.invariants.filter((inv) => inv.id !== id)
    })),

    updateNodeData: (id, data) => set((state) => ({
        nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, ...data } } : node
        ),
    })),

    setTestCases: (testCases) => set({ testCases }),

    addTestCase: (testCase) => set((state) => ({
        testCases: [...state.testCases, testCase]
    })),

    updateTestCase: (id, updatedTestCase) => set((state) => ({
        testCases: state.testCases.map((tc) =>
            tc.id === id ? { ...tc, ...updatedTestCase } : tc
        )
    })),

    removeTestCase: (id) => set((state) => ({
        testCases: state.testCases.filter((tc) => tc.id !== id),
        simulationResults: Object.fromEntries(
            Object.entries(state.simulationResults).filter(([key]) => key !== id)
        )
    })),

    setSimulationResults: (results) => set({ simulationResults: results }),
    setActiveSimulationId: (id) => set({ activeSimulationId: id }),

    setModelCheckerResults: (results) => set({ modelCheckerResults: results }),
}));
