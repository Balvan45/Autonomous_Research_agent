# Autonomous Research Agent — Frontend

React + TypeScript + Vite frontend, no backend. Auth, chat history, and tool-use
traces are persisted to `localStorage` via `src/utils/storage.ts` — swap that
module for real API calls whenever a backend exists; nothing else needs to change.

## What's inside
- **Blackhole / neuron field animation** — `src/components/BlackholeCanvas.tsx`, a
  canvas particle system (accretion disk + orbiting "neuron" nodes with synapse
  lines) used as the backdrop on the auth screens and, dimmed, behind the chat page.
- **Login / Signup** — `src/pages/Login.tsx`, `src/pages/Signup.tsx`. Password rule:
  8+ chars, 1 lowercase, 1 uppercase, 1 number, 1 special character
  (`src/utils/validation.ts`).
- **Chat** — `src/pages/Chat.tsx`: sidebar conversation history, message thread,
  a `+` menu beside the input (attach file / new research / tool picker), and a
  right-hand **tool use** panel showing each tool call's name, input, status and
  output, the way Claude/ChatGPT/Grok surface tool traces.

## Run it
```bash
npm install
npm run dev
```

## Structure
```
src/
  components/   BlackholeCanvas, Sidebar, ChatInput, PlusMenu, MessageBubble,
                ToolUsePanel, PasswordField, AuthLayout
  pages/        Login, Signup, Chat
  utils/        validation.ts, storage.ts, auth.tsx (AuthContext)
  types.ts
```

## Wiring up a real backend later
Every call to `localStorage` lives in `src/utils/storage.ts` and
`src/utils/auth.tsx`. Replace the function bodies with `fetch`/API calls; the
component layer never touches `localStorage` directly.
