import type { CSSProperties } from "react";
import { InstallSlot } from "./InstallSlot";
import type { ZoneState } from "../../types/game";
import { getZoneColor, getZoneLabel } from "../../utils/format";

interface ZoneColumnProps {
  zone: ZoneState;
  sessionId: string;
}

export function ZoneColumn({ zone, sessionId }: ZoneColumnProps) {
  const color = getZoneColor(zone.zoneId);
  const nextSlotIndex = zone.nextExpected - 1;
  const visibleSlotCount = Math.min(zone.maxSlots, 4);

  return (
    <div className="zone-column" style={{ "--zone-color": color } as CSSProperties}>
      <div className="zone-header" style={{ borderColor: color }}>
        <div className="zone-dot" style={{ backgroundColor: color }} />
        <span className="zone-label">{getZoneLabel(zone.zoneId)}</span>
      </div>
      <div className="zone-slots">
        {Array.from({ length: visibleSlotCount }, (_, i) => (
          <InstallSlot
            key={i}
            slotIndex={i}
            zoneId={zone.zoneId}
            card={zone.slots[i] ?? null}
            isNext={i === nextSlotIndex}
            sessionId={sessionId}
          />
        ))}
      </div>
    </div>
  );
}
