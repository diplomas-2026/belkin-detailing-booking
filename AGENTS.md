# Global Project Instructions

This workspace contains two projects in one repository:

- `product-api` (Spring Boot + PostgreSQL)
- `product-web` (React + Vite)

Goal: build a complete full-stack product from a base brief, formalize a full technical specification, implement it end-to-end, and verify quality automatically with Playwright E2E + screenshots.

---

# Repository Structure

workspace/
├── product-api
├── product-web

---

# Technology Stack

Backend:
- Java 21
- Spring Boot 3
- Spring Security
- JWT Authentication
- PostgreSQL
- Flyway
- Docker Compose

Frontend:
- React
- Vite
- React Router
- Playwright (E2E testing)

---

# Product Locale And UX

- Product language must be Russian (UI text, validation messages, labels, placeholders, and default seed content where applicable).
- Design must be modern, visually polished, and consistent across pages.
- Avoid generic template-like UI; deliver production-ready UX quality.

---

# GitHub

Use a single monorepo in GitHub organization:

- `https://github.com/diplomas-2026`

Repository must be created from workspace root (directory that contains both `product-api` and `product-web`).

Use GitHub CLI for operations.

Example:

- `gh repo create diplomas-2026/<project-name> --private --source=. --remote=origin`

Commit and push rules:

- initialize git in project root if needed
- make meaningful commits after each completed milestone
- push branch updates to GitHub regularly
- final result must be fully pushed to remote repository

---

# Required Development Workflow

The agent must follow this order:

1. Receive base brief from user.
2. Produce and agree on a full technical specification (functional scope, entities, permissions model, API contracts, UI pages, acceptance criteria, test scope).
3. Setup project repository in GitHub organization `diplomas-2026` from root directory.
4. Implement database + authentication + authorization model from the specification.
5. Implement seed data for domain tables + generated test users.
6. Setup Web project inside the same repository.
7. Implement login + UI restrictions based on the chosen authorization model.
8. Add Playwright E2E tests.
9. Run Playwright E2E tests and generate screenshots.
10. Fix discovered issues and repeat E2E cycle until acceptance criteria pass.
11. Commit final state and push all changes to GitHub.

---

# Local Development Rules

API runs via Docker.

Command:

`docker compose up -d --build`

API URL:

`http://localhost:8080`

Web runs locally without Docker.

Command:

`npm run dev`

Web URL:

`http://localhost:5173`

---

# Authentication And Authorization

- JWT must be used.
- Authorization header format:

`Authorization: Bearer <token>`

- Authorization model (roles/claims/permissions) is not hardcoded in advance.
- The agent must define it from the agreed technical specification.
- If roles are used, role-based access must be implemented in both API and Web UI.

---

# Test Users

- API must generate test users on startup for local/dev/test environments.
- Users must be written to file:

`product-api/users.txt`

- `users.txt` must contain all credentials used by Playwright tests.
- If roles are part of the authorization model, each user line must include role.

Recommended line format:

`email=<email>; password=<password>; role=<ROLE>` (role field required only when roles are used)

---

# Database Seeding

- Database must be populated automatically on startup in local/dev/test environments.
- AI may create any number of tables required by the domain model.
- All key tables must be filled with realistic test data (not only users) so frontend pages can be fully tested.
- Seed data files must be located in:

`product-api/seed-data/`

- Supported formats: JSON or CSV.
- Seeding must be idempotent.

---

# End-to-End Testing

Playwright must be used.

Tests must:

- authenticate using generated test users from `product-api/users.txt`
- validate access control and UI restrictions according to the chosen auth model
- create core entities from the agreed specification
- verify restrictions for users with lower permissions (when such levels exist)
- verify successful flows for users with required permissions

Screenshots must be generated (full page).

Output directory:

`product-web/artifacts/screenshots/`

Required screenshot coverage:

- login page
- dashboard/home page
- key entity pages
- administration/management pages (if they exist in the selected model)

---

# Expected Final Result

Working system:

- API running via Docker
- Web running via npm

Command to run tests:

`npx playwright test`

Artifacts produced:

`product-web/artifacts/screenshots/`

Screenshots must represent final validated UI state after E2E run.

---

# Quality Rules

- Use clean architecture principles.
- Use DTOs for API requests/responses.
- Validate input.
- Use proper HTTP status codes.
- Write unit tests for core business logic.
- Keep code readable and maintainable.
- Avoid unnecessary dependencies.
