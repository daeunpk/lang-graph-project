from app.services.websocket_service import manager

async def collect_reports_node(state):
    # 생성된 모든 보고서를 소켓으로 전송
    for report in state['reports']:
        await manager.broadcast_to_session(state['session_id'], {
            "type": "agent_report",
            "payload": report
        })
    return {"phase": "human_turn"}