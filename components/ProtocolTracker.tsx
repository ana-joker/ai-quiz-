
import React from 'react';
import { ProtocolStep } from '../types';

interface ProtocolTrackerProps {
    steps: ProtocolStep[];
}

const ProtocolTracker: React.FC<ProtocolTrackerProps> = ({ steps }) => {
    return (
        <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-lg shadow-lg border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-4 border-b-2 border-cyan-500 pb-2">مراحل التنفيذ التلقائي</h3>
            <ol className="space-y-3">
                {steps.map(step => (
                    <li key={step.id} className={`protocol-item bg-slate-900/50 p-3 rounded-md border-l-4 border-slate-600 ${step.status}`}>
                        <strong>{step.text.split(':')[0]}:</strong>{step.text.split(':')[1]}
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default ProtocolTracker;
