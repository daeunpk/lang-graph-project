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
        self.leader_directives = []
        self.team_flow = {
            "mode": "balanced",
            "label": "균형",
            "description": "리더 지시 없음: 에이전트가 보드, 손패 기억, HP를 균형 있게 고려합니다.",
            "source": "",
        }
        
        # 보드 구역 초기화 (1번부터 시작)
        self.zones = {
            z: {"slots": [None] * GameRules.COMPLETION_TARGET_NUMBER, "next": 1}
            for z in GameRules.ZONES
        }
        
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
            numbers = [1, 1, 1, 2, 2, 3, 3, 4, 4, 4]
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
                "zones": [
                    {
                        "zoneId": k,
                        "slots": v["slots"],
                        "maxSlots": GameRules.COMPLETION_TARGET_NUMBER,
                        "nextExpected": v["next"],
                    }
                    for k, v in self.zones.items()
                ],
                "errorCount": self.error_count,
                "maxErrors": GameRules.MAX_ERRORS
            },
            "deck": {
                "totalCards": self.total_cards,
                "remainingCards": len(self.deck),
                "discardedCards": len(self.discard_pile),
                "inHandCards": sum(len(p["hand"]) for p in self.players.values()),
                "installedCards": sum(sum(1 for slot in z["slots"] if slot) for z in self.zones.values()),
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
            "completionTargetScore": GameRules.COMPLETION_TARGET_SCORE,
            "completionTargetNumber": GameRules.COMPLETION_TARGET_NUMBER,
            "maxTeamScore": GameRules.MAX_TEAM_SCORE,
            "targetReached": self.team_score >= GameRules.COMPLETION_TARGET_SCORE,
            "teamFlow": self.team_flow,
            "isGameOver": self.is_game_over,
            "gameOverReason": self.game_over_reason
        }

    def _calculate_fmif_score(self):
        return sum(sum(1 for slot in zone["slots"] if slot) for zone in self.zones.values())

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
        elif action_type == "timeout":
            res, msg = self._handle_timeout(p_id)
        elif action_type == "give_info":
            res, msg = self._handle_give_info(p_id, payload)
        elif action_type == "broadcast":
            res, msg = self._handle_broadcast(p_id, payload)
            
        if res:
            self._check_game_over()
            if action_type in ["install", "discard", "rest", "timeout", "give_info", "broadcast"]:
                self.current_phase = "resolving"
        return res, msg

    def _handle_install(self, p_id, card_id, zone_id):
        player = self.players[p_id]
        card = next((c for c in player["hand"] if c["cardId"] == card_id), None)
        if not card: return False, "Card not in hand"
        if player["hp"] <= 0: return False, "Not enough HP"
        
        zone = self.zones[zone_id]
        if zone["next"] > GameRules.COMPLETION_TARGET_NUMBER:
            return False, "Zone already completed"
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
        if not is_correct:
            card.setdefault("hintHistory", []).append({
                "turn": self.current_turn,
                "hintType": "failed_install",
                "value": zone_id,
                "givenBy": "system",
                "message": "설치 실패 후 덱으로 되돌아간 카드입니다.",
            })
            self.deck.append(card)
            random.shuffle(self.deck)
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
            "returnedToDeck": not is_correct,
            "teamScoreAfter": self.team_score,
            "individualScoreAfter": player["score"],
            "deckRemaining": len(self.deck),
            "handSizeAfter": len(player["hand"]),
        }, is_correct, msg)
        return True, msg

    def _known_value_from_hints(self, card, hint_type):
        for hint in reversed(card.get("hintHistory", [])):
            if hint.get("hintType") == hint_type:
                return hint.get("value")
        return None

    def _agent_memory_summary(self, agent_id):
        player = self.players[agent_id]
        summaries = []
        for index, card in enumerate(player["hand"]):
            known_zone = self._known_value_from_hints(card, "zone")
            known_truth = self._known_value_from_hints(card, "truth")
            summaries.append({
                "cardId": card["cardId"],
                "position": index + 1,
                "number": card["number"],
                "knownZone": known_zone,
                "knownTruth": known_truth,
                "hintCount": len(card.get("hintHistory", [])),
            })
        return summaries

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

    def _handle_timeout(self, p_id):
        player = self.players[p_id]
        msg = "Turn timed out; no HP recovered"
        self._record_event("timeout", p_id, {"hpAfter": player["hp"]}, True, msg)
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
        target_cards = payload.get("targetCardIds") or []
        card_positions = []

        log_payload = {
            "infoType": info_type,
            "infoValue": info_value,
            "message": message,
            "targetId": target_id,
            "targetCardIds": target_cards,
        }
        for card_id in target_cards:
            for index, card in enumerate(self.players[target_id]["hand"]):
                if card["cardId"] == card_id:
                    card_positions.append(index + 1)
                    card.setdefault("hintHistory", []).append({
                        "turn": self.current_turn,
                        "hintType": info_type,
                        "value": info_value,
                        "givenBy": p_id,
                        "message": message,
                    })
        log_payload["targetCardPositions"] = card_positions
        value_label = {
            "genuine": "맞는 정보",
            "misinformation": "오정보",
            "red": "빨간 구역",
            "blue": "파란 구역",
            "green": "초록 구역",
            "yellow": "노란 구역",
            "purple": "보라 구역",
        }.get(info_value, info_value)
        type_label = "색깔" if info_type == "zone" else "진위" if info_type == "truth" else info_type
        cards_label = ", ".join(f"{pos}번 카드" for pos in card_positions) if card_positions else "선택한 카드 없음"
        public_message = f"{target_name}에게 공유: {cards_label} / {type_label}: {value_label}"
        if message:
            public_message = f"{public_message} / 메모: {message}"
        log_payload["publicMessage"] = public_message
        msg = public_message
        self._record_event("give_info", p_id, log_payload, True, msg)
        return True, msg

    def _handle_broadcast(self, p_id, payload):
        player = self.players[p_id]
        if player["hp"] <= 0:
            return False, "Not enough HP"

        message = payload.get("message", "").strip()
        if not message:
            return False, "Message is empty"

        player["hp"] -= 1
        directive = {
            "turn": self.current_turn,
            "leaderId": p_id,
            "message": message,
            "targetAgentIds": payload.get("targetAgentIds", "all"),
            "timestamp": datetime.now().isoformat(),
        }
        self.leader_directives.append(directive)
        self.team_flow = self._infer_team_flow(message)
        msg = "Leader directive broadcasted"
        self._record_event("leader_directive", p_id, directive, True, msg)
        return True, msg

    def _infer_team_flow(self, message):
        text = message.lower()
        if any(word in text for word in ["신중", "검증", "확인", "오류", "위험", "안전"]):
            return {
                "mode": "cautious",
                "label": "신중",
                "description": "정보 확인과 오류 회피를 우선합니다. 에이전트가 설치보다 힌트 제공을 더 자주 선택합니다.",
                "source": message,
            }
        if any(word in text for word in ["속도", "빠르게", "공격", "설치", "내려", "진행"]):
            return {
                "mode": "push",
                "label": "속도전",
                "description": "설치 속도를 우선합니다. 에이전트가 힌트가 조금 부족해도 설치를 시도할 확률이 올라갑니다.",
                "source": message,
            }
        if any(word in text for word in ["정보", "힌트", "공유", "보고", "색", "진위"]):
            return {
                "mode": "information",
                "label": "정보 정리",
                "description": "공유 정보 축적을 우선합니다. 에이전트가 서로에게 힌트를 주는 행동을 더 자주 선택합니다.",
                "source": message,
            }
        if any(word in text for word in ["hp", "체력", "휴식", "회복", "아껴", "자원"]):
            return {
                "mode": "conserve",
                "label": "자원 관리",
                "description": "HP 관리를 우선합니다. 에이전트가 무리한 행동을 줄이고 휴식/갱신을 고려합니다.",
                "source": message,
            }
        return {
            "mode": "balanced",
            "label": "균형",
            "description": "리더 지시를 일반 조율로 해석했습니다. 에이전트가 보드, 손패 기억, HP를 균형 있게 고려합니다.",
            "source": message,
        }

    def _latest_leader_directive_for(self, agent_id):
        for directive in reversed(self.leader_directives):
            targets = directive.get("targetAgentIds", "all")
            if targets == "all" or agent_id in targets:
                return directive
        return None

    def _check_game_over(self):
        if all(zone["next"] > GameRules.COMPLETION_TARGET_NUMBER for zone in self.zones.values()):
            self.is_game_over = True
            self.game_over_reason = "All zones completed"
        elif self.error_count >= GameRules.MAX_ERRORS:
            self.is_game_over = True
            self.game_over_reason = "Max errors reached"
        elif any(p["hp"] <= 0 for p in self.players.values()):
            self.is_game_over = True
            self.game_over_reason = "A player has collapsed (HP 0)"
        elif len(self.deck) == 0:
            self.is_game_over = True
            self.game_over_reason = "Deck exhausted"
        elif self.current_turn > GameRules.TOTAL_TURNS:
            self.is_game_over = True
            self.game_over_reason = "Final turn reached"
            
    def get_agent_decision(self, agent_id):
        player = self.players.get(agent_id)
        if not player: return {"type": "rest", "payload": {}}

        directive = self._latest_leader_directive_for(agent_id)
        directive_text = directive.get("message", "").lower() if directive else ""
        flow_mode = self.team_flow.get("mode", "balanced")
        hint_probability = {
            "balanced": 0.45,
            "cautious": 0.68,
            "information": 0.76,
            "push": 0.32,
            "conserve": 0.38,
        }.get(flow_mode, 0.45)
        confident_install_probability = {
            "balanced": 0.7,
            "cautious": 0.52,
            "information": 0.58,
            "push": 0.88,
            "conserve": 0.48,
        }.get(flow_mode, 0.7)
        risky_install_probability = {
            "balanced": 0.2,
            "cautious": 0.08,
            "information": 0.12,
            "push": 0.36,
            "conserve": 0.06,
        }.get(flow_mode, 0.2)

        potential_targets = [pid for pid in self.players if pid != agent_id and self.players[pid]["hand"]]
        target_id = random.choice(potential_targets) if potential_targets else self.human_id
        target = self.players.get(target_id)

        if directive and "휴식" in directive_text and player["hp"] < GameRules.MAX_HP:
            return {"type": "rest", "payload": {"reason": "leader_directive"}}

        if directive and ("버려" in directive_text or "갱신" in directive_text) and player["hp"] < GameRules.MAX_HP and player["hand"]:
            return {"type": "discard", "payload": {"cardId": player["hand"][0]["cardId"], "reason": "leader_directive"}}

        if directive and ("정보" in directive_text or "힌트" in directive_text) and player["hp"] > 0 and target and target["hand"]:
            card = target["hand"][0]
            return {
                "type": "give_info",
                "payload": {
                    "targetPlayerId": target_id,
                    "targetCardIds": [card["cardId"]],
                    "infoType": "truth",
                    "infoValue": card["truth"],
                    "message": f"리더 지시에 따라 {target['name']}의 카드 정보를 공유합니다."
                }
            }

        if flow_mode == "conserve" and player["hp"] < 5 and player["hp"] < GameRules.MAX_HP:
            return {"type": "rest", "payload": {"reason": "team_flow_conserve"}}

        if player["hp"] > 0 and target and target["hand"] and random.random() < hint_probability:
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
            known_zone = self._known_value_from_hints(card, "zone")
            known_truth = self._known_value_from_hints(card, "truth")
            if (
                known_zone
                and known_truth == "genuine"
                and known_zone in self.zones
                and card["number"] == self.zones[known_zone]["next"]
                and random.random() < confident_install_probability
            ):
                return {
                    "type": "install",
                    "payload": {
                        "cardId": card["cardId"],
                        "targetZone": known_zone,
                        "reason": "hint_based"
                    }
                }

        if directive and ("설치" in directive_text or "내려" in directive_text) and player["hand"]:
            hinted = next(
                (
                    c for c in player["hand"]
                    if self._known_value_from_hints(c, "zone") in self.zones
                ),
                player["hand"][0],
            )
            target_zone = self._known_value_from_hints(hinted, "zone") or random.choice(GameRules.ZONES)
            return {
                "type": "install",
                "payload": {
                    "cardId": hinted["cardId"],
                    "targetZone": target_zone,
                    "reason": "leader_directive"
                }
            }

        if player["hand"] and random.random() < risky_install_probability:
            card = random.choice(player["hand"])
            known_zone = self._known_value_from_hints(card, "zone")
            target_zone = known_zone or random.choice(GameRules.ZONES)
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
                (c for c in player["hand"] if self._known_value_from_hints(c, "truth") == "misinformation"),
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
