import { useEffect, useRef, useState, useCallback } from "react";
import { useUIStore } from "../store/uiStore";

export function useTurnTimer(
  timeLimit: number,
  isActive: boolean,
  onTimeout: () => void
) {
  const [secondsLeft, setSecondsLeft] = useState(timeLimit);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { openModal } = useUIStore();
  const hasTimedOut = useRef(false);

  const reset = useCallback(() => {
    hasTimedOut.current = false;
    setSecondsLeft(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    hasTimedOut.current = false;
    setSecondsLeft(timeLimit);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!hasTimedOut.current) {
            hasTimedOut.current = true;
            openModal("turn_timeout");
            onTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLimit, onTimeout, openModal]);

  const urgency =
    secondsLeft <= 10 ? "critical" : secondsLeft <= 30 ? "warning" : "normal";

  return { secondsLeft, urgency, reset };
}