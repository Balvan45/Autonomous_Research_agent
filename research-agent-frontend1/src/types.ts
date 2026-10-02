export interface User {
  id: string;
  name: string;
  email: string;
}

export type ToolStatus = "running" | "done" | "error";

export interface ToolCall {
  id: string;
  name: string;
  input: string;
  output?: string;
  status: ToolStatus;
  startedAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  createdAt: number;
  tools?: ToolCall[];
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}
