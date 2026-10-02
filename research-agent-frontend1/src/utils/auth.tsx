import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { User } from "../types";
import * as storage from "./storage";

interface AuthContextValue {
  user: User | null;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signUp: async (name, email, password) => {
        const created = await storage.signUp(name, email, password);
        setUser(created);
      },
      signIn: async (email, password) => {
        const signedIn = await storage.signIn(email, password);
        setUser(signedIn);
      },
      signOut: () => {
        storage.signOut();
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
