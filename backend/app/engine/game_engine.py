import uuid
import random
from datetime import datetime
from app.core.conditions import get_modes_from_condition
from app.engine.rules import GameRules

class GameEngine:
    def __init__(self, condition, human_name):
        self.session_id = str(uuid.uuid4())
        self.condition = condition
        self.interaction_mode, self.scoring_mode = get_modes_from_condition(condition)
        
        self.current_turn = 1
        self.current_phase = "agent_reporting"
        self.turn_started_at = datetime.now().isoformat()
        self.is_game_over = False
        self.game_over_reason = ""
        
        self.team_score = 0
        self.error_count = 0
        self.threshold_reached = False
        
        # 보드 구역 초기화 (1번부터 시작)
        self.zones = {z: {"slots": [None]*5, "next": 1} for z in GameRules.ZONES}
        
        self.human_id = str(uuid.uuid4())
        self.players = {
            self.human_id: {
                "id": self.human_id, "name": human_name, "hp": GameRules.MAX_HP, 
                "score": 0, "is_human": True, "hand": []
            },
            "agent_1": {
                "id": "agent_1", "name": "Flow-1", "hp": GameRules.MAX_HP, 
                "score": 0, "is_human": False, "role": "flow_analyst", "hand": []
            },
            "agent_2": {
                "id": "agent_2", "name": "Risk-2", "hp": GameRules.MAX_HP, 
                "score": 0, "is_human": False, "role": "risk_analyst", "hand": []
            },
            "agent_3": {
                "id": "agent_3", "name": "Res-3", "hp": GameRules.MAX_HP, 
                "score": 0, "is_human": False, "role": "resource_analyst", "hand": []
            }
        }
        
        self.deck = self._generate_deck()
        self.hands_dealt = False
        self.deal_initial_hands()
        self.logs = []

    def _generate_deck(self):
        deck = []
        for z in GameRules.ZONES:
            for n in GameRules.NUMBERS:
                truth = "misinformation" if random.random() < 0.2 else "genuine"
                deck.append({
                    "cardId": str(uuid.uuid4()),
                    "number": n,
                    "zone": z,
                    "truth": truth,
                    "hintHistory": []
                })
        random.shuffle(deck)
        return deck

    def deal_initial_hands(self):
        for p_id in self.players:
            self.players[p_id]["hand"] = []
            for _ in range(GameRules.HAND_SIZE):
                if self.deck:
                    self.players[p_id]["hand"].append(self.deck.pop())
        self.hands_dealt = True

    def get_full_state(self):
        return {
            "sessionId": self.session_id,
            "config": {
                "condition": self.condition,
                "interactionMode": self.interaction_mode,
                "scoringMode": self.scoring_mode,
                "sessionId": self.session_id,
                "playerId": self.human_id,
                "totalTurns": GameRules.TOTAL_TURNS,
                "turnTimeLimit": GameRules.TURN_TIME_LIMIT
            },
            "currentTurn": self.current_turn,
            "currentPhase": self.current_phase,
            "turnStartedAt": self.turn_started_at,
            "board": {
                "zones": [{"zoneId": k, "slots": v["slots"], "maxSlots": 5, "nextExpected": v["next"]} for k, v in self.zones.items()],
                "errorCount": self.error_count,
                "maxErrors": GameRules.MAX_ERRORS
            },
            "players": [
                {
                    "playerId": k, "name": v["name"], "isHuman": v["is_human"], 
                    "hp": v["hp"], "maxHp": GameRules.MAX_HP, 
                    "individualScore": v["score"], "handSize": len(v["hand"]),
                    "hand": v["hand"]
                } for k, v in self.players.items()
            ],
            "teamScore": self.team_score,
            "teamScoreThreshold": GameRules.THRESHOLD,
            "thresholdReached": self.threshold_reached,
            "isGameOver": self.is_game_over,
            "gameOverReason": self.game_over_reason
        }

    def process_action(self, p_id, action_type, payload):
        if self.is_game_over: return False, "Game is already over"
        res, msg = False, "Unknown action"
        
        if action_type == "install":
            res, msg = self._handle_install(p_id, payload['cardId'], payload['targetZone'])
        elif action_type == "discard":
            res, msg = self._handle_discard(p_id, payload['cardId'])
        elif action_type == "rest":
            res, msg = self._handle_rest(p_id)
        elif action_type in ["give_info", "broadcast"]:
            res, msg = self._handle_give_info(p_id, payload)
            
        if res:
            self._check_game_over()
            if action_type in ["install", "discard", "rest", "give_info", "broadcast"]:
                self.current_phase = "resolving"
        return res, msg

    def _handle_install(self, p_id, card_id, zone_id):
        player = self.players[p_id]
        card = next((c for c in player["hand"] if c["cardId"] == card_id), None)
        if not card: return False, "Card not in hand"
        if player["hp"] <= 0: return False, "Not enough HP"
        
        zone = self.zones[zone_id]
        # [복구] 항상 다음 기대 번호 자리에 설치
        actual_slot = zone["next"] - 1
        is_correct = (card["number"] == zone["next"] and card["zone"] == zone_id and card["truth"] == "genuine")
        player["hp"] -= 1
        
        if is_correct:
            zone["slots"][actual_slot] = {"cardId": card_id, "number": card["number"], "isCorrect": True}
            zone["next"] += 1
            t_delta, p_delta = GameRules.calculate_score(True, self.scoring_mode, self.threshold_reached)
            self.team_score += t_delta
            player["score"] += p_delta
            msg = "Installation successful"
        else:
            self.error_count += 1
            t_delta, p_delta = GameRules.calculate_score(False, self.scoring_mode, self.threshold_reached)
            self.team_score += t_delta
            player["score"] += p_delta
            msg = "Installation failed (Error)"
            
        player["hand"].remove(card)
        if self.deck: player["hand"].append(self.deck.pop())
        if self.team_score >= GameRules.THRESHOLD: self.threshold_reached = True
        return True, msg

    def _handle_discard(self, p_id, card_id):
        player = self.players[p_id]
        card = next((c for c in player["hand"] if c["cardId"] == card_id), None)
        if not card: return False, "Card not in hand"
        if player["hp"] >= GameRules.MAX_HP: return False, "HP is already full"
        player["hand"].remove(card)
        if self.deck: player["hand"].append(self.deck.pop())
        player["hp"] = min(GameRules.MAX_HP, player["hp"] + 1)
        return True, "Card discarded and HP recovered"

    def _handle_rest(self, p_id):
        player = self.players[p_id]
        if player["hp"] >= GameRules.MAX_HP: return False, "HP is already full"
        player["hp"] = min(GameRules.MAX_HP, player["hp"] + 1)
        return True, "Rested and recovered HP"

    def _handle_give_info(self, p_id, payload):
        player = self.players[p_id]
        if player["hp"] <= 0: return False, "Not enough HP"

        target_id = payload.get("targetPlayerId") or payload.get("targetAgentId")
        if target_id and target_id not in self.players:
            return False, "Target player not found"

        player["hp"] -= 1
        target_name = self.players[target_id]["name"] if target_id else "team"
        info_type = payload.get("infoType", "message")
        info_value = payload.get("infoValue", "")
        message = payload.get("message", "")

        self.logs.append({
            "turn": self.current_turn,
            "actorId": p_id,
            "targetId": target_id,
            "actionType": "give_info",
            "infoType": info_type,
            "infoValue": info_value,
            "message": message,
        })
        for card_id in payload.get("targetCardIds") or []:
            for card in self.players[target_id]["hand"]:
                if card["cardId"] == card_id:
                    card.setdefault("hintHistory", []).append({
                        "turn": self.current_turn,
                        "hintType": info_type,
                        "value": info_value,
                        "givenBy": p_id,
                        "message": message,
                    })
        return True, f"Shared {info_type} info with {target_name}"

    def _check_game_over(self):
        if self.error_count >= GameRules.MAX_ERRORS:
            self.is_game_over = True
            self.game_over_reason = "Max errors reached"
        elif any(p["hp"] <= 0 for p in self.players.values()):
            self.is_game_over = True
            self.game_over_reason = "A player has collapsed (HP 0)"
        elif self.current_turn > GameRules.TOTAL_TURNS:
            self.is_game_over = True
            self.game_over_reason = "Final turn reached"
            
    def get_agent_decision(self, agent_id):
        player = self.players.get(agent_id)
        if not player: return {"type": "rest", "payload": {}}

        for card in player["hand"]:
            for zone_id, zone in self.zones.items():
                if card["number"] == zone["next"] and card["zone"] == zone_id:
                    if card["truth"] == "genuine":
                        return {"type": "install", "payload": {"cardId": card["cardId"], "targetZone": zone_id}}
        
        human = self.players.get(self.human_id)
        if player["hp"] > 1 and human and human["hand"]:
            for card in human["hand"]:
                zone = self.zones.get(card["zone"])
                if zone and card["number"] == zone["next"] and card["truth"] == "genuine":
                    return {
                        "type": "give_info",
                        "payload": {
                            "targetPlayerId": self.human_id,
                            "targetCardIds": [card["cardId"]],
                            "infoType": "zone",
                            "infoValue": card["zone"],
                            "message": f"{card['zone']} 구역 정보가 중요합니다."
                        }
                    }

            card = human["hand"][0]
            return {
                "type": "give_info",
                "payload": {
                    "targetPlayerId": self.human_id,
                    "targetCardIds": [card["cardId"]],
                    "infoType": "truth",
                    "infoValue": card["truth"],
                    "message": "이 카드의 진위를 확인했습니다."
                }
            }

        if player["hp"] < 2: return {"type": "rest", "payload": {}}
        if player["hand"]: return {"type": "discard", "payload": {"cardId": player["hand"][0]["cardId"]}}
        return {"type": "rest", "payload": {}}
