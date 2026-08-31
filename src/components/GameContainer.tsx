import React, { useEffect } from 'react';
import './GameContainer.css';
import { useGameStore, playDungeonBgm, playTownBgm, playCampBgm } from '../store/useGameStore';
import { DungeonView } from './DungeonView';
import { BattleView } from './BattleView';
import { TownView } from './TownView';
import { CampView } from './CampView';
import { StatusPanel } from './StatusPanel';
import { MessageLog } from './MessageLog';
import { CharacterDetailModal } from './CharacterDetailModal';

export const GameContainer: React.FC = () => {
  // Zustand ストアから状態とアクションを取得
  const scene = useGameStore((state) => state.scene);
  const setScene = useGameStore((state) => state.setScene);
  const party = useGameStore((state) => state.party);
  const gold = useGameStore((state) => state.gold);
  const logs = useGameStore((state) => state.logs);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSoundEnabled = useGameStore((state) => state.toggleSoundEnabled);
  const setSelectedCharacterId = useGameStore((state) => state.setSelectedCharacterId);

  useEffect(() => {
    if (!soundEnabled) return;
    if (scene === 'dungeon') {
      playDungeonBgm();
    } else if (scene === 'town') {
      playTownBgm();
    } else if (scene === 'camp') {
      playCampBgm();
    }
  }, [scene, soundEnabled]);

  return (
    <div className="game-container">
      {/* 画面切り替えボタン */}
      <div className="game-container-toolbar">
        <button onClick={() => setScene('dungeon')}>ダンジョン画面</button>
        <button onClick={() => setScene('battle')}>戦闘画面</button>
        <button onClick={() => setScene('town')}>街画面</button>
        <button onClick={() => setScene('camp')}>キャンプ画面</button>
        <button onClick={toggleSoundEnabled}>
          サウンド: {soundEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* メイン画面ビュー切り替え */}
      <div className="game-container-main">
        {scene === 'dungeon' && <DungeonView />}
        {scene === 'battle' && <BattleView />}
        {scene === 'town' && <TownView />}
        {scene === 'camp' && <CampView />}
      </div>

      {/* メッセージログ */}
      <div className="game-container-log">
        <MessageLog logs={logs} />
      </div>

      {/* パーティステータス */}
      <StatusPanel party={party} gold={gold} onSelectCharacter={(character) => setSelectedCharacterId(character.id)} />
      <CharacterDetailModal />
    </div>
  );
};