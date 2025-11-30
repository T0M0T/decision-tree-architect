import { Node, Edge } from '@xyflow/react';
import { Variable } from '../types';

export interface VariableState {
    possibleValues: Set<string>;
}

export type NodeState = Record<string, VariableState>;

// Helper to get all possible values for a variable
const getAllValues = (variable: Variable): Set<string> => {
    return new Set(variable.possibleValues);
};

// Helper to parse value from string (remove quotes)
const parseValue = (val: string): string => {
    const trimmed = val.trim();
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
};

// Apply a single constraint to the state
const applyConstraint = (
    state: NodeState,
    variableName: string,
    operator: '==' | '!=',
    value: string,
    variables: Variable[]
): NodeState => {
    const newState = { ...state };
    const variable = variables.find(v => v.name === variableName);

    // If variable not found or not in state (shouldn't happen if initialized), skip
    if (!variable || !newState[variable.id]) return state;

    const currentValues = newState[variable.id].possibleValues;
    const constraintValue = parseValue(value);

    let newValues = new Set(currentValues);

    if (operator === '==') {
        if (currentValues.has(constraintValue)) {
            newValues = new Set([constraintValue]);
        } else {
            // Contradiction, empty set
            newValues = new Set();
        }
    } else if (operator === '!=') {
        newValues.delete(constraintValue);
    }

    newState[variable.id] = { possibleValues: newValues };
    return newState;
};

// Parse expression and apply to state
// We only handle top-level ANDs for 'Yes' branch
// And simple condition for 'No' branch
const applyExpression = (
    state: NodeState,
    expression: string,
    isYesBranch: boolean,
    variables: Variable[]
): NodeState => {
    if (!expression.trim()) return state;

    let newState = { ...state };

    // Simple parser for "Var == Val" or "Var != Val"
    // Regex to capture: Identifier Operator Value
    // We assume variables don't have spaces, values might be quoted
    // This is a basic heuristic parser

    // Split by && if Yes branch
    if (isYesBranch) {
        const parts = expression.split('&&');
        for (const part of parts) {
            const eqMatch = part.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(==|!=)\s*(.+)/);
            if (eqMatch) {
                const [, varName, op, val] = eqMatch;
                newState = applyConstraint(newState, varName.trim(), op as '==' | '!=', val, variables);
            }
        }
    } else {
        // No branch - only handle simple single condition negation
        // !(A == B) -> A != B
        // !(A != B) -> A == B
        // If expression has && or ||, we skip narrowing for safety (unless we implement De Morgan)
        if (!expression.includes('&&') && !expression.includes('||')) {
            const eqMatch = expression.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(==|!=)\s*(.+)/);
            if (eqMatch) {
                const [, varName, op, val] = eqMatch;
                // Invert operator
                const newOp = op === '==' ? '!=' : '==';
                newState = applyConstraint(newState, varName.trim(), newOp, val, variables);
            }
        }
    }

    return newState;
};

const mergeStates = (states: NodeState[]): NodeState => {
    if (states.length === 0) return {};

    // Initialize with the first state structure
    // We need to take Union of possible values for each variable
    const result: NodeState = {};
    const varIds = Object.keys(states[0]);

    for (const varId of varIds) {
        const allValues = new Set<string>();
        for (const s of states) {
            if (s[varId]) {
                s[varId].possibleValues.forEach(v => allValues.add(v));
            }
        }
        result[varId] = { possibleValues: allValues };
    }

    return result;
};

export const calculateNodeState = (
    targetNodeId: string,
    nodes: Node[],
    edges: Edge[],
    variables: Variable[]
): NodeState | null => {
    // 1. Find Root
    const root = nodes.find(n => n.type === 'root');
    if (!root) return {};

    // 2. Find all paths from Root to Target
    // DFS
    const paths: Edge[][] = [];

    const findPaths = (currentId: string, currentPath: Edge[], visited: Set<string>) => {
        if (currentId === targetNodeId) {
            paths.push([...currentPath]);
            return;
        }

        visited.add(currentId);

        const outgoing = edges.filter(e => e.source === currentId);
        for (const edge of outgoing) {
            if (!visited.has(edge.target)) {
                findPaths(edge.target, [...currentPath, edge], new Set(visited));
            }
        }

        visited.delete(currentId);
    };

    findPaths(root.id, [], new Set());

    if (paths.length === 0) {
        // Unreachable or is Root
        if (targetNodeId === root.id) {
            // Return full universe
            const initialState: NodeState = {};
            variables.forEach(v => {
                initialState[v.id] = { possibleValues: getAllValues(v) };
            });
            return initialState;
        }
        return null; // Unreachable
    }

    // 3. Calculate state for each path
    const pathResults: NodeState[] = [];

    for (const path of paths) {
        let currentState: NodeState = {};
        // Initialize
        variables.forEach(v => {
            currentState[v.id] = { possibleValues: getAllValues(v) };
        });

        for (const edge of path) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (sourceNode?.type === 'decision') {
                const expression = sourceNode.data.expression as string;
                const isYes = edge.sourceHandle === 'yes';
                // If center handle (neither yes nor no), treat as pass-through? 
                // Decision node usually has yes/no. If it has others, we assume pass-through.
                if (edge.sourceHandle === 'yes' || edge.sourceHandle === 'no') {
                    currentState = applyExpression(currentState, expression, isYes, variables);
                }
            }
        }
        pathResults.push(currentState);
    }

    // 4. Merge path results (Union)
    // Filter out impossible paths (where any variable has empty set)
    const validStates = pathResults.filter(state => {
        return Object.values(state).every(v => v.possibleValues.size > 0);
    });

    if (validStates.length === 0) return null; // All paths are contradictory

    return mergeStates(validStates);
};

export const analyzeReachability = (
    nodes: Node[],
    edges: Edge[],
    variables: Variable[]
): Set<string> => {
    const reachableNodes = new Set<string>();

    // Optimization: If no variables, just check graph connectivity?
    // But we want to support "always false" conditions too.

    for (const node of nodes) {
        const state = calculateNodeState(node.id, nodes, edges, variables);
        if (state !== null) {
            reachableNodes.add(node.id);
        }
    }

    return reachableNodes;
};

export const formatState = (state: NodeState, variables: Variable[]): string[] => {
    return variables.map(v => {
        const s = state[v.id];
        if (!s) return `${v.name}: Unknown`;

        const values = Array.from(s.possibleValues).sort();
        if (values.length === 0) return `${v.name}: Impossible (Contradiction)`;
        if (values.length === 1) return `${v.name} = ${values[0]}`;
        if (values.length === v.possibleValues.length) return `${v.name}: Any`;

        return `${v.name} = ${values.join(' | ')}`;
    });
};
