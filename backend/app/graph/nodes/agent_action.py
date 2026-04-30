import asyncio
import random
from app.db.session_store import game_sessions
from app.services.websocket_service import manager
from app.utils.game_helpers import get_filtered_state

async def agent_action_node(state, agent_id):
    session_id = state['session_id']
    engine = game_sessions.get_game(session_id)
    if not engine: return state

    # [지침서 6번] 에이전트 사고 시간 시각화 시작 신호 전송
    await manager.broadcast_to_session(session_id, {
        "type": "generating_start",
        "payload": {"agentId": agent_id}
    })

    # 사고의 흐름 시간 시뮬레이션 (2~4초 랜덤)
    await asyncio.sleep(random.uniform(2.0, 4.0))

    # 에이전트 의사 결정 및 액션 처리
    decision = engine.get_agent_decision(agent_id)
    success, msg = engine.process_action(agent_id, decision['type'], decision['payload'])
    
    # 추론 종료 신호 전송
    await manager.broadcast_to_session(session_id, {
        "type": "generating_end",
        "payload": {"agentId": agent_id}
    })

    # 로그 전송
    log_msg = f"{engine.players[agent_id]['name']}이(가) {decision['type']} 행동을 완료했다."
    await manager.broadcast_to_session(session_id, {
        "type": "log_entry",
        "payload": {
            "content": log_msg,
            "type": "action",
            "turn": engine.current_turn
        }
    })

    if decision["type"] == "give_info":
        await manager.broadcast_to_session(session_id, {
            "type": "agent_message",
            "payload": {
                "messageId": f"msg_{random.random()}_{agent_id}",
                "agentId": agent_id,
                "agentName": engine.players[agent_id]["name"],
                "content": decision["payload"].get("message", "정보를 공유했습니다."),
                "messageType": "free_chat",
                "turn": engine.current_turn,
            }
        })

    # 비대칭 정보가 적용된 상태 전송
    await manager.broadcast_to_session(session_id, {
        "type": "game_state",
        "payload": get_filtered_state(engine, engine.human_id)
    })
    
    return state

# [오류 해결 포인트] factory.py에서 임포트할 수 있도록 함수 추가
async def agent_1_node(state): return await agent_action_node(state, "agent_1")
async def agent_2_node(state): return await agent_action_node(state, "agent_2")
async def agent_3_node(state): return await agent_action_node(state, "agent_3")
