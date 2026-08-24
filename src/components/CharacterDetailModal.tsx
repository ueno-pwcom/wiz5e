// src/components/CharacterDetailModal.tsx
import React, { useState } from 'react';
import './CharacterDetailModal.css';
import { useGameStore } from '../store/useGameStore';
import { InventoryView } from './InventoryView';
import { itemList } from '../data/items';
import { getAbilityModifier } from '../utils/dice';
import type { Character } from '../types/game';

interface CharacterDetailModalProps {
  character?: Character;
  onClose?: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({ character: propCharacter, onClose }) => {
  const party = useGameStore((state) => state.party);
  const selectedCharacterId = useGameStore((state) => state.selectedCharacterId);
  const setSelectedCharacterId = useGameStore((state) => state.setSelectedCharacterId);
  const [showInventory, setShowInventory] = useState(false);

  const character = propCharacter ?? party.find((c) => c.id === selectedCharacterId);
  if (!character) return null;

  const closeModal = () => {
    if (onClose) {
      onClose();
    } else {
      setSelectedCharacterId(null);
    }
  };

  // 修正値の表記整形 (例: +2, -1, +0)
  const formatMod = (score: number) => {
    const mod = getAbilityModifier(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const abilities = [
    { label: 'STR (筋力)', val: character.stats.str },
    { label: 'DEX (敏捷)', val: character.stats.dex },
    { label: 'CON (耐久)', val: character.stats.con },
    { label: 'INT (知力)', val: character.stats.int },
    { label: 'WIS (判断)', val: character.stats.wis },
    { label: 'CHA (魅力)', val: character.stats.cha }
  ];

  const equippedWeapon = character.equipped_weapon_id ? itemList[character.equipped_weapon_id] : null;
  const equippedArmor = character.equipped_armor_id ? itemList[character.equipped_armor_id] : null;
  const equippedShield = character.equipped_shield_id ? itemList[character.equipped_shield_id] : null;

  return (
    <div style={overlayStyle} onClick={closeModal}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '8px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>{character.name}</h2>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              Level {character.level} / クラスID: {character.class_id}
            </span>
          </div>
          <button onClick={closeModal} style={closeBtnStyle}>✕</button>
        </div>

        {showInventory ? (
          <div>
            <button
              onClick={() => setShowInventory(false)}
              style={{ marginBottom: '12px', padding: '4px 8px', cursor: 'pointer' }}
            >
              ← ステータス詳細へ戻る
            </button>
            <InventoryView targetCharacterId={character.id} />
          </div>
        ) : (
          <>
            {/* 基本ステータス要約 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={statBoxStyle}>
                <span style={statLabelStyle}>HP</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>
                  {character.hp.current} / {character.hp.max}
                </span>
              </div>
              <div style={statBoxStyle}>
                <span style={statLabelStyle}>AC (アーマークラス)</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#60a5fa' }}>{character.ac}</span>
              </div>
              <div style={statBoxStyle}>
                <span style={statLabelStyle}>ヒットダイス残</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>{character.hit_dice_remaining}</span>
              </div>
            </div>

            {/* 能力値グリッド */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '6px' }}>能力値 (Ability Scores)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {abilities.map((a) => (
                  <div key={a.label} style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{a.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{a.val}</div>
                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>({formatMod(a.val)})</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold', marginBottom: '8px' }}>
                🛡️ 現在の装備
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>主武器:</span>
                  <span style={{ fontWeight: 'bold', color: equippedWeapon ? '#fff' : '#6b7280' }}>
                    {equippedWeapon ? `${equippedWeapon.name} (${equippedWeapon.damage_dice})` : 'なし (素手)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>防具:</span>
                  <span style={{ fontWeight: 'bold', color: equippedArmor ? '#fff' : '#6b7280' }}>
                    {equippedArmor ? `${equippedArmor.name} (AC ${equippedArmor.ac_bonus})` : 'なし (服)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>盾:</span>
                  <span style={{ fontWeight: 'bold', color: equippedShield ? '#fff' : '#6b7280' }}>
                    {equippedShield ? `${equippedShield.name} (+${equippedShield.ac_bonus})` : 'なし'}
                  </span>
                </div>
              </div>
            </div>

            {/* 呪文スロット（所持キャラのみ） */}
            {character.spell_slots && Object.keys(character.spell_slots).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '6px' }}>呪文スロット (Spell Slots)</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(character.spell_slots).map(([lvl, slot]) => (
                    <div key={lvl} style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '6px 12px', borderRadius: '4px', fontSize: '12px' }}>
                      <span style={{ color: '#9ca3af' }}>Lv.{lvl}: </span>
                      <span style={{ color: '#818cf8', fontWeight: 'bold' }}>{slot.current} / {slot.max}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 状態・装備 */}
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
              <div>隊列: <span style={{ color: '#fff' }}>{character.position === 'front' ? '前衛' : '後衛'}</span></div>
              <div>装備中の武器ID: <span style={{ color: '#fff' }}>{character.equipped_weapon_id || 'なし'}</span></div>
              <div>装備中の防具ID: <span style={{ color: '#fff' }}>{character.equipped_armor_id || 'なし'}</span></div>
              <div>装備中の盾ID: <span style={{ color: '#fff' }}>{character.equipped_shield_id || 'なし'}</span></div>
              <div>状態異常: <span style={{ color: character.status_effects.length ? '#ef4444' : '#10b981' }}>
                {character.status_effects.length ? character.status_effects.join(', ') : '正常'}
              </span></div>
            </div>

            <button
              onClick={() => setShowInventory(true)}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px',
                marginTop: '12px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🎒 所持品・装備を変更する
            </button>
          </>
        )}
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
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  border: '1px solid #4b5563',
  borderRadius: '8px',
  padding: '16px',
  width: '360px',
  maxWidth: '90vw',
  color: '#fff',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
};

const statBoxStyle: React.CSSProperties = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '4px',
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#9ca3af',
  marginBottom: '2px'
};

const closeBtnStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#9ca3af',
  fontSize: '16px',
  cursor: 'pointer'
};