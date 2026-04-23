async def pause_node(state):
    # LangGraph의 interrupt_before 설정으로 인해 이 지점에서 멈춤
    return {"phase": "human_turn"}