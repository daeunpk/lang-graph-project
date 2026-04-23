import React, { ReactNode } from "react";

// Extend here if global context providers (Theme, Auth, etc.) are needed
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}