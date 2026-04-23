import React, { useState } from "react";
import { PublicInfoPanel } from "./PublicInfoPanel";
import { SystemLogPanel } from "./SystemLogPanel";
import { PlayerMemoCard } from "./PlayerMemoCard";

type Tab = "info" | "log" | "memo";

export function LeftPanel() {
  const [tab, setTab] = useState<Tab>("info");

  return (
    <div className="left-panel">
      <div className="panel-tabs">
        {(["info", "log", "memo"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`panel-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "info" ? "공개 정보" : t === "log" ? "로그" : "메모"}
          </button>
        ))}
      </div>
      <div className="panel-content">
        {tab === "info" && <PublicInfoPanel />}
        {tab === "log" && <SystemLogPanel />}
        {tab === "memo" && <PlayerMemoCard />}
      </div>
    </div>
  );
}