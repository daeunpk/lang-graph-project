import { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";

export function RecentActionBanner() {
  const { logs } = useGameStore();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const latest = logs[0];

  useEffect(() => {
    if (!latest) return;
    if (latest.level === "success" || latest.level === "error" || latest.level === "warning") {
      setMessage(latest.message);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [latest?.logId]);

  if (!visible) return null;

  const level = latest?.level ?? "info";

  return (
    <div className={`recent-action-banner level-${level}`}>
      {message}
    </div>
  );
}