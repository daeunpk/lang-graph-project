import { useNavigate } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";
import { useGameStore } from "../../store/gameStore";
import { computeScoreBreakdown } from "../../utils/score";

interface GameEndModalProps {
  sessionId: string;
}

export function GameEndModal({ sessionId }: GameEndModalProps) {
  const { activeModal, modalPayload, closeModal } = useUIStore();
  const { gameState } = useGameStore();
  const navigate = useNavigate();

  if (activeModal !== "game_end") return null;

  const reason = modalPayload?.reason as string ?? "게임 종료";
  const winner = modalPayload?.winner as string | undefined;

  const playerId = localStorage.getItem("playerId") ?? "";
  const breakdown = gameState ? computeScoreBreakdown(gameState, playerId) : null;
  const maxScore = gameState?.maxTeamScore ?? 20;
  const targetScore = gameState?.completionTargetScore ?? gameState?.teamScoreThreshold ?? 20;

  const handleResult = () => {
    closeModal();
    navigate(`/result/${sessionId}`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box game-end-modal">
        <div className="game-end-header">
          <div className="game-end-badge">GAME OVER</div>
          <h2 className="modal-title">실험 종료</h2>
          <p className="game-end-reason">{reason}</p>
          {winner && <p className="game-end-winner">최종 결과: {winner}</p>}
        </div>

        {breakdown && (
          <div className="game-end-scores">
            <div className="end-score-row">
              <span>팀 완성도 점수</span>
              <span className="score-val">{breakdown.teamScore}/{maxScore}</span>
            </div>
            <div className="end-score-row">
              <span>기본 완성 목표</span>
              <span className="score-val">
                {gameState?.targetReached ? "달성" : "미달성"} ({targetScore}점)
              </span>
            </div>
            <div className="end-score-row">
              <span>내 성공 설치 수</span>
              <span className="score-val">{breakdown.individualScore}</span>
            </div>
            <div className="end-score-row total">
              <span>보상 기준</span>
              <span className="score-val">{breakdown.explanation}</span>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-btn confirm" onClick={handleResult}>
            결과 보기 →
          </button>
        </div>
      </div>
    </div>
  );
}
