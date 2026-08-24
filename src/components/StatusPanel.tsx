import React from 'react';
import type { Character } from '../types/game';
import { useGameStore } from '../store/useGameStore';

interface Props {
  party: Character[];
  gold: number;
}

export const StatusPanel: React.FC<Props> = ({ party, gold }) => {
  const combatants = useGameStore((state) => state.combatants);
  const currentTurnIndex = useGameStore((state) => state.currentTurnIndex);
  const scene = useGameStore((state) => state.scene);
  const setSelectedCharacterId = useGameStore((state) => state.setSelectedCharacterId);
  const currentCombatant = combatants[currentTurnIndex];
  const currentTurnId = currentCombatant?.is_player ? currentCombatant.id : null;
  const showFocus = scene === 'battle' && Boolean(currentTurnId);

  const classNames: Record<string, string> = {
    fighter: 'ファイター',
    wizard: 'ウィザード',
    cleric: 'クレリック',
    rogue: 'ローグ'
  };

  const frontParty = party.filter((char) => char.position === 'front');
  const backParty = party.filter((char) => char.position === 'back');
  const backRowWidth = frontParty.length > 0
    ? `${Math.min(100, (backParty.length / frontParty.length) * 100)}%`
    : '100%';

  const renderCharacterCard = (char: Character, idx: number) => {
    const isCurrentTurn = showFocus && char.id === currentTurnId;
    const hpHalfDown = char.hp.current > 0 && char.hp.current <= Math.floor(char.hp.max / 2);
    const isDown = char.hp.current <= 0;
    return (
      <div
        key={char.id}
        style={{
          backgroundColor: '#111827',
          padding: '6px',
          borderRadius: '4px',
          border: isCurrentTurn
            ? '2px solid #38bdf8'
            : isDown
            ? '1px solid #ef4444'
            : hpHalfDown
            ? '1px solid #f59e0b'
            : char.position === 'front'
            ? '1px solid #3b82f6'
            : '1px solid #6b7280',
          boxShadow: isCurrentTurn ? '0 0 0 4px rgba(56, 189, 248, 0.18)' : 'none',
          cursor: scene === 'camp' ? 'pointer' : 'default',
          minWidth: 0,
          flex: '1 1 0'
        }}
        onClick={() => {
          if (scene === 'camp') {
            setSelectedCharacterId(char.id);
          }
        }}
      >
        <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
          {classNames[char.class_id] ?? char.class_id}
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{char.name}</div>
        <div style={{ fontSize: '12px' }}>HP: {char.hp.current}/{char.hp.max}</div>
        <div style={{ fontSize: '12px' }}>AC: {char.ac}</div>
        <div style={{ fontSize: '11px', color: char.is_alive ? '#4ade80' : '#ef4444' }}>
          {char.is_alive ? '[正常]' : '[死亡]'}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 120px',
      gap: '8px',
      backgroundColor: '#1f2937',
      padding: '8px',
      border: '1px solid #374151',
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 0, minHeight: 0 }}>
          {frontParty.map((char, idx) => renderCharacterCard(char, idx))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, width: backRowWidth, minHeight: 0, margin: '0 auto' }}>
          {backParty.map((char, idx) => renderCharacterCard(char, idx))}
        </div>
      </div>
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