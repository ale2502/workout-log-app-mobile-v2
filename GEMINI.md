# GEMINI.md

## Project Overview

This repository is being built from scratch as a mobile-first full-stack monorepo for a workout log app.

The intended structure is:
- `apps/mobile` for the React Native mobile app
- `apps/api` for the backend API
- `packages/shared` for shared types, validation, constants, and other pure reusable logic

A browser app may be added later, but it is not part of the initial setup.

## Current Stage

This repo is in the early architecture and setup phase.

So far:
- the top-level monorepo folders have been created
- PromptKit has been added for tutoring and reflection workflows

Not yet set up:
- workspace/package manager configuration
- Expo or React Native app scaffolding
- backend framework and dependencies
- shared package configuration
- database and deployment setup

## Architecture Guidance

- Keep `apps/mobile` and `apps/api` as separate apps with different responsibilities
- Put only shared, runtime-agnostic code in `packages/shared`
- Do not place backend code inside the mobile app
- Favor a clean, explainable setup over unnecessary tooling complexity
- Add the browser app later only after the mobile and API foundations are stable

## Working Style

This repo is being developed as a learning project.

When assisting in this repository:
- explain architectural decisions clearly
- prefer step-by-step setup over large implicit jumps
- keep the student focused on understanding why each piece exists
- avoid unnecessary complexity early

## PromptKit Quick Reference

- Protocol: `promptkit/protocols/setup.md`
- Workflow: `promptkit/workflows/tutor.md`
- Workflow: `promptkit/workflows/reflect.md`
- Notes: `promptkit/notes/learning-plan.md`
- Journal: `promptkit/notes/progress-journal.md`
