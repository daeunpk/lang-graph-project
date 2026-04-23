from datetime import datetime
from app.services.websocket_service import manager

async def ask_followup_node(state):
    action = state["human_action"]
    agent_id = action["targetAgentId"]
    question = action["question"]
    
    # 즉시 응답 생성 시뮬레이션
    response = {
        "reportId": f"fup_{datetime.now().timestamp()}",
        "agentId": agent_id,
        "agentName": "Agent", # 실제 이름 매핑 필요
        "turn": state["current_turn"],
        "content": f"'{question}'에 대한 답변입니다: 현재 분석으로는 해당 카드의 설치를 보류하는 것이 논리적입니다.",
        "confidence": 0.9,
        "isFollowupResponse": True,
        "followupQuestion": question,
        "timestamp": datetime.now().isoformat()
    }
    
    await manager.broadcast_to_session(state['session_id'], {
        "type": "agent_report",
        "payload": response
    })
    
    # 질문 후 다시 인간 턴으로 (기다림)
    return {"human_action": None}