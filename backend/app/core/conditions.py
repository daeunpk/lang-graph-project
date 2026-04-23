from enum import Enum

class GameCondition(str, Enum):
    LEADER_COOPERATIVE = "leader_cooperative"
    LEADER_COMPETITIVE = "leader_competitive"
    LEADER_COOPETITION = "leader_coopetition"
    NO_LEADER_COOPERATIVE = "no_leader_cooperative"
    NO_LEADER_COMPETITIVE = "no_leader_competitive"
    NO_LEADER_COOPETITION = "no_leader_coopetition"

class InteractionMode(str, Enum):
    LEADER = "leader"
    FREE = "free"

class ScoringMode(str, Enum):
    COOPERATIVE = "cooperative"
    COMPETITIVE = "competitive"
    COOPETITION = "coopetition"

def get_modes_from_condition(condition: GameCondition):
    is_leader = condition.startswith("leader_")
    interaction = InteractionMode.LEADER if is_leader else InteractionMode.FREE
    
    if "_cooperative" in condition:
        scoring = ScoringMode.COOPERATIVE
    elif "_competitive" in condition:
        scoring = ScoringMode.COMPETITIVE
    else:
        scoring = ScoringMode.COOPETITION
        
    return interaction, scoring