# Project Whale Shark: React PWA & Golang API

## Description
Project Whale Shark is a responsive, installable Yard-Sale (PWA) application designed to run seamlessly on mobile and desktop browsers.

---

## Core Tech Stack

### Backend
*   **Language & Router:** Go (Golang 1.22+) using native `http.ServeMux` with method-prefixing and path wildcards.
*   **Database:** SQLite transitioning to PostgreSQL via Clean Adapter patterns.
*   **Architecture:** Clean Architecture, Repository, Adapter/Observer, and Abstract Factories.
*   See [Backend Developer Agent Skill](.agents/skills/backend/SKILL.md) and [Backend Reference](.agents/skills/backend/references/gotchas_and_patterns.md).

### Frontend
*   **Language & Framework:** TypeScript, React (v19) & React-DOM, Vite, `vite-plugin-pwa`.
*   **Styling & Theme:** Tailwind CSS (v4) with CSS-first configuration, defaulting to Dark Theme.
*   **Localization (i18n):** `react-i18next` with default Spanish (`es`) and secondary English (`en`). Zero hardcoded strings.
*   **Testing Stack:** Vitest and React Testing Library (RTL) with colocated tests.
*   See [Frontend Developer Agent Skill](.agents/skills/frontend/SKILL.md) and [Frontend Reference](.agents/skills/frontend/references/styling_and_testing.md).

### Planning & UX Specs
*   **Specifications:** Sequentially-numbered, bottom-up specifications written under `planning/specs/`.
*   See [Planning Agent Skill](.agents/skills/planning/SKILL.md), [Planning Reference](.agents/skills/planning/references/architecture_and_workflows.md), [UX Spec Architect Skill](.agents/skills/ux/SKILL.md), and [UX Reference](.agents/skills/ux/references/ux_and_a11y_standards.md).

---

## Agent Execution Rules
1.  **Review Policy:** Always ask for approval before applying file diffs or writing code.
2.  **Validation & Testing Workflow:** Run tests and linting (`pnpm run test` and `pnpm run lint` for frontend; `go test ./...` and `go vet ./...` for backend) exactly once, immediately after finishing ALL implementation tasks. Do not run tests or linting tools dynamically after intermediate code edits or task steps.
3.  **Dependencies Constraint:** Do not install external npm packages unless explicitly requested by the user.
4.  **Grill-Me Protocol:** Before writing specifications or implementing features, conduct a grill-me interview to clarify requirements and design decisions one-by-one, providing recommended options.
