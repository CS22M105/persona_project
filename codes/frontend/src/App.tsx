import { Dashboard } from "./pages/Dashboard";
import { VoiceRoom } from "./pages/VoiceRoom";

export function App() {
  if (window.location.pathname === "/voice") {
    return <VoiceRoom />;
  }

  return <Dashboard />;
}

// npm run dev
