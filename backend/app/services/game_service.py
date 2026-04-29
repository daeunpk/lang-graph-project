from app.graph.factory import get_graph
from app.db.session_store import game_sessions
from app.engine.game_engine import GameEngine
import asyncio

class GameService:
    @staticmethod
    async def create_new_game(condition, human_name):
        engine = GameEngine(condition, human_name)
        game_sessions.save_game(engine.session_id, engine)
        
        # 그래프 초기 실행
        graph = get_graph()
        initial_state = {
            "session_id": engine.session_id,
            "condition": condition,
            "current_turn": 1,
            "reports": [],
            "is_game_over": False
        }
        # 에이전트 보고 단계까지 진행 후 pause_for_human에서 멈춤
        config = {"configurable": {"thread_id": engine.session_id}}
        
        async def run_initial_graph():
            await asyncio.sleep(1.5) # 소켓 연결을 위한 여유 시간
            await graph.ainvoke(initial_state, config=config)
            
        asyncio.create_task(run_initial_graph())
        
        return engine.session_id, engine.human_id


    @staticmethod
    async def perform_action(session_id, p_id, action_type, payload):
        engine = game_sessions.get_game(session_id)
        graph = get_graph()
        
        # 현재 그래프 상태 가져오기 (실제 구현 시 state_store 사용)
        current_state = await graph.aget_state({"configurable": {"thread_id": session_id}})
        
        # 인간 액션 주입 및 Resume
        updated_state = {
            **current_state.values,
            "human_action": payload
        }
        await graph.ainvoke(updated_state, {"configurable": {"thread_id": session_id}})
        
        return True, "Action processed through graph"