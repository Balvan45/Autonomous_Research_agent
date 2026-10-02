import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createIntroScene, type IntroSceneHandle } from "../three/createIntroScene";
import { useAuth } from "../utils/auth";

const AUTO_ADVANCE_MS = 7000;

export default function Intro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Already signed in — skip straight to the app, no need to replay the intro.
    if (user) {
      navigate("/chat", { replace: true });
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handle: IntroSceneHandle = createIntroScene(container);
    const revealTimer = setTimeout(() => setReady(true), 250);
    const advanceTimer = setTimeout(() => navigate("/login"), AUTO_ADVANCE_MS);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(advanceTimer);
      handle.dispose();
    };
  }, [navigate, user]);

  if (user) return null;

  return (
    <div className="intro-screen">
      <div ref={containerRef} className="intro-canvas-holder" />
      <div className={`intro-overlay ${ready ? "visible" : ""}`}>
        <div className="intro-eyebrow">
          <span className="dot" />
          Autonomous Research Agent
        </div>
        <h1>Intelligence, in orbit.</h1>
        <p>A neural field of research tools, spiraling around one core.</p>
        <div className="intro-actions">
          <button className="btn-primary intro-enter" onClick={() => navigate("/login")}>
            Enter
          </button>
          <button className="intro-skip" onClick={() => navigate("/login")}>
            Skip intro
          </button>
        </div>
      </div>
    </div>
  );
}
