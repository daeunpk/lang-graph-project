import random
from typing import Dict, Any
from app.agents.prompts import SYSTEM_BASE_PROMPT, ROLE_DESCRIPTIONS, CONDITION_CONTEXTS

class AgentPolicy:
    @staticmethod
    def get_strategy_adjustments(condition: str, role: str, memory: Any) -> Dict[str, Any]:
        # 조건별 행동 확률 및 톤 조절 로직
        adjustments = {"honesty": 1.0, "risk_aversion": 0.5}
        
        if "competitive" in condition:
            adjustments["honesty"] = 0.6
        elif "coopetition" in condition:
            adjustments["honesty"] = 0.9 # 초기값
            
        return adjustments

    @staticmethod
    def generate_fallback_report(role: str, condition: str, obs: Dict[str, Any]) -> Dict[str, Any]:
        # LLM 장애 시나리오 또는 빠른 테스트용 Rule-based 생성
        confidence = round(random.uniform(0.4, 0.8), 2)
        return {
            "summary": f"{role}의 관점에서 현재 보드는 분석 중입니다.",
            "reason": "보드에 설치된 카드와 손패의 관계를 대조 중이나 데이터가 부족합니다.",
            "confidence": confidence,
            "recommended_action": "rest" if obs.get('hp', 5) < 2 else "hold",
            "uncertainties": ["카드 번호 3번의 진위 여부", "청색 구역의 다음 순서"]
        }