# UI Redesign Track

This document records user-facing redesign changes so each page update stays easy
to understand and review.

## 2026-07-17 - Step UI-1: Dashboard Persona Selection

### What Changed

- Redesigned the current dashboard into a simple persona-selection page.
- Added a clinical product-style top bar with the app name and backend
  connection status.
- Added four compact persona cards:
  - COPD / Shortness of Breath
  - Post-op Pain
  - Sepsis Concern
  - Chest Pain
- Marked COPD / Shortness of Breath as the available persona for the current
  build.
- Kept the other persona cards visible as coming-soon placeholders so the product
  direction is clear without adding unfinished functionality.

### Why It Changed

- The dashboard should help instructors choose a patient persona.
- Live session details such as event timeline, transcript, report generation, and
  state controls belong in the live session/voice room, not on the selection
  dashboard.
- Loading the dashboard should not automatically start a simulation session or
  create session records.
- A clean selection dashboard supports future scaling to multiple personas.

### How It Changed

- Replaced the dashboard's session/report-heavy logic with a lightweight
  persona-card data model in the frontend.
- Reused the backend health check only for the connection badge.
- Added visual hierarchy with a top bar, short hero section, scenario chips, and
  a primary action on the active persona.
- Added responsive CSS so the persona grid changes from four columns to two
  columns to one column depending on screen width.

### Files Changed

- `codes/frontend/src/pages/Dashboard.tsx`
  - Removed automatic session start, event loading, and report controls from the
    dashboard page.
  - Added static persona card data for the dashboard selection view.
  - Added backend connection status using the existing health endpoint.
  - Linked the currently available COPD/SOB persona action to the existing voice
    room route until the separate persona page is created.

- `codes/frontend/src/styles.css`
  - Added dashboard top bar styles.
  - Added connection pill styles.
  - Added persona grid and persona card styles.
  - Added scenario chip and action button styles.
  - Added responsive layout rules for tablet and mobile screens.

### Next Recommended UI Step

Create the persona-specific page for COPD/SOB. That page should sit between the
dashboard and the voice room, showing a concise patient briefing and a Start
Voice Room button.

## 2026-07-17 - Step UI-1B: Dashboard Webpage Layout

### What Changed

- Converted the dashboard from a large card-like container into a normal webpage
  layout.
- Made the navigation bar span the full page width.
- Removed the outer white bordered container around the hero and persona grid.
- Kept persona cards as individual cards inside the page body.

### Why It Changed

- The previous dashboard looked like all content was placed inside one large
  card, with persona cards nested inside it.
- A product dashboard should feel like a webpage: navigation first, then page
  content, then independent cards.
- This structure will scale better when more personas, filters, or admin actions
  are added later.

### How It Changed

- Updated only CSS layout rules.
- Set the dashboard shell to behave like a full page instead of a centered panel.
- Changed the top navigation to full width.
- Constrained the hero and persona grid content with a max-width while keeping
  the page background visible.
- Removed border, radius, shadow, and white background from the outer dashboard
  body sections.

### Files Changed

- `codes/frontend/src/styles.css`
  - Updated `.dashboard-shell`, `.dashboard-page`, `.dashboard-topbar`,
    `.dashboard-hero`, and `.persona-grid`.
  - Adjusted mobile spacing so the webpage layout remains clean on small screens.
