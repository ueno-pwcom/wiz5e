// src/components/DungeonEventModal.tsx
import React from 'react';
import './DungeonEventModal.css';
import { useGameStore } from '../store/useGameStore';
import { getAbilityModifier } from '../utils/dice';

export const DungeonEventModal: React.FC = () => {
  const activeEvent = useGameStore((state) => state.activeEvent);
  const eventResult = useGameStore((state) => state.eventResult);
  const party = useGameStore((state) => state.party);
  const selectedActorId = useGameStore((state) => state.selectedActorId);
  const setSelectedActor = useGameStore((state) => state.setSelectedActor);
  const resolveEventOption = useGameStore((state) => state.resolveEventOption);
  const closeEventModal = useGameStore((state) => state.closeEventModal);

  if (!activeEvent) return null;

  const currentActor = party.find((m) => m.id === selectedActorId) || party[0];

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '36px', marginBottom: '4px' }}>{activeEvent.icon}</div>
          <h2 style={{ fontSize: '18px', color: '#f59e0b', margin: 0, fontWeight: 'bold' }}>
            {activeEvent.title}
          </h2>
        </div>

        {/* イベント説明 */}
        <p style={{ fontSize: '12px', color: '#d1d5db', lineHeight: '1.5', marginBottom: '16px', backgroundColor: '#111827', padding: '10px', borderRadius: '6px' }}>
          {activeEvent.description}
        </p>

        {/* 結果表示（判定後） */}
        {eventResult ? (
          <div style={{ marginBottom: '16px' }}>
            {eventResult.dc && (
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: eventResult.passed ? '#10b981' : '#ef4444' }}>
                  {eventResult.passed ? '判定成功！' : '判定失敗...'}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>
                  (出目 {eventResult.roll} + 修正値 {eventResult.modifier} = {eventResult.total} / 目標値 DC {eventResult.dc})
                </span>
              </div>
            )}
            <div style={{ backgroundColor: '#111827', border: `1px solid ${eventResult.passed ? '#059669' : '#dc2626'}`, padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#fff' }}>
              {eventResult.message}
            </div>
            <button onClick={closeEventModal} style={{ ...buttonStyle, marginTop: '16px', backgroundColor: '#374151' }}>
              探索を再開する
            </button>
          </div>
        ) : (
          /* 選択肢とキャラクター選択（判定前） */
          <div>
            {/* 担当キャラクター選択 */}
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', padding: '8px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>実行者:</span>
              <select
                value={selectedActorId}
                onChange={(e) => setSelectedActor(e.target.value)}
                style={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
              >
                {party.filter(m => m.is_alive).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (HP: {m.hp.current}/{m.hp.max})
                  </option>
                ))}
              </select>
            </div>

            {/* 選択肢ボタン一覧 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeEvent.options.map((option) => {
                let modText = '';
                if (option.check && currentActor) {
                  const mod = getAbilityModifier(currentActor.stats[option.check.ability]);
                  modText = ` [${mod >= 0 ? '+' : ''}${mod}]`;
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => resolveEventOption(option)}
                    style={optionButtonStyle}
                  >
                    <div style={{ fontWeight: 'bold' }}>{option.label}</div>
                    {option.check && (
                      <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>
                        {option.check.label} (補正: {modText})
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0,
  width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1200
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  border: '2px solid #374151',
  borderRadius: '8px',
  padding: '20px',
  width: '360px',
  color: '#fff',
  boxShadow: '0 0 25px rgba(0,0,0,0.5)'
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '10px',
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const optionButtonStyle: React.CSSProperties = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '6px',
  padding: '10px',
  color: '#fff',
  textAlign: 'left',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'border-color 0.2s'
};