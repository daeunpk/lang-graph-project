import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SLIDES = [
  {
    title: "게임 개요",
    content: [
      "이 게임은 5개의 구역(색상)으로 구성된 설치 보드에 카드를 올바른 순서로 배치하는 것이 목표입니다.",
      "당신의 손패에 있는 카드는 번호와 구역을 직접 볼 수 없습니다. 에이전트들의 보고를 통해 추론해야 합니다.",
      "에이전트 3인이 각자의 관점에서 정보를 분석하여 보고를 제공합니다.",
    ],
  },
  {
    title: "카드와 보드",
    content: [
      "각 카드에는 번호(1~4)와 구역(색상)이 있습니다. 일부 카드는 오정보일 수 있습니다.",
      "각 구역은 1번부터 4번까지 순서대로 카드를 설치해야 합니다. 순서가 맞지 않으면 오류가 발생합니다.",
      "오류 횟수가 최대치에 도달하면 게임이 종료됩니다. HP가 0이 되어도 게임이 종료됩니다.",
    ],
  },
  {
    title: "행동 규칙",
    content: [
      "매 턴마다 하나의 행동을 선택할 수 있습니다: 설치, 버리기, 또는 휴식.",
      "설치: 손패의 카드를 선택하여 보드의 특정 슬롯에 배치합니다.",
      "버리기: 손패의 카드를 제거합니다. 새 카드가 보충됩니다.",
      "휴식: HP를 회복합니다. 이 턴에는 카드를 다루지 않습니다.",
    ],
  },
  {
    title: "에이전트와 소통",
    content: [
      "에이전트들은 매 턴 보고서를 제출합니다. 각 에이전트는 서로 다른 관점을 가집니다.",
      "보고서에는 불확실성이 포함될 수 있습니다. 확신이 없는 내용은 그렇게 표현됩니다.",
      "follow-up 질문을 통해 특정 에이전트에게 추가 정보를 요청할 수 있습니다.",
    ],
  },
  {
    title: "점수와 보상",
    content: [
      "팀 점수는 성공적으로 설치한 카드 1장당 1점으로 계산합니다.",
      "20점은 모든 구역을 4번까지 완성한 만점입니다.",
      "결과 보고서에서는 성공 여부, 남은 HP, 협력 행동량을 보상 산정 요소로 제공합니다.",
    ],
  },
];

export default function TutorialPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const [slide, setSlide] = useState(0);

  const handleFinish = () => {
    if (sessionId) {
      navigate(`/game/${sessionId}`);
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="tutorial-page">
      <div className="tutorial-card">
        <div className="tutorial-progress">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`tutorial-dot ${i === slide ? "active" : i < slide ? "done" : ""}`}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>

        <h2 className="tutorial-title">{SLIDES[slide].title}</h2>

        <ul className="tutorial-list">
          {SLIDES[slide].content.map((line, i) => (
            <li key={i} className="tutorial-item">
              <span className="tutorial-bullet">▸</span>
              {line}
            </li>
          ))}
        </ul>

        <div className="tutorial-nav">
          <button
            className="tutorial-btn secondary"
            onClick={() => setSlide((s) => Math.max(0, s - 1))}
            disabled={slide === 0}
          >
            이전
          </button>
          {slide < SLIDES.length - 1 ? (
            <button
              className="tutorial-btn primary"
              onClick={() => setSlide((s) => s + 1)}
            >
              다음
            </button>
          ) : (
            <button className="tutorial-btn primary" onClick={handleFinish}>
              게임 시작
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
