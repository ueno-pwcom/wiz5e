// src/components/TownView.tsx
import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ShopModal } from './ShopModal';
import { TempleModal } from './TempleModal';
import { CharacterDetailModal } from './CharacterDetailModal';
import { GuildModal } from './GuildModal';
import './TownView.css';
import type { Character } from '../types/game';

export const TownView: React.FC = () => {
  const party = useGameStore((state) => state.party);
  const gold = useGameStore((state) => state.gold);
  const restAtInn = useGameStore((state) => state.restAtInn);

  const [showShop, setShowShop] = useState(false);
  const [showTemple, setShowTemple] = useState(false);
  const [showGuild, setShowGuild] = useState(false);
  const [showInnConfirm, setShowInnConfirm] = useState(false);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const enterDungeon = useGameStore((state) => state.enterDungeon);
  const innCost = 10; // 宿泊代金

  const classNames: Record<string, string> = {
    Fighter: 'ファイター',
    Wizard: 'ウィザード',
    Cleric: 'クレリック',
    Rogue: 'ローグ'
  };

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

      {/* パーティー簡易ステータス表示 */}
      <div style={{ ...partyStatusStyle, marginTop: '24px' }}>
        <div style={partyStatusTitleStyle}>🛡️ パーティーの状態</div>
        <div style={partyStatusTableStyle}>
          <div style={{ ...partyStatusRowStyle, ...partyStatusHeaderRowStyle }}>
            <div style={partyStatusCellName}>名前</div>
            <div style={partyStatusCellLevel}>レベル</div>
            <div style={partyStatusCellClass}>クラス</div>
            <div style={partyStatusCell}>HP</div>
            <div style={partyStatusCell}>AC</div>
            <div style={partyStatusCellStatus}>状態</div>
          </div>
          {party.map((m) => {
            const hpHalfDown = m.hp.current > 0 && m.hp.current <= Math.floor(m.hp.max / 2);
            const isDown = m.hp.current <= 0;
            return (
              <div
                key={m.id}
                className="town-view-party-row"
                onClick={() => setSelectedChar(m)}
                style={{
                  ...partyStatusRowStyle,
                  borderColor: isDown ? '#ef4444' : hpHalfDown ? '#f59e0b' : 'transparent',
                  boxShadow: isDown ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : hpHalfDown ? '0 0 0 3px rgba(245, 158, 11, 0.12)' : undefined
                }}
              >
                <div style={partyStatusCellName}>{m.name}</div>
                <div style={partyStatusCellLevel}>Lv.{m.level}</div>
                <div style={partyStatusCellClass}>{classNames[m.class_id] ?? m.class_id}</div>
                <div style={partyStatusCell}>{m.hp.current}/{m.hp.max}</div>
                <div style={partyStatusCell}>{m.ac}</div>
                <div style={partyStatusCellStatus}>{isDown ? '[死亡]' : '[正常]'}</div>
              </div>
            );
          })}
        </div>
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
  width: '100%', minHeight: '100vh', backgroundColor: '#111827', color: '#fff',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '16px', boxSizing: 'border-box'
};
const headerStyle: React.CSSProperties = {
  textAlign: 'center', marginBottom: '20px'
};
const partyStatusStyle: React.CSSProperties = {
  backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '16px', width: '100%', maxWidth: '680px', marginBottom: '20px'
};
const partyStatusTitleStyle: React.CSSProperties = {
  fontSize: '11px', color: '#9ca3af', marginBottom: '12px', fontWeight: 'bold'
};
const partyStatusTableStyle: React.CSSProperties = {
  display: 'grid', gap: '10px'
};
const partyStatusRowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(140px, 1.5fr) minmax(60px, 0.8fr) minmax(100px, 1fr) 1fr 1fr 1fr', gap: '8px', alignItems: 'center', padding: '12px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid transparent', cursor: 'pointer'
};
const partyStatusHeaderRowStyle: React.CSSProperties = {
  fontWeight: 'bold', color: '#cbd5e1', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(148, 163, 184, 0.12)', cursor: 'default'
};
const partyStatusCellName: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px'
};
const partyStatusCellClass: React.CSSProperties = {
  display: 'flex', alignItems: 'center'
};
const partyStatusCellLevel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', fontSize: '11px', lineHeight: 1.3
};
const partyStatusCell: React.CSSProperties = {
  fontSize: '11px', lineHeight: 1.3
};
const partyStatusCellStatus: React.CSSProperties = {
  fontSize: '11px', color: '#a78bfa'
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