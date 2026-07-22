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

## 2026-07-22 - Step UI-6: State Update Icon Highlight

### What Changed

- Removed the separate red update dot from the center of highlighted patient
  state subcards.
- Reused the existing state icon as the update indicator.
- The icon now twinkles red and shows a small pulse ring when that state field
  changes.
- The icon remains in its original top-right position.

### Why It Changed

- The center dot could cover the patient-state information.
- The icon already identifies the type of state field, so animating it is clearer
  and less intrusive.
- Keeping the icon in its original position preserves the card layout.

### How It Changed

- Removed the `voice-state-updated-dot` element from the `StateMetric` component.
- Replaced dot-specific CSS animations with icon-specific twinkle and ring
  animations.
- Applied the animation only when the subcard has the highlighted state class.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Removed the separate recently-updated dot markup.

- `codes/frontend/src/styles.css`
  - Removed center-dot styling.
  - Added red twinkle and pulse-ring behavior to `.voice-state-icon` when its
    parent state card is highlighted.

## 2026-07-22 - Step UI-6: Live Persona Summary for Voice Settings

### What Changed

- Patient Summary now updates immediately when a persona dropdown changes.
- Gender selection is reflected in the visible Patient Summary before saving.
- Voice selection is reflected in the visible Patient Summary before saving.
- Added a Voice type dropdown to the persona settings area.
- Added Voice type to the visible Patient Summary.

### Why It Changed

- The visible Patient Summary should match what the instructor is currently
  selecting.
- The previous behavior made the dropdown feel disconnected because the summary
  only changed after Save.
- Voice type is a persona-level setting and should be visible before entering
  the voice room.

### How It Changed

- Patient Summary now reads active input values for dropdown-based settings.
- Added preset voice type options:
  - Breathless, tired, anxious
  - Calm but short of breath
  - Very anxious and breathless
  - Weak, tired, and slow
  - Alert and cooperative
- Connected the Voice type dropdown to the existing backend
  `voice_style` setting API.
- Save still persists the selected values so chat and Realtime voice can use
  them.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Shows live dropdown selections in Patient Summary.
  - Adds Voice type dropdown and save handler.
  - Adds Voice type to the summary facts.

- `codes/docs/UI_Redesign_Track.md`
  - Records the summary/dropdown behavior change.

## 2026-07-22 - Step UI-6: Expanded Voice and Voice Style Options

### What Changed

- Expanded the selectable Realtime voices on the Persona Page.
- Added voice options:
  - Marin
  - Cedar
  - Alloy
  - Ash
  - Ballad
  - Coral
  - Echo
  - Sage
  - Shimmer
  - Verse
- Kept Marin and Cedar labeled as recommended voices.
- Added more voice-style presets:
  - Breathless, tired, anxious
  - Severe dyspnea, short broken phrases
  - Mildly breathless, cooperative, reassuring
  - Anxious adult, rapid breathing, fearful, needs reassurance
  - Tired adult, weak voice, slow responses, fatigued
  - Post-treatment, calmer, still breathless, mildly tired
  - Confused, breathless, worried, needs simple questions
  - Guarded adult, chest tightness, uncomfortable, anxious

### Why It Changed

- Instructors need more flexibility when shaping the simulated patient's voice.
- The voice setting controls the OpenAI Realtime output voice.
- The voice style setting guides the AI's speaking behavior and emotional tone in
  both text and voice instructions.

### How It Changed

- Backend voice validation now accepts the current OpenAI Realtime built-in voice
  list used by this project.
- Frontend voice types were expanded to match backend validation.
- The Persona Page voice dropdown now renders from a reusable voice options list.
- The Voice Style field now includes presets while still allowing custom text.

### Files Changed

- `codes/backend/app/services/persona_settings.py`
  - Expanded `ALLOWED_PATIENT_VOICES`.

- `codes/backend/app/api/scenarios.py`
  - Expanded accepted voice values in the persona settings update schema.

- `codes/frontend/src/api/scenarios.ts`
  - Expanded `PatientVoice`.

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Added reusable voice options.
  - Added reusable voice-style preset options.
  - Updated the Voice dropdown and Voice Style controls.

### Source Note

- OpenAI Realtime API reference lists the supported built-in voices and notes
  that Marin and Cedar are recommended for best quality.

## 2026-07-21 - Step UI-6: Persona Voice Style and Voice Selection

### What Changed

- Added editable voice style to the COPD/SOB Persona Page.
- Added explicit voice selection to the COPD/SOB Persona Page.
- Default voice style is:
  - `Breathless, tired, anxious`
- Voice options are:
  - `Marin`
  - `Cedar`
  - `Verse`
- Patient Summary now displays the selected voice and voice style.
- Backend persona settings now store:
  - `voice`
  - `voice_style`
- Realtime voice session creation uses the selected `voice`.
- Realtime voice instructions include the selected `voice_style`.
- Text chat persona prompts also include the selected `voice_style`.

### Why It Changed

- Voice and voice style are persona-level settings chosen before the live
  session.
- The selected voice controls the generated audio voice.
- The selected style controls how the patient should sound clinically, for
  example breathless, tired, and anxious.
- Keeping these settings on the Persona Page helps the instructor prepare the
  patient before starting the Voice Room.

### How It Changed

- Extended the in-memory persona settings service with explicit voice and voice
  style fields.
- Added backend validation for supported voices and voice style length.
- Added API support for updating voice and voice style through the existing
  persona settings endpoint.
- Added frontend API calls for saving voice and voice style.
- Added Persona Page form controls for selecting voice and editing voice style.
- Added voice style into both text and Realtime prompt builders so patient
  responses reflect the selected style.

## 2026-07-22 - Step UI-7: Remove Age-Specific Default Voice Style

### What Changed

- Removed the age-specific older-adult phrase from the active Voice Style
  defaults.
- Replaced it with `Breathless, tired, anxious`.
- Removed age-specific wording from related voice-style presets.
- Kept the `Custom voice style` option unchanged.

### Why It Changed

- Age is now instructor-editable, so the default voice style should not hard-code
  an older adult persona.
- The Voice Style field should describe speaking behavior and emotional tone,
  while age should come from the separate age setting.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Updated the default voice style and preset labels.

- `codes/backend/app/services/persona_settings.py`
  - Updated the backend default voice style used by scenario context.

- `codes/docs/UI_Redesign_Track.md`
  - Updated the documented preset list and rationale.

### Files Changed

- `codes/backend/app/services/persona_settings.py`
  - Adds selected voice and voice style settings.
  - Injects `voice` and `voice_style` into the loaded scenario profile.

- `codes/backend/app/api/scenarios.py`
  - Adds `voice` and `voice_style` to persona settings responses.
  - Allows partial updates for voice and voice style.

- `codes/backend/app/services/voice_instruction_builder.py`
  - Adds voice style to Realtime voice instructions.

- `codes/backend/app/services/persona_prompt_builder.py`
  - Adds voice style to text chat persona instructions.

- `codes/frontend/src/api/scenarios.ts`
  - Adds `PatientVoice`.
  - Adds update functions for voice and voice style.

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Displays voice and voice style.
  - Adds Voice and Voice Style save controls.

- `codes/frontend/src/styles.css`
  - Adds a wider layout option for the voice style setting editor.

### Current Limitation

- Voice and voice style are stored in memory for the prototype and reset when the
  backend restarts.
- If a voice is changed while a Realtime session is already connected, the user
  should disconnect and reconnect to hear the new selected voice. Voice style can
  be reflected through refreshed instructions.

## 2026-07-21 - Step UI-6: Voice Persona Identity Sync Fix

### What Changed

- Fixed Realtime voice instruction syncing for editable age and gender.
- Added a backend persona-settings timestamp that changes whenever age or gender
  is saved.
- Added that timestamp to the `/voice/instructions` response.
- Updated the Voice Room sync logic so it refreshes Realtime instructions when
  either patient state or persona settings change.
- Made voice and text prompts explicitly include patient identity:
  - name
  - age
  - gender
  - pronouns
- Added direct prompt guidance that the AI must answer age/gender/name/background
  questions using the selected patient identity.

### Why It Changed

- The previous voice sync only checked `patient_state_updated_at`.
- Age and gender are persona settings, not patient state fields, so changing them
  did not trigger a `session.update` for an already-connected Realtime session.
- The AI also needed stronger identity instructions so it would not improvise a
  different age or gender when asked directly.

### How It Changed

- The backend now stores `persona_settings_updated_at` in the in-memory persona
  settings service.
- The timestamp is refreshed whenever age or gender changes.
- The voice instructions API returns both:
  - `patient_state_updated_at`
  - `persona_settings_updated_at`
- The frontend builds a combined instruction version from patient-state timestamp,
  persona-settings timestamp, and recent cue count.
- If that combined version changes, the Voice Room sends a Realtime
  `session.update`.

### Files Changed

- `codes/backend/app/services/persona_settings.py`
  - Added persona settings timestamp.
  - Updates timestamp after age/gender saves.

- `codes/backend/app/schemas/voice.py`
  - Added `persona_settings_updated_at` to `VoiceInstructionsResponse`.

- `codes/backend/app/services/realtime_voice_service.py`
  - Adds persona settings timestamp to voice instruction responses.

- `codes/backend/app/services/voice_instruction_builder.py`
  - Adds explicit patient identity block to Realtime instructions.
  - Adds identity guidance into voice guidance.

- `codes/backend/app/services/persona_prompt_builder.py`
  - Adds explicit patient identity block to text chat instructions.

- `codes/frontend/src/api/voice.ts`
  - Adds `persona_settings_updated_at` to the frontend voice instruction type.

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Replaces patient-state-only sync tracking with a combined instruction
    version.

### Verification

- Backend compile passed.
- Frontend build passed.
- API test confirmed that after setting age to `72` and gender to `male`, voice
  instructions included `Age: 72`, `Gender: male`, and `he/him`.

## 2026-07-18 - Step UI-6: Persona Page Baseline Card Polish

### What Changed

- Made the Starting Condition baseline subcards smaller.
- Reduced baseline subcard height, padding, icon size, label size, and value size.
- Changed the desktop baseline grid from two larger columns to four compact
  columns.
- Removed the circular visual containers around persona and baseline icons.

### Why It Changed

- The baseline cards were taking too much visual space on the persona page.
- The circle wrappers made the icons feel heavier than the surrounding clinical
  content.
- The persona page should stay lightweight and easy to scan before entering the
  voice room.

### How It Changed

- Updated only CSS styles; no behavior, API, or data model changed.
- Kept the icons themselves, but removed the background, border, and circular
  radius from their containers.
- Kept responsive behavior so smaller screens can still stack the baseline
  cards.

### Files Changed

- `codes/frontend/src/styles.css`
  - Updated `.persona-section-mark`.
  - Updated `.condition-title-icon`.
  - Updated `.condition-grid`.
  - Updated `.condition-metric`.
  - Updated `.condition-metric-center-icon`.

## 2026-07-18 - Step UI-6: Persona Page Baseline Card Polish

### What Changed

- Moved the Dashboard navigation button to the right side of the Persona Page
  top bar beside the connection status.
- Updated baseline state subcards so each metric has a visible centered icon.
- Made the baseline icons consistent across HR, SpO2, RR, and Breathing.

### Why It Changed

- The top bar navigation should keep page actions together on the right.
- Baseline state cards are easier to scan when each metric has a clear visual
  marker in the center of the card.
- The visual treatment now matches the icon-forward style used elsewhere in the
  redesigned app.

### How It Changed

- Moved the Dashboard link inside the existing `persona-topbar-actions` group.
- Changed condition metric styling from faint background icons to centered icon
  marks.
- Added tone-specific icon backgrounds and borders for heart, oxygen,
  respiratory rate, and breathing effort.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Moved Dashboard link into the right-side top bar actions.

- `codes/frontend/src/styles.css`
  - Updated baseline state card layout and centered icon styles.

## 2026-07-18 - Step UI-6: Persona Baseline State Icons

### What Changed

- Added matching center icons to every Baseline State card on the Persona Page.
- HR keeps the heart/ECG icon.
- SpO2 now shows an oxygen-style icon.
- RR now shows a lungs/respiratory icon.
- Breathing now shows an airflow/effort icon.

### Why It Changed

- The baseline state cards should be scannable before the instructor starts the
  voice room.
- Icons make HR, oxygen saturation, respiratory rate, and breathing effort easier
  to recognize quickly.
- The Persona Page now visually matches the style already used for the HR card.

### How It Changed

- Updated the `ConditionMetric` component to accept an icon.
- Added small inline SVG icon components for oxygen, respiratory rate, and
  breathing effort.
- Extended the existing condition-card CSS so each icon inherits the card's
  clinical color tone.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Added icon support to baseline condition cards.
  - Added oxygen, respiratory rate, and breathing effort icons.

- `codes/frontend/src/styles.css`
  - Added shared baseline-state icon styling.
  - Added color-specific icon rules for each condition card tone.

## 2026-07-18 - Step UI-6: Voice Room Icons

### What Changed

- Replaced voice-control text abbreviations with real icon buttons.
- Added icons to Current Patient State subcards.
- Patient-state icons now appear for:
  - Status
  - Stage
  - HR
  - SpO2
  - RR
  - BP
  - Breathing effort
  - Chest tightness
  - Anxiety
  - Fatigue
  - Speech
  - Tone
  - Oxygen
  - Bronchodilator
- Voice-control icons now appear for:
  - Connect
  - Disconnect
  - Mute / Unmute
  - Refresh
  - Pause AI
  - Resume AI
  - Takeover
  - Release

### Why It Changed

- The previous voice controls used text abbreviations such as `ON`, `OFF`, and
  `REF`, which were less intuitive.
- Patient-state subcards are easier to scan during a live simulation when each
  clinical value has a matching visual cue.
- Icons make the voice room feel more polished and closer to a production
  clinical simulation interface.

### How It Changed

- Extended the existing local `ControlIcon` SVG component.
- Passed icon names into `ControlTile` for voice-control buttons.
- Added an icon prop to `StateMetric`.
- Added state-card icon styling in CSS while preserving existing highlight and
  color behavior.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Added icon names for voice controls and patient-state subcards.
  - Extended the local icon component with additional SVG icons.
  - Updated `StateMetric` to render icons.

- `codes/frontend/src/styles.css`
  - Added patient-state icon badge styles.
  - Kept icon colors aligned with existing state-card tones.

## 2026-07-18 - Step UI-6: Transcripts and Timeline Page

### What Changed

- Added a dedicated Transcripts page at `/transcripts`.
- Added a `Transcripts` button to the Voice Room navigation bar.
- Moved the visible voice transcript section out of the Voice Room.
- The new page shows:
  - Current session summary
  - Conversation transcript
  - Event timeline
  - Refresh button
  - Navigation back to Voice Room, Persona Page, and Dashboard

### Why It Changed

- The Voice Room should stay focused on live simulation actions:
  - patient state
  - instructor controls
  - voice controls
  - patient conversation
- Transcript and timeline review is a session-record task, so it belongs on a
  separate page.
- Moving transcript/timeline away from the live controls reduces visual overload
  during the simulation.

### How It Changed

- Added a new React page that loads the current session using the existing
  session APIs.
- The page fetches persisted transcript messages and timeline events from the
  backend.
- Voice Room still saves Realtime transcript events to the backend, but no longer
  keeps a separate visual transcript section at the bottom of the page.
- Updated the Voice Room grid so it no longer reserves space for the transcript
  row.

### Files Changed

- `codes/frontend/src/pages/TranscriptsPage.tsx`
  - New page for session transcript and event timeline review.

- `codes/frontend/src/App.tsx`
  - Added route handling for `/transcripts`.

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Added Transcripts navigation button.
  - Removed bottom Voice Transcript display section.
  - Kept backend transcript-saving behavior.

- `codes/frontend/src/styles.css`
  - Added Transcripts page layout and responsive styles.
  - Removed Voice Room transcript grid area usage.

### Current Limitation

- The Transcripts page shows the current active session record. A later product
  version should add a session-history selector for reviewing older sessions.

## 2026-07-18 - Step UI-6: Voice Room Compact Layout

### What Changed

- Moved the room microphone/speaker guidance into the Voice Session Status card
  as part of a side-by-side status layout on desktop.
- Reduced the Patient Conversation panel height so the conversation stays inside
  a compact scrollable card.
- Tightened embedded chat header, message area, and input padding.
- Restored the Voice Room navigation subtitle: `Sim-room interface for speaking`.

### Why It Changed

- The Voice Room needs to show more information on one visible screen during a
  simulation.
- The conversation should scroll internally instead of pushing other live
  controls down the page.
- The microphone/speaker guidance belongs with session status because it is
  operational setup information.

### How It Changed

- Updated CSS for `.voice-instructor-chat .chat-panel` to use a smaller fixed
  height.
- Updated the Voice Session Status block to use a two-column desktop layout.
- Added responsive rules so the status block stacks on tablet and mobile.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Added the navigation subtitle under the Voice Room title.

- `codes/frontend/src/styles.css`
  - Compacted the embedded conversation card.
  - Styled Voice Session Status as a compact side-by-side status card.
  - Added responsive stacking for smaller screens.

## 2026-07-18 - Step UI-6: Compact Voice Controls and Status Guidance

### What Changed

- Moved the guidance text into the Voice Session Status card:
  `Use the room microphone for student speech and the room speaker for patient voice playback.`
- Removed the separate guidance note from the Voice Controls card.
- Compacted the Voice Controls panel:
  - Smaller control tiles
  - Smaller symbols
  - Reduced button height
  - Tighter audio setup spacing
  - Smaller Test Mic and Test Speaker controls

### Why It Changed

- The Voice Room needs to show more information on one screen without forcing the
  instructor to scroll.
- Guidance about room audio belongs with session status because it describes the
  live voice setup, not a separate action.
- Compact controls preserve all functions while improving visible space.

### How It Changed

- Kept all existing voice control behavior and handlers unchanged.
- Moved only the instructional text in `VoiceRoom.tsx`.
- Added `voice-session-guidance` styling inside the status block.
- Added voice-control-specific compact CSS so instructor controls are not
  affected.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Moved room microphone/speaker guidance into the Voice Session Status block.
  - Removed the standalone Voice Controls note.

- `codes/frontend/src/styles.css`
  - Added compact Voice Controls tile sizing.
  - Reduced audio setup spacing.
  - Added Voice Session Status guidance styling.

## 2026-07-18 - Step UI-6: Simplified Built-In / External Audio Selection

### What Changed

- Simplified Voice Room microphone selection to two instructor-facing options:
  - Built-in
  - External Bluetooth / USB
- Simplified Voice Room speaker selection to two instructor-facing options:
  - Built-in
  - External Bluetooth / USB
- Added a short hint explaining that external devices must already be paired or
  connected to the laptop before starting the voice session.
- Kept Test Mic and Test Speaker buttons.

### Why It Changed

- The previous device dropdown exposed every browser device name, which is too
  technical for the instructor workflow.
- The instructor only needs to decide whether the sim-room laptop should use its
  built-in audio or an external lab mic/speaker.
- Bluetooth pairing is handled by the operating system, not the web app, so the
  UI should guide the instructor without implying the browser can pair devices.

### How It Changed

- Voice Room now stores audio choices as `built_in` or `external`.
- The app resolves those choices to actual browser audio devices internally.
- Built-in selection prefers default, built-in, MacBook, or internal device
  labels.
- External selection uses the first visible non-built-in audio device.
- If External is selected but no external device is visible, the app shows a
  clear connection message.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Replaced raw audio device dropdown values with built-in/external choices.
  - Added audio device resolution helpers.
  - Updated microphone test, speaker test, voice connection, and speaker routing
    to use the selected audio type.

- `codes/frontend/src/styles.css`
  - Added hint styling for the simplified audio setup section.

## 2026-07-18 - Step UI-6: Reset Button Header Placement

### What Changed

- Moved `Reset patient state` out of the instructor cue grid.
- Placed it beside the `Patient State Controls` heading.
- Kept the same reset handler and loading spinner behavior.
- Added compact styling so reset reads as a header-level action, not a clinical
  cue.

### Why It Changed

- Reset is a session/state utility action, while the other buttons are clinical
  patient-state cues.
- Placing reset next to the section title makes the cue grid cleaner and easier
  to scan during a live simulation.

### How It Changed

- Updated the Voice Room JSX to render a `heading-reset-button` inside the
  control panel heading.
- Removed the reset tile from the instructor control grid.
- Added responsive CSS so the heading and reset button stack on small screens.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Moved reset action into the Patient State Controls heading.

- `codes/frontend/src/styles.css`
  - Added compact header reset button styles.
  - Added mobile stacking behavior for control panel headings.

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

## 2026-07-18 - Step UI-5A: Move Voice Session Status

### What Changed

- Moved the voice session status details from the Voice Controls card to below
  the Patient State Controls card.
- Kept the same live data fields:
  - Connection
  - Microphone
  - State sync
  - AI paused
  - Takeover
  - Realtime model
  - Voice
  - Session
- Made the status details more compact with a two-column label/value layout.

### Why It Changed

- The Voice Controls card needs to stay focused on audio setup and action
  buttons.
- Moving session status under Patient State Controls makes more information
  visible on one screen without pushing the voice controls downward.
- The status block is still connected to the same voice room state, so no
  behavior changed.

### How It Changed

- Moved the existing `voice-session-grid` JSX from the Voice Controls section
  into the Instructor/Patient State Controls section.
- Added a small `Voice Session Status` heading above the moved details.
- Added compact CSS scoped to `.voice-session-status-block`.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Moved the session details block below instructor cue controls.

- `codes/frontend/src/styles.css`
  - Added compact styling for the moved session status block.

## 2026-07-18 - Step UI-5B: Align Voice Room Card Bottoms

### What Changed

- Aligned the bottoms of the main Voice Room cards in the live-session row.
- The Patient State Controls card, Voice Controls card, and Patient Conversation
  card now stretch to the same row height.
- The embedded conversation area now flexes inside the conversation card so the
  input stays anchored while the card fills the row.

### Why It Changed

- The cards had different natural heights, which made the Voice Room look
  uneven.
- Aligning the card bottoms improves visual polish and makes the live-session
  workspace easier to scan.

### How It Changed

- Changed the Voice Room grid alignment from `start` to `stretch`.
- Made the main row cards full-height flex columns.
- Let the embedded chat wrapper and chat panel flex within the conversation
  card.

### Files Changed

- `codes/frontend/src/styles.css`
  - Updated `.voice-grid`, `.voice-instructor-card`, `.voice-control-card`,
    `.voice-chat-card`, `.voice-instructor-chat`, and the embedded chat panel
    rules.

## 2026-07-21 - Step UI-5C: Gender-Based Realtime Voice Selection

### What Changed

- Connected the saved persona gender to the Realtime voice selected at session
  creation.
- Female persona now uses the `marin` Realtime voice.
- Male persona now uses the `cedar` Realtime voice.
- Persona settings response now includes the selected voice.
- Persona Page now displays the selected voice in the Patient Summary.
- Voice instructions response now includes the selected voice.
- Voice Room now warns the instructor to disconnect and reconnect if the
  selected persona voice changes during an already-connected voice session.

### Why It Changed

- Previously, gender changed the AI instructions, but the audio output voice was
  still hardcoded to one voice.
- Realtime voice tone is controlled by the Realtime session voice setting, not
  only by prompt instructions.
- OpenAI Realtime voice cannot reliably be changed after the model has already
  responded with audio in the active session, so the selected voice should be
  applied when a new voice session is created.

### How It Changed

- Added a gender-to-voice mapping in the backend persona settings service.
- Realtime session creation now reads the selected persona voice instead of the
  static config voice.
- The frontend displays the selected voice and tells the instructor to reconnect
  when needed.
- Existing age, gender, state, cue, and voice connection behavior remains in
  place.

### Files Changed

- `codes/backend/app/services/persona_settings.py`
  - Added `GENDER_VOICE_MAP`.
  - Added `get_copd_sob_patient_voice`.

- `codes/backend/app/services/realtime_voice_service.py`
  - Uses the persona-selected voice when creating a Realtime session.
  - Returns the selected voice in current voice instructions.

- `codes/backend/app/api/scenarios.py`
  - Added `voice` to the persona settings response.

- `codes/backend/app/schemas/voice.py`
  - Added `voice` to `VoiceInstructionsResponse`.

- `codes/frontend/src/api/scenarios.ts`
  - Added `voice` to the persona settings type.

- `codes/frontend/src/api/voice.ts`
  - Added `voice` to the voice instructions type.

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Displays selected voice.
  - Updates selected voice after saving age or gender.

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Includes selected voice in instruction versioning.
  - Shows reconnect guidance if the selected voice changes while connected.

### Current Limitation

- The gender-to-voice mapping is practical for the demo, but OpenAI built-in
  voices are not formal clinical gender identities. A production system should
  let instructors preview and choose a specific voice per persona/session.

## 2026-07-22 - Step UI-5D: Clear Voice Style Card

### What Changed

- Removed the visible Voice Style editor from the Persona Page.
- Removed the related frontend state and save handler from the Persona Page.
- Removed the unused wide editor CSS rule that existed only for the Voice Style
  control.

### Why It Changed

- The Persona Page was getting overloaded with too many adjustable fields.
- For the current demo, age, gender, and voice are enough persona controls.
- Keeping voice style out of the UI makes the page simpler while leaving backend
  support available for later product work.

### How It Changed

- Deleted the Voice Style form from the Patient Summary settings grid.
- Removed the unused frontend import for saving voice style.
- Left the API client and backend voice-style support untouched so this feature
  can return later without a backend rewrite.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Removed the Voice Style form, state, and save handler.

- `codes/frontend/src/styles.css`
  - Removed the unused `.persona-setting-editor-wide` rule.

## 2026-07-22 - Step UI-5E: Rename Voice Type to Voice Affect

### What Changed

- Changed the Persona Page control label from `Voice type` to `Voice affect`.
- Kept the dropdown options visible for selecting the patient's emotional vocal
  affect.
- Removed the old `Voice type` wording from the Patient Summary.
- Patient Summary now shows `Voice affect` instead.
- Text chat and Realtime voice instructions now describe the setting as voice
  affect.

### Why It Changed

- Voice affect better describes what the instructor is choosing: the emotional
  delivery of the patient voice.
- Voice type sounded too similar to the Realtime voice selector, which chooses
  the actual synthesized voice.
- The Persona Page should stay understandable for instructors before they enter
  the live voice room.

### How It Changed

- Renamed frontend variables and labels from voice style/type wording to voice
  affect wording.
- Kept the existing backend `voice_style` request field for compatibility.
- Added `voice_affect` into the backend scenario patient profile while retaining
  `voice_style`.
- Updated prompt builders to say `Voice affect`.

### Files Changed

- `codes/frontend/src/pages/PersonaPage.tsx`
  - Renamed the dropdown to Voice affect.
  - Updated save messages.
  - Replaced the Patient Summary `Voice type` row with `Voice affect`.

- `codes/frontend/src/api/scenarios.ts`
  - Renamed the frontend update helper to `updateCopdSobPersonaVoiceAffect`.

- `codes/backend/app/services/persona_settings.py`
  - Adds `voice_affect` to the loaded patient profile.

- `codes/backend/app/services/persona_prompt_builder.py`
  - Uses Voice affect wording in text chat instructions.

- `codes/backend/app/services/voice_instruction_builder.py`
  - Uses Voice affect wording in Realtime voice instructions.

## 2026-07-22 - Step UI-5F: Bounded Voice Room Chat Scroll

### What Changed

- Made the Patient Conversation card in the Voice Room a fixed, bounded panel.
- Kept the chat input fixed at the bottom of the chat card.
- Made only the message conversation area scroll internally.
- Added tablet and mobile-specific chat card heights.

### Why It Changed

- Long chat sessions were pushing the entire Voice Room page downward.
- During a live simulation, controls should remain easy to reach and the page
  should not keep stretching as messages are added.
- The instructor should be able to scroll older messages without losing the
  current input box.

### How It Changed

- Added a viewport-aware height to `.voice-chat-card`.
- Added `overflow: hidden` and `min-height: 0` through the embedded chat layout
  chain.
- Kept `.conversation` as the only scrolling region inside the embedded chat.
- Added `overscroll-behavior: contain` so chat scrolling stays inside the chat
  panel.

### Files Changed

- `codes/frontend/src/styles.css`
  - Updated Voice Room chat card sizing.
  - Updated embedded chat panel overflow behavior.
  - Added responsive chat heights for mobile and tablet.

## 2026-07-22 - Step UI-5G: Twinkling Patient State Update Dot

### What Changed

- Replaced the `Updated` text badge on recently changed patient-state subcards.
- Added a centered twinkling red dot inside each recently changed state subcard.
- Kept the existing patient-state highlight behavior for reset and cue changes.

### Why It Changed

- The text badge was visually noisy and took attention away from the actual state
  value.
- A centered red dot gives a faster visual signal that a specific subcard changed.

### How It Changed

- Changed the highlighted state marker in `StateMetric` from text to a visual
  status dot.
- Added CSS animation for the dot and pulse ring.
- Removed the old label-width adjustment that existed only for the text badge.

### Files Changed

- `codes/frontend/src/pages/VoiceRoom.tsx`
  - Replaced the `Updated` badge span with an accessible twinkling dot marker.

- `codes/frontend/src/styles.css`
  - Added centered red dot styling.
  - Added twinkle and pulse-ring keyframe animations.
  - Removed old text-badge positioning behavior.

## 2026-07-22 - Step UI-6: Minimal Downloadable Debriefing Draft

### What Changed

- Added a Debriefing section to the Transcripts and Timeline page.
- Added a Download button that creates a `.txt` debriefing draft from the current
  session record.
- The draft currently includes:
  - Session metadata
  - Transcript lines
  - Event timeline lines
  - Placeholder note for the future debriefing algorithm

### Why It Changed

- The instructor needs an obvious place to access debriefing output from the
  transcript page.
- The debriefing algorithm has not been selected yet, so the current version is a
  minimal export foundation rather than a final structured debrief.
- This keeps the feature useful without inventing clinical/debriefing logic too
  early.

### How It Changed

- Added a frontend-only download function using a browser `Blob`.
- The download button is disabled until transcript or timeline data exists.
- Added a short placeholder explanation in the UI so the current limitation is
  clear.

### Files Changed

- `codes/frontend/src/pages/TranscriptsPage.tsx`
  - Added debriefing draft download logic.
  - Added a Debriefing section below transcript and timeline.

- `codes/frontend/src/styles.css`
  - Added styling for the debriefing panel, download button, and placeholder
    note.

### Current Limitation

- This is not the final debriefing algorithm. The selected debriefing structure
  will be added later when the algorithm is provided.
