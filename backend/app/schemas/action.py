from pydantic import BaseModel
from typing import Optional, List, Union, Dict

class GameActionRequest(BaseModel):
    playerId: str
    actionType: str # install, discard, rest, broadcast, followup
    cardId: Optional[str] = None
    targetZone: Optional[str] = None
    targetSlot: Optional[int] = None
    message: Optional[str] = None
    targetAgentIds: Optional[Union[str, List[str]]] = None
    question: Optional[str] = None
    targetAgentId: Optional[str] = None
    targetPlayerId: Optional[str] = None
    infoType: Optional[str] = None
    infoValue: Optional[str] = None
    targetCardIds: Optional[List[str]] = None

class ActionResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None
