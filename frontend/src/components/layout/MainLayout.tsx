import React, { ReactNode } from "react";
import "../../styles/game.css";

interface MainLayoutProps {
  topBar: ReactNode;
  leftPanel: ReactNode;
  centerBoard: ReactNode;
  rightPanel: ReactNode;
  bottomArea: ReactNode;
  overlays?: ReactNode;
}

export function MainLayout({
  topBar,
  leftPanel,
  centerBoard,
  rightPanel,
  bottomArea,
  overlays,
}: MainLayoutProps) {
  return (
    <div className="main-layout">
      <div className="layout-topbar">{topBar}</div>
      <div className="layout-body">
        <div className="layout-left">{leftPanel}</div>
        <div className="layout-center">{centerBoard}</div>
        <div className="layout-right">{rightPanel}</div>
      </div>
      <div className="layout-bottom">{bottomArea}</div>
      {overlays}
    </div>
  );
}