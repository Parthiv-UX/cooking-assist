# Cooking Assist — interactive prototype

Inclusive Design (Sem 7). Pre-fed recipe: *Bachelors spl Chicken Curry* — Chef Ranveer Brar.

**Real:** YouTube playback with step-segment seeking, browser speech recognition (Chrome), spoken replies,
timers, portrait/landscape layouts, state across rotation, screen wake lock.
**Pre-authored:** recipe steps/quantities (from the creator's description + timestamped transcript) and answers.
**Simulated:** YouTube page, share sheet, "preparing" analysis.

Facilitator panel: triple-tap "Step n of N" (or press L on a laptop). Keyboard: ←/→, R, Space, S, T, W, H, V.

## Design system — v2 additions (on top of the approved style tile)
- **Caption 12 / 600** added to the type ramp for micro labels (switch label, chips, strip time).
- **Source video stays clean:** the embedded player draws its own chrome (title, logo, captions), so the app paints
  nothing permanent on top of it. Step time + segment timeline moved to a **step strip below the video**.
  Only transient feedback cards (answers, errors, toasts) may sit over the video.
- **Landscape sizing rule:** the video is sized by available height (never cropped or cut off);
  the right column holds step, quantities and controls. Voice state moves to a top-bar pill.
- **No duplicate controls:** "Replay this moment" shows in portrait technique steps only; landscape uses Repeat.
- All sizes snap to the ramp (32/30/20/18/16/14/13/12), 8pt spacing and the radius set; icons are Material Symbols Outlined.

## Voice engines
- **Hands-free (default):** offline Vosk recognizer (`model.tar.gz`, Indian-English small model) running in the browser,
  limited to this recipe's command phrases. Mic stays open: no restart loop or beeps, robust to kitchen noise.
- **Fallback / Tap to speak:** Chrome's speech recognition (needs internet, understands open questions incl. Hindi words).

## v2 — changes from usability testing (3 hostel students, live dish, real kitchen)
- **Wake word "Hey Cook"** (participant feedback: "voice wake up"; observed false triggers). Commands act only after
  "Hey Cook"; an 8-second follow-up window allows chained commands without repeating it. Toggle in facilitator panel.
- **Visible alternatives** (feedback: "suggest alternatives"). Swaps existed by voice only; now every ingredient with an
  alternative shows a **Swap** button, plus a hint line.
- **Step-type icons** (feedback: "instruction-based step colour" → implemented as icon + label, not colour alone):
  Measure & add / Watch & do / Wait — on each step and in the step overview.
