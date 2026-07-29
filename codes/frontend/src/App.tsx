import { Dashboard } from "./pages/Dashboard";
import { DebriefPage } from "./pages/DebriefPage";
import { PersonaPage } from "./pages/PersonaPage";
import { VoiceRoom } from "./pages/VoiceRoom";

export function App() {
  if (window.location.pathname.startsWith("/personas/")) {
    const scenarioId = window.location.pathname.split("/")[2];
    return <PersonaPage scenarioId={scenarioId} />;
  }

  if (window.location.pathname === "/voice") {
    return <VoiceRoom />;
  }

  if (window.location.pathname === "/debrief") {
    return <DebriefPage />;
  }

  return <Dashboard />;
}

// npm run dev
