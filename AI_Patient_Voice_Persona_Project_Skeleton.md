# AI Patient Voice Persona for Nursing Simulation

**Project type:** Nursing simulation internship prototype  
**Primary environment:** Laerdal manikin lab with SimCapture recording  
**Phase 1 goal:** Instructor-cued AI patient voice demo  
**Phase 2 goal:** Optional Laerdal/LLEAP/SimCapture integration if technical access is available  
**Target deadline:** July 25  

---

## 1. Executive Summary

This project proposes an AI voice companion that speaks as a simulated patient during nursing manikin scenarios. In the current workflow, an instructor in the control room controls the Laerdal manikin and also speaks through a microphone on behalf of the patient. That works, but it increases instructor workload and can make patient responses inconsistent between student groups.

The Phase 1 prototype will not control the manikin or read Laerdal software state directly. Instead, it will use an instructor-cued design: the instructor changes the manikin in the Laerdal dashboard and clicks matching patient-state cues in the AI dashboard. The AI persona then responds to students using the latest patient state.

The first demo scenario is an adult COPD/shortness-of-breath case. The prototype will demonstrate realistic patient speech, live condition changes, transcript capture, and a debrief-ready report.

---

## 2. Problem Statement

High-fidelity simulation depends on believable patient interaction. In many manikin scenarios, the patient voice is supplied manually by an instructor or operator in the control room. The same instructor may also be managing vital signs, scenario timing, student observation, and SimCapture recording.

The project addresses this question:

**Can an instructor-controlled AI patient voice improve realism, consistency, and debrief support without requiring direct Laerdal integration in the first prototype?**

The answer proposed here is yes, if the AI is designed as a controlled simulation assistant rather than an autonomous clinical system.

---

## 3. Current Workflow and Gap

| Current Step | Existing Tool/Actor | Gap |
|---|---|---|
| Manikin behavior and vitals | Instructor using Laerdal software | AI cannot automatically see these changes |
| Patient speech | Instructor using microphone | Adds workload and may vary between groups |
| Recording and debrief | SimCapture | Captures session but does not automatically structure conversation content |
| Faculty judgment | Instructor | Must remain the source of evaluation and scenario control |

The key design constraint is that the AI persona does not know when heart rate, SpO2, respiratory rate, lung sounds, or scenario stage changes unless that information is sent to it. Phase 1 solves this with manual instructor cues.

---

## 4. Proposed Solution

Build a web-based companion app with two main views:

- **Instructor dashboard:** select scenario, cue patient condition, pause or take over, view transcript, and generate report.
- **AI patient voice interface:** listen to students, respond as the patient, and use the latest instructor-cued state.

The AI does not replace the instructor. It provides a realistic and consistent patient voice while the instructor keeps control of the manikin, scenario progression, and learner evaluation.

---

## 5. Scope

| Area | Phase 1: July 25 Prototype | Phase 2: Future Product Direction |
|---|---|---|
| Laerdal access | No direct integration required | Read state from API, event feed, export, or approved integration path |
| Scenario | One polished COPD/SOB case | Scenario library with multiple personas |
| State updates | Instructor clicks AI dashboard cues | Automatic sync plus instructor override |
| Voice | AI patient voice demo | Production-grade audio routing and interruption handling |
| Reports | Transcript and debrief summary | Secure storage, review workflow, analytics |
| Evaluation | Faculty/peer pilot feedback | Institutional validation and governance |

Out of scope for Phase 1:

- AI control of the manikin
- automatic reading of Laerdal software state
- independent student grading
- real patient data
- production deployment

---

## 6. Demo Scenario

**Scenario:** Adult COPD exacerbation / shortness of breath  
**Patient:** Mrs. Linda Thompson, 68 years old  
**Chief concern:** "I cannot catch my breath."  
**Background:** COPD history, former smoker, uses inhaler at home, occasional nighttime oxygen  
**Initial presentation:** anxious, breathless, tired, able to answer in short phrases  
**Learning focus:** respiratory assessment, medication history, therapeutic communication, oxygen intervention, escalation, and reassessment  

Example interaction:

Student: "What brought you in today?"  
AI patient: "I have been short of breath since this morning. It feels worse than usual, and my inhaler did not help much."

Student: "Are you having chest pain?"  
AI patient: "Not sharp pain, but my chest feels tight when I try to breathe."

---

## 7. Inputs and Outputs

### Inputs

| Input Type | Examples | Source |
|---|---|---|
| Student speech | assessment questions, reassurance, intervention explanations | simulation room microphone |
| Instructor cues | HR increased, SpO2 dropped, oxygen applied, patient anxious, pause AI | instructor dashboard |
| Scenario configuration | patient background, hidden information, stage rules, safety limits | faculty-authored scenario file |

### Outputs

| Output Type | Examples | User |
|---|---|---|
| Live patient voice | symptom answers, emotional reactions, shortness-of-breath responses | students |
| Live transcript | student questions and AI patient responses | instructor |
| Event timeline | scenario start, cue changes, interventions, pause/takeover | instructor/faculty |
| Final report | transcript, checklist, communication observations, debrief prompts | faculty |

---

## 8. Architecture

```text
Students speak in simulation room
        |
        v
Voice interface
        |
        v
Patient persona engine <---- Instructor dashboard
        |                         |
        |                         v
        |                  Scenario state manager
        v
AI patient voice output
        |
        v
Room audio / manikin speaker
        |
        v
SimCapture recording
```

Core components:

- **Voice interface:** converts student speech to text and AI response text to speech.
- **Persona engine:** generates patient responses using persona, scenario rules, and current state.
- **Instructor dashboard:** sends manual condition cues and provides pause/takeover controls.
- **Scenario state manager:** stores vitals, symptoms, emotional state, stage, interventions, and event timeline.
- **Report generator:** turns transcript and timeline into a debrief-ready summary.

---

## 9. Live State and Condition Changes

The AI persona must be dynamic, not a static chatbot. It should maintain a live patient state and update that state during the scenario.

Initial state example:

```text
HR: 92
SpO2: 91%
RR: 24
Breathing effort: moderate
Anxiety: mild
Speech pattern: short phrases
Stage: initial assessment
```

After instructor deterioration cue:

```text
HR: 128
SpO2: 88%
RR: 32
Breathing effort: severe
Anxiety: high
Speech pattern: very short phrases
Stage: deterioration
```

The AI uses the newest state for the next response. If the AI is already speaking, Phase 1 can let it finish and apply the update to the next response. A later version can support interruption, where the instructor pauses the current response and resumes with the updated state.

### Condition Progression Model

| Stage | Trigger | Persona Behavior |
|---|---|---|
| Initial assessment | scenario start | anxious, breathless, cooperative |
| Worsening | instructor cues no improvement or SpO2 drop | shorter answers, more fear, reports chest tightness |
| Deterioration | instructor cues severe distress | heart racing, difficult to speak, asks for help |
| Partial improvement | instructor cues oxygen applied | calmer but still short of breath |
| Treatment response | instructor cues bronchodilator effect | gradually longer answers, less tightness |

Condition changes should be instructor-approved in Phase 1. The dashboard may suggest time-based changes, but the instructor confirms whether the patient worsens or improves.

---

## 10. Control Flow

1. Instructor opens the AI dashboard and selects the COPD/SOB scenario.
2. Students begin assessment in the simulation room.
3. Student speech is captured by the voice interface.
4. Persona engine generates a patient response using the current state.
5. Instructor changes Laerdal manikin values as usual.
6. Instructor clicks matching AI cue, such as "SpO2 dropped" or "HR increased."
7. Scenario state manager updates the AI patient state.
8. The next AI response reflects the updated condition.
9. SimCapture records the room interaction.
10. Instructor ends the scenario and generates the report.

---

## 11. Instructor Dashboard Requirements

| Dashboard Area | Required Controls |
|---|---|
| Scenario | start, pause, resume, end, reset |
| Safety | instructor takeover, mute AI, resume AI |
| Condition | stable, worsening, improving, anxious, fatigued |
| Vitals | HR increased/decreased, RR increased/decreased, SpO2 dropped/improved, BP changed |
| Symptoms | more/less short of breath, chest tightness, cough, dizziness, pain |
| Interventions | oxygen applied, bronchodilator given, repositioned, reassured, provider notified |
| Debrief | live transcript, event timeline, instructor notes, mark important moment |

The dashboard should be fast to use. Buttons should be scenario-specific so the instructor is not searching through unnecessary options during a live simulation.

---

## 12. AI Persona Rules

The AI must:

- speak only as the simulated patient
- reflect the latest instructor-cued state
- reveal information only when students ask appropriate questions
- keep responses short when respiratory distress is high
- stop when paused or when instructor takeover is active
- log each response and state change

The AI must not:

- control manikin vitals or scenario progression
- provide treatment orders or clinical teaching during the live scenario
- reveal the diagnosis unless the scenario permits it
- grade students independently
- use real patient information

---

## 13. Final Report

The report should support debriefing, not replace faculty judgment.

Required sections:

- scenario name, date/time, group, instructor, duration, and persona
- short session summary
- transcript
- event timeline
- assessment checklist
- communication observations
- suggested debrief questions
- instructor notes

Example checklist:

| Item | Observed | Notes |
|---|---|---|
| Asked onset of shortness of breath | Yes/No | |
| Asked about chest pain/tightness | Yes/No | |
| Asked home oxygen or inhaler use | Yes/No | |
| Asked allergies/medications | Yes/No | |
| Reassessed after intervention | Yes/No | |
| Used therapeutic communication | Yes/No | |

Example debrief prompts:

- What cues suggested the patient was worsening?
- How did your communication affect the patient's anxiety?
- What assessment question would you ask earlier next time?

---

## 14. Knowledge and Techniques Required

This project does not require training a new ML model for the prototype. The core work is applied AI system design.

| Area | Required Knowledge |
|---|---|
| Generative AI | prompting, persona design, guardrails, structured summaries |
| Voice AI | speech-to-text, text-to-speech, latency, interruption behavior |
| State management | live patient state, event timeline, stage transitions |
| Web development | instructor dashboard, session UI, transcript display |
| Backend/API | session storage, state updates, report generation, API key handling |
| Nursing simulation | learning objectives, scenario stages, debriefing, faculty workflow |
| Security/privacy | authentication, access control, consent, data retention |

Useful AI techniques:

- state-conditioned generation for patient responses
- intent detection for identifying student assessment questions
- classification for checklist items
- summarization for debrief reports
- retrieval-augmented generation later for approved scenario materials
- fine-tuning only as a future option after approved, de-identified simulation data exists

---

## 15. Security, Privacy, and Safety

Use fictional patients only. Do not use real patient histories or identifiers. Student voices, transcripts, and performance comments should be treated as sensitive educational data. In a U.S. educational setting, FERPA may be relevant when records are linked to student performance. HIPAA concerns may arise if real patient information is introduced.

Minimum product safeguards:

- instructor/admin login
- role-based access
- encryption in transit and at rest
- secure API key storage
- audit logs for session access and state changes
- consent workflow before recording student voices
- data retention and deletion policy
- faculty review before AI reports are used for feedback
- pause, mute, reset, and instructor takeover controls

---

## 16. Evaluation Plan

| Evaluation Area | Success Question |
|---|---|
| Realism | Did the AI patient feel believable to students and faculty? |
| Workflow fit | Could the instructor cue state changes without added burden? |
| Safety | Did the AI stay in patient role and avoid clinical instruction? |
| State behavior | Did responses update after HR, SpO2, anxiety, or intervention cues? |
| Report value | Did the transcript and summary help debriefing? |
| Technical quality | Was voice latency acceptable and was pause/takeover reliable? |

---

## 17. Timeline

| Date Range | Milestone |
|---|---|
| June 15-21 | finalize scope, COPD persona, and state rules |
| June 22-28 | build text persona and instructor cue logic |
| June 29-July 5 | add voice input/output and basic dashboard |
| July 6-12 | add transcript, report, and safety controls |
| July 13-19 | pilot with faculty/peers and collect feedback |
| July 20-25 | finalize demo, document, slides, and report example |

---

## 18. Prototype-to-Product Path

| Stage | Focus | Output |
|---|---|---|
| Prototype | demonstrate feasibility | one COPD/SOB voice demo with manual cues |
| Pilot | test workflow | faculty feedback, revised scenario, usability notes |
| Secure beta | controlled use | login, storage, audit logs, consent, faculty review |
| Integrated version | connect systems | optional Laerdal/LLEAP/SimCapture state sync |
| Scaled product | support multiple courses | scenario library, admin tools, analytics |

---

## 19. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| AI cannot read Laerdal state | use instructor-cued updates in Phase 1 |
| AI reveals too much | strict patient-role prompts and faculty-approved scenario rules |
| Instructor dashboard adds workload | keep controls scenario-specific and minimal |
| Voice latency hurts realism | use short patient responses and test audio setup early |
| Transcript/report is imperfect | label as debrief support and require faculty review |
| Direct integration is unavailable | keep Laerdal integration as Phase 2 only |

---

## 20. Final Deliverables

- working AI patient voice demo
- COPD/SOB persona and state rules
- instructor dashboard prototype
- transcript and report example
- final project document
- short presentation or demo video
- faculty/peer feedback summary, if available

---

## One-Sentence Pitch

This project creates an instructor-controlled AI patient voice that makes manikin simulations more realistic and consistent while preserving faculty control and supporting transcript-based debriefing.
