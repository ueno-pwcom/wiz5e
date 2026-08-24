import React, { useEffect, useRef } from 'react';
import type { LogMessage } from '../types/game';
import './MessageLog.css';

interface Props {
  logs: LogMessage[];
}

export const MessageLog: React.FC<Props> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [logs]);

  return (
    <div ref={containerRef} className="message-log">
      {logs.map((log) => (
        <div key={log.id} className={`message-log-entry message-log-${log.type ?? 'default'}`}>
          &gt; {log.text}
        </div>
      ))}
    </div>
  );
};