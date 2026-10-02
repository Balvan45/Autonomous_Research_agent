import type { Conversation, User } from "../types";

// Everything in this file is the ONE place that touches persistence.
// Swap these implementations for real API/fetch calls later — nothing
// in components or pages needs to change.

const KEYS = {
  users: "ra:users",
  session: "ra:session",
  conversations: (userId: string) => `ra:conversations:${userId}`,
};

interface StoredUser extends User {
  passwordHash: string;
}

// Not cryptographically secure — this is a frontend-only demo. A real
// backend must hash passwords server-side (bcrypt/argon2) and never
// store or compare them in the client.
async function hash(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.users) ?? "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

export async function signUp(name: string, email: string, password: string): Promise<User> {
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with that email already exists.");
  }
  const user: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await hash(password),
  };
  writeUsers([...users, user]);
  const { passwordHash: _drop, ...publicUser } = user;
  localStorage.setItem(KEYS.session, JSON.stringify(publicUser));
  return publicUser;
}

export async function signIn(email: string, password: string): Promise<User> {
  const users = readUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found || found.passwordHash !== (await hash(password))) {
    throw new Error("Incorrect email or password.");
  }
  const { passwordHash: _drop, ...publicUser } = found;
  localStorage.setItem(KEYS.session, JSON.stringify(publicUser));
  return publicUser;
}

export function signOut() {
  localStorage.removeItem(KEYS.session);
}

export function getSession(): User | null {
  try {
    return JSON.parse(localStorage.getItem(KEYS.session) ?? "null");
  } catch {
    return null;
  }
}

export function loadConversations(userId: string): Conversation[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.conversations(userId)) ?? "[]");
  } catch {
    return [];
  }
}

export function saveConversations(userId: string, conversations: Conversation[]) {
  localStorage.setItem(KEYS.conversations(userId), JSON.stringify(conversations));
}
