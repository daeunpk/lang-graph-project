import type { GameState } from "../types/game";
import type { ScoringMode } from "../types/game";

export interface ScoreBreakdown {
  teamScore: number;
  individualScore: number;
  totalDisplayScore: number;
  thresholdStatus: "not_reached" | "reached" | "exceeded";
  bonusMultiplier: number;
  explanation: string;
}

export function computeScoreBreakdown(
  state: GameState,
  playerId: string
): ScoreBreakdown {
  const mode: ScoringMode = state.config.scoringMode;
  const teamScore = state.teamScore;
  const player = state.players.find((p) => p.playerId === playerId);
  const individualScore = player?.individualScore ?? 0;

  let totalDisplayScore = teamScore;
  let thresholdStatus: ScoreBreakdown["thresholdStatus"] = "not_reached";
  let bonusMultiplier = 1;
  let explanation = "";

  if (teamScore >= state.teamScoreThreshold) {
    thresholdStatus = teamScore > state.teamScoreThreshold ? "exceeded" : "reached";
  }

  switch (mode) {
    case "cooperative":
      totalDisplayScore = teamScore;
      explanation = "보상 기준: 팀 점수";
      break;
    case "competitive":
      totalDisplayScore = teamScore;
      explanation = "게임 점수는 팀 점수, 보상 기준은 개인 성공 설치 수";
      break;
    case "coopetition":
      if (state.thresholdReached) {
        totalDisplayScore = teamScore;
        explanation = "기준선 달성: 개인 성공 설치 수 순위 보상 적용";
      } else {
        totalDisplayScore = teamScore;
        explanation = "기준선 미달: 개인 순위 보상 비활성";
      }
      break;
  }

  return {
    teamScore,
    individualScore,
    totalDisplayScore,
    thresholdStatus,
    bonusMultiplier,
    explanation,
  };
}

export function getHpColor(hp: number, maxHp: number): string {
  const ratio = hp / maxHp;
  if (ratio > 0.6) return "#4ade80";
  if (ratio > 0.3) return "#facc15";
  return "#f87171";
}

export function getErrorSeverity(
  errorCount: number,
  maxErrors: number
): "safe" | "caution" | "danger" {
  const ratio = errorCount / maxErrors;
  if (ratio < 0.4) return "safe";
  if (ratio < 0.75) return "caution";
  return "danger";
}
