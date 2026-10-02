import type { ToolCall } from "../types";

export default function ToolUsePanel({ tools }: { tools: ToolCall[] }) {
  return (
    <aside className="tool-panel">
      <h3>Tool use</h3>
      <p className="tool-panel-sub">Live trace of every tool call this conversation.</p>

      {tools.length === 0 && <div className="tool-empty">No tools have been called yet.</div>}

      {[...tools].reverse().map((tool) => (
        <div className="tool-trace" key={tool.id}>
          <div className="tool-trace-head">
            <span className="tool-trace-name">{tool.name}</span>
            <span className={`tool-status ${tool.status}`}>{tool.status}</span>
          </div>
          <div className="tool-trace-label">Input</div>
          <pre>{tool.input}</pre>
          {tool.output && (
            <>
              <div className="tool-trace-label">Output</div>
              <pre>{tool.output}</pre>
            </>
          )}
        </div>
      ))}
    </aside>
  );
}
