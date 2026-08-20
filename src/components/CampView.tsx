// src/components/CampView.tsx
import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const CampView: React.FC = () => {
  const party = useGameStore((state) => state.party);
  const shortRest = useGameStore((state) => state.shortRest);
  const longRest = useGameStore((state) => state.longRest);
  const setScene = useGameStore((state) => state.setScene);

  return (
    <div style={{
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '16px',
      color: '#fff',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #374151', paddingBottom: '8px' }}>
          ⛺ 野営地（キャンプ）
        </h2>

        {/* パーティステータス一覧 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
          {party.map((m) => (
            <div key={m.id} style={{ backgroundColor: '#1f2937', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', color: m.is_alive ? '#fff' : '#ef4444' }}>{m.name}</div>
              <div style={{ color: '#9ca3af', marginTop: '4px' }}>
                HP: {m.hp.current} / {m.hp.max}
              </div>
              <div style={{ color: '#9ca3af' }}>
                HD残: {m.hit_dice_remaining}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 休憩コマンド */}
      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #374151', paddingTop: '12px' }}>
        <button onClick={shortRest} style={btnStyle}>
          🍖 小休憩（ヒットダイス消費回復）
        </button>
        <button onClick={longRest} style={{ ...btnStyle, backgroundColor: '#1d4ed8' }}>
          💤 大休憩（HP・スロット全回復）
        </button>
        <button onClick={() => setScene('dungeon')} style={{ ...btnStyle, backgroundColor: '#374151', marginLeft: 'auto' }}>
          🚶 ダンジョンへ戻る
        </button>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  backgroundColor: '#059669',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '10px 14px',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer'
};