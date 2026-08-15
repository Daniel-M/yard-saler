# Project Whale Shark: React PWA & Golang API

## Description
Project Whale Shark is a responsive, installable Yard-Sale (PWA) application designed to run seamlessly on mobile and desktop browsers.

---

## System Architecture

### Backend
*   **Language:** Go (Golang 1.22+)
*   **Router:** Native `http.ServeMux` using method-prefixing and path wildcards.
*   **Database:** SQLite for local/development, transitioning to PostgreSQL via clean Adapter patterns.
*   **Architecture Patterns:** Clean Architecture, Repository Pattern, Adapter/Observer Pattern (for Push Notifications/dispatchers), and Abstract Factories.

### Frontend
*   **Language:** TypeScript (TSX)
*   **Build & PWA Core:** React, Vite, `vite-plugin-pwa`
*   **Dependencies Management:** `pnpm`
*   **Styling:** Tailwind CSS (`tailwindcss`, `@tailwindcss/vite`)
*   **Icons:** `lucide-react`
*   **Theme:** Default to **Dark Theme** first.
*   **Localization (i18n):** Powered by `react-i18next`. Spanish (`es`) is the default language, and English (`en`) is supported as a secondary language.
*   **Testing Stack:** Vitest and React Testing Library (RTL).

---

## UI & Feature Requirements

1.  **Carousel for Listings:**
    *   Every listing detail view must support an image carousel displaying at least 3 images.
2.  **Location & Event Fields:**
    *   Support filtering and searching listings by simple text locations (address, city, zip code).
    *   Display structured event details (host, time, address) prominently on listing pages.
3.  **Strict Localization (i18n):**
    *   Direct text must not be hardcoded in UI components. Wrap all user-facing text in translation keys/i18n helpers.

---

## Guidelines & Guardrails

### Backend Guidelines
*   **Decoupling:** Direct database connections or channel-specific client SDKs must not be accessed outside their corresponding adapter packages.
*   **Migrations:** Explicitly define and track database migrations inside the `migrations/` directory.
*   **Testing:** Write unit and integration tests using mocked repositories and notification channels. Run tests using `go test ./...`.
*   **Logging:** Follow the 4-tier structured JSON logging taxonomy and configuration specification defined in [10_structured_logging_spec.md](file:///Users/danielmejiar./projects/personal/whale_shark/planning/specs/api/10_structured_logging_spec.md).

### Frontend Guidelines

#### 1. Theme (Dark Theme Default)
*   The application must default to a premium Dark Theme.
*   **Base Styling:** Use dark backgrounds (e.g., `bg-slate-950`, `bg-zinc-900`) and high-contrast readable text (e.g., `text-slate-50`, `text-zinc-100`) as the default body style.
*   **Consistency:** Avoid hardcoded bright light backgrounds (like `bg-white`) unless explicitly styled inside components that support active dual-theme elements. Ensure all custom controls, cards, and modal components adapt correctly.

#### 2. Localization (`react-i18next`)
*   All user-facing copy must reside in translation files (e.g., `src/locales/{en,es}.json`). Spanish (`es`) is the default language, and English (`en`) is the fallback language. Every translation key must be present in both files.
*   Retrieve labels using the `useTranslation` hook: `const { t } = useTranslation();`.
*   Maintain organized, descriptive translation keys (e.g., `t('listings.details.hostLabel')`).

#### 3. Testing (Vitest & React Testing Library)
*   Write unit and component tests with Vitest and `@testing-library/react`.
*   **Test Files:** Place tests strictly colocated as sibling files adjacent to the source components or modules they test. Ban dedicated `__tests__` directories. Test files must be named `*.test.tsx` or `*.test.ts`.
*   **Interaction Testing:** Every interactive element (buttons, links, inputs, forms) must be covered by unit tests verifying that user interactions (e.g., via `userEvent` or `fireEvent`) execute their intended side effects (such as navigation, form submissions, or callback triggers).
*   **Best Practices:**
    *   Prefer querying elements via accessible roles (`screen.getByRole`) over test IDs or raw class query selectors.
    *   Mock external dependencies, routing hooks, and global state providers.
    *   Use `@testing-library/user-event` to simulate user interactions.

#### 4. Components & Styling
*   Use Tailwind CSS for responsive grid/flex layout patterns and smooth interactive states.
*   Prioritize reusable UI components and Higher-Order Components (HOCs) to avoid design drift.

### Planning & Specification Guidelines
*   **Location:** Always write technical and UX specifications under the `planning/specs/` directory.
*   **Naming Convention:** Follow a sequentially-numbered, bottom-up dependency ordering convention starting from `0` (e.g., `0_File_Conventions.md`, `1_Motivation.md`, `2_password_input_spec.md`...) so that base widgets/interfaces are specified before pages/views that consume them.

---

## Agent Execution Rules
1.  **Review Policy:** Always ask for approval before applying file diffs or writing code.
2.  **TDD Workflow:** Run `pnpm run test` (frontend) or `go test ./...` (backend) only when functionality is implemented or changed and actual code is affected (e.g., updates to `.go`, `.tsx`, `.ts`, `.json` translations, or styling files). Do not run tests when modifying only documentation, planning markdown files (`.md`), or agent config/skill prompt files.
3.  **Dependencies Constraint:** Do not install external npm packages unless explicitly requested by the user.
