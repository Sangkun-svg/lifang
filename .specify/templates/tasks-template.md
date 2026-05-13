---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: E2E tests are mandatory for major user/admin flows. Service/API
tests should be added for core business logic, validation, external API
mapping, auth/authorization, and destructive data behavior.

**Organization**: Tasks are grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Pages Router screens: `pages/`
- API Routes: `pages/api/`
- Admin pages: `pages/admin/`
- Reusable UI: `components/`
- Global/shared styles: `styles/`
- Feature modules: `features/`
- Business logic and external API calls: `services/`
- Shared DB/auth/validation/utilities: `lib/`
- TypeORM entities: `entities/`
- Shared types: `types/`
- Tests: `tests/`

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  - Lifang Constitution gates

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline tooling

- [ ] T001 Create or confirm project structure: `pages/`, `pages/api/`,
  `pages/admin/`, `components/`, `styles/`, `features/`, `services/`, `lib/`,
  `entities/`, `types/`, `tests/`
- [ ] T002 Initialize pnpm dependencies for Next.js Pages Router, TypeScript,
  TypeORM, PostgreSQL driver, Zod, ESLint, Prettier, and E2E tooling
- [ ] T003 [P] Configure TypeScript strict mode in `tsconfig.json`
- [ ] T004 [P] Configure linting and formatting scripts in `package.json`
- [ ] T005 [P] Create `.env.example` entries for required server-only
  environment variables

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story
can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T006 Setup TypeORM PostgreSQL connection in `lib/db`
- [ ] T007 Create shared Zod validation helpers in `lib/validation`
- [ ] T008 Create shared API success/error response helpers in `lib/api`
- [ ] T009 [P] Implement server-side admin authentication/authorization helpers
  in `lib/auth`
- [ ] T010 [P] Setup external API client configuration in `services`
- [ ] T011 Configure E2E test runner and base test fixtures under `tests/e2e`
- [ ] T012 Create shared loading, empty, and error UI patterns in `components`
  if the feature needs UI

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (write first)

> Write these tests FIRST and confirm they fail before implementation.

- [ ] T013 [P] [US1] Add E2E test for [primary user/admin journey] in
  `tests/e2e/[feature].spec.ts`
- [ ] T014 [P] [US1] Add service/API test for [validation, mapping, auth, or
  external failure case] in `tests/[area]/[feature].test.ts`

### Implementation for User Story 1

- [ ] T015 [P] [US1] Define Zod schema for [input] in `lib/validation` or
  `features/[feature]`
- [ ] T016 [P] [US1] Create or update TypeScript types in `types` or
  `features/[feature]`
- [ ] T017 [P] [US1] Create or update TypeORM entity in `entities/[Entity].ts`
  if persistence is required
- [ ] T018 [US1] Implement business logic and external API mapping in
  `services/[service].ts`
- [ ] T019 [US1] Implement RESTful API Route in `pages/api/[route].ts`
- [ ] T020 [US1] Implement page or admin UI in `pages/[route].tsx` or
  `pages/admin/[route].tsx`
- [ ] T021 [US1] Add reusable table, form, modal, or state components in
  `components` as needed
- [ ] T022 [US1] Add desktop-only CSS Module or shared CSS styles
- [ ] T023 [US1] Verify user-safe error messages and server-side developer logs

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (write first)

- [ ] T024 [P] [US2] Add E2E test for [primary user/admin journey] in
  `tests/e2e/[feature].spec.ts`
- [ ] T025 [P] [US2] Add service/API test for [validation, mapping, auth, or
  external failure case] in `tests/[area]/[feature].test.ts`

### Implementation for User Story 2

- [ ] T026 [P] [US2] Define Zod schema and TypeScript types for [input/output]
- [ ] T027 [P] [US2] Create or update TypeORM entity if persistence is required
- [ ] T028 [US2] Implement service logic in `services/[service].ts`
- [ ] T029 [US2] Implement API Route in `pages/api/[route].ts`
- [ ] T030 [US2] Implement UI in `pages/[route].tsx` or
  `pages/admin/[route].tsx`
- [ ] T031 [US2] Integrate with User Story 1 components only where necessary

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (write first)

- [ ] T032 [P] [US3] Add E2E test for [primary user/admin journey] in
  `tests/e2e/[feature].spec.ts`
- [ ] T033 [P] [US3] Add service/API test for [validation, mapping, auth, or
  external failure case] in `tests/[area]/[feature].test.ts`

### Implementation for User Story 3

- [ ] T034 [P] [US3] Define Zod schema and TypeScript types for [input/output]
- [ ] T035 [P] [US3] Create or update TypeORM entity if persistence is required
- [ ] T036 [US3] Implement service logic in `services/[service].ts`
- [ ] T037 [US3] Implement API Route in `pages/api/[route].ts`
- [ ] T038 [US3] Implement UI in `pages/[route].tsx` or
  `pages/admin/[route].tsx`

**Checkpoint**: All user stories work independently

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in `docs/` or the feature spec folder
- [ ] TXXX Code cleanup and refactoring without moving business logic into page
  components
- [ ] TXXX Verify API response format consistency across changed API Routes
- [ ] TXXX Verify no `any` usage was introduced
- [ ] TXXX Verify `.env.example` covers new environment variables without
  secret values
- [ ] TXXX Security hardening for admin authorization and secret handling
- [ ] TXXX Run type check, lint, format check, and relevant E2E tests
- [ ] TXXX Update final implementation summary with changed files, main logic,
  and test/check results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user
  stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel if files do not conflict
  - Or sequentially in priority order (P1 -> P2 -> P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2); may integrate
  with US1 but must remain independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2); may integrate
  with US1/US2 but must remain independently testable

### Within Each User Story

- Tests MUST be written and fail before implementation
- Zod schemas and types before services
- Entities before services when persistence is required
- Services before API Routes and pages
- API Routes before UI integration when UI depends on server data
- Core implementation before integration
- Story complete before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel within Phase 2
- All tests for a user story marked [P] can run in parallel
- Types, schemas, and entities in different files can run in parallel
- Different user stories can be worked on in parallel when they do not edit the
  same files

---

## Parallel Example: User Story 1

```bash
# Launch tests for User Story 1 together:
Task: "Add E2E test for [journey] in tests/e2e/[feature].spec.ts"
Task: "Add service/API test for [case] in tests/[area]/[feature].test.ts"

# Launch independent implementation setup together:
Task: "Define Zod schema for [input]"
Task: "Create TypeScript types for [output]"
Task: "Create TypeORM entity for [entity]"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Write failing tests for User Story 1
4. Complete Phase 3: User Story 1
5. Stop and validate User Story 1 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup and Foundational phases
2. Add User Story 1, test independently, deploy/demo
3. Add User Story 2, test independently, deploy/demo
4. Add User Story 3, test independently, deploy/demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup and Foundational phases together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to a specific user story for traceability
- Each user story must be independently completable and testable
- Verify tests fail before implementing
- Keep external API calls server-side
- Keep business logic out of page components
- Avoid App Router, Express, Nest, `any`, raw external payload passthrough, and
  client-exposed secrets
- Stop at any checkpoint to validate story independently
