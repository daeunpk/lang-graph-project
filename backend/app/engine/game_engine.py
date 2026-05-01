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
        self.current_actor_id = "agent_1"
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
        self.total_cards = len(self.deck)
        self.discard_pile = []
        self.hands_dealt = False
        self.deal_initial_hands()
        self.logs = []

    def _generate_deck(self):
        deck = []
        for z in GameRules.ZONES:
            zone_cards = []
            numbers = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5]
            misinformation_indexes = set(random.sample(range(len(numbers)), 2))
            for index, n in enumerate(numbers):
                truth = "misinformation" if index in misinformation_indexes else "genuine"
                deck.append({
                    "cardId": str(uuid.uuid4()),
                    "number": n,
                    "zone": z,
                    "truth": truth,
                    "hintHistory": []
                })
        random.shuffle(deck)
        return deck

    def _draw_card(self):
        if not self.deck:
            return None
        return self.deck.pop()

    def _record_event(self, event_type, actor_id, payload=None, success=True, message=""):
        self.logs.append({
            "eventId": f"evt_{datetime.now().timestamp()}_{len(self.logs)}",
            "sessionId": self.session_id,
            "turn": self.current_turn,
            "phase": self.current_phase,
            "actorId": actor_id,
            "eventType": event_type,
            "success": success,
            "message": message,
            "payload": payload or {},
            "timestamp": datetime.now().isoformat(),
        })

    def deal_initial_hands(self):
        for p_id in self.players:
            self.players[p_id]["hand"] = []
            for _ in range(GameRules.HAND_SIZE):
                drawn = self._draw_card()
                if drawn:
                    self.players[p_id]["hand"].append(drawn)
        self.hands_dealt = True

    def get_full_state(self):
        self._sync_scores()
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
            "currentActorId": self.current_actor_id,
            "board": {
                "zones": [{"zoneId": k, "slots": v["slots"], "maxSlots": 5, "nextExpected": v["next"]} for k, v in self.zones.items()],
                "errorCount": self.error_count,
                "maxErrors": GameRules.MAX_ERRORS
            },
            "deck": {
                "totalCards": self.total_cards,
                "remainingCards": len(self.deck),
                "discardedCards": len(self.discard_pile)
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

    def _calculate_fmif_score(self):
        return sum(zone["next"] - 1 for zone in self.zones.values())

    def _sync_scores(self):
        self.team_score = self._calculate_fmif_score()
        self.threshold_reached = self.team_score >= GameRules.THRESHOLD

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
            player["score"] += 1
            msg = "Installation successful"
        else:
            self.error_count += 1
            msg = "Installation failed (Error)"
            
        player["hand"].remove(card)
        self.discard_pile.append({**card, "discardReason": "installed", "installedBy": p_id, "success": is_correct})
        drawn = self._draw_card()
        if drawn:
            player["hand"].append(drawn)
        self._sync_scores()
        self._record_event("install", p_id, {
            "cardId": card_id,
            "targetZone": zone_id,
            "cardNumber": card["number"],
            "actualZone": card["zone"],
            "truth": card["truth"],
            "teamScoreAfter": self.team_score,
            "individualScoreAfter": player["score"],
            "deckRemaining": len(self.deck),
            "handSizeAfter": len(player["hand"]),
        }, is_correct, msg)
        return True, msg

    def _handle_discard(self, p_id, card_id):
        player = self.players[p_id]
        card = next((c for c in player["hand"] if c["cardId"] == card_id), None)
        if not card: return False, "Card not in hand"
        if player["hp"] >= GameRules.MAX_HP: return False, "HP is already full"
        player["hand"].remove(card)
        self.discard_pile.append({**card, "discardReason": "discarded", "discardedBy": p_id})
        drawn = self._draw_card()
        if drawn:
            player["hand"].append(drawn)
        player["hp"] = min(GameRules.MAX_HP, player["hp"] + 1)
        msg = "Card discarded and HP recovered"
        self._record_event("discard", p_id, {
            "cardId": card_id,
            "cardNumber": card["number"],
            "zone": card["zone"],
            "truth": card["truth"],
            "deckRemaining": len(self.deck),
            "handSizeAfter": len(player["hand"]),
        }, True, msg)
        return True, msg

    def _handle_rest(self, p_id):
        player = self.players[p_id]
        if player["hp"] >= GameRules.MAX_HP: return False, "HP is already full"
        player["hp"] = min(GameRules.MAX_HP, player["hp"] + 1)
        msg = "Rested and recovered HP"
        self._record_event("rest", p_id, {"hpAfter": player["hp"]}, True, msg)
        return True, msg

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

        log_payload = {
            "infoType": info_type,
            "infoValue": info_value,
            "message": message,
            "targetId": target_id,
            "targetCardIds": payload.get("targetCardIds") or [],
        }
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
        msg = f"Shared {info_type} info with {target_name}"
        self._record_event("give_info", p_id, log_payload, True, msg)
        return True, msg

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

        potential_targets = [pid for pid in self.players if pid != agent_id and self.players[pid]["hand"]]
        target_id = random.choice(potential_targets) if potential_targets else self.human_id
        target = self.players.get(target_id)

        if player["hp"] > 0 and target and target["hand"] and random.random() < 0.45:
            for card in target["hand"]:
                zone = self.zones.get(card["zone"])
                if zone and card["number"] == zone["next"] and card["truth"] == "genuine":
                    return {
                        "type": "give_info",
                        "payload": {
                            "targetPlayerId": target_id,
                            "targetCardIds": [card["cardId"]],
                            "infoType": "zone",
                            "infoValue": card["zone"],
                            "message": f"{card['zone']} 구역 정보가 중요합니다."
                        }
                    }

            card = random.choice(target["hand"])
            return {
                "type": "give_info",
                "payload": {
                    "targetPlayerId": target_id,
                    "targetCardIds": [card["cardId"]],
                    "infoType": "truth",
                    "infoValue": card["truth"],
                    "message": "이 카드의 진위를 확인했습니다."
                }
            }

        for card in player["hand"]:
            for zone_id, zone in self.zones.items():
                if card["number"] == zone["next"] and card["zone"] == zone_id:
                    if card["truth"] == "genuine" and random.random() < 0.6:
                        return {"type": "install", "payload": {"cardId": card["cardId"], "targetZone": zone_id}}

        if player["hand"] and random.random() < 0.2:
            card = random.choice(player["hand"])
            target_zone = random.choice(GameRules.ZONES)
            return {"type": "install", "payload": {"cardId": card["cardId"], "targetZone": target_zone}}

        if player["hp"] > 1 and target and target["hand"]:
            for card in target["hand"]:
                zone = self.zones.get(card["zone"])
                if zone and card["number"] == zone["next"] and card["truth"] == "genuine":
                    return {
                        "type": "give_info",
                        "payload": {
                            "targetPlayerId": target_id,
                            "targetCardIds": [card["cardId"]],
                            "infoType": "zone",
                            "infoValue": card["zone"],
                            "message": f"{card['zone']} 구역 정보가 중요합니다."
                        }
                    }

            card = target["hand"][0]
            return {
                "type": "give_info",
                "payload": {
                    "targetPlayerId": target_id,
                    "targetCardIds": [card["cardId"]],
                    "infoType": "truth",
                    "infoValue": card["truth"],
                    "message": "이 카드의 진위를 확인했습니다."
                }
            }

        if player["hp"] < 2:
            return {"type": "rest", "payload": {}}

        if player["hp"] < GameRules.MAX_HP and player["hand"]:
            discard_card = next(
                (c for c in player["hand"] if c["truth"] == "misinformation"),
                player["hand"][0]
            )
            return {"type": "discard", "payload": {"cardId": discard_card["cardId"]}}

        if player["hand"]:
            card = random.choice(player["hand"])
            return {
                "type": "give_info",
                "payload": {
                    "targetPlayerId": target_id,
                    "targetCardIds": [target["hand"][0]["cardId"]] if target and target["hand"] else [],
                    "infoType": "truth",
                    "infoValue": card["truth"],
                    "message": "이번 턴은 설치보다 정보 정리가 우선입니다."
                }
            }
        return {"type": "rest", "payload": {}}
