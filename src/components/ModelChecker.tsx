import { useMemo, useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Node } from '@xyflow/react';
import { Plus, Trash2, AlertTriangle, ChevronDown, Info, Edit, X, RefreshCw, Activity } from 'lucide-react';
import { Invariant, Variable } from '../types';

// Searchable Dropdown Component
const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as any)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.value.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative w-64" ref={wrapperRef}>
            <div
                className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm cursor-pointer flex justify-between items-center hover:border-gray-500 transition-colors"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearch('');
                }}
            >
                <span className={`truncate ${selectedOption ? 'text-white' : 'text-gray-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-600 rounded mt-1 max-h-60 overflow-y-auto z-50 shadow-xl">
                    <input
                        type="text"
                        className="w-full bg-gray-900 p-2 text-sm border-b border-gray-700 focus:outline-none text-white sticky top-0"
                        placeholder="Filter nodes..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                    />
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => (
                            <div
                                key={opt.value}
                                className={`px-3 py-2 cursor-pointer text-sm flex items-center justify-between ${opt.value === value ? 'bg-purple-900/50 text-purple-200' : 'text-gray-300 hover:bg-gray-700'}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                <span>{opt.label}</span>
                                {opt.value === value && <span className="text-purple-400 text-xs">Selected</span>}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm italic text-center">No matches found</div>
                    )}
                </div>
            )}
        </div>
    );
};

// Variable Reference Panel with Operators
const VariableReferencePanel = ({ variables }: { variables: Variable[] }) => {
    const [isOpen, setIsOpen] = useState(false);

    const operators = [
        { op: '==', desc: 'Equal' },
        { op: '!=', desc: 'Not Equal' },
        { op: '>', desc: 'Greater' },
        { op: '<', desc: 'Less' },
        { op: '>=', desc: 'Greater/Equal' },
        { op: '<=', desc: 'Less/Equal' },
        { op: '&&', desc: 'AND' },
        { op: '||', desc: 'OR' },
        { op: '!', desc: 'NOT' },
    ];

    return (
        <div className="mb-4 bg-gray-900/50 rounded border border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-xs text-blue-400 hover:text-blue-300 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Info size={14} />
                    {isOpen ? 'Hide Reference' : 'Show Variables & Operators'}
                </div>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="p-3 border-t border-gray-700 flex flex-col gap-4 max-h-60 overflow-y-auto custom-scrollbar">
                    {/* Variables Section */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Variables</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {variables.length === 0 ? (
                                <div className="text-gray-500 italic text-xs">No variables defined.</div>
                            ) : (
                                variables.map(v => (
                                    <div key={v.id} className="bg-gray-800 p-2 rounded border border-gray-700">
                                        <div className="font-bold text-gray-300 text-xs mb-1">{v.name}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {v.possibleValues.map((val: string) => (
                                                <span key={val} className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded border border-gray-600">
                                                    '{val}'
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Operators Section */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Operators</h4>
                        <div className="flex flex-wrap gap-2">
                            {operators.map(o => (
                                <div key={o.op} className="bg-gray-800 px-2 py-1 rounded border border-gray-700 flex items-center gap-2" title={o.desc}>
                                    <code className="text-purple-300 font-bold text-xs">{o.op}</code>
                                    <span className="text-gray-500 text-[10px]">{o.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ModelChecker = () => {
    const {
        variables,
        invariants,
        nodes,
        edges,
        addInvariant,
        removeInvariant,
        updateInvariant,
        modelCheckerResults,
        setModelCheckerResults
    } = useStore();

    const [newInvariantName, setNewInvariantName] = useState('');
    const [newInvariantCondition, setNewInvariantCondition] = useState('');
    const [newInvariantResult, setNewInvariantResult] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isInvariantsOpen, setIsInvariantsOpen] = useState(true);
    const [selectedViolation, setSelectedViolation] = useState<Invariant | null>(null);

    // Validation Logic
    const validateCondition = (condition: string) => {
        if (!condition.trim()) {
            setValidationError(null);
            return;
        }

        // 1. Operator Check: Ensure '==' is used instead of '='
        const temp = condition.replace(/==|!=|<=|>=/g, '  ');
        if (temp.includes('=')) {
            setValidationError("Invalid operator: Use '==' for comparison, not '='.");
            return;
        }

        // 2. Variable Existence Check
        const identifiers = condition.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
        const validVars = new Set(variables.map(v => v.name));
        // Also allow all possible enum values as valid identifiers (unquoted)
        const validEnums = new Set(variables.flatMap(v => v.possibleValues));
        const reserved = new Set(['true', 'false', 'null', 'undefined', 'and', 'or', 'not', 'in']);

        for (const id of identifiers) {
            if (!validVars.has(id) && !validEnums.has(id) && !reserved.has(id)) {
                setValidationError(`Unknown identifier: '${id}'. Must be a variable or a valid enum value.`);
                return;
            }
        }

        setValidationError(null);
    };

    const handleConditionChange = (val: string) => {
        setNewInvariantCondition(val);
        validateCondition(val);
    };

    // 1. Generate all combinations of variable values
    const combinations = useMemo(() => {
        if (variables.length === 0) return [];

        const keys = variables.map(v => v.name);
        const values = variables.map(v => v.possibleValues);

        const cartesian = (args: string[][]): string[][] => {
            if (args.length === 0) return [];
            return args.reduce<string[][]>(
                (acc, curr) => acc.flatMap(c => curr.map(n => [...c, n])),
                [[]]
            );
        };

        if (values.length === 0) return [];

        const product = cartesian(values);

        return product.map((row) => {
            const obj: Record<string, string> = {};
            row.forEach((val, i) => {
                obj[keys[i]] = val;
            });
            return obj;
        });
    }, [variables]);

    // 2. Collect all possible enum values for evaluation context
    const allEnumValues = useMemo(() => {
        const set = new Set<string>();
        variables.forEach(v => v.possibleValues.forEach(val => set.add(val)));
        return Array.from(set);
    }, [variables]);

    // 3. Evaluation Logic
    const evaluate = (context: Record<string, string>): { result: string; display: string } => {
        const root = nodes.find(n => n.type === 'root');
        if (!root) return { result: 'Error: No Root', display: 'Error: No Root' };

        let currentNode: Node | undefined = root;
        const visited = new Set<string>();
        let steps = 0;
        const MAX_STEPS = 100;

        while (currentNode && steps < MAX_STEPS) {
            if (visited.has(currentNode.id)) return { result: 'Error: Loop Detected', display: 'Error: Loop Detected' };
            visited.add(currentNode.id);
            steps++;

            if (currentNode.type === 'leaf') {
                const nodeId = (currentNode.data.nodeId as string) || 'Unknown';
                const label = (currentNode.data.label as string) || 'Leaf';
                return { result: nodeId, display: `${nodeId} (${label})` };
            }

            if (currentNode.type === 'root') {
                const outEdge = edges.find(e => e.source === currentNode!.id && (e.sourceHandle === 'out' || e.sourceHandle === null));
                if (!outEdge) return { result: 'Stuck: Root has no connection', display: 'Stuck: Root has no connection' };
                currentNode = nodes.find(n => n.id === outEdge.target);
                if (!currentNode) return { result: 'Error: Broken Link', display: 'Error: Broken Link' };
                continue;
            }

            if (currentNode.type === 'decision') {
                const expression = currentNode.data.expression as string;
                if (!expression) return { result: 'Error: Empty Condition', display: 'Error: Empty Condition' };

                let result = false;
                try {
                    const keys = Object.keys(context);
                    const argNames = [...keys, ...allEnumValues];
                    const argValues = [...keys.map(k => context[k]), ...allEnumValues];
                    const func = new Function(...argNames, `return ${expression};`);
                    result = func(...argValues);
                } catch (e) {
                    return { result: `Error: Invalid Expression`, display: `Error: Invalid Expression (${expression})` };
                }

                const handleId = result ? 'yes' : 'no';
                const outEdge = edges.find(e => e.source === currentNode!.id && e.sourceHandle === handleId);

                if (!outEdge) {
                    return { result: `Stuck: No path`, display: `Stuck: No path for ${result ? 'YES' : 'NO'}` };
                }

                currentNode = nodes.find(n => n.id === outEdge.target);
                if (!currentNode) return { result: 'Error: Broken Link', display: 'Error: Broken Link' };
            }
        }

        if (steps >= MAX_STEPS) return { result: 'Error: Too many steps', display: 'Error: Too many steps (Loop?)' };
        return { result: 'Unknown Error', display: 'Unknown Error' };
    };

    const leafNodes = useMemo(() => nodes.filter(n => n.type === 'leaf'), [nodes]);

    // Options for the dropdown
    const leafOptions = useMemo(() => leafNodes.map(node => ({
        value: (node.data.nodeId as string) || 'Unknown',
        label: `${node.data.nodeId || 'Unknown'} (${node.data.label || 'Leaf'})`
    })), [leafNodes]);

    const checkInvariants = useMemo(() => (context: Record<string, string>, result: string): Invariant[] => {
        const violations: Invariant[] = [];
        const argNames = [...Object.keys(context), ...allEnumValues];
        const argValues = [...Object.values(context), ...allEnumValues];

        invariants.forEach(inv => {
            try {
                const func = new Function(...argNames, `return ${inv.condition};`);
                const conditionMet = func(...argValues);

                if (conditionMet) {
                    if (result !== inv.expectedResult) {
                        violations.push(inv);
                    }
                }
            } catch (e) {
                // Ignore errors during check
            }
        });
        return violations;
    }, [invariants, allEnumValues]);

    const [isRunning, setIsRunning] = useState(false);

    const handleRun = () => {
        setIsRunning(true);
        setTimeout(() => {
            const newResults = combinations.map(combo => {
                const { result, display } = evaluate(combo);
                return { combo, result, display };
            });
            setModelCheckerResults(newResults);
            setIsRunning(false);
        }, 10);
    };

    const displayResults = useMemo(() => {
        return modelCheckerResults.map(row => ({
            ...row,
            violations: checkInvariants(row.combo, row.result)
        }));
    }, [modelCheckerResults, checkInvariants]);

    const resetForm = () => {
        setEditingId(null);
        setNewInvariantName('');
        setNewInvariantCondition('');
        setNewInvariantResult('');
        setValidationError(null);
    };

    const handleAddInvariant = () => {
        if (!newInvariantName || !newInvariantCondition || !newInvariantResult || validationError) return;
        addInvariant({
            name: newInvariantName,
            condition: newInvariantCondition,
            expectedResult: newInvariantResult
        });
        resetForm();
    };

    const handleEdit = (inv: Invariant) => {
        setEditingId(inv.id);
        setNewInvariantName(inv.name);
        setNewInvariantCondition(inv.condition);
        setNewInvariantResult(inv.expectedResult);
        setValidationError(null);
        validateCondition(inv.condition);
        setIsInvariantsOpen(true);
    };

    const handleUpdateInvariant = () => {
        if (!editingId || !newInvariantName || !newInvariantCondition || !newInvariantResult || validationError) return;
        updateInvariant(editingId, {
            name: newInvariantName,
            condition: newInvariantCondition,
            expectedResult: newInvariantResult
        });
        resetForm();
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white p-6 overflow-hidden gap-6 relative">

            {/* Violation Detail Modal */}
            {selectedViolation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedViolation(null)}>
                    <div
                        className="bg-gray-800 border border-gray-600 shadow-2xl rounded-lg p-6 max-w-md w-full relative animate-in fade-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedViolation(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                            <AlertTriangle size={24} />
                            Violation Details
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Invariant Name</div>
                                <div className="text-lg font-medium text-white">{selectedViolation.name}</div>
                            </div>

                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Condition (If)</div>
                                <code className="text-blue-300 font-mono text-sm block break-all">{selectedViolation.condition}</code>
                            </div>

                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Expected Result (Then)</div>
                                <div className="flex items-center gap-2">
                                    <code className="text-green-400 font-mono text-sm font-bold">{selectedViolation.expectedResult}</code>
                                    <span className="text-gray-500 text-xs">(Leaf Node ID)</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedViolation(null)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invariants Section */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 shrink-0 transition-all duration-300">
                <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700/50 rounded-t-lg"
                    onClick={() => setIsInvariantsOpen(!isInvariantsOpen)}
                >
                    <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Invariants (Safety Checks)
                        <span className="text-xs text-gray-500 font-normal ml-2">
                            ({invariants.length} defined)
                        </span>
                    </h3>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isInvariantsOpen ? 'rotate-180' : ''}`} />
                </div>

                {isInvariantsOpen && (
                    <div className="p-4 pt-0 border-t border-gray-700/50">
                        <VariableReferencePanel variables={variables} />

                        <div className="flex flex-col gap-2 mb-4 mt-4">
                            <div className="flex gap-2 items-center flex-wrap">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:border-purple-500"
                                    value={newInvariantName}
                                    onChange={e => setNewInvariantName(e.target.value)}
                                />
                                <span className="text-gray-400 text-sm">If</span>
                                <input
                                    type="text"
                                    placeholder="Condition (e.g. Temp == 'HIGH')"
                                    className={`bg-gray-900 border rounded px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none ${validationError ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'}`}
                                    value={newInvariantCondition}
                                    onChange={e => handleConditionChange(e.target.value)}
                                />
                                <span className="text-gray-400 text-sm">Then Result is</span>

                                <SearchableSelect
                                    options={leafOptions}
                                    value={newInvariantResult}
                                    onChange={setNewInvariantResult}
                                    placeholder="Select Leaf Node..."
                                />

                                {editingId ? (
                                    <>
                                        <button
                                            onClick={handleUpdateInvariant}
                                            disabled={!newInvariantName || !newInvariantCondition || !newInvariantResult || !!validationError}
                                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                                        >
                                            <Edit size={16} /> Update
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                                        >
                                            <X size={16} /> Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleAddInvariant}
                                        disabled={!newInvariantName || !newInvariantCondition || !newInvariantResult || !!validationError}
                                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                )}
                            </div>
                            {validationError && (
                                <div className="text-red-400 text-xs pl-1 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    {validationError}
                                </div>
                            )}
                        </div>

                        {invariants.length > 0 && (
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                {invariants.map(inv => (
                                    <div key={inv.id} className={`flex items-center justify-between bg-gray-900/50 p-2 rounded border text-sm transition-colors ${editingId === inv.id ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 hover:bg-gray-900'}`}>
                                        <div className="flex-1 flex items-center gap-2">
                                            <span className="font-semibold text-purple-300">{inv.name}:</span>
                                            <span className="text-gray-400">If</span>
                                            <code className="text-blue-300 bg-gray-800 px-1 rounded">{inv.condition}</code>
                                            <span className="text-gray-400">Then</span>
                                            <code className="text-green-400 bg-gray-800 px-1 rounded">{inv.expectedResult}</code>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(inv)}
                                                className="text-gray-500 hover:text-blue-400 p-1 transition-colors"
                                                title="Edit"
                                                disabled={!!editingId}
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => removeInvariant(inv.id)}
                                                className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Analysis Section */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 shrink-0 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                            <Activity size={20} />
                            Model Checking
                        </h2>
                        {modelCheckerResults.length > 0 ? (
                            <p className="text-xs text-gray-400 mt-1">
                                <span className="text-green-400 font-bold">Live Analysis:</span> Invariants are checked automatically.
                                Only regenerate if Variables or Tree Logic changes.
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-1">
                                Generates all possible variable combinations to verify safety.
                                <span className="text-orange-400 ml-1">Computationally expensive for many variables.</span>
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleRun}
                        disabled={variables.length === 0 || isRunning}
                        className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-all text-sm ${variables.length === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : modelCheckerResults.length > 0
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-gray-500'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/20'
                            }`}
                    >
                        <RefreshCw size={16} className={isRunning ? 'animate-spin' : ''} />
                        {isRunning ? 'Generating...' : modelCheckerResults.length > 0 ? 'Regenerate State Space' : 'Generate State Space'}
                    </button>
                </div>

                {variables.length === 0 ? (
                    <div className="text-gray-400 italic p-4">No variables defined. Add variables to perform model checking.</div>
                ) : displayResults.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border border-gray-700 rounded-lg bg-gray-800/30 text-gray-400 gap-2">
                        <Activity size={48} className="opacity-20" />
                        <p>State space not generated.</p>
                        <p className="text-sm opacity-60">Click "Generate State Space" to begin analysis.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto border border-gray-700 rounded-lg shadow-xl custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-800 sticky top-0 z-10">
                                <tr>
                                    {variables.map(v => (
                                        <th key={v.id} className="p-3 border-b border-gray-700 font-semibold text-gray-300 whitespace-nowrap">
                                            {v.name}
                                        </th>
                                    ))}
                                    <th className="p-3 border-b border-gray-700 font-semibold text-green-400 whitespace-nowrap">
                                        Result (Leaf)
                                    </th>
                                    <th className="p-3 border-b border-gray-700 font-semibold text-red-400 whitespace-nowrap">
                                        Violations
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {displayResults.map((row, idx) => {
                                    const isError = row.result.startsWith('Error') || row.result.startsWith('Stuck');
                                    const hasViolations = row.violations.length > 0;
                                    return (
                                        <tr key={idx} className={`hover:bg-gray-800/50 transition-colors ${hasViolations ? 'bg-red-900/20' : ''}`}>
                                            {variables.map(v => (
                                                <td key={v.id} className="p-3 text-gray-400 font-mono text-sm whitespace-nowrap">
                                                    {row.combo[v.name]}
                                                </td>
                                            ))}
                                            <td className={`p-3 font-mono text-sm font-bold whitespace-nowrap ${isError ? 'text-red-400' : 'text-green-400'}`}>
                                                {row.display}
                                            </td>
                                            <td className="p-3 font-mono text-sm text-red-400 font-bold">
                                                {hasViolations ? (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <AlertTriangle size={14} className="text-red-500" />
                                                        {row.violations.map((v, i) => (
                                                            <button
                                                                key={i}
                                                                className="cursor-pointer bg-red-950 hover:bg-red-900 text-red-200 px-2 py-1 rounded border border-red-800 hover:border-red-600 text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedViolation(v);
                                                                }}
                                                            >
                                                                <span>{v.name}</span>
                                                                <Info size={10} className="opacity-70" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {displayResults.length > 0 && (
                    <div className="mt-4 text-xs text-gray-500 shrink-0">
                        Total States: {displayResults.length} | Violations Found: {displayResults.filter(r => r.violations.length > 0).length}
                    </div>
                )}
            </div>
        </div>
    );
};
