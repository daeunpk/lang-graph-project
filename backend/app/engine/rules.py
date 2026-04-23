class GameRules:
    MAX_ERRORS = 3
    MAX_HP = 5
    TOTAL_TURNS = 20
    HAND_SIZE = 4
    ZONES = ["red", "blue", "green", "yellow", "purple"]
    NUMBERS = [1, 2, 3, 4, 5]
    THRESHOLD = 15 # Coopetition 기준선

    @staticmethod
    def calculate_score(is_correct: bool, scoring_mode: str, threshold_reached: bool):
        if not is_correct:
            return -2, -1 # Team, Individual
        
        if scoring_mode == "cooperative":
            return 3, 1
        elif scoring_mode == "competitive":
            return 1, 3
        elif scoring_mode == "coopetition":
            if threshold_reached:
                return 1, 5 # 개인 보너스 강화
            return 4, 1 # 팀 점수 강화
        return 0, 0