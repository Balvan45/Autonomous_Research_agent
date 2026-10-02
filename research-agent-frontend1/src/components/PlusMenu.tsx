import { useEffect, useRef, useState } from "react";

interface PlusMenuProps {
  onAction: (action: string) => void;
}

const ITEMS = [
  { id: "attach", label: "Attach a file", hint: "PDF, CSV, image, docs" },
  { id: "web", label: "Search the web", hint: "Force a live web search" },
  { id: "deep-research", label: "Deep research mode", hint: "Multi-step, cites sources" },
  { id: "code", label: "Run code", hint: "Sandbox execution tool" },
];

export default function PlusMenu({ onAction }: PlusMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className={`plus-btn ${open ? "active" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Add attachment or tool"
        aria-expanded={open}
      >
        +
      </button>
      {open && (
        <div className="plus-menu" role="menu">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              onClick={() => {
                onAction(item.id);
                setOpen(false);
              }}
            >
              <span>
                {item.label}
                <span className="menu-sub">{item.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
