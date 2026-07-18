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

## 2026-07-17 - Step UI-3: Editable Persona Age

### What Changed

- Made patient age configurable from the COPD/SOB persona page.
- Added a compact age input and Save button inside the Patient Summary card.
- Corrected the displayed patient name to match the backend scenario:
  `Linda Thompson`.
- Added backend endpoints to read and update the current COPD/SOB persona age.
- Updated scenario loading so the selected age is injected into the scenario
  context used by text chat and Realtime voice instructions.

### Why It Changed

- Age is a persona setting, not a live patient-state cue.
- Instructors should be able to adjust age before starting the voice room without
  editing code or JSON files.
- The changed age must affect AI behavior, so it needs to be stored in the
  backend scenario context, not only displayed in the frontend.

### How It Changed

- Added a small in-memory backend persona settings service for the current
  prototype.
- Added validation so age must stay between 18 and 110.
- Added frontend API calls for loading and saving the persona age.
- Connected the persona page age field to the backend settings API.
- The scenario loader applies the latest saved age every time it loads the
  COPD/SOB scenario, which keeps downstream prompt builders aligned.

### Files Changed

- `codes/backend/app/services/persona_settings.py`
  - New service for current COPD/SOB persona settings.
  - Stores and validates the adjustable patient age.

- `codes/backend/app/services/scenario_loader.py`
  - Applies the current persona age to the loaded scenario.

- `codes/backend/app/api/scenarios.py`
  - Added `GET /scenarios/copd-sob/persona-settings`.
  - Added `PATCH /scenarios/copd-sob/persona-settings`.

- `codes/frontend/src/api/scenarios.ts`
  - New frontend API client for persona settings.

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Loads patient name and age from the backend.
  - Adds editable age input and save action.

- `codes/frontend/src/styles.css`
  - Adds compact age editor styling.

### Current Limitation

- The age setting is in-memory for the prototype. It resets when the backend
  server restarts. A production version should persist persona settings in the
  database per scenario/session.

## 2026-07-17 - Step UI-4: Editable Persona Gender

### What Changed

- Added gender as an editable COPD/SOB persona setting.
- Added a compact gender dropdown on the Persona Page.
- Added gender to the Patient Summary display.
- Backend now returns and accepts gender through the same persona settings API
  used for age.
- Scenario loading now injects the current gender and pronouns into the patient
  profile used by text chat and Realtime voice instructions.

### Why It Changed

- Gender is a persona-level attribute, similar to age.
- Instructors should be able to adjust the patient profile before starting the
  voice room.
- The AI should receive the selected gender in its scenario context so responses
  remain consistent with the persona shown to the instructor.

### How It Changed

- Extended the existing in-memory persona settings service to store gender.
- Added validation for supported gender values:
  - `female`
  - `male`
- Updated the scenario settings API so age and gender can be updated separately.
- Added a frontend gender update API call.
- Added a small select control in the Patient Summary card.

### Files Changed

- `codes/backend/app/services/persona_settings.py`
  - Added current gender storage.
  - Added gender validation.
  - Adds `gender`, `sex`, and `pronouns` into the loaded scenario profile.

- `codes/backend/app/api/scenarios.py`
  - Added `gender` to the persona settings response.
  - Allows partial settings updates for age and/or gender.

- `codes/frontend/src/api/scenarios.ts`
  - Added `PatientGender`.
  - Added `updateCopdSobPersonaGender`.

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Displays selected gender.
  - Adds an editable gender dropdown.
  - Saves gender to the backend.

- `codes/frontend/src/styles.css`
  - Renamed the age editor styling to generic persona-setting editor styling.
  - Added select styling for gender.

### Current Limitation

- Gender is also in-memory for this prototype and resets when the backend server
  restarts. Production should persist persona settings per scenario/session.

## 2026-07-17 - Step UI-5: Voice Room Control Redesign

### What Changed

- Redesigned the Voice Room navigation as a full-width top bar.
- Added the full voice-room title stack:
  - Student voice room
  - AI Patient Voice: COPD/SOB
  - Sim-room interface for speaking
- Redesigned instructor controls into compact symbol tiles.
- Instructor controls now show:
  - Reset patient state
  - SpO2 dropped
  - HR increased
  - Breathing worsened
  - Oxygen applied
  - Bronchodilator given
  - Patient improving
- Redesigned voice controls into compact symbol tiles.
- Voice controls now show:
  - Connect
  - Disconnect
  - Mute / Unmute
  - Refresh
  - Pause AI
  - Resume AI
  - Takeover
  - Release
- Added an Audio Setup section with:
  - Microphone selector
  - Test Mic button
  - Speaker selector
  - Test Speaker button
  - Audio setup status message
- Expanded the Voice Room grid so patient state spans the top and control panels
  have more room.

### Why It Changed

- The previous controls worked but were visually too compressed.
- Instructors need fast, visible controls during a live sim without searching.
- Voice setup should be visible in the room where the student microphone and
  patient speaker are selected.
- The full-width navigation makes the live session feel like the primary app
  workspace, not a small embedded panel.

### How It Changed

- Added symbols to each instructor cue definition.
- Added a reusable `ControlTile` component for consistent icon-style controls.
- Kept the existing state, voice, cue, pause/resume, and takeover handlers.
- Added frontend audio-device state using browser media-device APIs.
- The selected microphone is used when connecting the Realtime voice session.
- The selected speaker is applied to the patient audio element when the browser
  supports `setSinkId`.
- Added desktop, tablet, and mobile CSS layouts for the redesigned voice room.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Added control tile metadata and rendering.
  - Added microphone/speaker device loading.
  - Added microphone test and speaker test handlers.
  - Applies selected microphone during voice connection.
  - Applies selected speaker when supported by the browser.

- `codes/frontend/src/styles.css`
  - Redesigned full-width voice navigation.
  - Added control tile styles.
  - Added audio setup styles.
  - Expanded the voice room grid and responsive layouts.

### Current Limitation

- Speaker routing depends on browser support for audio output selection APIs.
  Chrome or Edge is recommended for the demo.

## 2026-07-17 - Step UI-6: Smaller Patient State Control Buttons

### What Changed

- Made the instructor patient-state control tiles smaller.
- Replaced text badges such as `RST`, `HR`, and `O2` with inline SVG line icons.
- Kept the existing instructor cue behavior unchanged.

### Why It Changed

- The patient-state controls were taking too much space in the Voice Room.
- Letter badges did not look like true icons.
- Instructors need fast scanning during a live scenario, so compact icon buttons
  are easier to read.

### How It Changed

- Added icon names to the existing cue button definitions.
- Added a reusable `ControlIcon` renderer inside `VoiceRoom.tsx`.
- Updated `ControlTile` so it can show either an SVG icon or a text symbol.
- Scoped smaller sizing to `.voice-instructor-card` so voice controls remain
  large enough for important connection and safety actions.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Adds icon metadata for patient-state controls.
  - Adds inline SVG icon rendering.
  - Uses icons for Reset, SpO2 dropped, HR increased, Breathing worsened,
    Oxygen applied, Bronchodilator given, and Patient improving.

- `codes/frontend/src/styles.css`
  - Adds SVG icon sizing.
  - Shrinks patient-state control tiles only inside the instructor control card.

## 2026-07-17 - Step UI-6: HR Baseline ECG Icon

### What Changed

- Added a heart ECG icon inside the HR card in the Persona Page Baseline State
  section.

### Why It Changed

- The HR card should be visually recognizable at a glance.
- The ECG symbol makes the heart-rate card easier to identify without adding
  extra text.

### How It Changed

- Reused the existing `HeartEcgIcon` component.
- Rendered the ECG symbol only for the HR metric card.
- Styled the icon as a centered, low-opacity visual mark so the HR value remains
  readable.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Added the ECG icon inside the HR condition metric.

- `codes/frontend/src/styles.css`
  - Added centered icon styling for the HR condition card.

## 2026-07-17 - Step UI-6: Heart ECG Icons

### What Changed

- Added a heart icon with an ECG wave inside it to the Persona Page Baseline
  State card.
- Added the same heart ECG icon to the Dashboard cards for:
  - Post-op Pain
  - Chest Pain

### Why It Changed

- The baseline condition section now has a clearer clinical visual signal.
- Post-op Pain and Chest Pain are cardiac/pain-related persona cards, so the
  heart ECG icon communicates the scenario category better than text initials.

### How It Changed

- Added a small inline SVG heart ECG icon in the relevant React components.
- Styled the icon with the existing clinical color system.
- Kept the change visual-only; no route, API, or session behavior changed.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Added the heart ECG icon to the Baseline State card header.

- `codes/frontend/src/pages/Dashboard.tsx`
  - Uses the heart ECG icon for Post-op Pain and Chest Pain persona cards.

- `codes/frontend/src/styles.css`
  - Added reusable heart ECG icon styling.
  - Added Baseline State icon container styling.

## 2026-07-17 - Step UI-5: Limit Gender Options

### What Changed

- Removed the nonbinary gender option from the COPD/SOB persona settings.
- Gender can now be set only to:
  - `female`
  - `male`
- Removed nonbinary from backend validation, frontend TypeScript types, and the
  Persona Page dropdown.

### Why It Changed

- The current project requirement is to keep the gender control limited to female
  and male.
- Keeping frontend and backend options identical prevents invalid saved settings
  and inconsistent AI context.

### How It Changed

- Updated backend allowed gender values.
- Updated the API request type.
- Updated the frontend gender union type.
- Removed the Nonbinary option from the selector.
- Removed nonbinary-specific pronoun handling.

### Files Changed

- `codes/backend/app/services/persona_settings.py`
- `codes/backend/app/api/scenarios.py`
- `codes/frontend/src/api/scenarios.ts`
- `codes/frontend/src/pages/PersonaPage.tsx`
- `codes/docs/UI_Redesign_Track.md`

## 2026-07-17 - Step UI-5: Persona Page Layout Polish

### What Changed

- Moved the age and gender edit controls beside the patient summary instead of
  stacking them below the summary facts.
- Kept age and gender as compact setting cards so they are visible without
  overloading the page.
- Updated baseline state tiles so the metric label sits at the top left and the
  value sits at the bottom right.
- Changed the Start Voice Room button color from blue/green-leaning styling to
  a purple-blue action color.

### Why It Changed

- The patient summary should feel like one compact briefing area.
- Age and gender are important setup controls, but they should not push the page
  vertically.
- Baseline vitals are easier to scan when labels and values have consistent
  positions.
- The Start Voice Room button needed to avoid green so it does not visually
  conflict with health/status indicators.

### How It Changed

- Added a `persona-summary-layout` grid inside the Patient Summary card.
- Added a `persona-settings-grid` for the age and gender editor cards.
- Wrapped baseline metric values in a `condition-value` container for better
  bottom-right alignment.
- Updated responsive CSS so the summary and setting cards stack on smaller
  screens.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Added summary/settings layout wrappers.
  - Wrapped baseline metric value and unit together.

- `codes/frontend/src/styles.css`
  - Added side-by-side summary/settings layout.
  - Adjusted setting-card layout.
  - Adjusted baseline state tile alignment.
  - Updated Start Voice Room button color.

## 2026-07-17 - Step UI-5: Broader Persona Page Cards

### What Changed

- Made the persona page content wider.
- Reduced card padding and vertical gaps so the briefing is easier to see at
  once on a desktop screen.
- Moved the only Start Voice Room button into the Starting Condition card.
- Removed the duplicate Start Voice Room button from the top bar.
- Removed the footer action area from the persona page.
- Made the Patient Summary card wider so age, gender, and key persona facts are
  easier to read.

### Why It Changed

- The persona page is a pre-session briefing page, so the instructor should be
  able to scan it quickly without scrolling.
- The Start Voice Room action belongs near the baseline patient state because
  that is the final check before entering the live room.
- Duplicate primary actions can make the page feel busier than necessary.

### How It Changed

- Adjusted the persona page grid from a narrow centered layout to a wider
  12-column layout.
- Let Patient Summary span more columns and tightened the Starting Condition
  card.
- Added a compact header inside the Starting Condition card for the Start Voice
  Room action.
- Removed unused footer JSX and footer CSS.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Removed Start Voice Room from the top bar.
  - Added Start Voice Room inside the Starting Condition card.
  - Removed the bottom footer action.

- `codes/frontend/src/styles.css`
  - Increased persona content width.
  - Reduced persona card spacing.
  - Added Starting Condition header layout.
  - Removed obsolete persona footer styles.

## 2026-07-17 - Step UI-3: Edge-Aligned Navigation Bars

### What Changed

- Moved navigation content toward the far left and far right edges on the
  dashboard, persona page, and voice room.
- Changed the persona page top bar from a three-column layout into a standard
  web app layout:
  - Left group: Dashboard link and persona title
  - Right group: connection status and Start Voice Room button
- Changed the voice room top bar into a full-width app bar.
- Kept the voice room working content constrained below the nav so controls and
  cards remain readable.

### Why It Changed

- Most web apps place brand/page identity on the left and actions/status on the
  right.
- The previous persona page layout made the title feel too centered instead of
  attached to the page context.
- The voice room nav looked more like a contained card than a page-level app bar.

### How It Changed

- Added a left-side wrapper in the persona page markup.
- Updated dashboard, persona, and voice nav CSS to use edge padding.
- Set voice room shell padding to zero so the nav reaches the page edges.
- Added padding and max-width to the voice room content grid so only the nav
  stretches fully.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Grouped the Dashboard link and persona title into a left navigation group.

- `codes/frontend/src/styles.css`
  - Updated dashboard top bar padding.
  - Updated persona top bar layout and spacing.
  - Updated voice shell, voice nav, and voice grid layout.

## 2026-07-17 - Step UI-2B: Persona Page Layout Refinement

### What Changed

- Expanded the persona page navigation bar so it spans the full browser width.
- Removed the large outer container/card around the persona briefing content.
- Kept the briefing sections as independent cards on the page background.
- Added a constrained content area below the full-width navigation bar.
- Improved the persona page visual style with a stronger navigation gradient,
  subtle independent card shadows, hover feedback, and cleaner spacing.

### Why It Changed

- The previous persona page felt like smaller cards placed inside one large card.
- The redesigned dashboard feels more open, so the persona page should follow the
  same product direction.
- A full-width navigation bar makes the page feel like a real app screen instead
  of a modal-like panel.
- Independent cards keep information simple and scannable without overloading the
  instructor.

### How It Changed

- Wrapped the persona briefing grid and footer inside a new `persona-content`
  container.
- Made the `persona-topbar` full-width by removing the page-level constrained
  shell behavior.
- Removed background, border, radius, and shadow from the briefing grid.
- Applied visual treatment to each briefing card individually.
- Updated mobile spacing so the new open layout still stacks cleanly.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Added the `persona-content` wrapper around the page body.

- `codes/frontend/src/styles.css`
  - Changed persona shell/page sizing.
  - Made the persona navigation bar full-width.
  - Removed the outer card treatment from the briefing grid.
  - Added independent card styling and responsive spacing.

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
