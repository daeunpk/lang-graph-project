import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const QUESTIONS = [
  { id: "q1", text: "에이전트들의 보고가 게임에 도움이 되었나요?", scale: 5 },
  { id: "q2", text: "에이전트들이 충분히 신뢰할 만하다고 느꼈나요?", scale: 5 },
  { id: "q3", text: "점수 규칙이 명확하게 이해되었나요?", scale: 5 },
  { id: "q4", text: "팀원들과의 협력이 효과적이었나요?", scale: 5 },
  { id: "q5", text: "전반적인 게임 경험을 평가해주세요.", scale: 5 },
];

export default function PostSurveyPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const setAnswer = (qId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = async () => {
    if (!sessionId) return;
    await fetch(`${API_BASE}/api/game/${sessionId}/survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, freeText }),
    }).catch(() => {});
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="survey-page">
        <div className="survey-card">
          <h2 className="survey-done-title">감사합니다</h2>
          <p className="survey-done-text">응답이 저장되었습니다.</p>
          <button className="result-btn primary" onClick={() => navigate("/onboarding")}>
            메인으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-page">
      <div className="survey-card">
        <h1 className="survey-title">사후 설문</h1>
        <p className="survey-subtitle">게임 경험에 대해 평가해주세요.</p>

        {QUESTIONS.map((q) => (
          <div key={q.id} className="survey-question">
            <p className="survey-q-text">{q.text}</p>
            <div className="survey-scale">
              {Array.from({ length: q.scale }, (_, i) => i + 1).map((val) => (
                <button
                  key={val}
                  className={`scale-btn ${answers[q.id] === val ? "selected" : ""}`}
                  onClick={() => setAnswer(q.id, val)}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="survey-free">
          <p className="survey-q-text">자유 의견 (선택)</p>
          <textarea
            className="survey-textarea"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="게임에 대한 의견을 자유롭게 작성해주세요."
            rows={4}
          />
        </div>

        <button
          className="result-btn primary"
          onClick={handleSubmit}
          disabled={QUESTIONS.some((q) => !answers[q.id])}
        >
          제출
        </button>
      </div>
    </div>
  );
}