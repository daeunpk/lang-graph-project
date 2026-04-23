from app.agents.agent_runner import AgentRunner
from app.db.session_store import game_sessions
from app.services.websocket_service import manager # 소켓 매니저 추가

def agent_node_factory(agent_id: str):
    async def agent_node(state):
        session_id = state['session_id']
        
        # UI에 "에이전트가 생각 중"임을 알림
        await manager.broadcast_to_session(session_id, {
            "type": "generating_start", 
            "payload": {"agentId": agent_id}
        })

        runner = AgentRunner(session_id)
        engine = game_sessions.get_game(session_id)
        agent_data = engine.players[agent_id]
        
        # 실제 로직 실행 (LLM 또는 Fallback)
        report = await runner.run_agent(
            agent_id, 
            agent_data, 
            state['observations'], 
            state['condition']
        )
        
        # [중요] 생성된 보고서를 즉시 UI로 전송
        await manager.broadcast_to_session(session_id, {
            "type": "agent_report",
            "payload": report
        })

        await manager.broadcast_to_session(session_id, {
            "type": "generating_end", 
            "payload": {"agentId": agent_id}
        })

        return {"reports": [report]}
    return agent_node