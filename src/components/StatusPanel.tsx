import React from 'react';
import type { Character } from '../types/game';

interface Props {
  party: Character[];
  gold: number;
}

export const StatusPanel: React.FC<Props> = ({ party, gold }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr) 120px',
      gap: '8px',
      backgroundColor: '#1f2937',
      padding: '8px',
      border: '1px solid #374151',
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      {party.map((char, idx) => (
        <div key={char.id} style={{
          backgroundColor: '#111827',
          padding: '6px',
          borderRadius: '4px',
          border: char.position === 'front' ? '1px solid #3b82f6' : '1px solid #6b7280'
        }}>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            [{char.position === 'front' ? `前衛 ${idx + 1}` : `後衛 ${idx + 1}`}]
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{char.name}</div>
          <div style={{ fontSize: '12px' }}>HP: {char.hp.current}/{char.hp.max}</div>
          <div style={{ fontSize: '12px' }}>AC: {char.ac}</div>
          <div style={{ fontSize: '11px', color: char.is_alive ? '#4ade80' : '#ef4444' }}>
            {char.is_alive ? '[正常]' : '[死亡]'}
          </div>
        </div>
      ))}
      <div style={{
        backgroundColor: '#111827',
        padding: '6px',
        borderRadius: '4px',
        border: '1px solid #f59e0b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '11px', color: '#f59e0b' }}>所持金</div>
        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#fbbf24' }}>{gold} gp</div>
      </div>
    </div>
  );
};