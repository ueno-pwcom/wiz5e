import { GameContainer } from './components/GameContainer';
import { BattleResultModal } from './components/BattleResultModal';
import { DungeonEventModal } from './components/DungeonEventModal';

function App() {
  return (
    <div style={{ backgroundColor: '#090d16', minHeight: '100vh', padding: '20px' }}>
      <GameContainer />
      <BattleResultModal />
      <DungeonEventModal />
    </div>
  );
}

export default App;