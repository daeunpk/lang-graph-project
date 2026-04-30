import copy

def get_filtered_state(engine, viewer_id):
    """
    보는 사람(viewer_id)에 따라 카드 정보를 마스킹함.
    """
    # 1. 엔진의 get_full_state() 결과물을 가져옴
    state = copy.deepcopy(engine.get_full_state())
    
    # 2. players 리스트를 순회
    for player in state.get('players', []):
        # [수정] 'id'가 아니라 'playerId'로 비교해야 합니다.
        if player['playerId'] == viewer_id:
            # 내 카드 정보 숨기기
            if 'hand' in player:
                for card in player['hand']:
                    card['number'] = None
                    card['color'] = None
        else:
            # 타인 카드는 그대로 둠
            pass
            
    return state