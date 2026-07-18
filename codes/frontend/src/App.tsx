import { Dashboard } from "./pages/Dashboard";
import { PersonaPage } from "./pages/PersonaPage";
import { TranscriptsPage } from "./pages/TranscriptsPage";
import { VoiceRoom } from "./pages/VoiceRoom";

export function App() {
  if (window.location.pathname === "/personas/copd-sob") {
    return <PersonaPage />;
  }

  if (window.location.pathname === "/voice") {
    return <VoiceRoom />;
  }

  if (window.location.pathname === "/transcripts") {
    return <TranscriptsPage />;
  }

  return <Dashboard />;
}

// npm run dev
