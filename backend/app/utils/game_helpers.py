import copy

def get_filtered_state(engine, viewer_id):
    """
    보는 사람(viewer_id)에 따라 카드 정보를 마스킹함.
    - 내 카드는 뒷면(None) 처리, 남의 카드는 앞면 공개.
    """
    # 원본 데이터 보호를 위해 깊은 복사
    state = copy.deepcopy(engine.get_full_state())
    
    for player in state.get('players', []):
        if player['id'] == viewer_id:
            # 내 카드 정보 숨기기
            for card in player.get('hand', []):
                card['number'] = None
                card['color'] = None
        else:
            # 타인/에이전트 카드는 그대로 노출
            pass
            
    return state