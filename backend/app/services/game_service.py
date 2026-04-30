from app.graph.factory import get_graph
from app.db.session_store import game_sessions
from app.engine.game_engine import GameEngine
from app.services.websocket_service import manager
from app.utils.game_helpers import get_filtered_state
import asyncio
from datetime import datetime

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
        if not engine:
            return False, "Session not found"

        success, msg = engine.process_action(p_id, action_type, payload)
        level = "success" if success else "error"

        if success:
            engine.current_phase = "agent_reporting"
            engine.turn_started_at = datetime.now().isoformat()

        await manager.broadcast_to_session(session_id, {
            "type": "action_result",
            "payload": {"success": success, "message": msg}
        })

        await manager.broadcast_to_session(session_id, {
            "type": "log_entry",
            "payload": {
                "logId": f"log_{datetime.now().timestamp()}",
                "turn": engine.current_turn,
                "level": level,
                "message": msg,
                "actorId": p_id,
                "actionType": action_type,
                "timestamp": datetime.now().isoformat()
            }
        })

        if action_type in ["give_info", "broadcast"] and success:
            target_id = payload.get("targetPlayerId") or payload.get("targetAgentId") or p_id
            target = engine.players.get(target_id, {"name": "팀"})
            await manager.broadcast_to_session(session_id, {
                "type": "agent_message",
                "payload": {
                    "messageId": f"msg_{datetime.now().timestamp()}",
                    "agentId": p_id,
                    "agentName": engine.players[p_id]["name"],
                    "content": payload.get("message") or f"{target['name']}에게 정보를 전달했습니다.",
                    "messageType": "free_chat",
                    "turn": engine.current_turn,
                    "timestamp": datetime.now().isoformat()
                }
            })

        await manager.broadcast_to_session(session_id, {
            "type": "game_state",
            "payload": get_filtered_state(engine, engine.human_id)
        })

        if success:
            asyncio.create_task(GameService._run_agent_round(session_id))

        return success, msg

    @staticmethod
    async def _run_agent_round(session_id):
        engine = game_sessions.get_game(session_id)
        if not engine:
            return

        for agent_id in ["agent_1", "agent_2", "agent_3"]:
            if engine.is_game_over:
                break

            await manager.broadcast_to_session(session_id, {
                "type": "generating_start",
                "payload": {"agentId": agent_id}
            })

            await asyncio.sleep(0.8)
            decision = engine.get_agent_decision(agent_id)
            success, msg = engine.process_action(
                agent_id,
                decision["type"],
                decision.get("payload", {})
            )
            if not engine.is_game_over:
                engine.current_phase = "agent_reporting"

            await manager.broadcast_to_session(session_id, {
                "type": "generating_end",
                "payload": {"agentId": agent_id}
            })

            await manager.broadcast_to_session(session_id, {
                "type": "log_entry",
                "payload": {
                    "logId": f"log_{datetime.now().timestamp()}",
                    "turn": engine.current_turn,
                    "level": "success" if success else "error",
                    "message": f"{engine.players[agent_id]['name']}: {msg}",
                    "actorId": agent_id,
                    "actionType": decision["type"],
                    "timestamp": datetime.now().isoformat()
                }
            })

            if success and decision["type"] == "give_info":
                await manager.broadcast_to_session(session_id, {
                    "type": "agent_message",
                    "payload": {
                        "messageId": f"msg_{datetime.now().timestamp()}",
                        "agentId": agent_id,
                        "agentName": engine.players[agent_id]["name"],
                        "content": decision["payload"].get("message", "정보를 공유했습니다."),
                        "messageType": "free_chat",
                        "turn": engine.current_turn,
                        "timestamp": datetime.now().isoformat()
                    }
                })

            await manager.broadcast_to_session(session_id, {
                "type": "game_state",
                "payload": get_filtered_state(engine, engine.human_id)
            })

        if not engine.is_game_over:
            engine.current_turn += 1
            engine.current_phase = "human_turn"
            engine.turn_started_at = datetime.now().isoformat()

        await manager.broadcast_to_session(session_id, {
            "type": "game_state",
            "payload": get_filtered_state(engine, engine.human_id)
        })
