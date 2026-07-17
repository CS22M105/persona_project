import { Dashboard } from "./pages/Dashboard";
import { PersonaPage } from "./pages/PersonaPage";
import { VoiceRoom } from "./pages/VoiceRoom";

export function App() {
  if (window.location.pathname === "/personas/copd-sob") {
    return <PersonaPage />;
  }

  if (window.location.pathname === "/voice") {
    return <VoiceRoom />;
  }

  return <Dashboard />;
}

// npm run dev
