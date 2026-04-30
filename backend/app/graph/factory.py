from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver # 추가
from app.graph.nodes.start_turn import start_turn_node
from app.graph.nodes.agent_action import agent_1_node, agent_2_node, agent_3_node
from app.graph.nodes.human_wait import human_wait_node

def get_graph():
    workflow = StateGraph(dict)

    # 노드 등록
    workflow.add_node("start_turn", start_turn_node)
    workflow.add_node("agent_1", agent_1_node)
    workflow.add_node("agent_2", agent_2_node)
    workflow.add_node("agent_3", agent_3_node)
    workflow.add_node("human_wait", human_wait_node)

    # 순서 연결: 에이전트 순차 행동 -> 인간 대기
    workflow.set_entry_point("start_turn")
    workflow.add_edge("start_turn", "agent_1")
    workflow.add_edge("agent_1", "agent_2")
    workflow.add_edge("agent_2", "agent_3")
    workflow.add_edge("agent_3", "human_wait")
    
    # 인간 액션 후 종료 (또는 다음 턴 루프)
    workflow.add_edge("human_wait", END)

    # [핵심] 체크포인터 설정하여 500 에러 해결
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory, interrupt_before=["human_wait"])