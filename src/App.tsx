import { GameContainer } from './components/GameContainer';
import { BattleResultModal } from './components/BattleResultModal';

function App() {
  return (
    <div style={{ backgroundColor: '#090d16', minHeight: '100vh', padding: '20px' }}>
      <GameContainer />
      <BattleResultModal />
    </div>
  );
}

export default App;