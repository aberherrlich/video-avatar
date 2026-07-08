---
description: Triage a finding (bug vs feature, goal alignment, file placement) before adding to known-issues or roadmap
---

Triage the finding: `$ARGUMENTS`

If no argument was given, ask the user for the finding/idea first, then continue.

## Step 1 — Gather context

Read these three files before deciding anything:

- [PROJECT.md](PROJECT.md) — project goal + 6 success criteria
- [docs/known-issues.md](docs/known-issues.md) — existing bug entries and their format
- [docs/roadmap.md](docs/roadmap.md) — existing feature entries and their format

## Step 2 — Run the checklist

1. **Bug or feature?**
   - **Bug** = current behavior diverges from documented/intended behavior, or fails a project success criterion
   - **Feature** = new capability or enhancement to intended behavior
2. **Goal alignment** — which of the 6 success criteria does it serve? Or is it scope creep?
3. **Already tracked?** — search known-issues.md and roadmap.md for duplicates or near-duplicates. Cite the existing entry if found.
4. **Severity / value:**
   - Bug: blocks user task / degrades UX / cosmetic
   - Feature: high impact / nice-to-have / speculative
5. **Cost estimate** — one-line fix, small refactor, or architectural change?
6. **Decision** — `fix-now` / `add-to-known-issues` / `add-to-roadmap (short|medium|long)` / `drop`

## Step 3 — Present analysis

Output in this fixed format. Do not write any file yet.

```
### Triage: <one-line summary of the finding>

Classification:    Bug | Feature
Target:            docs/known-issues.md | docs/roadmap.md (short|medium|long) | drop | fix-now
Aligned with goal: #N, #N  (or "none — scope creep")
Duplicate of:      <link to existing entry> | none
Severity / value:  <one line>
Cost:              <one line>

Proposed entry (exact markdown to insert, matching the target file's format):
---
<the markdown block>
---

Reasoning: <2–4 sentences>
```

## Step 4 — Wait for approval

Ask the user: **"Insert this entry into <target file>? (yes / edit / drop)"**

- **yes** → write the entry into the target file. For `docs/known-issues.md`, place it in the `## Open` section with the next sequential number. For `docs/roadmap.md`, place it under the chosen Short/Medium/Long heading using the existing bullet format.
- **edit** → ask what to change, then return to Step 3.
- **drop** → do nothing, confirm dropped.

Do not write to any file before the user says yes.
