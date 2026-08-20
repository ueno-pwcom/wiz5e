import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { Direction } from '../types/game';

export const DungeonView: React.FC = () => {
  const playerPosition = useGameStore((state) => state.playerPosition);
  const currentMap = useGameStore((state) => state.currentMap);
  const movePlayer = useGameStore((state) => state.movePlayer);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') movePlayer('forward');
      if (e.key === 'ArrowDown' || e.key === 's') movePlayer('backward');
      if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer('turnLeft');
      if (e.key === 'ArrowRight' || e.key === 'd') movePlayer('turnRight');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  // 向きを示す矢印アイコン
  const getFacingIcon = (facing: Direction) => {
    switch (facing) {
      case 'N': return '▲';
      case 'E': return '►';
      case 'S': return '▼';
      case 'W': return '◄';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '8px', height: '320px' }}>
      {/* 3Dビューエリア */}
      <div style={{
        backgroundColor: '#000',
        border: '1px solid #374151',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#4b5563',
        position: 'relative'
      }}>
        <div style={{
          width: '200px',
          height: '180px',
          border: '2px solid #fff',
          boxShadow: 'inset 0 0 20px #555'
        }}>
          <div style={{ textAlign: 'center', marginTop: '70px', color: '#fff' }}>[ 3D View Area ]</div>
        </div>
      </div>

      {/* ミニマップ & コマンド */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', color: '#fff' }}>
        <div style={{ fontSize: '12px', marginBottom: '8px', color: '#9ca3af' }}>
          [{playerPosition.facing}] 座標: X:{String(playerPosition.x).padStart(2, '0')} Y:{String(playerPosition.y).padStart(2, '0')}
        </div>

        {/* 動的グリッドミニマップ */}
        <div style={{
          height: '120px',
          backgroundColor: '#000',
          border: '1px solid #374151',
          marginBottom: '12px',
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: `repeat(${currentMap.width}, 1fr)`,
          gap: '2px'
        }}>
          {currentMap.grid.map((row, y) =>
            row.map((tile, x) => {
              const isPlayerHere = playerPosition.x === x && playerPosition.y === y;
              return (
                <div key={`${x}-${y}`} style={{
                  backgroundColor: isPlayerHere ? '#1e3a8a' : '#1f2937',
                  borderTop: tile.walls.N !== 'none' ? '2px solid #9ca3af' : '1px solid #374151',
                  borderRight: tile.walls.E !== 'none' ? '2px solid #9ca3af' : '1px solid #374151',
                  borderBottom: tile.walls.S !== 'none' ? '2px solid #9ca3af' : '1px solid #374151',
                  borderLeft: tile.walls.W !== 'none' ? '2px solid #9ca3af' : '1px solid #374151',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: isPlayerHere ? '#60a5fa' : '#4b5563',
                  fontWeight: 'bold'
                }}>
                  {isPlayerHere ? getFacingIcon(playerPosition.facing) : (tile.event ? '?' : '')}
                </div>
              );
            })
          )}
        </div>

        {/* コントロールボタン */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '8px' }}>
          <div></div>
          <button style={btnStyle} onClick={() => movePlayer('forward')}>▲</button>
          <div></div>
          <button style={btnStyle} onClick={() => movePlayer('turnLeft')}>◄</button>
          <button style={btnStyle} onClick={() => movePlayer('backward')}>▼</button>
          <button style={btnStyle} onClick={() => movePlayer('turnRight')}>►</button>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={{ ...btnStyle, flex: 1 }}>調べる</button>
          <button style={{ ...btnStyle, flex: 1 }}>キャンプ</button>
        </div>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  backgroundColor: '#374151',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  padding: '6px',
  cursor: 'pointer',
  fontSize: '12px'
};