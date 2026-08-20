import React from 'react';

export const TownView: React.FC = () => {
  return (
    <div style={{
      height: '320px',
      backgroundColor: '#1e1b4b',
      border: '1px solid #374151',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff'
    }}>
      <h2 style={{ marginBottom: '16px', color: '#c084fc' }}>冒険者の街「王都アーク」</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '320px' }}>
        <button style={townBtnStyle}>ギルド（編成・成長）</button>
        <button style={townBtnStyle}>宿屋（回復・長休止）</button>
        <button style={townBtnStyle}>商店（売買・鑑定）</button>
        <button style={townBtnStyle}>寺院（治療・蘇生）</button>
      </div>
      <button style={{
        ...townBtnStyle,
        marginTop: '16px',
        width: '320px',
        backgroundColor: '#059669',
        fontWeight: 'bold'
      }}>
        ダンジョンへ出撃
      </button>
    </div>
  );
};

const townBtnStyle: React.CSSProperties = {
  backgroundColor: '#312e81',
  color: '#fff',
  border: '1px solid #6366f1',
  borderRadius: '4px',
  padding: '10px',
  cursor: 'pointer',
  fontSize: '13px'
};