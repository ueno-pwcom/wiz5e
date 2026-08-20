import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { DungeonView } from './DungeonView';
import { BattleView } from './BattleView';
import { TownView } from './TownView';
import { StatusPanel } from './StatusPanel';
import { MessageLog } from './MessageLog';

export const GameContainer: React.FC = () => {
  // Zustand ストアから状態とアクションを取得
  const scene = useGameStore((state) => state.scene);
  const setScene = useGameStore((state) => state.setScene);
  const party = useGameStore((state) => state.party);
  const gold = useGameStore((state) => state.gold);
  const logs = useGameStore((state) => state.logs);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>
      {/* 画面切り替えボタン */}
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
        <MessageLog logs={logs} />
      </div>

      {/* パーティステータス */}
      <StatusPanel party={party} gold={gold} />
    </div>
  );
};