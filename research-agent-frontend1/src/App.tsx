import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./utils/auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";

// Three.js is only needed for the intro, so it ships as its own chunk
// instead of bloating every other route's bundle.
const Intro = lazy(() => import("./pages/Intro"));

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RedirectIfAuthed({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  return user ? <Navigate to="/chat" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<div style={{ height: "100%", background: "#05060a" }} />}>
              <Intro />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/signup"
          element={
            <RedirectIfAuthed>
              <Signup />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <Chat />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
