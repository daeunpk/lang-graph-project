async def start_turn_node(state):
    print(f"--- TURN START: {state['current_turn']} ---")
    return {"phase": "agent_reporting", "reports": []}