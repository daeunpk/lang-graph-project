from app.db.session_store import game_sessions

async def discard_node(state):
    action = state["human_action"]
    engine = game_sessions.get_game(state['session_id'])
    success, msg = engine.process_action(action["playerId"], "discard", action)
    return {"observations": {"last_action_msg": msg}}