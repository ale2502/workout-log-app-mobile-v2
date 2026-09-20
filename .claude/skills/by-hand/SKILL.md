---
name: by-hand
description: Use when the user says "by hand", "teaching mode", "let me code this myself", or otherwise asks to write the code themselves for this workout-log-app repo instead of being handed a snippet. Deep, low-level teaching mode - explain what to do and why, withhold actual code, and only give a snippet if the user explicitly insists after a hint or two, or says they're genuinely stuck.
---

# By Hand

## Purpose

The user is early in their software development career and is building this
repo specifically to *learn* by typing every line themselves. This skill is a
stricter version of the "Working Style" section in `CLAUDE.md`: normally
Claude still describes the exact snippet to apply; in this mode, Claude
withholds the snippet by default and teaches toward it instead.

## When this is active

Active for the rest of the session (or until the user says to turn it off)
once triggered. Applies to feature/functionality work, same scope as the
`CLAUDE.md` working-style rules — routine tasks the user explicitly hands off
wholesale (cleanup, config, refactors, direct debugging) are unaffected.

## Workflow

For each step of a change, in order:

1. **Name the destination, not the content.** Say which file(s) need to
   change (full path) and what kind of change it is (e.g. "you'll add a new
   function to `server/models/exercises.ts`"), without writing it out.
2. **Explain the concept.** What is this piece of code responsible for, why
   does it need to exist here, and how does it fit the surrounding flow
   (request → route → model → DB, or component → hook → state, etc.)?
3. **Point at a pattern already in the repo**, when one exists, so the user
   has a real example to model from (e.g. "look at how `getWorkoutById` maps
   snake_case columns to camelCase — you'll do the same shape here"). Name the
   file/function, don't paste it.
4. **Give a structural nudge, not code.** Pseudocode-level hints are fine
   ("you'll need a loop that filters sets by exercise id, then reduces to a
   max load"), but stop short of real syntax.
5. **Let them try.** Wait for the user's attempt or next question before
   moving on.

## When to give real code

Stay in teaching mode by default. Escalate to an actual snippet only when one
of these is true:

- The user explicitly asks for the code a second time (a rephrase like "just
  show me" or "give me the snippet" counts as insisting).
- The user says they're genuinely stuck / don't know how to proceed after a
  hint (e.g. "I have no idea", "I don't understand", "still lost").
- The user asks a direct factual question that has no teaching value to
  withhold (e.g. "what's the Knex method for a left join?") — answer those
  directly, this skill is about withholding *solutions*, not withholding
  reference facts.

When giving code at that point, still explain *why* it works and keep it
scoped to the one step in question — don't jump ahead and hand over the rest
of the feature.

## What this skill does not change

- Debugging the user explicitly asks you to just fix, and non-feature tasks
  (config, cleanup, migrations they hand off wholesale), are handled normally
  per `CLAUDE.md` — no need to teach through those unless asked.
- Don't fabricate extra Socratic back-and-forth for trivial one-line asks;
  use judgment on what's worth teaching vs. answering directly.
