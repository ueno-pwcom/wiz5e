import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { AbilityScores, Character, CharacterClassName } from '../types/game';
import './GuildModal.css';

interface GuildModalProps {
  onClose: () => void;
}

// ダイス表示・能力値生成ユーティリティ（4d6 drop lowest方式）
const roll4d6DropLowest = (): number => {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
};

const generateRandomStats = (): AbilityScores => ({
  str: roll4d6DropLowest(),
  dex: roll4d6DropLowest(),
  con: roll4d6DropLowest(),
  int: roll4d6DropLowest(),
  wis: roll4d6DropLowest(),
  cha: roll4d6DropLowest(),
});

// クラス別のベーステンプレート
const CLASS_TEMPLATES: Record<string, Omit<Character, 'id' | 'name' | 'stats'>> = {
  Fighter: {
    class_id: 'Fighter',
    level: 1,
    xp: 0,
    hp: { current: 12, max: 12 },
    hit_dice_remaining: 1,
    ac: 16,
    position: 'front',
    is_alive: true,
    status_effects: [],
    equipped_weapon_id: 'longsword',
    equipped_armor_id: 'chain_mail',
  },
  Wizard: {
    class_id: 'Wizard',
    level: 1,
    xp: 0,
    hp: { current: 8, max: 8 },
    hit_dice_remaining: 1,
    ac: 12,
    position: 'back',
    is_alive: true,
    status_effects: [],
    spell_slots: { 1: { current: 2, max: 2 } },
    equipped_weapon_id: 'dagger',
  },
  Cleric: {
    class_id: 'Cleric',
    level: 1,
    xp: 0,
    hp: { current: 10, max: 10 },
    hit_dice_remaining: 1,
    ac: 18,
    position: 'front',
    is_alive: true,
    status_effects: [],
    spell_slots: { 1: { current: 2, max: 2 } },
    equipped_weapon_id: 'mace',
    equipped_armor_id: 'scale_mail',
    equipped_shield_id: 'shield',
  },
  Rogue: {
    class_id: 'Rogue',
    level: 1,
    xp: 0,
    hp: { current: 9, max: 9 },
    hit_dice_remaining: 1,
    ac: 14,
    position: 'front',
    is_alive: true,
    status_effects: [],
    equipped_weapon_id: 'shortsword',
    equipped_armor_id: 'leather_armor',
  },
};

export const GuildModal: React.FC<GuildModalProps> = ({ onClose }) => {
  const { characterRoster, party, createCharacter, addToParty, removeFromParty } = useGameStore();

  const [activeTab, setActiveTab] = useState<'roster' | 'create'>('roster');
  const [newCharName, setNewCharName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClassName>('Fighter');
  
  // ランダム生成された能力値を保持する State
  const [rolledStats, setRolledStats] = useState<AbilityScores>(generateRandomStats);

  const classNames: Record<string, string> = {
    Fighter: 'ファイター',
    Wizard: 'ウィザード',
    Cleric: 'クレリック',
    Rogue: 'ローグ',
  };

  const sortedParty = [...party].sort((a, b) => {
    if (a.position === 'front' && b.position !== 'front') return -1;
    if (a.position !== 'front' && b.position === 'front') return 1;
    return 0;
  });

  const handleRerollStats = () => {
    setRolledStats(generateRandomStats());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    const template = CLASS_TEMPLATES[selectedClass] || CLASS_TEMPLATES.Fighter;
    const newChar: Character = {
      ...template,
      id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: newCharName.trim(),
      stats: rolledStats, // 振り直したランダム能力値を適用
    };

    createCharacter(newChar);
    setNewCharName('');
    setRolledStats(generateRandomStats()); // 次回用にリセット
    setActiveTab('roster');
  };

  return (
    <div className="guild-modal-overlay">
      <div className="guild-modal">
        <div className="guild-modal-header">
          <h2 className="guild-modal-title">🏛️ 冒険者ギルド</h2>
          <button onClick={onClose} className="guild-modal-close-button">
            街へ戻る
          </button>
        </div>

        <div className="guild-modal-tabs">
          <button
            onClick={() => setActiveTab('roster')}
            className={activeTab === 'roster' ? 'guild-modal-tab-button active' : 'guild-modal-tab-button'}
          >
            パーティ編成 ({party.length}/5)
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={activeTab === 'create' ? 'guild-modal-tab-button active' : 'guild-modal-tab-button'}
          >
            新規冒険者登録
          </button>
        </div>

        <div className="guild-modal-content">
          {activeTab === 'roster' ? (
            <div className="guild-modal-section">
              <div className="guild-modal-section-block">
                <h3 className="guild-modal-section-title">現在のパーティ</h3>
                {party.length === 0 ? (
                  <p className="guild-modal-empty">
                    メンバーがいません。控えから追加するか新規作成してください。
                  </p>
                ) : (
                  <div className="guild-modal-table">
                    <div className="guild-modal-row guild-modal-row-header">
                      <div className="guild-modal-cell guild-modal-cell-name">名前</div>
                      <div className="guild-modal-cell guild-modal-cell-level">レベル</div>
                      <div className="guild-modal-cell guild-modal-cell-class">クラス</div>
                      <div className="guild-modal-cell">HP</div>
                      <div className="guild-modal-cell">AC</div>
                      <div className="guild-modal-cell">位置</div>
                      <div className="guild-modal-cell guild-modal-cell-action"></div>
                    </div>
                    {sortedParty.map((char) => (
                      <div key={char.id} className="guild-modal-row guild-modal-party-row">
                        <div className="guild-modal-cell guild-modal-cell-name">
                          <div className="guild-modal-card-name">{char.name}</div>
                        </div>
                        <div className="guild-modal-cell guild-modal-cell-level">Lv.{char.level}</div>
                        <div className="guild-modal-cell guild-modal-cell-class">{classNames[char.class_id] ?? char.class_id}</div>
                        <div className="guild-modal-cell">{char.hp.current}/{char.hp.max}</div>
                        <div className="guild-modal-cell">{char.ac}</div>
                        <div className="guild-modal-cell">{char.position === 'front' ? '前衛' : '後衛'}</div>
                        <div className="guild-modal-cell guild-modal-cell-action">
                          <button
                            onClick={() => removeFromParty(char.id)}
                            disabled={party.length <= 1}
                            className={party.length <= 1 ? 'guild-modal-button guild-modal-button-disabled' : 'guild-modal-button guild-modal-button-danger'}
                          >
                            外す
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="guild-modal-section-block">
                <h3 className="guild-modal-section-title">ギルド待機中</h3>
                {characterRoster.filter((c) => !party.some((p) => p.id === c.id)).length === 0 ? (
                  <p className="guild-modal-empty">待機中の冒険者は居ません。</p>
                ) : (
                  <div className="guild-modal-table">
                    <div className="guild-modal-row guild-modal-row-header">
                      <div className="guild-modal-cell guild-modal-cell-name">名前</div>
                      <div className="guild-modal-cell guild-modal-cell-level">Lv</div>
                      <div className="guild-modal-cell guild-modal-cell-class">クラス</div>
                      <div className="guild-modal-cell">HP</div>
                      <div className="guild-modal-cell">AC</div>
                      <div className="guild-modal-cell">位置</div>
                      <div className="guild-modal-cell guild-modal-cell-action"></div>
                    </div>
                    {characterRoster
                      .filter((c) => !party.some((p) => p.id === c.id))
                      .map((char) => (
                        <div key={char.id} className="guild-modal-row guild-modal-waiting-row">
                          <div className="guild-modal-cell guild-modal-cell-name">
                            <div className="guild-modal-card-name guild-modal-card-name-muted">{char.name}</div>
                          </div>
                          <div className="guild-modal-cell guild-modal-cell-level">Lv.{char.level}</div>
                          <div className="guild-modal-cell guild-modal-cell-class">{classNames[char.class_id] ?? char.class_id}</div>
                          <div className="guild-modal-cell">{char.hp.max}</div>
                          <div className="guild-modal-cell">{char.ac}</div>
                          <div className="guild-modal-cell">{char.position === 'front' ? '前衛' : '後衛'}</div>
                          <div className="guild-modal-cell guild-modal-cell-action">
                            <button
                              onClick={() => addToParty(char.id)}
                              disabled={party.length >= 5}
                              className={party.length >= 5 ? 'guild-modal-button guild-modal-button-disabled' : 'guild-modal-button guild-modal-button-primary'}
                            >
                              加える
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="guild-modal-form">
              <div className="guild-modal-form-group">
                <label className="guild-modal-form-label">1. 冒険者の名前</label>
                <input
                  type="text"
                  required
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="例: ヴァリス"
                  className="guild-modal-input"
                />
              </div>

              {/* 能力値決定セクション */}
              <div className="guild-modal-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="guild-modal-form-label">2. 能力値決定（4d6、最低値を破棄）</label>
                  <button
                    type="button"
                    onClick={handleRerollStats}
                    className="guild-modal-button guild-modal-button-primary"
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                  >
                    🎲 ダイスを振り直す
                  </button>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '8px',
                  marginTop: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '12px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div><strong style={{ fontSize: '11px', display: 'block', color: '#888' }}>STR</strong><span>{rolledStats.str}</span></div>
                  <div><strong style={{ fontSize: '11px', display: 'block', color: '#888' }}>DEX</strong><span>{rolledStats.dex}</span></div>
                  <div><strong style={{ fontSize: '11px', display: 'block', color: '#888' }}>CON</strong><span>{rolledStats.con}</span></div>
                  <div><strong style={{ fontSize: '11px', display: 'block', color: '#888' }}>INT</strong><span>{rolledStats.int}</span></div>
                  <div><strong style={{ fontSize: '11px', display: 'block', color: '#888' }}>WIS</strong><span>{rolledStats.wis}</span></div>
                  <div><strong style={{ fontSize: '11px', display: 'block', color: '#888' }}>CHA</strong><span>{rolledStats.cha}</span></div>
                </div>
              </div>

              <div className="guild-modal-form-group">
                <label className="guild-modal-form-label">3. クラス（職業）の選択</label>
                <div className="guild-modal-class-grid">
                  {(['Fighter', 'Wizard', 'Cleric', 'Rogue'] as const).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={selectedClass === cls ? 'guild-modal-class-button selected' : 'guild-modal-class-button'}
                    >
                      <div className="guild-modal-class-name">{cls}</div>
                      <div className="guild-modal-class-desc">
                        {cls === 'Fighter' && '前衛 / 近接攻撃'}
                        {cls === 'Wizard' && '後衛 / 範囲・攻撃呪文'}
                        {cls === 'Cleric' && '前衛・中衛 / 回復・補助'}
                        {cls === 'Rogue' && '前衛・後衛 / 奇襲・高火力'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="guild-modal-submit-button">
                登録を完了する
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};