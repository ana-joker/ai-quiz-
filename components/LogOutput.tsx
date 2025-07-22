
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogOutputProps {
    logs: LogEntry[];
}

const LogOutput: React.FC<LogOutputProps> = ({ logs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const getTextColor = (type: 'log' | 'error' | 'success') => {
        switch (type) {
            case 'error': return 'text-red-400 font-semibold';
            case 'success': return 'text-green-400 font-semibold';
            default: return 'text-slate-400';
        }
    };

    return (
        <div ref={logContainerRef} className="space-y-2 h-96 md:h-auto overflow-y-auto bg-black/50 p-3 rounded-md text-sm">
            {logs.map(log => (
                <p key={log.id} className={`log-message ${getTextColor(log.type)}`}>
                    <span className="font-sans">[{new Date().toLocaleTimeString()}]</span> {log.message}
                </p>
            ))}
        </div>
    );
};

export default LogOutput;
