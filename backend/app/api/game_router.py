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
    players = state["players"]
    human = next(p for p in players if p["isHuman"])
    scoring_mode = state["config"]["scoringMode"]
    reward_rule = {
        "cooperative": "기본 완성 여부, 사람 플레이어의 남은 HP, 협력 행동량을 함께 반영",
        "competitive": "기본 완성 여부와 사람 플레이어의 남은 HP를 반영하되, 협력 행동량을 별도 지표로 기록",
        "coopetition": "기본 완성 달성 후 사람 플레이어의 남은 HP와 협력 행동량을 함께 반영",
    }.get(scoring_mode, "성공 여부, HP, 협력 정도 기준")
    team_collaboration_actions = sum(1 for event in engine.logs if event.get("eventType") == "give_info")
    human_collaboration_actions = sum(
        1
        for event in engine.logs
        if event.get("eventType") == "give_info" and event.get("actorId") == human["playerId"]
    )
    if human_collaboration_actions >= 5:
        cooperation_level = "높음"
    elif human_collaboration_actions >= 2:
        cooperation_level = "보통"
    else:
        cooperation_level = "낮음"
    reward_report = {
        "success": state["targetReached"],
        "hpRemaining": human["hp"],
        "maxHp": human["maxHp"],
        "hpRatio": round(human["hp"] / human["maxHp"], 3) if human["maxHp"] else 0,
        "humanCollaborationActions": human_collaboration_actions,
        "teamCollaborationActions": team_collaboration_actions,
        "cooperationLevel": cooperation_level,
        "summary": (
            f"성공 여부: {'성공' if state['targetReached'] else '미달성'} / "
            f"남은 HP: {human['hp']}/{human['maxHp']} / "
            f"협력 정도: {cooperation_level}"
        ),
    }
    leaderboard = sorted(
        [
            {
                "playerId": p["playerId"],
                "name": p["name"],
                "isHuman": p["isHuman"],
                "successfulInstalls": p["individualScore"],
                "rewardEligible": scoring_mode != "coopetition" or state["thresholdReached"],
            }
            for p in players
        ],
        key=lambda p: p["successfulInstalls"],
        reverse=True,
    )
    return {
        "teamScore": state["teamScore"],
        "individualScore": human["individualScore"],
        "totalTurns": state["currentTurn"],
        "errorCount": state["board"]["errorCount"],
        "successfulInstalls": sum(sum(1 for s in z["slots"] if s) for z in state["board"]["zones"]),
        "gameOverReason": state["gameOverReason"],
        "scoringMode": scoring_mode,
        "rewardRule": reward_rule,
        "teamScoreThreshold": state["teamScoreThreshold"],
        "thresholdReached": state["thresholdReached"],
        "completionTargetScore": state["completionTargetScore"],
        "completionTargetNumber": state["completionTargetNumber"],
        "maxTeamScore": state["maxTeamScore"],
        "targetReached": state["targetReached"],
        "rewardReport": reward_report,
        "leaderboard": leaderboard,
    }

@router.get("/{session_id}/logs")
async def get_logs(session_id: str):
    engine = game_sessions.get_game(session_id)
    if not engine: raise HTTPException(status_code=404, detail="Session not found")
    return {
        "sessionId": session_id,
        "events": engine.logs,
        "count": len(engine.logs),
    }
