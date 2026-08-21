import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const BattleResultModal: React.FC = () => {
  const showResultModal = useGameStore((state) => state.showResultModal);
  const battleReward = useGameStore((state) => state.battleReward);
  const claimBattleReward = useGameStore((state) => state.claimBattleReward);
  const party = useGameStore((state) => state.party);

  if (!showResultModal || !battleReward) return null;

  const aliveCount = party.filter((m) => m.is_alive).length;
  const xpPerMember = Math.floor(battleReward.xp / (aliveCount || 1));

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '36px', marginBottom: '4px' }}>⚔️✨</div>
          <h2 style={{ fontSize: '20px', color: '#f59e0b', margin: 0, fontWeight: 'bold' }}>
            VICTORY!（戦闘勝利）
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>
            敵の群れを退けた！
          </p>
        </div>

        {/* 獲得報酬カード */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '8px', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
            戦利品・獲得報酬
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div style={rewardBoxStyle}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>総獲得XP</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>
                +{battleReward.xp} XP
              </span>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>（1人あたり +{xpPerMember}）</span>
            </div>

            <div style={rewardBoxStyle}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>獲得ゴールド</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#facc15' }}>
                +{battleReward.gold} GP
              </span>
            </div>
          </div>

          {/* ドロップアイテム */}
          {battleReward.items.length > 0 && (
            <div style={{ fontSize: '12px', color: '#d1d5db', marginTop: '6px' }}>
              <span style={{ color: '#9ca3af' }}>入手アイテム: </span>
              {battleReward.items.join(', ')}
            </div>
          )}
        </div>

        {/* 完了ボタン */}
        <button onClick={claimBattleReward} style={buttonStyle}>
          報酬を受け取って探索を続ける
        </button>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1100
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  width: '340px',
  color: '#fff',
  boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
};

const rewardBoxStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '4px',
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#059669',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '10px',
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};