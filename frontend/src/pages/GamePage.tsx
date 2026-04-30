import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameShell } from "../components/layout/GameShell";
import { useGameSocket } from "../hooks/useGameSocket";
import { useGameStore } from "../store/gameStore";
import { fetchGameState } from "../utils/sendAction";

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { setGameState, setLoading } = useGameStore();

  useGameSocket(sessionId ?? null);

  useEffect(() => {
    if (!sessionId) {
      navigate("/onboarding");
      return;
    }

    setLoading(true);

    fetchGameState(sessionId).then((state) => {
      if (state) setGameState(state);
      setLoading(false);
    });
  }, [sessionId, setGameState, setLoading, navigate]);

  if (!sessionId) return null;

  return <GameShell sessionId={sessionId} />;
}
