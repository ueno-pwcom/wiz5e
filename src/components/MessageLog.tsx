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

  const getLogClassName = (log: LogMessage): string => {
    const text = log.text;

    if (text.includes('を倒した！') || text.includes('が倒れた') || text.includes('を倒した。')) {
      return 'message-log-info';
    }

    if (text.includes('ダメージを受けた')) {
      return 'message-log-damage';
    }

    if (log.type === 'critical') {
      return 'message-log-critical';
    }

    if (log.type === 'enemy_action') {
      return 'message-log-enemy_action';
    }

    if (log.type === 'player_action') {
      return 'message-log-player_action';
    }

    if (log.type === 'heal') {
      return 'message-log-heal';
    }

    if (log.type === 'system') {
      return 'message-log-system';
    }

    return 'message-log-info';
  };

  return (
    <div ref={containerRef} className="message-log">
      {logs.map((log) => (
        <div key={log.id} className={`message-log-entry ${getLogClassName(log)}`}>
          &gt; {log.text.split('\n').map((line, index, arr) => (
            <React.Fragment key={index}>
              {line}
              {index < arr.length - 1 ? <br /> : null}
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};