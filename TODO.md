# Before publishing

Code-quality work to finish before the library goes public.

## Review

- [ ] Run an independent code review.
- [ ] Test by hand the interactions that have no automated checks yet: Take over / Hand back (handoff-inbox), every Undo (tool-approval-queue, memory-panel, conversation-list, confirmation-card, response-feedback, agent-question), dragging real files onto drop-zone, slider drag, composer send while the agent is running.

## Structure

- [ ] Split the largest files into subcomponents. Over 400 lines today: handoff-inbox (808), chart-card (593), tool-approval-queue (576), coding-agent (507), file-changes (472), agent-composer (466), eval-results (453), background-agents (444), agent-question (438), run-trace (418), select-field (415), response-feedback (402). Components matter more than screens.
- [ ] Extract the patterns that were written several times in parallel into shared hooks:
  - `useRovingFocus` — arrow-key navigation over lists and grids;
  - `useInstantFromKeyboard` — skip animation for keyboard-triggered changes (today `event.detail === 0` in many places);
  - `useContainerWidth` — the ResizeObserver width measurements.

## Workarounds to replace

- [ ] `asChild` is passed through a spread so `shadcn add` doesn't rewrite it to `render` in Base UI projects (action-menu, popover-panel, select-field, modal-sheet). Find a supported way or document it.
- [ ] Keyboard detection via `event.detail === 0` can misfire with some screen readers and programmatic clicks — replace with the shared hook above, based on the last input modality.

## Tests and CI

- [ ] Vitest for pure logic: `fillCells`, `formatTokens`, `checkFiles`, data-table sorting, conversation-list date grouping, key-hint formatting, calendar ranges.
- [ ] Move the Playwright checks into the repo (page sweep, screen overflow check, clipped-button check, icon-weight scan) and run them in CI on every PR, against the static export.
