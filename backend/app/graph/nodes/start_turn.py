from app.db.session_store import game_sessions
from app.services.websocket_service import manager
from app.utils.game_helpers import get_filtered_state

async def start_turn_node(state):
    session_id = state['session_id']
    engine = game_sessions.get_game(session_id)
    
    # 1. 카드 분배가 안 됐다면 분배
    if not engine.hands_dealt:
        engine.deal_initial_hands()

    # 2. 유저에게 필터링된 정보 전송
    for player_id in engine.all_player_ids:
        filtered_data = get_filtered_state(engine, player_id)
        await manager.send_personal_message(player_id, {
            "type": "game_state",
            "payload": filtered_data
        })