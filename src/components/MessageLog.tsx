import React from 'react';
import type { LogMessage } from '../types/game';

interface Props {
  logs: LogMessage[];
}

export const MessageLog: React.FC<Props> = ({ logs }) => {
  const getLogColor = (type: LogMessage['type']) => {
    switch (type) {
      case 'player_action': return '#60a5fa'; // 青（味方行動・命中）
      case 'enemy_action':  return '#f87171'; // 赤（敵の攻撃・被害）
      case 'heal':          return '#4ade80'; // 緑（回復）
      case 'critical':      return '#fbbf24'; // オレンジ（クリティカル）
      case 'system':        return '#a78bfa'; // 紫（システム・知覚）
      default:              return '#e5e7eb'; // 白（標準）
    }
  };

  return (
    <div style={{
      height: '100px',
      backgroundColor: '#111827',
      border: '1px solid #374151',
      padding: '8px 12px',
      fontFamily: 'monospace',
      fontSize: '14px',
      overflowY: 'auto'
    }}>
      {logs.map((log) => (
        <div key={log.id} style={{ color: getLogColor(log.type), marginBottom: '2px' }}>
          &gt; {log.text}
        </div>
      ))}
    </div>
  );
};