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

  let totalDisplayScore = 0;
  let thresholdStatus: ScoreBreakdown["thresholdStatus"] = "not_reached";
  let bonusMultiplier = 1;
  let explanation = "";

  if (teamScore >= state.teamScoreThreshold) {
    thresholdStatus = teamScore > state.teamScoreThreshold ? "exceeded" : "reached";
  }

  switch (mode) {
    case "cooperative":
      totalDisplayScore = teamScore;
      explanation = "팀 점수 기반";
      break;
    case "competitive":
      totalDisplayScore = individualScore;
      explanation = "개인 점수 기반";
      break;
    case "coopetition":
      if (state.thresholdReached) {
        bonusMultiplier = 1.5;
        totalDisplayScore = Math.floor(
          teamScore * 0.5 + individualScore * bonusMultiplier
        );
        explanation = "기준선 달성 후: 개인 보너스 활성화";
      } else {
        totalDisplayScore = teamScore;
        explanation = "기준선 도달 전: 팀 점수 중심";
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