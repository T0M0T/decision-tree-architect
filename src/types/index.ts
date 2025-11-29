export interface Variable {
    id: string;
    name: string;
    type: 'enum';
    possibleValues: string[]; // e.g., ["LOW", "MEDIUM", "HIGH"] or ["ON", "OFF"]
    description?: string;
}

export interface Invariant {
    id: string;
    name: string;
    condition: string; // e.g. "Temperature == 'HIGH'"
    expectedResult: string; // e.g. "Stop"
}

export interface SimulationResult {
    nodeIds: Set<string>;
    edgeIds: Set<string>;
    result: string | null;
    display: string;
    isError: boolean;
}

export interface ModelCheckerResult {
    combo: Record<string, string>;
    result: string;
    display: string;
}

export interface TestCase {
    id: string;
    name: string;
    values: Record<string, string>;
}
