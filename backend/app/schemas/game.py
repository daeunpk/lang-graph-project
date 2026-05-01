from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.core.conditions import GameCondition, InteractionMode, ScoringMode

class CardSchema(BaseModel):
    cardId: str
    number: Optional[int]
    zone: Optional[str]
    truth: str = "genuine"
    knownNumber: Optional[int] = None
    knownZone: Optional[str] = None
    knownTruth: Optional[str] = None

class ZoneStateSchema(BaseModel):
    zoneId: str
    slots: List[Optional[Dict[str, Any]]]
    maxSlots: int
    nextExpected: int

class BoardStateSchema(BaseModel):
    zones: List[ZoneStateSchema]
    errorCount: int
    maxErrors: int

class PlayerStateSchema(BaseModel):
    playerId: str
    name: str
    isHuman: bool
    hp: int
    maxHp: int
    individualScore: int
    handSize: int

class GameConfigSchema(BaseModel):
    condition: GameCondition
    interactionMode: InteractionMode
    scoringMode: ScoringMode
    sessionId: str
    playerId: str
    totalTurns: int
    turnTimeLimit: int

class GameStateSchema(BaseModel):
    sessionId: str
    config: GameConfigSchema
    currentTurn: int
    currentPhase: str
    board: BoardStateSchema
    players: List[PlayerStateSchema]
    teamScore: int
    teamScoreThreshold: int
    thresholdReached: bool
    completionTargetScore: int = 20
    completionTargetNumber: int = 4
    maxTeamScore: int = 20
    targetReached: bool = False
    isGameOver: bool
    gameOverReason: Optional[str] = None
