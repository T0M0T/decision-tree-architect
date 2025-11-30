import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useStore } from '../../store/useStore';

import { AlertCircle } from 'lucide-react';

export const LeafNode = memo(({ id, data, selected }: NodeProps) => {
    const { updateNodeData } = useStore();
    const [label, setLabel] = useState(String(data.label || 'Leaf Node'));
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        updateNodeData(id, { label });
        setIsEditing(false);
    };

    return (
        <div className={`bg-gray-700 border-2 rounded-lg shadow-lg min-w-[180px] transition-all duration-200 ${selected
            ? 'border-white shadow-[0_0_20px_rgba(107,114,128,0.8)] scale-105 ring-2 ring-gray-400 ring-offset-2 ring-offset-gray-900'
            : 'border-gray-500'
            }`}>
            <div className="bg-gray-600 px-3 py-2 rounded-t-md relative">
                <div className="absolute -top-3 -left-3 bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-gray-400 shadow-sm z-20">
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
                        className="bg-gray-700 text-white font-semibold text-sm w-full border border-gray-500 focus:outline-none focus:border-gray-400 px-1 rounded"
                        placeholder="Node Label"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') setIsEditing(false);
                        }}
                        onBlur={handleSave}
                    />
                ) : (
                    <div
                        className="text-white font-semibold text-sm cursor-pointer hover:text-gray-300"
                        onClick={() => setIsEditing(true)}
                    >
                        {label}
                    </div>
                )}
            </div>

            <div className="p-3 text-center">
                <div className="text-xs text-gray-400 italic">
                    End of Decision Path
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Top}
                id="in"
                className="w-4 h-4 bg-gray-400 border-2 border-gray-300"
                isConnectable={true}
                style={{ top: '-8px', zIndex: 10 }}
            />
        </div>
    );
});

LeafNode.displayName = 'LeafNode';
