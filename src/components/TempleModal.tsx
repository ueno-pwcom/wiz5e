// src/components/TempleModal.tsx
import React from 'react';
import { useGameStore } from '../store/useGameStore';

interface Props {
  onClose: () => void;
}

export const TempleModal: React.FC<Props> = ({ onClose }) => {
  const party = useGameStore((state) => state.party);
  const gold = useGameStore((state) => state.gold);
  const reviveCharacter = useGameStore((state) => state.reviveCharacter);
  const healCharacter = useGameStore((state) => state.healCharacter);

  const reviveCost = 50; // 蘇生費用
  const healCost = 15;   // 単体治療費用

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#60a5fa' }}>⛪ 慈愛の神殿</h2>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24' }}>💰 {gold} G</div>
        </div>

        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '16px' }}>
          「神の加護が共にあらんことを。傷ついた者、倒れた者がおれば声をかけなさい」
        </p>

        {/* メンバー一覧と施術ボタン */}
        <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', overflowY: 'auto' }}>
          {party.map((m) => {
            const isDead = !m.is_alive || m.hp.current <= 0;
            const isFullHp = m.hp.current >= m.hp.max;

            return (
              <div key={m.id} style={memberCardStyle}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: isDead ? '#ef4444' : '#fff' }}>
                    {m.name} {isDead && '(死亡)'}
                  </div>
                  <div style={{ fontSize: '11px', color: isDead ? '#ef4444' : '#10b981' }}>
                    HP: {m.hp.current} / {m.hp.max}
                  </div>
                </div>

                <div>
                  {isDead ? (
                    <button
                      disabled={gold < reviveCost}
                      onClick={() => reviveCharacter(m.id, reviveCost)}
                      style={{
                        ...actionBtnStyle,
                        backgroundColor: gold >= reviveCost ? '#ef4444' : '#4b5563',
                        cursor: gold >= reviveCost ? 'pointer' : 'not-allowed'
                      }}
                    >
                      蘇生 ({reviveCost} G)
                    </button>
                  ) : (
                    <button
                      disabled={isFullHp || gold < healCost}
                      onClick={() => healCharacter(m.id, healCost)}
                      style={{
                        ...actionBtnStyle,
                        backgroundColor: !isFullHp && gold >= healCost ? '#3b82f6' : '#4b5563',
                        cursor: !isFullHp && gold >= healCost ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isFullHp ? '健康' : `治療 (${healCost} G)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} style={closeButtonStyle}>神殿を出る</button>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
};
const modalStyle: React.CSSProperties = {
  backgroundColor: '#1f2937', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '880px', height: 'min(90vh, 760px)', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden'
};
const memberCardStyle: React.CSSProperties = {
  backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};
const actionBtnStyle: React.CSSProperties = {
  border: 'none', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '11px', fontWeight: 'bold'
};
const closeButtonStyle: React.CSSProperties = {
  width: '100%', backgroundColor: '#374151', border: 'none', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
};