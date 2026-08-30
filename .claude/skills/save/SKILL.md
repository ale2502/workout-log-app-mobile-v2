---
name: save
description: Use when the user asks to save, wrap up, checkpoint, or "/save" the current session for this workout-log-app repo. Appends a dated entry to PROGRESS_JOURNAL.md, commits the session's changes, and pushes to GitHub.
---

# Save

## Purpose

End-of-session checkpoint for this repo: record what happened in `PROGRESS_JOURNAL.md`, commit the work, and push it to `origin`. This is the single durable memory mechanism for the project (it replaced the old `promptkit/` workflows — see `CLAUDE.md`).

## Preconditions

- Run from the repository root (must contain `PROGRESS_JOURNAL.md`).
- There is something to save: either uncommitted changes, or committed-but-unpushed work, or both. If neither exists, report that and stop — do not create an empty journal entry or empty commit.

## Workflow

1. **Gather context**
   - `git status --short` — see modified/untracked files.
   - `git diff --stat` and `git diff` on the relevant files — understand what actually changed.
   - `git log --oneline @{u}..HEAD` (or `git log --oneline -10` if no upstream) — see commits made this session that haven't been pushed yet.
   - Read the last 1-2 rows of the `PROGRESS_JOURNAL.md` table to match its exact format and tone.

2. **Draft the journal entry**
   - Table columns are: `Date | Activity or Question | What I Asked / Did | What I Learned | Next Action`.
   - Use today's date.
   - Fill `Activity or Question` / `What I Asked / Did` from the git diff/log and this session's conversation — concrete, not vague ("Added gym machine variant editing" not "made changes").
   - For `What I Learned`, write in first person from what was actually explained/discovered this session. Do not invent insight that didn't happen — if genuinely nothing conceptual was learned (e.g. pure cleanup), keep it short and honest.
   - For `Next Action`, state the concrete next step. If the user already said what's next, use that; otherwise ask.
   - Show the drafted row to the user before writing it, unless they've already described it in detail this turn and approval would be redundant — use judgment, but don't silently fabricate the learning column.

3. **Append to the journal**
   - Add the new row to the end of the table in `PROGRESS_JOURNAL.md`. Never rewrite or remove existing rows.

4. **Stage intentionally**
   - `git status --short` again after the journal edit.
   - Stage the journal file plus the files that belong to this session's work.
   - Do not stage: `.env`/`.env.local`, `*.sqlite3`, build output (`dist/`), or unrelated dirty files the user didn't ask about this session. If unrelated changes are mixed in, ask before including them.

5. **Commit**
   - Short imperative subject matching repo style (e.g. `Add gym machine editing`, `Update progress journal`).
   - If there's nothing new to commit (journal entry is the only change), that's still a valid commit — journaling counts as the save.

6. **Push**
   - Push the current branch to `origin` (`git push`, or `git push -u origin <branch>` if it has no upstream yet).
   - This skill's whole purpose is to commit and push — do it without re-confirming the push itself. Still surface the diff/commit for the user to see what went out.

7. **Report**
   - Commit hash + subject, files included, and confirmation the push succeeded (or the exact error if it didn't).
   - One line pointing at the new journal row as the resume point for next time.

## Safety rules

- Never `git add -A`/`git add .` blindly — review `git status --short` first and stage specific paths.
- Never commit secrets, `.env*`, local SQLite DBs, or build artifacts.
- Never amend, rebase, reset, or force-push.
- Never rewrite prior `PROGRESS_JOURNAL.md` rows — append-only.
