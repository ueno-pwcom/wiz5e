// src/components/TownView.tsx
import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ShopModal } from './ShopModal';
import { TempleModal } from './TempleModal';
import { CharacterDetailModal } from './CharacterDetailModal';
import type { Character } from '../types/game';

export const TownView: React.FC = () => {
  const party = useGameStore((state) => state.party);
  const gold = useGameStore((state) => state.gold);
  const restAtInn = useGameStore((state) => state.restAtInn);

  const [showShop, setShowShop] = useState(false);
  const [showTemple, setShowTemple] = useState(false);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const enterDungeon = useGameStore((state) => state.enterDungeon);
  const innCost = 10; // 宿泊代金

  return (
    <div style={containerStyle}>
      {/* 街のヘッダー */}
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '20px', color: '#f59e0b' }}>🏰 始まりの街 アークヘイブン</h1>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24', marginTop: '4px' }}>
          所持金: 💰 {gold} G
        </div>
      </div>

      {/* パーティー簡易ステータス表示 */}
      <div style={partyStatusStyle}>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', fontWeight: 'bold' }}>
          🛡️ パーティーの状態
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {party.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedChar(m)}
              style={partyMemberCardStyle}
            >
              <div style={{ fontWeight: 'bold', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{m.name}</span>
                <span style={{ fontSize: '10px', color: '#60a5fa' }}>装備・詳細 ⚙️</span>
              </div>
              <div style={{ fontSize: '11px', color: m.hp.current < m.hp.max * 0.4 ? '#ef4444' : '#10b981' }}>
                HP: {m.hp.current} / {m.hp.max}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 街の施設メニュー */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '340px' }}>
        {/* 宿屋 */}
        <button onClick={() => restAtInn(innCost)} style={{ ...menuButtonStyle, backgroundColor: '#1e3a8a' }}>
          <div style={{ fontSize: '16px' }}>🏨 宿屋『月光亭』</div>
          <div style={{ fontSize: '11px', color: '#93c5fd', marginTop: '2px' }}>
            大休憩をとって全員のHPを全回復 ({innCost} G)
          </div>
        </button>

        {/* 武具・道具屋 */}
        <button onClick={() => setShowShop(true)} style={{ ...menuButtonStyle, backgroundColor: '#065f46' }}>
          <div style={{ fontSize: '16px' }}>🛒 武具・道具屋</div>
          <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>
            ポーションや装備の購入・不要アイテムの売却
          </div>
        </button>

        {/* 神殿 (Temple)  */}
        <button onClick={() => setShowTemple(true)} style={{ ...menuButtonStyle, backgroundColor: '#1e1b4b' }}>
          <div style={{ fontSize: '16px' }}>⛪ 慈愛の神殿</div>
          <div style={{ fontSize: '11px', color: '#c7d2fe', marginTop: '2px' }}>
            個別治療・倒れた仲間の蘇生
          </div>
        </button>

        {/* ダンジョンへ出発 */}
        <button onClick={enterDungeon} style={{ ...menuButtonStyle, backgroundColor: '#991b1b', marginTop: '8px' }}>
          <div style={{ fontSize: '16px' }}>⚔️ ダンジョンへ出発する</div>
          <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
            古の地下迷宮へ挑戦する
          </div>
        </button>
      </div>

      {/* モーダル表示 */}
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}
      {showTemple && <TempleModal onClose={() => setShowTemple(false)} />}
      {selectedChar && (
        <CharacterDetailModal
          character={selectedChar}
          onClose={() => setSelectedChar(null)}
        />
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: '100%', height: '100vh', backgroundColor: '#111827', color: '#fff',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box'
};
const headerStyle: React.CSSProperties = {
  textAlign: 'center', marginBottom: '20px'
};
const partyStatusStyle: React.CSSProperties = {
  backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px', width: '100%', maxWidth: '340px', marginBottom: '20px'
};
const partyMemberCardStyle: React.CSSProperties = {
  backgroundColor: '#111827', padding: '6px 10px', borderRadius: '4px', border: '1px solid #374151'
};
const menuButtonStyle: React.CSSProperties = {
  border: '1px solid #374151', borderRadius: '8px', padding: '14px', color: '#fff', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.1s'
};