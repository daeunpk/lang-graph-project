import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface ResultData {
  teamScore: number;
  individualScore: number;
  totalTurns: number;
  errorCount: number;
  successfulInstalls: number;
  gameOverReason: string;
  scoringMode: "cooperative" | "competitive" | "coopetition";
  rewardRule: string;
  teamScoreThreshold: number;
  thresholdReached: boolean;
  leaderboard: Array<{
    playerId: string;
    name: string;
    isHuman: boolean;
    successfulInstalls: number;
    rewardEligible: boolean;
  }>;
  winner?: string;
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API_BASE}/api/game/${sessionId}/result`)
      .then((r) => r.json())
      .then(setResult)
      .catch(() => {});
  }, [sessionId, API_BASE]);

  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-header">
          <div className="result-badge">EXPERIMENT COMPLETE</div>
          <h1 className="result-title">게임 종료</h1>
          {result?.gameOverReason && (
            <p className="result-reason">{result.gameOverReason}</p>
          )}
        </div>

        {result ? (
          <div className="result-stats">
            <div className="stat-row">
              <span className="stat-label">팀 완성도 점수</span>
              <span className="stat-value team">{result.teamScore}/25</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">내 성공 설치 수</span>
              <span className="stat-value">{result.individualScore}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">진행 턴</span>
              <span className="stat-value">{result.totalTurns}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">성공 설치</span>
              <span className="stat-value success">{result.successfulInstalls}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">오류 횟수</span>
              <span className="stat-value error">{result.errorCount}</span>
            </div>
            <div className="reward-rule-box">
              <span className="reward-rule-label">보상 기준</span>
              <p>{result.rewardRule}</p>
              {result.scoringMode === "coopetition" && (
                <p>
                  기준선 {result.teamScoreThreshold}점:
                  {result.thresholdReached ? " 달성" : " 미달성"}
                </p>
              )}
            </div>
            <div className="leaderboard-box">
              <div className="leaderboard-title">리더보드</div>
              {result.leaderboard.map((entry, index) => (
                <div key={entry.playerId} className="leaderboard-row">
                  <span className="leaderboard-rank">{index + 1}</span>
                  <span className="leaderboard-name">
                    {entry.name}
                    {entry.isHuman ? " (나)" : ""}
                  </span>
                  <span className="leaderboard-score">
                    성공 {entry.successfulInstalls}
                  </span>
                  <span
                    className={`leaderboard-eligible ${
                      entry.rewardEligible ? "eligible" : "ineligible"
                    }`}
                  >
                    {entry.rewardEligible ? "보상 대상" : "비활성"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="result-loading">결과 불러오는 중...</div>
        )}

        <div className="result-actions">
          <button
            className="result-btn primary"
            onClick={() => navigate(`/survey/${sessionId}`)}
          >
            설문 참여 →
          </button>
          <button
            className="result-btn secondary"
            onClick={() => navigate("/onboarding")}
          >
            새 게임
          </button>
        </div>
      </div>
    </div>
  );
}
