import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export const VariableManager: React.FC = () => {
    const { variables, addVariable, updateVariable, removeVariable } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [possibleValues, setPossibleValues] = useState<string[]>(['']);

    const resetForm = () => {
        setName('');
        setPossibleValues(['']);
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const filteredValues = possibleValues.filter(v => v.trim() !== '');
        if (filteredValues.length === 0) return;

        const newVar = {
            name,
            type: 'enum' as const,
            possibleValues: filteredValues,
        };

        if (editingId) {
            updateVariable(editingId, newVar);
        } else {
            addVariable(newVar);
        }
        resetForm();
    };

    const startEdit = (v: any) => {
        setName(v.name);
        setPossibleValues([...v.possibleValues]);
        setEditingId(v.id);
        setIsAdding(true);
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
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">State Variables</h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors text-sm"
                    >
                        <Plus size={16} /> Add Variable
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-900/50 rounded-md border border-gray-700">
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
                                            placeholder={`Value ${index + 1} (e.g., LOW, HIGH, ON, OFF)`}
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

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-3 py-1 text-gray-400 hover:text-white text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm"
                        >
                            <Save size={14} /> Save
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {variables.length === 0 && !isAdding && (
                    <p className="text-gray-500 text-center py-4 text-sm">No variables defined.</p>
                )}
                {variables.map((v) => (
                    <div
                        key={v.id}
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
                                onClick={() => startEdit(v)}
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
                ))}
            </div>
        </div>
    );
};
