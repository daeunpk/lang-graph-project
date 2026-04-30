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
        self.is_game_over = False
        self.game_over_reason = ""
        
        self.team_score = 0
        self.error_count = 0
        self.threshold_reached = False
        
        # 보드 구역 초기화
        self.zones = {z: {"slots": [None]*5, "next": 1} for z in GameRules.ZONES}
        
        self.human_id = str(uuid.uuid4())
        self.players = {
            self.human_id: {
                "id": self.human_id, 
                "name": human_name, 
                "hp": GameRules.MAX_HP, 
                "score": 0, 
                "is_human": True, 
                "hand": []
            },
            "agent_1": {
                "id": "agent_1", 
                "name": "Flow-1", 
                "hp": GameRules.MAX_HP, 
                "score": 0, 
                "is_human": False, 
                "role": "flow_analyst", 
                "hand": []
            },
            "agent_2": {
                "id": "agent_2", 
                "name": "Risk-2", 
                "hp": GameRules.MAX_HP, 
                "score": 0, 
                "is_human": False, 
                "role": "risk_analyst", 
                "hand": []
            },
            "agent_3": {
                "id": "agent_3", 
                "name": "Res-3", 
                "hp": GameRules.MAX_HP, 
                "score": 0, 
                "is_human": False, 
                "role": "resource_analyst", 
                "hand": []
            }
        }
        
        self.deck = self._generate_deck()
        
        # [수정] 카드 분배 상태 플래그 추가 및 메서드 호출
        self.hands_dealt = False
        self.deal_initial_hands()
        
        self.logs = []

    def _generate_deck(self):
        deck = []
        for z in GameRules.ZONES:
            for n in GameRules.NUMBERS:
                # 진위 여부 포함 (실험용으로 20% 오정보)
                truth = "misinformation" if random.random() < 0.2 else "genuine"
                deck.append({
                    "cardId": str(uuid.uuid4()), 
                    "number": n, 
                    "zone": z, 
                    "truth": truth
                })
        random.shuffle(deck)
        return deck

    # [수정] 외부 노드에서 호출 가능하도록 언더바(_) 제거
    def deal_initial_hands(self):
        """플레이어들에게 초기 손패 분배"""
        for p_id in self.players:
            # 기존에 카드가 있다면 비우고 새로 분배 (초기화 보장)
            self.players[p_id]["hand"] = []
            for _ in range(GameRules.HAND_SIZE):
                if self.deck:
                    self.players[p_id]["hand"].append(self.deck.pop())
        
        self.hands_dealt = True

    def get_full_state(self):
        """서버 내부용/에이전트용 전체 게임 상태 반환 (마스킹 없음)"""
        return {
            "sessionId": self.session_id,
            "config": {
                "condition": self.condition,
                "interactionMode": self.interaction_mode,
                "scoringMode": self.scoring_mode,
                "sessionId": self.session_id,
                "playerId": self.human_id,
                "totalTurns": GameRules.TOTAL_TURNS,
                "turnTimeLimit": 60
            },
            "currentTurn": self.current_turn,
            "currentPhase": self.current_phase,
            "board": {
                "zones": [
                    {
                        "zoneId": k, 
                        "slots": v["slots"], 
                        "maxSlots": 5, 
                        "nextExpected": v["next"]
                    } for k, v in self.zones.items()
                ],
                "errorCount": self.error_count,
                "maxErrors": GameRules.MAX_ERRORS
            },
            "players": [
                {
                    "playerId": k, 
                    "name": v["name"], 
                    "isHuman": v["is_human"], 
                    "hp": v["hp"], 
                    "maxHp": GameRules.MAX_HP, 
                    "individualScore": v["score"], 
                    "handSize": len(v["hand"]),
                    "hand": v["hand"] # [수정] 카드 데이터를 포함시켜야 필터링이 가능함
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
        
        res = False
        msg = "Unknown action"
        
        if action_type == "install":
            res, msg = self._handle_install(p_id, payload['cardId'], payload['targetZone'], payload['targetSlot'])
        elif action_type == "discard":
            res, msg = self._handle_discard(p_id, payload['cardId'])
        elif action_type == "rest":
            res, msg = self._handle_rest(p_id)
        elif action_type == "broadcast" or action_type == "followup":
            res, msg = True, "Communication sent"
            
        if res:
            self._check_game_over()
            if action_type in ["install", "discard", "rest"]:
                self.current_phase = "resolving"
        
        return res, msg

    def _handle_install(self, p_id, card_id, zone_id, slot_idx):
        player = self.players[p_id]
        card = next((c for c in player["hand"] if c["cardId"] == card_id), None)
        if not card: return False, "Card not in hand"
        
        zone = self.zones[zone_id]
        is_correct = (card["number"] == zone["next"] and card["zone"] == zone_id and card["truth"] == "genuine")
        
        if is_correct:
            zone["slots"][slot_idx] = {"cardId": card_id, "number": card["number"], "isCorrect": True}
            zone["next"] += 1
            t_delta, p_delta = GameRules.calculate_score(True, self.scoring_mode, self.threshold_reached)
            self.team_score += t_delta
            player["score"] += p_delta
            msg = "Installation successful"
        else:
            self.error_count += 1
            player["hp"] -= 1
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
        player["hand"].remove(card)
        if self.deck: player["hand"].append(self.deck.pop())
        return True, "Card discarded"

    def _handle_rest(self, p_id):
        player = self.players[p_id]
        player["hp"] = min(GameRules.MAX_HP, player["hp"] + 1)
        return True, "Rested and recovered HP"

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
        """에이전트가 현재 보드와 자신의 손패를 보고 액션을 결정함"""
        player = self.players.get(agent_id)
        if not player:
            return {"type": "rest", "payload": {}}

        # 1. 설치 가능한 카드가 있는지 확인 (전략적 판단)
        for card in player["hand"]:
            for zone_id, zone in self.zones.items():
                # 현재 구역에서 요구하는 번호와 색상이 일치하는지 확인
                if card["number"] == zone["next"] and card["zone"] == zone_id:
                    # 진위 여부가 genuine인 경우 설치 시도
                    if card["truth"] == "genuine":
                        return {
                            "type": "install",
                            "payload": {
                                "cardId": card["cardId"],
                                "targetZone": zone_id,
                                "targetSlot": zone["next"] - 1
                            }
                        }
        
        # 2. 설치할 게 없다면 HP가 낮은 경우 휴식, 아니면 무작위 카드 버리기
        if player["hp"] < 2:
            return {"type": "rest", "payload": {}}
        
        # 3. 버릴 카드 선택 (가장 쓸모없는 카드 하나)
        if player["hand"]:
            return {
                "type": "discard",
                "payload": {"cardId": player["hand"][0]["cardId"]}
            }
            
        return {"type": "rest", "payload": {}}