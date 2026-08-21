import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { spellList } from '../data/spells';
import type { Character, SpellData } from '../types/game';

export const BattleView: React.FC = () => {
  const combatants = useGameStore((state) => state.combatants);
  const currentTurnIndex = useGameStore((state) => state.currentTurnIndex);
  const executePlayerAttack = useGameStore((state) => state.executePlayerAttack);
  const executePlayerDefend = useGameStore((state) => state.executePlayerDefend);
  const executePlayerSpell = useGameStore((state) => state.executePlayerSpell);
  // const addLog = useGameStore((state) => state.addLog);
 
  const [selectedAction, setSelectedAction] = useState<'none' | 'attack' | 'spell'>('none');
  const [selectedSpell, setSelectedSpell] = useState<SpellData | null>(null);

  const currentCombatant = combatants[currentTurnIndex];
  const attemptRun = useGameStore((state) => state.attemptRun);
  const isPlayerTurn = currentCombatant?.is_player ?? false;
  const playerChar = isPlayerTurn ? (currentCombatant.ref as Character) : null;

  const enemies = combatants.filter((c) => !c.is_player && c.hp.current > 0);
  const allies = combatants.filter((c) => c.is_player && c.hp.current > 0);

  // 攻撃または呪文の対象を選択した時の処理
  const handleSelectTarget = (targetId: string) => {
    if (selectedAction === 'attack') {
      executePlayerAttack(targetId);
      setSelectedAction('none');
    } else if (selectedAction === 'spell' && selectedSpell) {
      executePlayerSpell(selectedSpell.id, targetId);
      setSelectedAction('none');
      setSelectedSpell(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
      {/* イニシアチブバー */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #374151',
        borderRadius: '6px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto'
      }}>
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>行動順:</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {combatants.map((c, idx) => (
            <div
              key={c.id}
              style={{
                backgroundColor: idx === currentTurnIndex ? (c.is_player ? '#15803d' : '#b91c1c') : '#1f2937',
                border: idx === currentTurnIndex ? '2px solid #f59e0b' : '1px solid #374151',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                color: '#fff',
                opacity: c.hp.current <= 0 ? 0.4 : 1
              }}
            >
              {c.is_player ? '🛡️' : '👾'} {c.name} ({c.initiative})
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '8px', flex: 1, minHeight: '260px' }}>
        {/* 戦闘フィールド (敵・味方) */}
        <div style={{
          backgroundColor: '#111827',
          border: '1px solid #374151',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          {/* 敵一覧 */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {enemies.map((enemy) => {
              const isTargetable = isPlayerTurn && (
                selectedAction === 'attack' || (selectedAction === 'spell' && selectedSpell?.damage_dice != null)
              );
              return (
                <div
                  key={enemy.id}
                  onClick={() => isTargetable && handleSelectTarget(enemy.id)}
                  style={{
                    backgroundColor: '#1f2937',
                    border: isTargetable ? '2px solid #ef4444' : '1px solid #4b5563',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center',
                    width: '110px',
                    cursor: isTargetable ? 'pointer' : 'default'
                  }}
                >
                  <div style={{ fontSize: '28px' }}>👾</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{enemy.name}</div>
                  <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>HP: {enemy.hp.current} / {enemy.hp.max}</div>
                </div>
              );
            })}
          </div>

          {/* 味方（回復呪文のターゲット選択用） */}
          {selectedAction === 'spell' && selectedSpell?.heal_dice && (
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6', borderRadius: '6px', padding: '8px' }}>
              <div style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '6px', fontWeight: 'bold' }}>
                回復対象の味方を選択してください:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {allies.map((ally) => (
                  <button
                    key={ally.id}
                    onClick={() => handleSelectTarget(ally.id)}
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {ally.name} (HP: {ally.hp.current}/{ally.hp.max})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#1f2937', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: '#e5e7eb' }}>
            現在のターン: <strong>{currentCombatant?.name}</strong>
          </div>
        </div>

        {/* コマンドパネル */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', color: '#fff' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
            戦闘コマンド
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              disabled={!isPlayerTurn}
              style={{
                ...cmdBtnStyle,
                backgroundColor: selectedAction === 'attack' ? '#dc2626' : '#374151',
                opacity: isPlayerTurn ? 1 : 0.5
              }}
              onClick={() => {
                setSelectedAction(selectedAction === 'attack' ? 'none' : 'attack');
                setSelectedSpell(null);
              }}
            >
              ⚔️ 攻撃
            </button>

            <button
              disabled={!isPlayerTurn}
              style={{ ...cmdBtnStyle, backgroundColor: selectedAction === 'spell' ? '#2563eb' : '#374151', opacity: isPlayerTurn ? 1 : 0.5 }}
              onClick={() => setSelectedAction(selectedAction === 'spell' ? 'none' : 'spell')}
            >
              🪄 呪文
            </button>

            {/* 呪文サブメニュー */}
            {selectedAction === 'spell' && isPlayerTurn && (
              <div style={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>使用する呪文を選択:</div>
                {Object.values(spellList).map((spell) => {
                  const slots = playerChar?.spell_slots?.[spell.level]?.current ?? 0;
                  const isSelected = selectedSpell?.id === spell.id;
                  return (
                    <button
                      key={spell.id}
                      disabled={slots <= 0}
                      onClick={() => setSelectedSpell(spell)}
                      style={{
                        backgroundColor: isSelected ? '#1d4ed8' : '#374151',
                        color: slots > 0 ? '#fff' : '#6b7280',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px',
                        fontSize: '11px',
                        textAlign: 'left',
                        cursor: slots > 0 ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {spell.name} (Lv.{spell.level}) [残:{slots}]
                    </button>
                  );
                })}
              </div>
            )}

            <button
              disabled={!isPlayerTurn}
              style={cmdBtnStyle}
              onClick={() => {
                setSelectedAction('none');
                setSelectedSpell(null);
                executePlayerDefend();
              }}
            >
              🛡️ 防御
            </button>

            {/* ★ 逃げるボタンの追加 */}
            <button
              disabled={!isPlayerTurn}
              onClick={attemptRun}
              style={{
                ...cmdBtnStyle,
                backgroundColor: isPlayerTurn ? '#4b5563' : '#1f2937',
                color: '#e5e7eb'
              }}
            >
              🏃 逃げる
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

const cmdBtnStyle: React.CSSProperties = {
  backgroundColor: '#374151',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '10px',
  cursor: 'pointer',
  fontSize: '13px',
  textAlign: 'left',
  transition: 'background-color 0.15s'
};