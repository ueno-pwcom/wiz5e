import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export const BattleView: React.FC = () => {
  const combatants = useGameStore((state) => state.combatants);
  const currentTurnIndex = useGameStore((state) => state.currentTurnIndex);
  const executePlayerAttack = useGameStore((state) => state.executePlayerAttack);
  const executePlayerDefend = useGameStore((state) => state.executePlayerDefend);
  const addLog = useGameStore((state) => state.addLog);

  // 選択中のアクション状態（'none' | 'attack'）
  const [selectedAction, setSelectedAction] = useState<'none' | 'attack'>('none');

  const currentCombatant = combatants[currentTurnIndex];
  const isPlayerTurn = currentCombatant?.is_player ?? false;
  const players = combatants.filter((c) => c.is_player && c.hp.current > 0);
  const enemies = combatants.filter((c) => !c.is_player && c.hp.current > 0);

  // 攻撃実行時の処理
  const handleAttackTarget = (targetId: string) => {
    executePlayerAttack(targetId);
    setSelectedAction('none'); // 攻撃後はアクション選択をリセット
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '8px', height: '320px' }}>
      {/* エネミー・行動順表示エリア */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #374151',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* モンスター表示 */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          {enemies.map((enemy) => {
            const isTargetable = isPlayerTurn && selectedAction === 'attack';
            const isCurrentEnemy = currentCombatant?.id === enemy.id;
            return (
              <div
                key={enemy.id}
                onClick={() => isTargetable && handleAttackTarget(enemy.id)}
                style={{
                  backgroundColor: '#1f2937',
                  border: isCurrentEnemy ? '2px solid #38bdf8' : isTargetable ? '2px solid #ef4444' : '1px solid #4b5563',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                  width: '110px',
                  cursor: isTargetable ? 'pointer' : 'default',
                  boxShadow: isCurrentEnemy ? '0 0 0 4px rgba(56, 189, 248, 0.25)' : isTargetable ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '28px' }}>👾</div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
                  {enemy.name}
                </div>
                <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                  HP: {enemy.hp.current} / {enemy.hp.max}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                  AC: {enemy.ac}
                </div>

                {/* 攻撃対象選択状態時のボタン */}
                {isTargetable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAttackTarget(enemy.id);
                    }}
                    style={{
                      marginTop: '8px',
                      backgroundColor: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    攻撃する
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ターン表示インジケーター */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>現在のターン: <strong>{currentCombatant?.name}</strong></span>
          <span style={{ color: isPlayerTurn ? '#4ade80' : '#f87171' }}>
            {isPlayerTurn ? '【味方の行動】' : '【敵の思考中...】'}
          </span>
        </div>
      </div>

      {/* コマンドパネル */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', color: '#fff' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
          戦闘コマンド
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 1. 攻撃ボタン */}
          <button
            disabled={!isPlayerTurn}
            style={{
              ...cmdBtnStyle,
              backgroundColor: selectedAction === 'attack' ? '#dc2626' : '#374151',
              opacity: isPlayerTurn ? 1 : 0.5
            }}
            onClick={() => setSelectedAction(selectedAction === 'attack' ? 'none' : 'attack')}
          >
            ⚔️ 攻撃
          </button>

          {/* 2. 防御ボタン */}
          <button
            disabled={!isPlayerTurn}
            style={{ ...cmdBtnStyle, backgroundColor: '#047857', opacity: isPlayerTurn ? 1 : 0.5 }}
            onClick={() => {
              setSelectedAction('none');
              executePlayerDefend();
            }}
          >
            🛡️ 防御
          </button>

          {/* ナビゲーションガイド */}
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', lineHeight: '1.4' }}>
            {!isPlayerTurn && '敵のターンです。'}
            {isPlayerTurn && selectedAction === 'none' && 'コマンドを選択してください。'}
            {isPlayerTurn && selectedAction === 'attack' && '対象のモンスターまたは「攻撃する」ボタンをクリックしてください。'}
          </div>
        </div>
      </div>
    </div >
  );
};

const cmdBtnStyle: React.CSSProperties = {
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '10px',
  cursor: 'pointer',
  fontSize: '13px',
  textAlign: 'left',
  transition: 'background-color 0.15s'
};