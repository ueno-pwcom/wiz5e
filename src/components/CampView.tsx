// src/components/CampView.tsx
import React from 'react';
import './CampView.css';
import { useGameStore } from '../store/useGameStore';

export const CampView: React.FC = () => {
  const party = useGameStore((state) => state.party);
  const shortRest = useGameStore((state) => state.shortRest);
  const longRest = useGameStore((state) => state.longRest);
  const setScene = useGameStore((state) => state.setScene);

  return (
    <div className="camp-view">
      <div>
        <h2 className="camp-view-heading">
          ⛺ 野営地（キャンプ）
        </h2>

        {/* パーティステータス一覧 */}
        <div className="camp-view-party-grid">
          {party.map((m) => (
            <div key={m.id} className="camp-view-party-card">
              <div className="camp-view-party-card-name" style={{ color: m.is_alive ? '#fff' : '#ef4444' }}>{m.name}</div>
              <div className="camp-view-party-card-status">
                HP: {m.hp.current} / {m.hp.max}
              </div>
              <div className="camp-view-party-card-status">
                HD残: {m.hit_dice_remaining}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 休憩コマンド */}
      <div className="camp-view-action-bar">
        <button onClick={shortRest} className="camp-view-button">
          🍖 小休憩（ヒットダイス消費回復）
        </button>
        <button onClick={longRest} className="camp-view-button inn">
          💤 大休憩（HP・スロット全回復）
        </button>
        <button onClick={() => setScene('dungeon')} className="camp-view-button back">
          🚶 ダンジョンへ戻る
        </button>
      </div>
    </div>
  );
};