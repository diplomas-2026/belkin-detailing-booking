# WEB Project Instructions

Stack:

- React
- Vite
- React Router
- Axios or Fetch
- Playwright

---

# Product Language And Design

- UI must be in Russian.
- All visible content must be localized: labels, buttons, hints, errors, placeholders, empty states.
- Design must be modern, beautiful, visually strong, and consistent (not a basic template look).
- Layouts must be responsive for desktop and mobile.

---

# Local Development

Install dependencies:

`npm install`

Start dev server:

`npm run dev`

App URL:

`http://localhost:5173`

API base URL:

`http://localhost:8080`

Environment variable:

`VITE_API_URL`

---

# Auth Integration

Login page:

`/login`

After login:

- store JWT token in `localStorage` (or another agreed secure client storage approach)
- attach token to API requests

Authorization header:

`Bearer <token>`

---

# Pages

Page structure is defined by agreed technical specification.

Minimum:

- auth page (`/login`)
- main protected page (`/dashboard` or equivalent)
- core entity list/create/edit pages
- management pages only if required by selected authorization model

---

# Access Control In UI

- Do not hardcode specific roles in instructions.
- UI restrictions must follow API authorization model from the specification.
- If roles/permission levels exist, hide/disable restricted actions and protect routes accordingly.
- UI behavior must match backend access responses (no contradictory permissions).

---

# E2E Testing

Use Playwright.

Install:

`npm install -D @playwright/test`

Install browsers:

`npx playwright install`

Playwright tests must read users from:

`../product-api/users.txt`

Parse file and extract credentials used by the current auth model.

---

# Test Scenarios

E2E must validate a full cycle:

- login flow
- navigation across key pages
- successful creation/edit flow for allowed users
- rendering and behavior on seeded entity datasets from API
- restriction behavior for users without required permissions (if such users exist)
- visible UI state consistency after actions

Scenarios must be generated from the selected authorization model, not from hardcoded role names.

---

# Screenshots

Each E2E run must generate full-page screenshots.

Directory:

`artifacts/screenshots/`

Required coverage:

- login page
- dashboard/home
- core entity pages
- management/admin pages (if present in project scope)

---

# Running Tests

Command:

`npx playwright test`

All screenshots must appear in:

`artifacts/screenshots/`
