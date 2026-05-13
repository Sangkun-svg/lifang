# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories must be prioritized user journeys ordered by value.
  Each story must be independently testable and must identify whether it affects
  user pages, admin pages, API Routes, services, database entities, or external
  APIs.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user or admin journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe the E2E or service/API verification that proves
this story works independently]

**Affected Surfaces**: [pages path, pages/admin path, pages/api path, services,
entities, external APIs, or N/A]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user or admin journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Affected Surfaces**: [pages path, pages/admin path, pages/api path, services,
entities, external APIs, or N/A]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user or admin journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Affected Surfaces**: [pages path, pages/admin path, pages/api path, services,
entities, external APIs, or N/A]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when required input is missing or invalid?
- What happens when an external API call fails, times out, or returns an
  unexpected shape?
- What happens when an authenticated user lacks the required admin permission?
- What happens when the requested database record does not exist?
- What happens during destructive hard-delete operations?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow admins to create a product"]
- **FR-002**: System MUST [server/API behavior, e.g., "proxy provider lookups through a pages/api route"]
- **FR-003**: System MUST validate [input name] with Zod before using it
- **FR-004**: System MUST map external API response fields to [internal type]
  instead of passing raw provider payloads through
- **FR-005**: System MUST return API responses using the project success/error
  format
- **FR-006**: System MUST show loading, empty, and error states for [screen/flow]

*Mark unclear requirements as TODO items, not assumptions:*

- **FR-XXX**: TODO(AUTH_METHOD): Clarify how this flow authenticates admins
- **FR-XXX**: TODO(EXTERNAL_API_CONTRACT): Confirm provider response fields for
  [provider/action]

### Route and API Requirements

- **Page Routes**: [user-facing pages under pages/, or N/A]
- **Admin Routes**: [admin pages under pages/admin/, or N/A]
- **API Routes**: [RESTful pages/api routes and allowed methods, or N/A]
- **Server-Side External Calls**: [external APIs called from services/API
  Routes, or N/A]
- **Admin Authorization**: [required server-side permission checks, or N/A]
- **Environment Variables**: [required .env.local keys and .env.example entries,
  or N/A]

### Data Requirements *(include if feature involves data)*

- **Entities**: [TypeORM entities and relationships, or N/A]
- **Tables**: [snake_case PostgreSQL table names, or N/A]
- **Audit Fields**: [created_at/updated_at behavior, or N/A]
- **Deletion Behavior**: [hard delete target verification, cascade design, or N/A]

### UI/UX Requirements *(include if feature has UI)*

- **Desktop Layout**: [fixed content width, truncation/scroll behavior as width
  shrinks, or N/A]
- **Reusable Components**: [tables, forms, modals, or N/A]
- **Loading State**: [expected loading behavior]
- **Empty State**: [expected empty behavior]
- **Error State**: [user-facing message and recovery action]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [Measurable outcome, e.g., "Admins can complete product creation without client-side provider secrets"]
- **SC-002**: [Measurable outcome, e.g., "Invalid input is rejected with a user-safe error message"]
- **SC-003**: [Measurable outcome, e.g., "External API failure shows the configured error state and logs developer detail server-side"]
- **SC-004**: [Measurable outcome, e.g., "E2E coverage verifies the primary user/admin flow"]

## TODOs / Open Questions

<!--
  ACTION REQUIRED: Record unclear details here instead of inventing assumptions.
  Resolve or explicitly carry these TODOs into plan.md before implementation.
-->

- TODO([TOPIC]): [Question or missing decision]
