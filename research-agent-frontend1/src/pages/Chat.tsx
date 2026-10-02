import { useEffect, useState } from "react";
import BlackholeCanvas from "../components/BlackholeCanvas";
import Sidebar from "../components/Sidebar";
import ChatInput from "../components/ChatInput";
import MessageBubble from "../components/MessageBubble";
import ToolUsePanel from "../components/ToolUsePanel";
import { useAuth } from "../utils/auth";
import { loadConversations, saveConversations } from "../utils/storage";
import type { ChatMessage, Conversation, ToolCall } from "../types";


const PLUS_ACTION_LABEL: Record<string, string> = {
  attach: "Attaching a file",
  web: "Forcing a web search",
  "deep-research": "Switching to deep research mode",
  code: "Preparing a code sandbox",
};

export default function Chat() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loaded = loadConversations(user.id);

    setConversations(loaded);
    setActiveId(loaded[0]?.id ?? null);
  }, [user]);

  useEffect(() => {
    if (user) {
      saveConversations(user.id, conversations);
    }
  }, [conversations, user]);

  const active =
    conversations.find((c) => c.id === activeId) ?? null;

  const allTools =
    active?.messages.flatMap((m) => m.tools ?? []) ?? [];

  function createConversation(): Conversation {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title: "New research",
      updatedAt: Date.now(),
      messages: [],
    };

    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);

    return conv;
  }

  function updateConversation(
    id: string,
    mutate: (c: Conversation) => Conversation
  ) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? mutate(c) : c
      )
    );
  }

  // -----------------------------------------
  // CALL FASTAPI BACKEND
  // -----------------------------------------

async function callAgent(query: string) {
  console.log("1. Calling backend...");

  const response = await fetch("http://127.0.0.1:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: query,
    }),
  });

  console.log("2. Response received:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error:", errorText);
    throw new Error(`Backend returned ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Backend returned no response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let fullResponse = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value, {
      stream: true,
    });

    console.log("3. Stream chunk:", chunk);

    fullResponse += chunk;
  }

  console.log("4. Complete response:", fullResponse);

  return {
    message: fullResponse,
  };
}
  // -----------------------------------------
  // SEND MESSAGE
  // -----------------------------------------

  async function handleSend() {
    const text = draft.trim();

    if (!text || sending) return;

    setDraft("");
    setSending(true);

    const conv = active ?? createConversation();

    // -----------------------------
    // USER MESSAGE
    // -----------------------------

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    updateConversation(conv.id, (c) => ({
      ...c,

      title:
        c.messages.length === 0
          ? text.slice(0, 42)
          : c.title,

      updatedAt: Date.now(),

      messages: [
        ...c.messages,
        userMessage,
      ],
    }));

    try {
      // -----------------------------
      // CALL FASTAPI
      // -----------------------------

      const result = await callAgent(text);

      console.log("Backend response:", result);

      // -----------------------------
      // TOOL RESULT
      // -----------------------------

      const tool: ToolCall = {
        id: crypto.randomUUID(),

        name:
          result.tool?.name ??
          "agent",

        input: text,

        status:
          result.tool?.status ??
          "done",

        startedAt: Date.now(),

        output:
          result.tool?.output ?? "",
      };

      // -----------------------------
      // AGENT MESSAGE
      // -----------------------------

      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),

        role: "agent",

        content:
          result.message ??
          "No response received.",

        createdAt: Date.now(),

        tools: [tool],
      };

      // -----------------------------
      // DISPLAY AGENT RESPONSE
      // -----------------------------

      updateConversation(conv.id, (c) => ({
        ...c,

        updatedAt: Date.now(),

        messages: [
          ...c.messages,
          agentMessage,
        ],
      }));

    } catch (error) {

      console.error(
        "Agent request failed:",
        error
      );

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),

        role: "agent",

        content:
          "Sorry, I could not connect to the agent backend.",

        createdAt: Date.now(),
      };

      updateConversation(conv.id, (c) => ({
        ...c,

        updatedAt: Date.now(),

        messages: [
          ...c.messages,
          errorMessage,
        ],
      }));

    } finally {

      setSending(false);

    }
  }

  function handlePlusAction(action: string) {
    setDraft((d) =>
      d
        ? d
        : `${PLUS_ACTION_LABEL[action] ?? action}: `
    );
  }

  return (
    <div
      className={`chat-app ${
        panelOpen ? "panel-open" : ""
      }`}
    >

      <BlackholeCanvas intensity={0.35} />

      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={createConversation}
      />

      <main className="chat-main">

        {/* TOP BAR */}

        <div className="chat-topbar">

          <h2>
            {active?.title ?? "New research"}
          </h2>

          <button
            className={`tool-toggle ${
              panelOpen ? "active" : ""
            }`}
            onClick={() =>
              setPanelOpen((o) => !o)
            }
          >
            ⚙ Tool use
          </button>

        </div>

        {/* CHAT MESSAGES */}

        <div className="thread">

          {(!active ||
            active.messages.length === 0) && (

            <div className="empty-thread">

              <h3>
                Start a new research thread
              </h3>

              <p>
                Ask a question, attach a source
                with the + button, or trigger
                deep research mode.
              </p>

            </div>
          )}

          {active?.messages.map((m) => (

            <MessageBubble
              key={m.id}
              message={m}
            />

          ))}

        </div>

        {/* INPUT + SEND BUTTON */}

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          onPlusAction={handlePlusAction}
          disabled={sending}
        />

      </main>

      {/* TOOL PANEL */}

      {panelOpen && (
        <ToolUsePanel
          tools={allTools}
        />
      )}

    </div>
  );
}