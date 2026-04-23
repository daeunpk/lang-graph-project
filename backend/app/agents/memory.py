from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentMemory(BaseModel):
    remembered_hints: List[Dict[str, Any]] = Field(default_factory=list)
    suspected_false_cards: List[str] = Field(default_factory=list) # card_ids
    last_reports: List[Dict[str, Any]] = Field(default_factory=list)
    trust_in_human: float = 0.8
    trust_in_others: Dict[str, float] = Field(default_factory=lambda: {"agent_1": 0.8, "agent_2": 0.8, "agent_3": 0.8})
    last_failed_action: Optional[Dict[str, Any]] = None
    recent_broadcasts: List[str] = Field(default_factory=list)

class MemoryStore:
    def __init__(self):
        self._memories: Dict[str, Dict[str, AgentMemory]] = {} # {session_id: {agent_id: AgentMemory}}

    def get_memory(self, session_id: str, agent_id: str) -> AgentMemory:
        if session_id not in self._memories:
            self._memories[session_id] = {}
        if agent_id not in self._memories[session_id]:
            self._memories[session_id][agent_id] = AgentMemory()
        return self._memories[session_id][agent_id]

    def update_memory(self, session_id: str, agent_id: str, data: Dict[str, Any]):
        memory = self.get_memory(session_id, agent_id)
        for key, value in data.items():
            if hasattr(memory, key):
                setattr(memory, key, value)

agent_memory_store = MemoryStore()