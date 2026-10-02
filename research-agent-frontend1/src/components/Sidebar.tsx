import type { Conversation } from "../types";
import { useAuth } from "../utils/auth";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNew }: SidebarProps) {
  const { user, signOut } = useAuth();
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="dot" />
        Research Agent
      </div>

      <button className="new-chat-btn" onClick={onNew}>
        <span>+</span> New research
      </button>

      <div className="history-label">History</div>
      <ul className="history-list">
        {sorted.length === 0 && (
          <li style={{ padding: "9px 10px", color: "var(--text-faint)", fontSize: 13 }}>
            No conversations yet
          </li>
        )}
        {sorted.map((c) => (
          <li key={c.id}>
            <button
              className={`history-item ${c.id === activeId ? "active" : ""}`}
              onClick={() => onSelect(c.id)}
              title={c.title}
            >
              {c.title}
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <span>{user?.name}</span>
        <button className="sign-out-btn" onClick={signOut}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
