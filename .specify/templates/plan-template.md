# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See
`.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement, affected user/admin/API routes,
external services involved, and technical approach]

## Technical Context

<!--
  ACTION REQUIRED: Replace or refine the entries below for this feature.
  Defaults come from the Lifang Constitution and must remain true unless a
  Complexity Tracking entry justifies an exception.
-->

**Language/Version**: TypeScript with strict type checking

**Primary Dependencies**: Next.js Pages Router, TypeORM, Zod, CSS Modules or
regular CSS

**Storage**: PostgreSQL via TypeORM entities, or N/A if the feature has no
persistence change

**Testing**: E2E tests for affected user/admin flows, targeted service/API
tests where useful, plus type check, ESLint, and Prettier

**Target Platform**: Vercel

**Project Type**: Single Next.js Pages Router project containing user pages,
admin pages, and `pages/api` API Routes

**Performance Goals**: [domain-specific target or TODO(PERFORMANCE_GOAL)]

**Constraints**: Pages Router only; no App Router; no Express/Nest server;
server-side external API calls; desktop-only UI; no `any`; Zod at boundaries

**Scale/Scope**: [expected users, data volume, external API volume, or
TODO(SCALE_SCOPE)]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Pages Router scope**: Plan keeps user pages, admin pages, and API Routes in
  one Next.js Pages Router project. No App Router, Express, or Nest server is
  introduced.
- **Route ownership**: Plan lists affected `pages/`, `pages/admin/`, and
  `pages/api/` paths.
- **Service boundary**: Business logic and external API calls are placed in
  `services/` or feature services, not directly in page components.
- **Validation and mapping**: Inputs are validated with Zod, and external API
  responses are mapped to typed internal objects before use.
- **API contract**: API Routes use RESTful methods and a consistent
  success/error response format.
- **Security**: Admin surfaces perform server-side authentication and
  authorization; secrets stay server-only and are not logged.
- **Data integrity**: Persistence changes use PostgreSQL, TypeORM entities,
  `snake_case` table names, `created_at`/`updated_at`, and explicit hard-delete
  behavior.
- **Desktop UI**: UI work preserves desktop-first layout, avoids mobile
  breakpoints, and defines loading, empty, and error states.
- **Quality gates**: E2E coverage is planned for affected critical flows,
  including CRUD, auth/authorization, and external API success/failure cases
  when applicable.
- **Open questions**: Unclear requirements are recorded as TODO items, not
  assumed.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
pages/
├── api/                 # Next.js API Routes
└── admin/               # Admin pages

components/              # Reusable UI components
styles/                  # Global CSS and shared styles
features/                # Feature-level modules
services/                # External API calls and business logic
lib/                     # Shared utilities, DB, auth, validation
entities/                # TypeORM entities
types/                   # Shared TypeScript types
tests/                   # E2E and targeted test code
```

**Structure Decision**: [Document the exact files/directories this feature will
touch and confirm they follow the constitution structure.]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., direct external API call from client] | [current need] | [why API Route proxy is insufficient] |
| [e.g., soft delete] | [current need] | [why hard delete is insufficient] |
