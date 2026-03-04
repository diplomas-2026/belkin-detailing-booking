# API Project Instructions

Stack:

- Java 21
- Spring Boot 3
- Spring Security
- JWT Authentication
- PostgreSQL
- Flyway
- Docker Compose

---

# API Role In Full Workflow

- API implementation starts only after full technical specification is agreed from the base brief.
- Authentication/authorization model is defined by the specification, not hardcoded upfront.
- If roles are selected, API must implement role-based access consistently.

---

# Package Structure

`com.company.product.api`

Suggested subpackages:

- `controller`
- `service`
- `repository`
- `security`
- `dto`
- `entity`
- `config`
- `seed`

---

# Authentication

JWT authentication must be implemented.

Minimum endpoints:

- `POST /api/auth/login`
- `GET /api/auth/me`

Login response should include token and current user identity fields needed by Web UI.

---

# Authorization

- Model can be role-based or permission-based (according to the agreed specification).
- Access rules must be explicit and testable.
- Spring Security restrictions must match UI restrictions.

---

# Database

Use PostgreSQL.

Requirements:

- AI can create any number of tables/entities required by the agreed domain.
- tables/entities reflect agreed domain model
- passwords are hashed with BCrypt
- schema is normalized enough for maintainable growth

---

# Migrations

Flyway must manage schema.

Migration directory:

`src/main/resources/db/migration`

---

# Database Seed

Seed data must be loaded on startup in local/dev/test environments.

Seed files directory:

`seed-data/`

Supported formats:

- JSON
- CSV

Seeder must:

- read files
- upsert records
- avoid duplicates
- be idempotent
- populate all key domain tables with realistic linked test data (not only users)
- provide enough records for meaningful frontend and Playwright E2E scenarios

---

# Test Users

On startup, API must create test users required for E2E tests.

Write credentials into:

`users.txt` (file path in workspace expectations: `product-api/users.txt`)

Format (recommended):

`email=<email>; password=<password>; role=<ROLE>`

Notes:

- If roles are used, `role` is required and must reflect real access levels.
- If roles are not used in the selected model, store credentials without fake roles.
- File must stay machine-readable for Playwright parsing.

---

# Docker

Provide `docker-compose.yml`.

Services:

- `postgres`
- `api`

API must wait until database is ready.

---

# API Documentation

Enable Swagger UI.

Path:

`/swagger-ui`

---

# Testing

Use:

- JUnit 5
- Mockito

Required:

- unit tests for business logic
- integration tests for security and key controllers
- tests aligned with the selected authorization model
