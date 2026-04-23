from typing import TypedDict, List, Dict, Any, Annotated, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
import operator

class GameGraphState(TypedDict):
    session_id: str
    condition: str
    current_turn: int
    phase: str
    observations: Dict[str, Any]
    reports: Annotated[List[Dict[str, Any]], operator.add]
    human_action: Optional[Dict[str, Any]]
    next_node: str
    is_game_over: bool

shared_checkpoint = MemorySaver()

def create_game_graph():
    workflow = StateGraph(GameGraphState)

    # 노드 등록 (각 파일에서 정의된 함수들 연결)
    from app.graph.nodes.start_turn import start_turn_node
    from app.graph.nodes.build_observations import build_obs_node
    from app.graph.nodes.agent_nodes import agent_node_factory
    from app.graph.nodes.collect_reports import collect_reports_node
    from app.graph.nodes.pause_for_human import pause_node
    from app.graph.nodes.route_action import route_action_node
    from app.graph.nodes.install import install_node
    from app.graph.nodes.discard import discard_node
    from app.graph.nodes.broadcast import broadcast_node
    from app.graph.nodes.ask_followup import ask_followup_node
    from app.graph.nodes.resolve_turn import resolve_turn_node
    from app.graph.nodes.check_end import check_end_node

    workflow.add_node("start_turn", start_turn_node)
    workflow.add_node("build_obs", build_obs_node)
    workflow.add_node("agent_a", agent_node_factory("agent_1"))
    workflow.add_node("agent_b", agent_node_factory("agent_2"))
    workflow.add_node("agent_c", agent_node_factory("agent_3"))
    workflow.add_node("collect_reports", collect_reports_node)
    workflow.add_node("pause_for_human", pause_node)
    workflow.add_node("route_action", route_action_node)
    workflow.add_node("install", install_node)
    workflow.add_node("discard", discard_node)
    workflow.add_node("broadcast", broadcast_node)
    workflow.add_node("ask_followup", ask_followup_node)
    workflow.add_node("resolve_turn", resolve_turn_node)
    workflow.add_node("check_end", check_end_node)

    # 엣지 정의
    workflow.set_entry_point("start_turn")
    workflow.add_edge("start_turn", "build_obs")
    workflow.add_edge("build_obs", "agent_a")
    workflow.add_edge("agent_a", "agent_b")
    workflow.add_edge("agent_b", "agent_c")
    workflow.add_edge("agent_c", "collect_reports")
    workflow.add_edge("collect_reports", "pause_for_human")
    
    # 인간 액션 라우팅
    workflow.add_edge("pause_for_human", "route_action")
    
    workflow.add_conditional_edges(
        "route_action",
        lambda x: x["next_node"],
        {
            "install": "install",
            "discard": "discard",
            "broadcast": "broadcast",
            "ask_followup": "ask_followup",
            "rest": "resolve_turn"
        }
    )

    workflow.add_edge("install", "resolve_turn")
    workflow.add_edge("discard", "resolve_turn")
    workflow.add_edge("broadcast", "pause_for_human") # 브로드캐스트 후 다시 대기
    workflow.add_edge("ask_followup", "pause_for_human") # 질문 후 응답 받고 다시 대기
    
    workflow.add_edge("resolve_turn", "check_end")
    workflow.add_conditional_edges(
        "check_end",
        lambda x: "end" if x["is_game_over"] else "start_turn",
        {
            "end": END,
            "start_turn": "start_turn"
        }
    )

    return workflow.compile(checkpointer=MemorySaver(), interrupt_before=["pause_for_human"])