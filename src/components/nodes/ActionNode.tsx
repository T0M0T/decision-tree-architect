import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export const ActionNode: React.FC<NodeProps> = ({ data }) => {
    return (
        <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg p-3 min-w-[150px] shadow-lg">
            <Handle type="target" position={Position.Top} className="!bg-yellow-500" />

            <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Action</div>
                <input
                    type="text"
                    placeholder="Set variable..."
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-500"
                    defaultValue={data.label as string}
                />
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-yellow-500" />
        </div>
    );
};
