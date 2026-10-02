import { useRef, type KeyboardEvent } from "react";
import PlusMenu from "./PlusMenu";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onPlusAction: (action: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, onPlusAction, disabled }: ChatInputProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }

  return (
    <div className="composer">
      <div className="composer-inner">
        <PlusMenu onAction={onPlusAction} />
        <textarea
          ref={taRef}
          rows={1}
          placeholder="Ask the research agent anything…"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="send-btn"
          disabled={!value.trim() || disabled}
          onClick={onSend}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>
      <div className="composer-hint">Enter to send · Shift+Enter for a new line · click + for tools</div>
    </div>
  );
}
