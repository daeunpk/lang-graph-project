import asyncio
import random
from app.db.session_store import game_sessions
from app.services.websocket_service import manager
from app.utils.game_helpers import get_filtered_state

async def agent_action_node(state, agent_id):
    session_id = state['session_id']
    engine = game_sessions.get_game(session_id)
    if not engine:
        return state

    # [지침서 6번] 에이전트 사고 시간 (2~4초 사이 랜덤)
    await asyncio.sleep(random.uniform(2.0, 4.0))

    # 1. 에이전트 의사 결정
    decision = engine.get_agent_decision(agent_id)
    
    # 2. 엔진에 액션 반영
    success, msg = engine.process_action(agent_id, decision['type'], decision['payload'])
    
    # 3. 로그 전송
    log_msg = f"{engine.players[agent_id]['name']}이(가) {decision['type']} 행동을 완료했다."
    await manager.broadcast_to_session(session_id, {
        "type": "log_entry",
        "payload": {"content": log_msg, "type": "action"}
    })

    # 4. 인간 플레이어 시점의 필터링된 상태 전송
    await manager.broadcast_to_session(session_id, {
        "type": "game_state",
        "payload": get_filtered_state(engine, engine.human_id)
    })
    
    return state

async def agent_1_node(state): return await agent_action_node(state, "agent_1")
async def agent_2_node(state): return await agent_action_node(state, "agent_2")
async def agent_3_node(state): return await agent_action_node(state, "agent_3")