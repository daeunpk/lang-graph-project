from app.db.session_store import game_sessions
from app.services.websocket_service import manager

async def resolve_turn_node(state):
    engine = game_sessions.get_game(state['session_id'])
    # 턴 마무리 (HP 회복, 카드 드로우 등은 이미 엔진에서 처리됨)
    await manager.broadcast_to_session(state['session_id'], {
        "type": "game_state",
        "payload": engine.get_full_state()
    })
    return {"current_turn": state["current_turn"] + 1}