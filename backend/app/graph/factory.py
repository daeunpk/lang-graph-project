# backend/app/graph/factory.py 수정

from langgraph.graph import StateGraph, END
from app.graph.nodes.start_turn import start_turn_node
from app.graph.nodes.agent_action import agent_1_node, agent_2_node, agent_3_node
from app.graph.nodes.human_wait import human_wait_node
# human_wait_node 등 기존 임포트 유지

def get_graph():
    workflow = StateGraph(dict) # 간단한 상태 딕셔너리 사용

    # 노드 등록
    workflow.add_node("start_turn", start_turn_node)
    workflow.add_node("agent_1", agent_1_node)
    workflow.add_node("agent_2", agent_2_node)
    workflow.add_node("agent_3", agent_3_node)
    workflow.add_node("human_wait", human_wait_node)

    # 순서 연결: 에이전트 1 -> 2 -> 3 순서로 행동 후 인간 대기
    workflow.set_entry_point("start_turn")
    workflow.add_edge("start_turn", "agent_1")
    workflow.add_edge("agent_1", "agent_2")
    workflow.add_edge("agent_2", "agent_3")
    workflow.add_edge("agent_3", "human_wait")
    
    # 인간의 액션이 처리되면 다시 턴 시작으로 돌아가거나 종료 처리
    workflow.add_edge("human_wait", END) # 혹은 다음 턴으로 루프

    return workflow.compile()