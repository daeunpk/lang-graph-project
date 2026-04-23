from fastapi import APIRouter, HTTPException
from app.schemas.game import GameStateSchema
from app.schemas.action import GameActionRequest, ActionResponse
from app.services.game_service import GameService
from app.db.session_store import game_sessions

router = APIRouter(prefix="/game", tags=["game"])

@router.post("/create")
async def create_game(req: dict):
    # req: { condition: str, humanName: str }
    session_id, p_id = await GameService.create_new_game(req['condition'], req['humanName'])
    return {"sessionId": session_id, "playerId": p_id}

@router.get("/{session_id}/state")
async def get_state(session_id: str):
    engine = game_sessions.get_game(session_id)
    if not engine: raise HTTPException(status_code=404, detail="Session not found")
    return engine.get_full_state()

@router.post("/{session_id}/action")
async def take_action(session_id: str, req: GameActionRequest):
    success, msg = await GameService.perform_action(session_id, req.playerId, req.actionType, req.model_dump())
    return {"success": success, "message": msg}

@router.get("/{session_id}/result")
async def get_result(session_id: str):
    engine = game_sessions.get_game(session_id)
    if not engine: raise HTTPException(status_code=404, detail="Session not found")
    state = engine.get_full_state()
    return {
        "teamScore": state["teamScore"],
        "individualScore": next(p["individualScore"] for p in state["players"] if p["isHuman"]),
        "totalTurns": state["currentTurn"],
        "errorCount": state["board"]["errorCount"],
        "successfulInstalls": sum(sum(1 for s in z["slots"] if s) for z in state["board"]["zones"]),
        "gameOverReason": state["gameOverReason"]
    }