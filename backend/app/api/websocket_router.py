from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_service import manager
from app.db.session_store import game_sessions
from app.utils.game_helpers import get_filtered_state
import asyncio

router = APIRouter()

@router.websocket("/ws/game/{session_id}")
async def game_websocket(websocket: WebSocket, session_id: str):
    # 1. 연결 수락
    await manager.connect(session_id, websocket)
    
    try:
        # 2. 게임 엔진 확인
        engine = game_sessions.get_game(session_id)
        if engine:
            # 초기 상태 전송
            await websocket.send_json({"type": "game_state", "payload": get_filtered_state(engine, engine.human_id)})
            # 인간 손패 전송
            human_hand = get_filtered_state(engine, engine.human_id)["players"][0]["hand"]
            await websocket.send_json({"type": "hand_update", "payload": human_hand})
        
        # 3. 중요: 연결을 유지하기 위한 무한 루프
        while True:
            # 클라이언트로부터 메시지를 기다리며 대기 (연결 유지용)
            data = await websocket.receive_text()
            
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(session_id, websocket)
