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

## 2026-07-17 - Step UI-2: COPD/SOB Persona Briefing Page

### What Changed

- Created a new persona-specific briefing page for COPD / Shortness of Breath.
- Added a new frontend route: `/personas/copd-sob`.
- Updated the dashboard's Open Persona action so it opens the persona briefing
  page instead of going directly to the voice room.
- Updated the voice room navigation so the instructor can return to the persona
  page or the dashboard.
- Added concise briefing sections:
  - Patient summary
  - Starting condition
  - Available instructor cues
  - Learning goals
  - Start Voice Room action

### Why It Changed

- The instructor needs a simple page to understand the selected scenario before
  entering the live voice room.
- The persona page should explain the scenario but should not contain live
  session controls, transcripts, reports, or event timeline.
- This keeps the product flow clear:
  - Dashboard = choose persona
  - Persona page = review scenario
  - Voice room = run live session

### How It Changed

- Added a dedicated `PersonaPage` React component.
- Used static COPD/SOB briefing content for the current single-persona product.
- Added a simple route in `App.tsx` using the existing pathname-based routing
  style.
- Reused the backend health check to show connection status in the persona page
  top bar.
- Added responsive styles for the persona page so briefing cards stack on small
  screens.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - New page component for the COPD/SOB persona briefing.
  - Contains patient summary, baseline state, cues, learning goals, and Start
    Voice Room navigation.

- `codes/frontend/src/App.tsx`
  - Added route handling for `/personas/copd-sob`.

- `codes/frontend/src/pages/Dashboard.tsx`
  - Changed the available persona action from `/voice` to `/personas/copd-sob`.

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Added a Persona Page navigation link.
  - Kept the Dashboard navigation link.

- `codes/frontend/src/styles.css`
  - Added persona page layout, top bar, briefing card, condition metric, cue
    chip, footer, and responsive styles.

### Next Recommended UI Step

Refine the voice room layout so it visually matches the new page system. The
event timeline should live inside the voice room, close to instructor controls.

## 2026-07-17 - Step UI-2A: Expand Persona Page Layout

### What Changed

- Expanded the persona page width to match the dashboard and voice room.
- Changed the briefing area from a narrow two-column layout to a 12-column grid.
- Made the patient summary and starting condition cards use more horizontal
  space on wide screens.
- Preserved a stacked layout on mobile and tablet screens.

### Why It Changed

- The previous persona page left too much unused white space inside the page
  boundary.
- The page should feel like a full product screen, not a small centered panel.
- The page did not need more content; it needed better use of the available
  space.

### How It Changed

- Updated only CSS layout rules for the persona page.
- Increased `.persona-page` max width from `1120px` to `1440px`.
- Changed `.persona-brief-grid` to a 12-column grid.
- Added grid spans for the four existing briefing cards.
- Added responsive overrides so cards still stack cleanly on smaller screens.

### Files Changed

- `codes/frontend/src/styles.css`
  - Updated persona page width and grid behavior.
  - Added responsive grid-span resets.

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
