import React, { useState } from 'react';
import { DungeonView } from './DungeonView';
import { BattleView } from './BattleView';
import { TownView } from './TownView';
import { StatusPanel } from './StatusPanel';
import { MessageLog } from './MessageLog';
import type { Character, LogMessage } from '../types/game';

// テスト用ダミーデータ
const initialParty: Character[] = [
  { id: '1', name: 'バルド', class_id: 'fighter', level: 1, xp: 0, stats: { str: 15, dex: 12, con: 14, int: 10, wis: 12, cha: 8 }, hp: { current: 12, max: 12 }, hit_dice_remaining: 1, spell_slots: {}, ac: 16, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'longsword' },
  { id: '2', name: 'ロンド', class_id: 'rogue', level: 1, xp: 0, stats: { str: 10, dex: 16, con: 12, int: 14, wis: 10, cha: 12 }, hp: { current: 9, max: 9 }, hit_dice_remaining: 1, spell_slots: {}, ac: 14, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'shortsword' },
  { id: '3', name: 'アリア', class_id: 'cleric', level: 1, xp: 0, stats: { str: 14, dex: 8, con: 14, int: 10, wis: 16, cha: 12 }, hp: { current: 10, max: 10 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 18, position: 'front', is_alive: true, status_effects: [], equipped_weapon_id: 'mace' },
  { id: '4', name: 'シオン', class_id: 'wizard', level: 1, xp: 0, stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 }, hp: { current: 7, max: 7 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 12, position: 'back', is_alive: true, status_effects: [], equipped_weapon_id: 'dagger' },
  { id: '5', name: 'エリア', class_id: 'wizard', level: 1, xp: 0, stats: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 }, hp: { current: 7, max: 7 }, hit_dice_remaining: 1, spell_slots: { 1: { current: 2, max: 2 } }, ac: 12, position: 'back', is_alive: true, status_effects: [], equipped_weapon_id: 'dagger' }
];

const initialLogs: LogMessage[] = [
  { id: '1', text: '王都アークから地下迷宮へ進出いた。', type: 'info' },
  { id: '2', text: '[受動知覚 15] バルドは扉の近くに危険がないか確認した。', type: 'system' },
  { id: '3', text: 'モンスターの群れ（ゴブリン 2体）が現れた！', type: 'enemy_action' }
];

export const GameContainer: React.FC = () => {
  const [scene, setScene] = useState<'dungeon' | 'battle' | 'town'>('dungeon');

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>
      {/* 画面切り替えテストボタン */}
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <button onClick={() => setScene('dungeon')}>ダンジョン画面</button>
        <button onClick={() => setScene('battle')}>戦闘画面</button>
        <button onClick={() => setScene('town')}>街画面</button>
      </div>

      {/* メイン画面ビュー切り替え */}
      <div style={{ marginBottom: '8px' }}>
        {scene === 'dungeon' && <DungeonView />}
        {scene === 'battle' && <BattleView />}
        {scene === 'town' && <TownView />}
      </div>

      {/* メッセージログ */}
      <div style={{ marginBottom: '8px' }}>
        <MessageLog logs={initialLogs} />
      </div>

      {/* パーティステータス */}
      <StatusPanel party={initialParty} gold={150} />
    </div>
  );
};