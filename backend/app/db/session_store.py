# 실제 DB 대신 메모리 세션 저장소
class SessionStore:
    def __init__(self):
        self._sessions = {}

    def save_game(self, game_id, engine):
        self._sessions[game_id] = engine

    def get_game(self, game_id):
        return self._sessions.get(game_id)

    def delete_game(self, game_id):
        if game_id in self._sessions:
            del self._sessions[game_id]

game_sessions = SessionStore()