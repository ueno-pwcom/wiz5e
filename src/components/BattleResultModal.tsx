import React from 'react';
import './BattleResultModal.css';
import { useGameStore } from '../store/useGameStore';
import { XP_TABLE } from '../data/levelTable';

export const BattleResultModal: React.FC = () => {
  const showResultModal = useGameStore((state) => state.showResultModal);
  const battleReward = useGameStore((state) => state.battleReward);
  const claimBattleReward = useGameStore((state) => state.claimBattleReward);
  const party = useGameStore((state) => state.party);

  if (!showResultModal || !battleReward) return null;

  const aliveCount = party.filter((m) => m.is_alive).length;
  const xpPerMember = Math.floor(battleReward.xp / (aliveCount || 1));

  return (
    <div className="battle-result-overlay">
      <div className="battle-result-modal">
        {/* ヘッダー */}
        <div className="battle-result-header">
          <div className="battle-result-header-icon">⚔️✨</div>
          <h2 className="battle-result-header-title">
            VICTORY!（戦闘勝利）
          </h2>
          <p className="battle-result-header-subtitle">
            敵の群れを退けた！
          </p>
        </div>

        {/* 獲得報酬カード */}
        <div className="battle-result-rewards">
          <div className="battle-result-rewards-title">
            戦利品・獲得報酬
          </div>

          <div className="battle-result-reward-grid">
            <div className="battle-result-reward-box">
              <span className="battle-result-reward-label">総獲得XP</span>
              <span className="battle-result-reward-value battle-result-reward-value--xp">
                +{battleReward.xp} XP
              </span>
              <span className="battle-result-reward-note">（1人あたり +{xpPerMember}）</span>
            </div>

            <div className="battle-result-reward-box">
              <span className="battle-result-reward-label">獲得ゴールド</span>
              <span className="battle-result-reward-value battle-result-reward-value--gold">
                +{battleReward.gold} GP
              </span>
            </div>
          </div>

          {/* パーティの獲得XPとレベルアップ状況 */}
          <div className="battle-result-party-growth">
            <div className="battle-result-party-growth-title">
              パーティの成長
            </div>
            <div className="battle-result-party-growth-list">
              {party.filter(m => m.is_alive).map((m) => {
                const nextXp = XP_TABLE[m.level + 1];
                const willLevelUp = nextXp && ((m.xp || 0) + xpPerMember) >= nextXp;

                return (
                  <div key={m.id} className="battle-result-party-growth-item">
                    <span>{m.name} (Lv.{m.level})</span>
                    {willLevelUp ? (
                      <span className="battle-result-level-up">✨ LEVEL UP!</span>
                    ) : (
                      <span className="battle-result-next-xp">
                        次Lvまで: {nextXp ? nextXp - ((m.xp || 0) + xpPerMember) : 'MAX'} XP
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ドロップアイテム */}
          {battleReward.items.length > 0 && (
            <div className="battle-result-drop-items">
              <span className="battle-result-drop-items-label">入手アイテム: </span>
              {battleReward.items.join(', ')}
            </div>
          )}
        </div>

        {/* 完了ボタン */}
        <button onClick={claimBattleReward} className="battle-result-button">
          報酬を受け取って探索を続ける
        </button>
      </div>
    </div>
  );
};
