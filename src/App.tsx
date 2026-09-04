import { GameContainer } from './components/GameContainer';
import { BattleResultModal } from './components/BattleResultModal';
import { DungeonEventModal } from './components/DungeonEventModal';
import { useGameStore } from './store/useGameStore';
import './App.css';

function App() {
  const hasStarted = useGameStore((state) => state.hasStarted);
  const saveGame = useGameStore((state) => state.saveGame);
  const loadGame = useGameStore((state) => state.loadGame);
  const resetToDefaultState = useGameStore((state) => state.resetToDefaultState);

  if (!hasStarted) {
    return (
      <div className="title-screen-container">
        <div className="title-screen-panel">
          <div className="title-screen-badge">WIZ5E</div>
          <h1 className="title-screen-title">Wizard's Dungeon</h1>
          <p className="title-screen-subtitle">地下迷宮へ足を踏み入れ、仲間と冒険を続けよう。</p>

          <div className="title-screen-actions">
            <button type="button" className="title-screen-button primary" onClick={resetToDefaultState}>
              新規ゲーム
            </button>
            <button type="button" className="title-screen-button" onClick={loadGame}>
              続きから
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="game-toolbar">
        <button type="button" className="toolbar-button" onClick={saveGame}>セーブ</button>
        <button type="button" className="toolbar-button" onClick={loadGame}>ロード</button>
      </div>

      <GameContainer />
      <BattleResultModal />
      <DungeonEventModal />
    </div>
  );
}

export default App;