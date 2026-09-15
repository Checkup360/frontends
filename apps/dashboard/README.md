# Checkup360 Dashboard (Enterprise Health Management Portal)

Enterprise portal for **Checkup360** designed for Human Resources, Team Leaders, and Occupational Health managers.

It provides actionable insights on organizational health risks, department-level aggregations, employee score tracking, risk weight configuration, and team invitation management.

---

## Key Features

- **Population Health Analytics:** High-level metrics on employee participation, risk distributions, and health indicators across the company.
- **Department Breakdown:** Health risk comparisons, engagement rates, and segmentations by organizational department.
- **Employee Health Records:** Detailed risk history and questionnaire status for staff members (with privacy and compliance safeguards).
- **Risk Scoring Weights:** Tailored weighting configuration for different health risk models (cardiovascular, diabetes, sleep apnea, etc.) suited to the company's occupational profile.
- **Team Invitations:** Single and bulk invitation flows to onboard employees into the Checkup360 ecosystem.

---

## Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Charts & Data Visualization:** [Recharts](https://recharts.org/)
- **Styling & Components:** [Tailwind CSS](https://tailwindcss.com/) + Shadcn UI (via `@workspace/ui`)
- **Internal Packages:**
  - `@workspace/api`: Typed client for organization and analytics endpoints.
  - `@workspace/auth`: Session management and organization role authorization (`org_admin`, etc.).
  - `@workspace/ui`: UI components and design tokens.

---

## Getting Started

From the monorepo root (`frontends/`):

```bash
# Install dependencies
pnpm install

# Run the dashboard app in development mode
pnpm --filter dashboard dev
```

The application will run at:
`http://localhost:5174`

### Available Scripts

```bash
# Start development server
pnpm --filter dashboard dev

# Type check
pnpm --filter dashboard typecheck

# Lint
pnpm --filter dashboard lint

# Production build
pnpm --filter dashboard build

# Preview production build (port 4174)
pnpm --filter dashboard preview
```
