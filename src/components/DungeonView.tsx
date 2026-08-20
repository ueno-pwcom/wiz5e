import React from 'react';

export const DungeonView: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '8px', height: '320px' }}>
      {/* 3Dダンジョンビュー（ワイヤーフレーム/テクスチャ表示領域） */}
      <div style={{
        backgroundColor: '#000',
        border: '1px solid #374151',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#4b5563',
        position: 'relative'
      }}>
        {/* 簡易的な3Dビュー風プレースホルダー */}
        <div style={{
          width: '200px',
          height: '180px',
          border: '2px solid #fff',
          boxShadow: 'inset 0 0 20px #555'
        }}>
          <div style={{ textAlign: 'center', marginTop: '70px', color: '#fff' }}>[ 3D View Area ]</div>
        </div>
      </div>

      {/* ミニマップ & コマンドパネル */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', color: '#fff' }}>
        <div style={{ fontSize: '12px', marginBottom: '8px', color: '#9ca3af' }}>[N] 座標: X:02 Y:04</div>
        <div style={{
          height: '100px',
          backgroundColor: '#000',
          border: '1px solid #374151',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          [ Minimap ]
        </div>

        {/* 移動コントロール */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '8px' }}>
          <div></div>
          <button style={btnStyle}>▲</button>
          <div></div>
          <button style={btnStyle}>◄</button>
          <button style={btnStyle}>▼</button>
          <button style={btnStyle}>►</button>
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