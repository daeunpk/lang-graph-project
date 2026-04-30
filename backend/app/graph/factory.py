from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver  # 추가
from app.graph.nodes.start_turn import start_turn_node
from app.graph.nodes.agent_action import agent_1_node, agent_2_node, agent_3_node
from app.graph.nodes.human_wait import human_wait_node

def get_graph():
    workflow = StateGraph(dict)

    workflow.add_node("start_turn", start_turn_node)
    workflow.add_node("agent_1", agent_1_node)
    workflow.add_node("agent_2", agent_2_node)
    workflow.add_node("agent_3", agent_3_node)
    workflow.add_node("human_wait", human_wait_node)

    workflow.set_entry_point("start_turn")
    workflow.add_edge("start_turn", "agent_1")
    workflow.add_edge("agent_1", "agent_2")
    workflow.add_edge("agent_2", "agent_3")
    workflow.add_edge("agent_3", "human_wait")
    
    workflow.add_edge("human_wait", END)

    # 체크포인터 설정으로 500 에러 예방
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory, interrupt_before=["human_wait"])