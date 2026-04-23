from app.services.websocket_service import manager

async def broadcast_node(state):
    action = state["human_action"]
    # 모든 에이전트 메모리에 브로드캐스트 기록 추가 가능
    await manager.broadcast_to_session(state['session_id'], {
        "type": "agent_message",
        "payload": {
            "messageId": "br_" + str(datetime.now().timestamp()),
            "agentId": action["playerId"],
            "agentName": "리더(인간)",
            "content": action["message"],
            "turn": state["current_turn"],
            "timestamp": datetime.now().isoformat()
        }
    })
    return {"human_action": None}