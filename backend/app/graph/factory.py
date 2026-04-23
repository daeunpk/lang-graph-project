from app.graph.game_graph import create_game_graph

# 글로벌 그래프 인스턴스 생성
app_graph = create_game_graph()

def get_graph():
    return app_graph