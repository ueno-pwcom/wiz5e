import React from 'react';

export const BattleView: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '8px', height: '320px' }}>
      {/* 戦闘メインエリア（モンスター表示） */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #374151',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '12px' }}>[敵 前衛]</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={monsterStyle}>
            <div>ゴブリンA</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>HP: 7/7</div>
          </div>
          <div style={monsterStyle}>
            <div>ゴブリンB</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>HP: 7/7</div>
          </div>
        </div>
      </div>

      {/* 戦闘コマンド & 行動順 */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', color: '#fff' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#60a5fa' }}>COMMAND</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
          <button style={actionBtnStyle}>▶ 攻撃 (Attack)</button>
          <button style={actionBtnStyle}>  呪文 (Cast)</button>
          <button style={actionBtnStyle}>  道具 (Item)</button>
          <button style={actionBtnStyle}>  回避 (Dodge)</button>
          <button style={actionBtnStyle}>  逃亡 (Flee)</button>
        </div>

        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>イニシアチブ順:</div>
        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
          1. シオン<br />
          2. ゴブリンA<br />
          3. バルド
        </div>
      </div>
    </div>
  );
};

const monsterStyle: React.CSSProperties = {
  border: '1px dashed #ef4444',
  padding: '16px 24px',
  borderRadius: '8px',
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#1e293b'
};

const actionBtnStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#fff',
  border: '1px solid #374151',
  borderRadius: '4px',
  padding: '6px',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '12px'
};