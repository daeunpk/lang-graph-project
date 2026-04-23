import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../utils/sendAction";
import type { GameCondition } from "../types/game";
import "../styles/global.css";

const CONDITIONS: { value: GameCondition; scoreLabel: string; rewardLabel: string; interactionLabel: string }[] = [
  {
    value: "leader_cooperative",
    scoreLabel: "모든 플레이어가 팀 점수를 공유합니다.",
    rewardLabel: "팀 전체가 성공할 때 보상이 주어집니다.",
    interactionLabel: "당신은 리더입니다. 에이전트들이 개별 보고하며, 당신이 지시를 내립니다.",
  },
  {
    value: "leader_competitive",
    scoreLabel: "각 플레이어는 개인 점수를 따로 관리합니다.",
    rewardLabel: "가장 높은 개인 점수를 가진 플레이어가 우선 보상을 받습니다.",
    interactionLabel: "당신은 리더입니다. 에이전트들이 보고하지만, 각자의 이익을 고려합니다.",
  },
  {
    value: "leader_coopetition",
    scoreLabel: "팀 기준선 달성 전에는 팀 점수가 중심입니다. 달성 후에는 개인 점수 보너스가 활성화됩니다.",
    rewardLabel: "팀 기준선 달성 후 개인 보상이 추가로 적용됩니다.",
    interactionLabel: "당신은 리더입니다. 에이전트들이 보고하며, 상황에 따라 협력과 경쟁이 혼재합니다.",
  },
  {
    value: "no_leader_cooperative",
    scoreLabel: "모든 플레이어가 팀 점수를 공유합니다.",
    rewardLabel: "팀 전체가 성공할 때 보상이 주어집니다.",
    interactionLabel: "리더 없이 자유롭게 소통합니다. 모두가 동등하게 참여합니다.",
  },
  {
    value: "no_leader_competitive",
    scoreLabel: "각 플레이어는 개인 점수를 따로 관리합니다.",
    rewardLabel: "가장 높은 개인 점수를 가진 플레이어가 우선 보상을 받습니다.",
    interactionLabel: "리더 없이 자유 소통합니다. 에이전트들도 개별 이익을 고려할 수 있습니다.",
  },
  {
    value: "no_leader_coopetition",
    scoreLabel: "팀 기준선 달성 전에는 팀 점수가 중심입니다. 달성 후에는 개인 점수 보너스가 활성화됩니다.",
    rewardLabel: "팀 기준선 달성 후 개인 보상이 추가로 적용됩니다.",
    interactionLabel: "리더 없이 자유 소통합니다. 상황에 따라 협력과 경쟁이 혼재합니다.",
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<GameCondition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = CONDITIONS.find((c) => c.value === selectedCondition);

  const handleStart = async () => {
    if (!name.trim() || !selectedCondition) return;
    setLoading(true);
    setError(null);
    const result = await createSession(selectedCondition, name.trim());
    setLoading(false);
    if (!result) {
      setError("세션 생성에 실패했습니다. 서버를 확인해주세요.");
      return;
    }
    localStorage.setItem("playerId", result.playerId);
    localStorage.setItem("sessionId", result.sessionId);
    navigate(`/tutorial?session=${result.sessionId}&condition=${selectedCondition}`);
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-badge">CLASSIFIED EXPERIMENT</div>
          <h1 className="onboarding-title">NEXUS PROTOCOL</h1>
          <p className="onboarding-subtitle">
            인간 1인 + AI 에이전트 3인이 함께 진행하는 정보 통합 전략 게임
          </p>
        </div>

        <div className="onboarding-section">
          <label className="onboarding-label">참가자 코드명</label>
          <input
            className="onboarding-input"
            type="text"
            placeholder="코드명을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div className="onboarding-section">
          <label className="onboarding-label">실험 시나리오 선택</label>
          <div className="condition-grid">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                className={`condition-btn ${selectedCondition === c.value ? "selected" : ""}`}
                onClick={() => setSelectedCondition(c.value)}
              >
                <span className="condition-index">{CONDITIONS.indexOf(c) + 1}</span>
                <span className="condition-name">시나리오 {CONDITIONS.indexOf(c) + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="condition-info-box">
            <div className="condition-info-row">
              <span className="info-icon">📊</span>
              <div>
                <div className="info-label">점수 방식</div>
                <div className="info-text">{selected.scoreLabel}</div>
              </div>
            </div>
            <div className="condition-info-row">
              <span className="info-icon">🏆</span>
              <div>
                <div className="info-label">보상 방식</div>
                <div className="info-text">{selected.rewardLabel}</div>
              </div>
            </div>
            <div className="condition-info-row">
              <span className="info-icon">🔗</span>
              <div>
                <div className="info-label">상호작용 규칙</div>
                <div className="info-text">{selected.interactionLabel}</div>
              </div>
            </div>
          </div>
        )}

        {error && <div className="onboarding-error">{error}</div>}

        <button
          className="onboarding-start-btn"
          onClick={handleStart}
          disabled={!name.trim() || !selectedCondition || loading}
        >
          {loading ? "세션 생성 중..." : "실험 시작 →"}
        </button>
      </div>
    </div>
  );
}