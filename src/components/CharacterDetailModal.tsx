// src/components/CharacterDetailModal.tsx
import React, { useEffect, useState } from 'react';
import './CharacterDetailModal.css';
import { useGameStore } from '../store/useGameStore';
import { InventoryView } from './InventoryView';
import { itemList } from '../data/items';
import { XP_TABLE } from '../data/levelTable';
import { getAbilityModifier } from '../utils/dice';
import { translateStatusEffects } from '../utils/statusEffects.ts';
import { spellsData } from '../utils/srdData';
import type { Character, SpellData } from '../types/game';

interface CharacterDetailModalProps {
  character?: Character;
  onClose?: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({ character: propCharacter, onClose }) => {
  const party = useGameStore((state) => state.party);
  const selectedCharacterId = useGameStore((state) => state.selectedCharacterId);
  const setSelectedCharacterId = useGameStore((state) => state.setSelectedCharacterId);
  const [showInventory, setShowInventory] = useState(false);

  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(propCharacter?.id ?? selectedCharacterId);

  useEffect(() => {
    setActiveCharacterId(propCharacter?.id ?? selectedCharacterId);
  }, [propCharacter, selectedCharacterId]);

  const character = party.find((c) => c.id === activeCharacterId) ?? propCharacter;
  if (!character) return null;

  const activeIndex = party.findIndex((c) => c.id === activeCharacterId);
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex !== -1 && activeIndex < party.length - 1;

  const goToCharacter = (index: number) => {
    if (index < 0 || index >= party.length) return;
    const nextCharacter = party[index];
    setActiveCharacterId(nextCharacter.id);
    setSelectedCharacterId(nextCharacter.id);
  };

  const getPartyPositionRole = (charId: string) => {
    const index = party.findIndex((p) => p.id === charId);
    if (index === -1) return '控え';
    return index < 3 ? '前衛' : '後衛';
  };

  const classNameMap: Record<string, string> = {
    fighter: 'ファイター',
    wizard: 'ウィザード',
    cleric: 'クレリック',
    rogue: 'ローグ'
  };
  const characterRoleLabel = getPartyPositionRole(character.id);

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

  const currentXp = character.xp || 0;
  const nextLevelXp = XP_TABLE[character.level + 1] ?? currentXp;
  const xpToNextLevel = Math.max(0, nextLevelXp - currentXp);

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

  const availableSpells = Object.values(spellsData)
    .filter((spell) => spell.classes.includes(character.class_id))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const spellsByLevel = availableSpells.reduce<Record<number, SpellData[]>>((acc, spell) => {
    if (!acc[spell.level]) acc[spell.level] = [];
    acc[spell.level].push(spell);
    return acc;
  }, {});

  return (
    <div className="character-detail-overlay" onClick={closeModal}>
      <div className="character-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="character-detail-header">
          <div>
            <h2 className="character-detail-title">{character.name}</h2>
            <span className="character-detail-subtitle">
              Level {character.level} / {classNameMap[character.class_id] ?? character.class_id}
            </span>
          </div>
          <button onClick={closeModal} className="character-detail-close-button">✕</button>
        </div>

        <button
          type="button"
          onClick={() => goToCharacter(activeIndex - 1)}
          disabled={!hasPrev}
          className="character-detail-nav-button character-detail-nav-button--prev"
        />
        <button
          type="button"
          onClick={() => goToCharacter(activeIndex + 1)}
          disabled={!hasNext}
          className="character-detail-nav-button character-detail-nav-button--next"
        />

        {showInventory ? (
          <div>
            <button
              className="character-detail-back-button"
              onClick={() => setShowInventory(false)}
            >
              ← ステータス詳細へ戻る
            </button>
            <InventoryView
              selectedTargetId={activeCharacterId ?? character.id}
              onChangeTargetId={(id) => setActiveCharacterId(id)}
            />
          </div>
        ) : (
          <>
            <div className="character-detail-body">
              <div className="character-detail-left-panel">
                <div className="character-detail-section">
                  <div className="character-detail-section-title">能力値 (Ability Scores)</div>
                  <div className="character-detail-ability-grid">
                    {abilities.map((a) => (
                      <div key={a.label} className="character-detail-ability-box">
                        <div className="character-detail-stat-label">{a.label}</div>
                        <div className="character-detail-ability-value">{a.val}</div>
                        <div className="character-detail-ability-mod">({formatMod(a.val)})</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="character-detail-center-panel">
                <div className="character-detail-stat-grid">
                  <div className="character-detail-stat-box">
                    <span className="character-detail-stat-label">HP</span>
                    <span className="character-detail-stat-value character-detail-stat-value--hp">
                      {character.hp.current} / {character.hp.max}
                    </span>
                  </div>
                  <div className="character-detail-stat-box">
                    <span className="character-detail-stat-label">経験値</span>
                    <span className="character-detail-stat-value character-detail-stat-value--xp">
                      {currentXp} / {nextLevelXp}
                    </span>
                  </div>
                  <div className="character-detail-stat-box">
                    <span className="character-detail-stat-label">次のレベルまで</span>
                    <span className="character-detail-stat-value character-detail-stat-value--xp-to-next">
                      {xpToNextLevel} XP
                    </span>
                  </div>
                  <div className="character-detail-stat-box">
                    <span className="character-detail-stat-label">AC (アーマークラス)</span>
                    <span className="character-detail-stat-value character-detail-stat-value--ac">{character.ac}</span>
                  </div>
                  <div className="character-detail-stat-box">
                    <span className="character-detail-stat-label">ヒットダイス残</span>
                    <span className="character-detail-stat-value character-detail-stat-value--hd">{character.hit_dice_remaining}</span>
                  </div>
                </div>

                <div className="character-detail-equipment-panel">
                  <div className="character-detail-section-title">🛡️ 現在の装備</div>
                  <div className="character-detail-equipment-column">
                    <div className="character-detail-equipment-row">
                      <span className="character-detail-equipment-label">主武器:</span>
                      <span className={`character-detail-equipment-value ${equippedWeapon ? '' : 'empty'}`}>
                        {equippedWeapon ? `${equippedWeapon.name} (${equippedWeapon.damage_dice})` : 'なし (素手)'}
                      </span>
                    </div>
                    <div className="character-detail-equipment-row">
                      <span className="character-detail-equipment-label">防具:</span>
                      <span className={`character-detail-equipment-value ${equippedArmor ? '' : 'empty'}`}>
                        {equippedArmor ? `${equippedArmor.name} (AC ${equippedArmor.ac_bonus})` : 'なし (服)'}
                      </span>
                    </div>
                    <div className="character-detail-equipment-row">
                      <span className="character-detail-equipment-label">盾:</span>
                      <span className={`character-detail-equipment-value ${equippedShield ? '' : 'empty'}`}>
                        {equippedShield ? `${equippedShield.name} (+${equippedShield.ac_bonus})` : 'なし'}
                      </span>
                    </div>
                  </div>
                </div>

                {character.spell_slots && Object.keys(character.spell_slots).length > 0 && (
                  <div className="character-detail-section">
                    <div className="character-detail-section-title">呪文スロット (Spell Slots)</div>
                    <div className="character-detail-slot-row">
                      {Object.entries(character.spell_slots).map(([lvl, slot]) => (
                        <div key={lvl} className="character-detail-slot-box">
                          <span className="character-detail-stat-label">Lv.{lvl}: </span>
                          <span className="character-detail-ability-value">{slot.current} / {slot.max}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="character-detail-section-note">
                  <div>隊列: <span className="character-detail-highlight">{characterRoleLabel}</span></div>
                  <div>状態異常: <span className={character.status_effects.length ? 'character-detail-status-danger' : 'character-detail-status-normal'}>
                    {translateStatusEffects(character.status_effects)}
                  </span></div>
                </div>

                <button
                  onClick={() => setShowInventory(true)}
                  className="character-detail-action-button"
                >
                  🎒 所持品・装備を変更する
                </button>
              </div>

              <div className="character-detail-right-panel">
                <div className="character-detail-section">
                  <div className="character-detail-section-title">呪文一覧</div>
                  <div className="character-detail-spell-list">
                    {availableSpells.length > 0 ? (
                      Object.entries(spellsByLevel).map(([level, spells]) => (
                        <div key={level} className="character-detail-spell-level-group">
                          <div className="character-detail-spell-level-title">Lv.{level}</div>
                          <div className="character-detail-spell-items">
                            {spells.map((spell) => (
                              <div key={spell.id} className="character-detail-spell-item">
                                <span className="character-detail-spell-name">{spell.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="character-detail-empty-text">習得可能な呪文がありません。</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};