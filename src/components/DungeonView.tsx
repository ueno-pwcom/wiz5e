import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { Direction } from '../types/game';

export const DungeonView: React.FC = () => {
  const playerPosition = useGameStore((state) => state.playerPosition);
  const currentMap = useGameStore((state) => state.currentMap);
  const movePlayer = useGameStore((state) => state.movePlayer);
  const enterCamp = useGameStore((state) => state.enterCamp);
  const returnToTown = useGameStore((state) => state.returnToTown); // 街に戻るアクションを取得

  // 現在プレイヤーが足元に置いているタイルの情報を取得
  const currentTile = currentMap.grid[playerPosition.y]?.[playerPosition.x];

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

  const getWallBorder = (wall: string) => {
    if (wall === 'door') return '2px solid #f59e0b';
    if (wall === 'locked_door') return '2px solid #f97316';
    if (wall === 'wall') return '2px solid #9ca3af';
    return '1px solid #374151';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '8px', height: '320px' }}>
      {/* 3Dビューエリア */}
      <div style={{
        backgroundColor: '#000',
        border: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#4b5563',
        position: 'relative'
      }}>
        <div style={{
          width: '200px',
          height: '180px',
          border: '2px solid #fff',
          boxShadow: 'inset 0 0 20px #555',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>[ 3D View Area ]</div>
        </div>

        {/* 階上への階段（stairs_up）イベントオーバーレイ */}
        {currentTile?.event?.type === 'stairs_up' && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '8px 12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>
              🧗 地上へ続く階段がある
            </div>
            <button
              onClick={returnToTown}
              style={{
                backgroundColor: '#d97706',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🏰 街へ帰還する
            </button>
          </div>
        )}
      </div>

      {/* ミニマップ & コマンド */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', color: '#fff' }}>
        <div style={{ fontSize: '12px', marginBottom: '8px', color: '#9ca3af' }}>
          [{playerPosition.facing}] 座標: X:{String(playerPosition.x).padStart(2, '0')} Y:{String(playerPosition.y).padStart(2, '0')}
        </div>

        {/* 動的グリッドミニマップ */}
        <div style={{
          width: '80%',
          aspectRatio: '1 / 1',
          maxWidth: '220px',
          backgroundColor: '#000',
          border: '1px solid #374151',
          margin: '0 auto 12px',
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: `repeat(${currentMap.width}, 1fr)`,
          gridTemplateRows: `repeat(${currentMap.height}, 1fr)`,
          gap: '2px'
        }}>
          {currentMap.grid.map((row, y) =>
            row.map((tile, x) => {
              const isPlayerHere = playerPosition.x === x && playerPosition.y === y;
              return (
                <div key={`${x}-${y}`} style={{
                  backgroundColor: isPlayerHere ? '#1e3a8a' : '#1f2937',
                  borderTop: getWallBorder(tile.walls.N),
                  borderRight: getWallBorder(tile.walls.E),
                  borderBottom: getWallBorder(tile.walls.S),
                  borderLeft: getWallBorder(tile.walls.W),
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: isPlayerHere ? '#60a5fa' : '#4b5563',
                  fontWeight: 'bold'
                }}>
                  {isPlayerHere ? getFacingIcon(playerPosition.facing) : (tile.event?.type === 'stairs_up' ? '▲' : tile.event ? '?' : '')}
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
          <button
            style={{ ...btnStyle, flex: 1 }}
            onClick={() => {
              console.log('DungeonView: キャンプボタンが押されました');
              enterCamp();
            }}
          >
            キャンプ
          </button>
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
  padding: '4px 6px',
  cursor: 'pointer',
  fontSize: '11px'
};