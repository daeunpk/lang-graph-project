import traceback
from app.agents.agent_runner import AgentRunner
from app.db.session_store import game_sessions
from app.services.websocket_service import manager

def agent_node_factory(agent_id: str):
    async def agent_node(state):
        session_id = state.get('session_id')
        print(f"\n[NODE DEBUG] >>> {agent_id} 노드 진입 (Session: {session_id})")
        
        try:
            # 1. UI에 생성 시작 알림
            print(f"[NODE DEBUG] 📡 {agent_id} 생성 시작 알림 전송...")
            await manager.broadcast_to_session(session_id, {
                "type": "generating_start", 
                "payload": {"agentId": agent_id}
            })

            # 2. 에이전트 실행 환경 준비
            runner = AgentRunner(session_id)
            engine = game_sessions.get_game(session_id)
            
            if not engine:
                print(f"[NODE ERROR] ❌ 세션을 찾을 수 없습니다: {session_id}")
                return {"reports": []}

            agent_data = engine.players.get(agent_id)
            
            # 3. 에이전트 실행 (LLM 호출)
            report = await runner.run_agent(
                agent_id, 
                agent_data, 
                state.get('observations', {}), 
                state.get('condition', 'normal')
            )
            
            # 4. [핵심] 보고서 실시간 전송 로그 확인
            print(f"[NODE DEBUG] 📤 {agent_id} 보고서 전송 시도: {report.get('reportId')}")
            await manager.broadcast_to_session(session_id, {
                "type": "agent_report",
                "payload": report
            })

            # 5. UI에 생성 종료 알림
            await manager.broadcast_to_session(session_id, {
                "type": "generating_end", 
                "payload": {"agentId": agent_id}
            })

            # 6. 이전 리포트들과 합쳐서 반환 (LangGraph State 업데이트)
            existing_reports = state.get('reports', [])
            return {"reports": existing_reports + [report]}

        except Exception as e:
            print(f"[NODE ERROR] ❌ {agent_id} 실행 중 예외 발생!")
            print(traceback.format_exc()) # 에러 위치 상세 출력
            return {"reports": state.get('reports', [])}

    return agent_node