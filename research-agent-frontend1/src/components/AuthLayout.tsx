import type { ReactNode } from "react";
import BlackholeCanvas from "./BlackholeCanvas";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-screen">
      <BlackholeCanvas intensity={1} />
      <div className="auth-panel">
        <div className="auth-eyebrow">
          <span className="dot" />
          Research Agent
        </div>
        {children}
      </div>
    </div>
  );
}
