import copy

def get_filtered_state(engine, viewer_id):
    state = copy.deepcopy(engine.get_full_state())
    
    for player in state.get('players', []):
        # 1. 내 카드인 경우 (번호만 노출, 구역/진위 가림)
        if player['playerId'] == viewer_id:
            for card in player.get('hand', []):
                card['zone'] = "unknown"
                card['truth'] = "unknown"
                # card['number']는 유지
        
        # 2. 남의 카드인 경우 (번호 가림, 구역/진위 노출)
        else:
            for card in player.get('hand', []):
                card['number'] = None
                # card['zone'], card['truth']는 유지
                
    return state