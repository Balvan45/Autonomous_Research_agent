// BlackholeLoader.tsx
export default function BlackholeLoader() {
  return (
    <div className="research-message agent-response">
      <div className="response-label">
        <div className="response-blackhole loading">
          <div className="response-blackhole-core" />
          <div className="response-blackhole-ring" />
          <div className="response-blackhole-glow" />
          <div className="response-blackhole-particles">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <span>RESEARCH AGENT</span>
        <span className="thinking-text">is thinking...</span>
      </div>
    </div>
  );
}