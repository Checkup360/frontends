# Checkup360 Web (Member & Patient Portal)

Progressive Web Application (**PWA**) for **Checkup360** members and patients. It allows employees to complete medical onboarding, fill out preventive health questionnaires, view occupational medical studies and lab results, and read educational health content published via the CMS.

---

## Key Features

- **Unified Authentication:** Email/password and Google OAuth login, team invitation acceptance, and password reset flows.
- **Medical Onboarding:** Initial demographic information and clinical history intake.
- **Health Questionnaires:** Dynamic forms for deterministic health risk scoring (e.g., FINDRISC, STOP-BANG).
- **Studies & Diagnostic Reports:** Overview and detail of submitted occupational exams and test results.
- **Preventive Health Hub:** Informative articles and health insights streamed directly from Payload CMS.
- **PWA Ready:** Installable on mobile and desktop devices with offline caching.

---

## Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Styling & Components:** [Tailwind CSS](https://tailwindcss.com/) + Shadcn UI (consumed via `@workspace/ui`)
- **PWA:** `vite-plugin-pwa`
- **Internal Packages:**
  - `@workspace/api`: Typed HTTP client connected to the backend.
  - `@workspace/auth`: User session context and route guards.
  - `@workspace/components`: Cross-app reusable components.
  - `@workspace/ui`: Design system primitives.

---

## Getting Started

From the monorepo root (`frontends/`):

```bash
# Install dependencies
pnpm install

# Run the web portal in development mode
pnpm --filter web dev
```

The application will be accessible at:
`http://localhost:5173`

### Available Scripts

```bash
# Start development server
pnpm --filter web dev

# Type check
pnpm --filter web typecheck

# Lint
pnpm --filter web lint

# Production build
pnpm --filter web build

# Preview production build (port 4173)
pnpm --filter web preview
```
