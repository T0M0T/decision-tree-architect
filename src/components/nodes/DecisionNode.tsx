import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useStore } from '../../store/useStore';
import { validateExpression } from '../../utils/validation';
import { formatExpression, getCompletionSuggestion } from '../../utils/expressionUtils';
import { AlertCircle } from 'lucide-react';

export const DecisionNode = memo(({ id, data, selected }: NodeProps) => {
    const { variables, updateNodeData } = useStore();
    const [label, setLabel] = useState(String(data.label || 'Decision Node'));
    const [expression, setExpression] = useState(String(data.expression || ''));
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Ghost text state
    const [suggestion, setSuggestion] = useState<string>('');
    const [cursorPos, setCursorPos] = useState<number>(0);

    const handleSave = () => {
        setError(null);

        const formattedExpression = formatExpression(expression);

        const validation = validateExpression(formattedExpression, variables);

        if (!validation.isValid) {
            setError(validation.error || 'Invalid expression');
            return;
        }

        setExpression(formattedExpression);
        updateNodeData(id, { label, expression: formattedExpression });
        setIsEditing(false);
        setSuggestion('');
    };

    const insertVariable = (varName: string) => {
        const newExpr = expression + (expression ? ' ' : '') + varName;
        setExpression(newExpr);
        setError(null);
        // Focus and move cursor to end
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newExpr.length;
            }
        }, 0);
    };

    const insertOperator = (op: string) => {
        const newExpr = expression + ' ' + op + ' ';
        setExpression(newExpr);
        setError(null);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newExpr.length;
            }
        }, 0);
    };

    // Calculate suggestion based on current input and cursor position
    useEffect(() => {
        if (!isEditing) {
            setSuggestion('');
            return;
        }
        setSuggestion(getCompletionSuggestion(expression, cursorPos, variables));
    }, [expression, cursorPos, isEditing, variables]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (suggestion) {
                const newValue = expression.slice(0, cursorPos) + suggestion + expression.slice(cursorPos);
                setExpression(newValue);
                const newCursorPos = cursorPos + suggestion.length;
                setCursorPos(newCursorPos);
                setSuggestion(''); // Clear suggestion

                // Move cursor
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
                    }
                }, 0);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setExpression(e.target.value);
        setCursorPos(e.target.selectionStart);
        setError(null);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        setCursorPos(e.currentTarget.selectionStart);
    };

    return (
        <div className={`bg-blue-900 border-2 rounded-lg shadow-lg w-[280px] transition-all duration-200 ${selected
            ? 'border-white shadow-[0_0_20px_rgba(59,130,246,0.8)] scale-105 ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900'
            : 'border-blue-500'
            }`}>
            <div className="bg-blue-700 px-3 py-2 rounded-t-md relative">
                <div className="absolute -top-3 -left-3 bg-blue-900 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-blue-400 shadow-sm z-20">
                    {String(data.nodeId || id)}
                </div>
                {!!data.isUnreachable && (
                    <div className="absolute -top-3 -right-3 bg-red-900 text-red-200 p-1 rounded-full border border-red-500 shadow-sm z-30" title="Unreachable Node">
                        <AlertCircle size={14} />
                    </div>
                )}
                {isEditing ? (
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="bg-blue-800 text-white font-semibold text-sm w-full border border-blue-600 focus:outline-none focus:border-blue-400 px-1 rounded"
                        placeholder="Node Name"
                    />
                ) : (
                    <div
                        className="text-white font-semibold text-sm cursor-pointer"
                        onClick={() => setIsEditing(true)}
                    >
                        {label}
                    </div>
                )}
            </div>

            <div className="p-3 space-y-2">
                {isEditing ? (
                    <div className="space-y-2">
                        <div className="relative w-full h-16">
                            {/* Ghost Text Layer */}
                            <div
                                className={`absolute inset-0 px-2 py-1 text-xs font-mono whitespace-pre-wrap break-all border border-transparent pointer-events-none bg-transparent`}
                                aria-hidden="true"
                            >
                                <span className="opacity-0">{expression.slice(0, cursorPos)}</span>
                                <span className="text-gray-500">{suggestion}</span>
                                <span className="opacity-0">{expression.slice(cursorPos)}</span>
                            </div>

                            {/* Actual Textarea */}
                            <textarea
                                ref={textareaRef}
                                value={expression}
                                onChange={handleChange}
                                onSelect={handleSelect}
                                onKeyDown={handleKeyDown}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const varName = e.dataTransfer.getData('application/reactflow/variable');
                                    if (varName) {
                                        insertVariable(varName);
                                    }
                                }}
                                placeholder="e.g., A == HIGH && B == LOW"
                                className={`absolute inset-0 w-full h-full bg-transparent border rounded px-2 py-1 text-white text-xs font-mono focus:outline-none resize-none overflow-hidden ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-400'
                                    }`}
                                autoFocus
                                spellCheck={false}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-1 text-red-400 text-xs bg-red-900/20 p-1.5 rounded border border-red-900/50">
                                <AlertCircle size={12} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                                {variables.map(v => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => insertVariable(v.name)}
                                        className="px-1.5 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 rounded text-xs"
                                    >
                                        {v.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-1">
                                <button type="button" onClick={() => insertOperator('==')} className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs">==</button>
                                <button type="button" onClick={() => insertOperator('!=')} className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs">!=</button>
                                <button type="button" onClick={() => insertOperator('&&')} className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs">&&</button>
                                <button type="button" onClick={() => insertOperator('||')} className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs">||</button>
                                <button type="button" onClick={() => setExpression(prev => prev + '(')} className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs">(</button>
                                <button type="button" onClick={() => setExpression(prev => prev + ')')} className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs">)</button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setError(null);
                                    setExpression(String(data.expression || ''));
                                    setSuggestion('');
                                }}
                                className="px-2 py-1 text-gray-400 hover:text-white text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className="cursor-pointer hover:bg-gray-800/50 rounded p-2 min-h-[40px]"
                    >
                        {expression ? (
                            <div className="text-xs font-mono text-yellow-300 break-all">
                                {expression}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500 italic">
                                Click to add decision logic...
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                id="yes"
                className="w-4 h-4 bg-green-500 border-2 border-green-300"
                style={{ top: '50%', right: '-8px', zIndex: 10 }}
                isConnectable={true}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-green-400 font-semibold pointer-events-none">
                Yes
            </div>

            <Handle
                type="source"
                position={Position.Left}
                id="no"
                className="w-4 h-4 bg-red-500 border-2 border-red-300"
                style={{ top: '50%', left: '-8px', zIndex: 10 }}
                isConnectable={true}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xs text-red-400 font-semibold pointer-events-none">
                No
            </div>

            <Handle
                type="target"
                position={Position.Top}
                id="in"
                className="w-3 h-3 bg-blue-400"
                isConnectable={true}
                style={{ zIndex: 50 }}
            />
        </div>
    );
});

DecisionNode.displayName = 'DecisionNode';
