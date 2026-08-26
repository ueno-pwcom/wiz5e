import React from 'react';
import type { Character } from '../types/game';
import { useGameStore } from '../store/useGameStore';
import './StatusPanel.css';

interface Props {
  party: Character[];
  gold: number;
  onSelectCharacter?: (character: Character) => void;
}

export const StatusPanel: React.FC<Props> = ({ party, gold, onSelectCharacter }) => {
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

  const renderCharacterRow = (char: Character) => {
    const isCurrentTurn = showFocus && char.id === currentTurnId;
    const hpHalfDown = char.hp.current > 0 && char.hp.current <= Math.floor(char.hp.max / 2);
    const isDown = char.hp.current <= 0;
    const rowClickable = scene === 'camp' || (Boolean(onSelectCharacter) && scene !== 'battle');
    const rowClass = [
      'status-panel-row',
      rowClickable ? 'status-panel-row-clickable' : '',
      isCurrentTurn ? 'status-panel-row-current' : '',
      isDown ? 'status-panel-row-down' : '',
      hpHalfDown ? 'status-panel-row-half' : ''
    ].filter(Boolean).join(' ');

    return (
      <div
        key={char.id}
        className={rowClass}
        onClick={() => {
          if (scene === 'camp') {
            setSelectedCharacterId(char.id);
          }
          if (onSelectCharacter && scene !== 'battle') {
            onSelectCharacter(char);
          }
        }}
      >
        <div className="status-panel-cell status-panel-cell-name">
          <div className="status-panel-card-name">{char.name}</div>
        </div>
        <div className="status-panel-cell status-panel-cell-level">Lv.{char.level}</div>
        <div className="status-panel-cell status-panel-cell-class">
          {classNames[char.class_id] ?? char.class_id}
        </div>
        <div className="status-panel-cell">{char.hp.current}/{char.hp.max}</div>
        <div className="status-panel-cell">{char.ac}</div>
        <div className="status-panel-cell status-panel-cell-status">{char.is_alive ? '[正常]' : '[死亡]'}</div>
      </div>
    );
  };

  return (
    <div className="status-panel">
      <div className="status-panel-left">
        <div className="status-panel-row status-panel-row-header">
          <div className="status-panel-cell status-panel-cell-name">名前</div>
          <div className="status-panel-cell status-panel-cell-level">レベル</div>
          <div className="status-panel-cell status-panel-cell-class">クラス</div>
          <div className="status-panel-cell">HP</div>
          <div className="status-panel-cell">AC</div>
          <div className="status-panel-cell status-panel-cell-status">状態</div>
        </div>
        <div className="status-panel-table">
          {party.map(renderCharacterRow)}
        </div>
      </div>
      <div className="status-panel-gold">
        <div className="status-panel-gold-label">所持金</div>
        <div className="status-panel-gold-value">{gold} gp</div>
      </div>
    </div>
  );
};