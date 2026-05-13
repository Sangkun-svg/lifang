<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Pages Router Full-Stack Next.js
- Template principle 2 -> II. Layered Feature Architecture
- Template principle 3 -> III. Type Safety, Validation, and API Mapping
- Template principle 4 -> IV. Server API Boundary and REST Discipline
- Template principle 5 -> V. PostgreSQL and TypeORM Data Integrity
Added principles:
- VI. Desktop-Only UI and Admin Usability
- VII. Server-Enforced Security
- VIII. Mandatory E2E Quality Gates
- IX. Vercel Runtime and Environment Discipline
- X. Requirements-First Delivery
Added sections:
- Required Project Structure
- Development Workflow and Compliance Gates
Removed sections:
- None; placeholder sections were replaced with project-specific sections.
Templates requiring updates:
- ✅ updated .specify/templates/plan-template.md
- ✅ updated .specify/templates/spec-template.md
- ✅ updated .specify/templates/tasks-template.md
- ✅ reviewed .specify/templates/checklist-template.md; no constitution-specific changes required
- ✅ reviewed .specify/templates/commands/*.md; no command templates present
- ✅ reviewed AGENTS.md; no change required
Follow-up TODOs:
- None
-->
# Lifang Constitution

## Core Principles

### I. Pages Router Full-Stack Next.js
The project MUST be one Next.js Pages Router application that contains user
pages, admin pages, and API Routes together. App Router MUST NOT be used.
API handlers MUST live under `pages/api`. User-facing routes MUST live under
`pages`, and admin routes MUST live under `pages/admin`. Separate Express or
Nest servers MUST NOT be introduced for simple CRUD or external API proxying.

Rationale: One Pages Router deployment keeps routing, server APIs, secrets, and
Vercel runtime behavior in one predictable project.

### II. Layered Feature Architecture
Business logic MUST NOT be written directly inside page components. Page
components MUST compose UI and call feature/service abstractions. External API
calls and business workflows MUST live in `services`, shared helpers MUST live
in `lib`, and feature-specific modules SHOULD live in `features` when they
span multiple UI/API/service files.

Rationale: Thin pages keep UI testable, services reusable, and API behavior
consistent across user and admin flows.

### III. Type Safety, Validation, and API Mapping
All code MUST be TypeScript with strict type checking. `any` MUST NOT be used.
Inputs crossing an API, form, or external-service boundary MUST be validated
with Zod. External API responses MUST NOT be trusted as-is; services MUST map
only the fields required by the application into typed internal objects. API
responses MUST use a consistent success/error format. User-facing error
messages and developer logs MUST be separated.

Rationale: Strict typing plus boundary validation prevents untrusted external
data from leaking through the application.

### IV. Server API Boundary and REST Discipline
The default API style MUST be RESTful. `GET`, `POST`, `PATCH`, and `DELETE`
MUST be used according to their semantics. External APIs MUST be called from
server API Routes or services invoked by those routes, not directly from the
client. Admin-only API Routes MUST perform authentication and authorization on
the server before returning data or mutating state.

Rationale: Server-side API boundaries protect secrets, centralize failure
handling, and make method behavior explicit.

### V. PostgreSQL and TypeORM Data Integrity
PostgreSQL is the database and TypeORM is the ORM. Database table names MUST
use `snake_case`; Entity class names MUST use `PascalCase`; TypeScript
variables and functions MUST use `camelCase`. Created and updated records MUST
include `created_at` and `updated_at`. Deletes default to hard delete, not
soft delete. User deletion MUST remove all user-linked data, and product
deletion MUST remove the product data from the database. Cascade deletes MUST
be explicitly designed, documented in the feature plan, and preceded by
verification of the target data.

Rationale: Deletion is destructive by default in this project, so related data
ownership and cascade behavior must be deliberate.

### VI. Desktop-Only UI and Admin Usability
The UI MUST be designed for PC layouts only. Mobile UI is out of scope. Screens
MUST NOT switch to mobile layouts as width shrinks; instead, the primary
content width MUST be preserved while right-side areas truncate, scroll, or
compress according to the feature plan. Admin pages MUST prioritize function,
readability, and efficient data inspection. Loading, empty, and error states
MUST be implemented for user-facing and admin-facing flows. Tables, forms, and
modals MUST be reusable components.

Rationale: The product optimizes for desktop data work, especially in admin
flows, rather than mobile-first adaptation.

### VII. Server-Enforced Security
Admin pages and admin APIs MUST be accessible only to authenticated users with
the required server-verified authorization. API keys, tokens, database
connection strings, and external-service credentials MUST only be used on the
server. Passwords, tokens, and API keys MUST NOT be logged. External API
failures MUST NOT expose internal stack traces, upstream secrets, or raw
provider error details to users.

Rationale: Client-side checks are advisory only; enforcement belongs on the
server boundary where secrets and privileged data live.

### VIII. Mandatory E2E Quality Gates
E2E tests MUST be included. Major user flows and admin flows MUST be covered
by E2E tests. CRUD flows, login/authorization behavior, and external API
success/failure cases MUST be tested. Core business logic MUST be separated
into services so it can be tested without rendering pages. Type checking,
ESLint, and Prettier MUST pass before implementation is considered complete.

Rationale: The application combines UI, API Routes, database behavior, and
external APIs, so feature confidence requires end-to-end coverage.

### IX. Vercel Runtime and Environment Discipline
The runtime and deployment target is Vercel. The package manager MUST be
pnpm. Environment variables MUST be loaded from `.env.local` during local
development, and `.env.example` MUST document required keys without real
secret values. API keys, tokens, and external-service credentials MUST never
be exposed through `NEXT_PUBLIC_*` variables unless they are intentionally
public and documented as such.

Rationale: Vercel deployment and local development stay reproducible only when
runtime configuration is explicit and secrets remain server-only.

### X. Requirements-First Delivery
Requirements MUST be summarized before implementation starts. Unclear details
MUST NOT be guessed; they MUST be recorded as TODO items or explicit open
questions in the spec/plan. Large features MUST be split into small tasks that
can be implemented and verified independently. After implementation, the
change summary MUST include changed files, the main logic added or changed,
and the tests or checks that were run.

Rationale: Small, explicit work units reduce hidden assumptions and make review
and verification practical.

## Required Project Structure

The project MUST use this repository structure unless a future constitution
amendment changes it:

```text
pages/          # Pages Router screen routing
pages/api/      # Next.js API Routes
pages/admin/    # Admin pages
components/     # Reusable UI components
styles/         # Global CSS and shared styles
features/       # Feature-level modules
services/       # External API calls and business logic
lib/            # Shared utilities, DB, auth, validation
entities/       # TypeORM entities
types/          # Shared TypeScript types
tests/          # Test code, including E2E coverage
```

CSS Modules or regular CSS are the allowed styling approaches. Shared tables,
forms, and modals MUST live in `components` unless a feature-specific variant
is clearly isolated inside `features`.

## Development Workflow and Compliance Gates

Every feature plan MUST pass these gates before implementation:

1. Confirm the feature stays within one Next.js Pages Router project and does
   not introduce App Router, Express, or Nest.
2. Identify user pages, admin pages, and API Routes that will change.
3. Identify services that will contain business logic and external API calls.
4. Define Zod validation for inputs and typed mapping for external responses.
5. Define admin authentication/authorization requirements for admin surfaces.
6. Define TypeORM entities, PostgreSQL table names, and deletion behavior when
   data persistence changes.
7. Define desktop-only UI behavior, including loading, empty, and error states.
8. Define E2E coverage for major user/admin flows, CRUD, auth, and external
   API success/failure cases.
9. Record unresolved details as TODO items instead of assumptions.
10. Run or document type, lint, format, and relevant test checks before
    completion.

## Governance

This constitution supersedes conflicting project practices. Feature specs,
plans, tasks, and implementation reviews MUST check compliance with these
principles. A feature that violates a principle MUST either be revised or
include an explicit Complexity Tracking entry explaining why the violation is
necessary and what simpler compliant alternative was rejected.

Amendments MUST update this file, include a Sync Impact Report, and review the
dependent Spec Kit templates for alignment. Version changes follow semantic
versioning: MAJOR for incompatible governance or principle redefinitions,
MINOR for added principles or materially expanded requirements, and PATCH for
clarifications that do not change obligations.

Compliance review is required at plan creation, after design, and before final
handoff. Final handoff MUST summarize changed files, main logic, and tests or
checks performed.

**Version**: 1.0.0 | **Ratified**: 2026-05-12 | **Last Amended**: 2026-05-12
