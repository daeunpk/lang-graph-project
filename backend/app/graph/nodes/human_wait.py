from app.db.session_store import game_sessions
from app.services.websocket_service import manager
from app.utils.game_helpers import get_filtered_state

async def human_wait_node(state):
    session_id = state.get('session_id')
    engine = game_sessions.get_game(session_id)
    
    if not engine:
        return state

    # 1. 페이즈를 인간 턴으로 변경
    engine.current_phase = "human_turn"
    
    # 2. 로그 전송: 이제 당신의 차례입니다.
    await manager.broadcast_to_session(session_id, {
        "type": "log_entry",
        "payload": {"content": "에이전트들의 행동이 끝났다. 이제 당신의 차례다.", "type": "info"}
    })

    # 3. 최신 상태 전송 (조작 활성화를 위해)
    await manager.broadcast_to_session(session_id, {
        "type": "game_state",
        "payload": get_filtered_state(engine, engine.human_id)
    })

    # LangGraph의 'interrupt' 기능을 사용하기 위해 상태를 그대로 반환하며 멈춤
    return state