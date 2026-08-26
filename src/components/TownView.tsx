// src/components/TownView.tsx
import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ShopModal } from './ShopModal';
import { TempleModal } from './TempleModal';
import { GuildModal } from './GuildModal';
import './TownView.css';

export const TownView: React.FC = () => {
  const gold = useGameStore((state) => state.gold);
  const restAtInn = useGameStore((state) => state.restAtInn);

  const [showShop, setShowShop] = useState(false);
  const [showTemple, setShowTemple] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showInnConfirm, setShowInnConfirm] = useState(false);
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

      {/* 街の施設メニュー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', width: '100%', maxWidth: '680px' }}>
        {/* 宿屋 */}
        <button onClick={() => setShowInnConfirm(true)} style={{ ...menuButtonStyle, backgroundColor: '#1e3a8a' }}>
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

        {/* ギルド */}
        <button onClick={() => setShowGuild(true)} style={{ ...menuButtonStyle, backgroundColor: '#553c9a' }}>
          <div style={{ fontSize: '16px' }}>🏛️ 冒険者ギルド</div>
          <div style={{ fontSize: '11px', color: '#c4b5fd', marginTop: '2px' }}>
            パーティ編成や新規冒険者の登録
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
      {showGuild && <GuildModal onClose={() => setShowGuild(false)} />}
      {showInnConfirm && (
        <div style={innOverlayStyle}>
          <div style={innModalStyle}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#f59e0b' }}>🏨 宿屋『月光亭』</h2>
            <p style={{ color: '#e2e8f0', margin: '16px 0 24px', lineHeight: 1.5 }}>
              宿泊して全員のHPを全回復します。<br></br>所持金から {innCost} G が消費されます。
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowInnConfirm(false)} style={innCancelButtonStyle}>キャンセル</button>
              <button onClick={() => { restAtInn(innCost); setShowInnConfirm(false); }} style={innConfirmButtonStyle}>宿泊する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: '100%', backgroundColor: '#111827', color: '#fff',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '16px', boxSizing: 'border-box'
};
const headerStyle: React.CSSProperties = {
  textAlign: 'center', marginBottom: '20px'
};
const menuButtonStyle: React.CSSProperties = {
  border: '1px solid #374151', borderRadius: '8px', padding: '14px', color: '#fff', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.1s'
};
const innOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
};
const innModalStyle: React.CSSProperties = {
  backgroundColor: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', color: '#e2e8f0'
};
const innCancelButtonStyle: React.CSSProperties = {
  backgroundColor: '#374151', color: '#e2e8f0', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold'
};
const innConfirmButtonStyle: React.CSSProperties = {
  backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold'
};