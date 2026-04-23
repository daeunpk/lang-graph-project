from app.db.session_store import game_sessions

async def build_obs_node(state):
    engine = game_sessions.get_game(state['session_id'])
    # 엔진 상태에서 에이전트들이 볼 수 있는 관찰 정보 추출
    obs = {
        "turn": state['current_turn'],
        "board": engine.get_full_state()['board'],
        "hp": engine.players[engine.human_id]['hp'],
        "team_score": engine.team_score,
        "threshold_reached": engine.threshold_reached
    }
    return {"observations": obs}