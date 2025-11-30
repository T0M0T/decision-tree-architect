import { useMemo, useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Node } from '@xyflow/react';
import { Plus, Trash2, AlertTriangle, ChevronDown, Info, Edit, X, RefreshCw, Activity } from 'lucide-react';
import { Invariant, Variable } from '../types';
import { getCompletionSuggestion, isValidIdentifier } from '../utils/expressionUtils';

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
                        filteredOptions.map((opt, index) => (
                            <div
                                key={`${opt.value}-${index}`}
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

    // Ghost text state
    const [suggestion, setSuggestion] = useState<string>('');
    const [cursorPos, setCursorPos] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Calculate suggestion
    useEffect(() => {
        setSuggestion(getCompletionSuggestion(newInvariantCondition, cursorPos, variables));
    }, [newInvariantCondition, cursorPos, variables]);

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

    const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewInvariantCondition(val);
        setCursorPos(e.target.selectionStart || 0);
        validateCondition(val);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        setCursorPos(e.currentTarget.selectionStart || 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab') {
            if (suggestion) {
                e.preventDefault();
                const newValue = newInvariantCondition.slice(0, cursorPos) + suggestion + newInvariantCondition.slice(cursorPos);
                setNewInvariantCondition(newValue);
                const newCursorPos = cursorPos + suggestion.length;
                setCursorPos(newCursorPos);
                setSuggestion('');

                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPos;
                    }
                }, 0);

                validateCondition(newValue);
            }
        }
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

        // Filter valid identifiers for enum values
        const validEnumValues = allEnumValues.filter(isValidIdentifier);

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
                    const argNames = [...keys, ...validEnumValues];
                    const argValues = [...keys.map(k => context[k]), ...validEnumValues];
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
    const leafOptions = useMemo(() => {
        const uniqueMap = new Map();
        leafNodes.forEach(node => {
            const value = (node.data.nodeId as string) || 'Unknown';
            if (!uniqueMap.has(value)) {
                uniqueMap.set(value, {
                    value,
                    label: `${value} (${node.data.label || 'Leaf'})`
                });
            }
        });
        return Array.from(uniqueMap.values());
    }, [leafNodes]);

    const checkInvariants = useMemo(() => (context: Record<string, string>, result: string): Invariant[] => {
        const violations: Invariant[] = [];
        const validEnumValues = allEnumValues.filter(isValidIdentifier);
        const argNames = [...Object.keys(context), ...validEnumValues];
        const argValues = [...Object.values(context), ...validEnumValues];

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

                                <div className="relative flex-1 min-w-[200px]">
                                    {/* Ghost Text Layer */}
                                    <div
                                        className="absolute inset-0 px-3 py-2 text-sm font-mono whitespace-pre-wrap break-all border border-transparent pointer-events-none bg-transparent"
                                        aria-hidden="true"
                                    >
                                        <span className="opacity-0">{newInvariantCondition.slice(0, cursorPos)}</span>
                                        <span className="text-gray-500">{suggestion}</span>
                                        <span className="opacity-0">{newInvariantCondition.slice(cursorPos)}</span>
                                    </div>

                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Condition (e.g. Temp == 'HIGH')"
                                        className={`w-full bg-transparent border rounded px-3 py-2 text-sm font-mono focus:outline-none relative z-10 ${validationError ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'}`}
                                        value={newInvariantCondition}
                                        onChange={handleConditionChange}
                                        onKeyDown={handleKeyDown}
                                        onSelect={handleSelect}
                                        spellCheck={false}
                                    />
                                </div>

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

                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {invariants.map(inv => (
                                <div key={inv.id} className="bg-gray-900/50 p-3 rounded border border-gray-700 flex items-center justify-between group hover:border-gray-600 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-white">{inv.name}</span>
                                            <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">ID: {inv.id.slice(0, 4)}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            If <span className="text-blue-300">{inv.condition}</span> then <span className="text-green-300">{inv.expectedResult}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(inv)}
                                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                            title="Edit Invariant"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => removeInvariant(inv.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                            title="Delete Invariant"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {invariants.length === 0 && (
                                <div className="text-gray-500 text-sm italic text-center py-4">
                                    No invariants defined. Add one above to check for safety properties.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Results Section */}
            <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 flex flex-col min-h-0">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Activity size={18} className="text-blue-400" />
                        Model Checker Results
                    </h3>
                    <button
                        onClick={handleRun}
                        disabled={isRunning || variables.length === 0}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <RefreshCw size={16} className={isRunning ? 'animate-spin' : ''} />
                        {isRunning ? 'Checking...' : 'Run Check'}
                    </button>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                    {modelCheckerResults.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                            <Activity size={48} className="opacity-20" />
                            <p>Run the model checker to verify all possible paths.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-900/50 sticky top-0 z-10">
                                <tr>
                                    {variables.map(v => (
                                        <th key={v.id} className="p-3 text-xs font-bold text-gray-400 uppercase border-b border-gray-700 whitespace-nowrap">
                                            {v.name}
                                        </th>
                                    ))}
                                    <th className="p-3 text-xs font-bold text-gray-400 uppercase border-b border-gray-700 whitespace-nowrap">
                                        Result Node
                                    </th>
                                    <th className="p-3 text-xs font-bold text-gray-400 uppercase border-b border-gray-700 whitespace-nowrap">
                                        Violations
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {displayResults.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-700/30 transition-colors group">
                                        {variables.map(v => (
                                            <td key={v.id} className="p-3 text-sm text-gray-300 border-r border-gray-700/50 last:border-r-0">
                                                <span className="bg-gray-800 px-2 py-1 rounded text-xs font-mono border border-gray-700">
                                                    {row.combo[v.name]}
                                                </span>
                                            </td>
                                        ))}
                                        <td className="p-3 text-sm">
                                            <span className={`font-mono font-bold ${row.result.startsWith('Error') || row.result.startsWith('Stuck') ? 'text-red-400' : 'text-green-400'}`}>
                                                {row.display}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm">
                                            {row.violations.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {row.violations.map((v, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-red-900/30 text-red-400 border border-red-900/50 px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer hover:bg-red-900/50 transition-colors"
                                                            onClick={() => setSelectedViolation(v)}
                                                        >
                                                            <AlertTriangle size={12} />
                                                            {v.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 text-xs flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                                                    Pass
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="p-2 border-t border-gray-700 bg-gray-900/50 text-xs text-gray-500 flex justify-between px-4">
                    <span>Total Combinations: {modelCheckerResults.length}</span>
                    <span>Violations Found: {displayResults.filter(r => r.violations.length > 0).length}</span>
                </div>
            </div>
        </div >
    );
};
