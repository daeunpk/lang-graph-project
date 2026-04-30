# backend/app/graph/nodes/agent_action.py (신규 생성)

import asyncio
from app.db.session_store import game_sessions
from app.services.websocket_service import manager
from app.utils.game_helpers import get_filtered_state

async def agent_action_node(state, agent_id):
    session_id = state['session_id']
    engine = game_sessions.get_game(session_id)
    if not engine:
        return state

    # 1. 에이전트 의사 결정
    decision = engine.get_agent_decision(agent_id)
    
    # 2. 엔진에 액션 반영
    success, msg = engine.process_action(agent_id, decision['type'], decision['payload'])
    
    # 3. 로그 메시지 생성 및 전송
    log_msg = f"{engine.players[agent_id]['name']}이(가) {decision['type']} 액션을 수행했다."
    await manager.broadcast_to_session(session_id, {
        "type": "log_entry",
        "payload": {"content": log_msg, "type": "action"}
    })

    # 4. 필터링된 상태를 즉시 브로드캐스트 (화면 업데이트)
    # 인간 유저에게는 자신의 카드가 가려진 상태로 전달함
    await manager.broadcast_to_session(session_id, {
        "type": "game_state",
        "payload": get_filtered_state(engine, engine.human_id)
    })

    # 5. 시각적 연출을 위해 1초 대기 (에이전트가 생각하고 행동하는 느낌)
    await asyncio.sleep(1.2)
    
    return state

# 각 에이전트별 래퍼 함수들
async def agent_1_node(state): return await agent_action_node(state, "agent_1")
async def agent_2_node(state): return await agent_action_node(state, "agent_2")
async def agent_3_node(state): return await agent_action_node(state, "agent_3")