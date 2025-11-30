import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import { isReservedWord, isValidIdentifier } from '../utils/reservedWords';

interface VariableFormProps {
    initialName?: string;
    initialValues?: string[];
    onSubmit: (name: string, values: string[]) => void;
    onCancel: () => void;
    submitLabel?: string;
}

const VariableForm: React.FC<VariableFormProps> = ({
    initialName = '',
    initialValues = [''],
    onSubmit,
    onCancel,
    submitLabel = 'Save'
}) => {
    const [name, setName] = useState(initialName);
    const [possibleValues, setPossibleValues] = useState<string[]>(initialValues);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate Name
        if (!isValidIdentifier(name)) {
            setError(`Invalid variable name: "${name}". Must start with a letter/_ and contain only letters, numbers, _.`);
            return;
        }
        if (isReservedWord(name)) {
            setError(`Invalid variable name: "${name}" is a reserved word.`);
            return;
        }

        const filteredValues = possibleValues.filter(v => v.trim() !== '');
        if (filteredValues.length === 0) {
            setError("At least one possible value is required.");
            return;
        }

        // Validate Values
        for (const val of filteredValues) {
            if (!isValidIdentifier(val)) {
                setError(`Invalid value: "${val}". Must start with a letter/_ and contain only letters, numbers, _. (No raw numbers allowed)`);
                return;
            }
            if (isReservedWord(val)) {
                setError(`Invalid value: "${val}" is a reserved word.`);
                return;
            }
        }

        // Check for duplicates
        const uniqueValues = new Set(filteredValues);
        if (uniqueValues.size !== filteredValues.length) {
            setError("Duplicate values are not allowed.");
            return;
        }

        onSubmit(name, filteredValues);
    };

    const addValueField = () => {
        setPossibleValues([...possibleValues, '']);
    };

    const updateValueField = (index: number, value: string) => {
        const newValues = [...possibleValues];
        newValues[index] = value;
        setPossibleValues(newValues);
    };

    const removeValueField = (index: number) => {
        if (possibleValues.length > 1) {
            setPossibleValues(possibleValues.filter((_, i) => i !== index));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-900/50 rounded-md border border-gray-700 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Variable Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., temperature, status"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs text-gray-400 mb-2">Possible Values (Enum)</label>
                    <div className="space-y-2">
                        {possibleValues.map((value, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => updateValueField(index, e.target.value)}
                                    placeholder={`Value ${index + 1}`}
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                                {possibleValues.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeValueField(index)}
                                        className="p-1 text-gray-400 hover:text-red-400"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addValueField}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <Plus size={12} /> Add Value
                        </button>
                    </div>
                </div>
            </div>


            {
                error && (
                    <div className="mt-3 p-2 bg-red-900/30 border border-red-800 rounded flex items-start gap-2 text-red-200 text-xs">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )
            }

            <div className="flex justify-end gap-2 mt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1 text-gray-400 hover:text-white text-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm"
                >
                    <Save size={14} /> {submitLabel}
                </button>
            </div>
        </form >
    );
};

export const VariableManager: React.FC = () => {
    const { variables, addVariable, updateVariable, removeVariable } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAdd = (name: string, values: string[]) => {
        addVariable({
            name,
            type: 'enum',
            possibleValues: values,
        });
        setIsAdding(false);
    };

    const handleUpdate = (id: string, name: string, values: string[]) => {
        updateVariable(id, {
            name,
            type: 'enum',
            possibleValues: values,
        });
        setEditingId(null);
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">State Variables</h2>
                {!isAdding && (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingId(null); // Close any open edits
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-sm"
                    >
                        <Plus size={16} /> Add Variable
                    </button>
                )}
            </div>

            {isAdding && (
                <VariableForm
                    onSubmit={handleAdd}
                    onCancel={() => setIsAdding(false)}
                    submitLabel="Add Variable"
                />
            )}

            <div className="space-y-2">
                {variables.length === 0 && !isAdding && (
                    <p className="text-gray-500 text-center py-4 text-sm">No variables defined.</p>
                )}
                {variables.map((v) => (
                    <div key={v.id}>
                        {editingId === v.id ? (
                            <VariableForm
                                initialName={v.name}
                                initialValues={v.possibleValues}
                                onSubmit={(name, values) => handleUpdate(v.id, name, values)}
                                onCancel={() => setEditingId(null)}
                                submitLabel="Update"
                            />
                        ) : (
                            <div
                                className="flex items-center justify-between p-3 bg-gray-700/50 rounded border border-gray-700 hover:border-gray-600 transition-colors cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/reactflow/variable', v.name);
                                    e.dataTransfer.effectAllowed = 'copy';
                                }}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-white">{v.name}</span>
                                        <span className="text-xs px-1.5 py-0.5 bg-purple-600 rounded text-gray-200">enum</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {v.possibleValues.map((val, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-gray-600 rounded text-gray-300 font-mono">
                                                {val}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                    <button
                                        onClick={() => {
                                            setEditingId(v.id);
                                            setIsAdding(false); // Close add form if open
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => removeVariable(v.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
