import { useEffect, useState } from "react";

import { getHealth } from "../api/client";

type BackendStatus = "checking" | "connected" | "unavailable";

export function Home() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    getHealth()
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("unavailable"));
  }, []);

  return (
    <main className="app-shell">
      <section className="status-panel">
        <p className="eyebrow">Phase 1 setup</p>
        <h1>AI Patient Voice Persona</h1>
        <p className="lede">
          Standalone instructor-cued simulation app foundation.
        </p>
        <div className={`status status-${backendStatus}`}>
          Backend status: {backendStatus}
        </div>
      </section>
    </main>
  );
}
