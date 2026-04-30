from app.db.session_store import game_sessions
from app.services.websocket_service import manager
from app.utils.game_helpers import get_filtered_state

async def start_turn_node(state):
    session_id = state['session_id']
    engine = game_sessions.get_game(session_id)
    
    if not engine:
        return state

    # 1. 카드 분배 확인
    if not getattr(engine, 'hands_dealt', False):
        engine.deal_initial_hands()

    # 2. 인간 플레이어용 필터링 데이터 생성
    # (나머지 에이전트들은 서버 내부에서 전체 데이터를 보므로 상관없음)
    human_view_state = get_filtered_state(engine, engine.human_id)
    
    # 3. 소켓으로 전송
    await manager.broadcast_to_session(session_id, {
        "type": "game_state",
        "payload": human_view_state
    })
    
    return state