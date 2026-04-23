from app.db.session_store import game_sessions

async def check_end_node(state):
    engine = game_sessions.get_game(state['session_id'])
    return {"is_game_over": engine.is_game_over}