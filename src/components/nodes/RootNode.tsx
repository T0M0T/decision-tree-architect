import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export const RootNode = memo(({ data, selected }: NodeProps) => {
    return (
        <div className={`px-6 py-4 shadow-xl rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 border-2 w-[150px] transition-all duration-200 ${selected
            ? 'border-white shadow-[0_0_20px_rgba(168,85,247,0.8)] scale-105 ring-2 ring-purple-300 ring-offset-2 ring-offset-gray-900'
            : 'border-purple-400'
            }`}>
            <div className="flex flex-col items-center gap-2 relative">
                <div className="absolute -top-6 -left-6 bg-purple-900 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-purple-400 shadow-sm z-20">
                    {data.nodeId || 'R0'}
                </div>
                <div className="text-white font-bold text-lg">ROOT</div>
                <div className="text-purple-200 text-xs">Decision Tree Start</div>
            </div>

            {/* Output handle only */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="out"
                className="w-4 h-4 bg-purple-400 border-2 border-purple-200"
                style={{ bottom: '-8px', zIndex: 10 }}
                isConnectable={true}
            />
        </div>
    );
});

RootNode.displayName = 'RootNode';
