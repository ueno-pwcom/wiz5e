import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const BattleView: React.FC = () => {
  const activeEnemies = useGameStore((state) => state.activeEnemies);
  const setScene = useGameStore((state) => state.setScene);
  const addLog = useGameStore((state) => state.addLog);

  // 逃走試行（仮実装）
  const handleRun = () => {
    if (Math.random() > 0.5) {
      addLog('うまく逃げ切れた！', 'info');
      setScene('dungeon');
    } else {
      addLog('逃げ切れなかった！', 'critical');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '8px', height: '320px' }}>
      {/* 敵モンスター表示エリア */}
      <div style={{
        backgroundColor: '#111827',
        border: '1px solid #374151',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'relative'
      }}>
        {activeEnemies.length === 0 ? (
          <div style={{ color: '#9ca3af' }}>敵はいません。</div>
        ) : (
          activeEnemies.map((enemy) => (
            <div key={enemy.id} style={{
              backgroundColor: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              width: '120px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👾</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                {enemy.name}
              </div>
              <div style={{ color: '#ef4444', fontSize: '12px' }}>
                HP: {enemy.hp.current} / {enemy.hp.max}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '10px', marginTop: '4px' }}>
                AC: {enemy.ac}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 戦闘コマンドパネル */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', color: '#fff' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
          戦闘コマンド
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button style={cmdBtnStyle} onClick={() => addLog('攻撃処理は次のステップで実装します。', 'info')}>
            ⚔️ 攻撃
          </button>
          <button style={cmdBtnStyle} onClick={() => addLog('呪文処理は次のステップで実装します。', 'info')}>
            🪄 呪文
          </button>
          <button style={cmdBtnStyle} onClick={() => addLog('防御した。', 'info')}>
            🛡️ 防御
          </button>
          <button style={cmdBtnStyle} onClick={handleRun}>
            🏃 逃げる
          </button>
        </div>
      </div>
    </div>
  );
};

const cmdBtnStyle: React.CSSProperties = {
  backgroundColor: '#374151',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '10px',
  cursor: 'pointer',
  fontSize: '13px',
  textAlign: 'left'
};