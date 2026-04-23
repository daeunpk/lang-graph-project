async def route_action_node(state):
    action = state.get("human_action")
    if not action:
        return {"next_node": "rest"}
    
    a_type = action.get("actionType")
    return {"next_node": a_type}