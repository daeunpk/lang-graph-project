from app.db.session_store import game_sessions
from app.engine.game_engine import GameEngine
from app.engine.rules import GameRules
from app.services.websocket_service import manager
from app.utils.game_helpers import get_filtered_state
import asyncio
from datetime import datetime

class GameService:
    @staticmethod
    async def create_new_game(condition, human_name):
        engine = GameEngine(condition, human_name)
        game_sessions.save_game(engine.session_id, engine)

        async def run_initial_graph():
            await asyncio.sleep(0.8)
            await GameService._run_agent_round(engine.session_id)
            
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
            engine.current_actor_id = "agent_1"
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
            latest_event = engine.logs[-1] if engine.logs else {}
            public_message = latest_event.get("payload", {}).get("publicMessage")
            await manager.broadcast_to_session(session_id, {
                "type": "agent_message",
                "payload": {
                    "messageId": f"msg_{datetime.now().timestamp()}",
                    "agentId": p_id,
                    "agentName": engine.players[p_id]["name"],
                    "content": public_message or payload.get("message") or f"{target['name']}에게 정보를 전달했습니다.",
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

            engine.current_phase = "agent_turn"
            engine.current_actor_id = agent_id
            engine.turn_started_at = datetime.now().isoformat()

            await manager.broadcast_to_session(session_id, {
                "type": "game_state",
                "payload": get_filtered_state(engine, engine.human_id)
            })

            await manager.broadcast_to_session(session_id, {
                "type": "generating_start",
                "payload": {"agentId": agent_id}
            })

            decision = engine.get_agent_decision(agent_id)
            report = GameService._build_agent_report(engine, agent_id, decision)
            engine._record_event("agent_report", agent_id, {
                "reportId": report["reportId"],
                "suggestedAction": report["suggestedAction"],
                "confidence": report["confidence"],
                "content": report["content"],
                "uncertainties": report["uncertainties"],
            }, True, "Agent report generated")
            await manager.broadcast_to_session(session_id, {
                "type": "agent_report",
                "payload": report
            })

            await asyncio.sleep(GameRules.TURN_TIME_LIMIT)

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
                latest_event = engine.logs[-1] if engine.logs else {}
                public_message = latest_event.get("payload", {}).get("publicMessage")
                await manager.broadcast_to_session(session_id, {
                    "type": "agent_message",
                    "payload": {
                        "messageId": f"msg_{datetime.now().timestamp()}",
                        "agentId": agent_id,
                        "agentName": engine.players[agent_id]["name"],
                        "content": public_message or decision["payload"].get("message", "정보를 공유했습니다."),
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
            engine.current_actor_id = engine.human_id
            engine.turn_started_at = datetime.now().isoformat()

        await manager.broadcast_to_session(session_id, {
            "type": "game_state",
            "payload": get_filtered_state(engine, engine.human_id)
        })

    @staticmethod
    def _build_agent_report(engine, agent_id, decision):
        agent = engine.players[agent_id]
        action_type = decision["type"]
        payload = decision.get("payload", {})

        action_label = {
            "install": "카드 설치",
            "give_info": "정보 제공",
            "discard": "정보 갱신",
            "rest": "휴식",
        }.get(action_type, action_type)

        reason = "현재 보드 순서, 손패, HP 상태를 기준으로 선택했습니다."
        directive = engine._latest_leader_directive_for(agent_id)
        if action_type == "install":
            reason = f"{payload.get('targetZone', '해당')} 구역의 다음 순서에 맞는 카드가 있다고 판단했습니다."
        elif action_type == "give_info":
            reason = "팀원이 볼 수 없는 카드 뒷면 정보를 보완하는 것이 더 중요하다고 판단했습니다."
        elif action_type == "discard":
            reason = "현재 손패에서 설치 우선도가 낮은 카드를 갱신하는 편이 낫다고 판단했습니다."
        elif action_type == "rest":
            reason = "HP를 회복해 다음 행동 여지를 확보해야 한다고 판단했습니다."

        if directive:
            reason = f"리더 지시('{directive['message']}')를 고려했습니다. {reason}"
        flow = engine.team_flow

        return {
            "reportId": f"rep_{datetime.now().timestamp()}_{agent_id}",
            "agentId": agent_id,
            "agentName": agent["name"],
            "role": agent.get("role", "flow_analyst"),
            "turn": engine.current_turn,
            "content": (
                f"이번 턴 제안 행동: {action_label}\n"
                f"현재 팀 흐름: {flow.get('label', '균형')} - {flow.get('description', '')}\n"
                f"{reason}\n"
                f"내 기억: {GameService._format_memory(engine, agent_id)}"
            ),
            "confidence": 0.72 if action_type in ["install", "give_info"] else 0.58,
            "suggestedAction": action_type,
            "uncertainties": [
                "인간 플레이어가 기억한 힌트 상태",
                "다른 팀원의 다음 행동 의도",
                "리더 지시와 내 손패 기억의 불일치 가능성" if directive else "리더 지시 없음",
            ],
            "isFollowupResponse": False,
            "timestamp": datetime.now().isoformat()
        }

    @staticmethod
    def _format_memory(engine, agent_id):
        memories = engine._agent_memory_summary(agent_id)
        if not memories:
            return "손패 없음"

        chunks = []
        for item in memories:
            zone = item["knownZone"] or "색 미확인"
            truth = item["knownTruth"] or "진위 미확인"
            chunks.append(f"{item['position']}번({item['number']}): {zone}, {truth}")
        return " / ".join(chunks)
