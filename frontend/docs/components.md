# Components Reference

All components live in `src/components/` and `src/pages/`. Pages are route-level components composed from smaller reusable components.

---

## Pages

### `ApplicationListPage`

**Route:** `/`

Fetches and displays all applications in a sortable table. Provides a link to create a new application.

**Data:** `useApplications()` — no props required.

**Table columns:** Tracking #, Applicant, Company, Type, Status, Created.

**Empty state:** Displays a message when no applications exist yet.

---

### `ApplicationDetailPage`

**Route:** `/applications/:id`

Full read-only detail view for a single application. Displays all fields, a reviewer comment box (amber, only shown when a comment exists), and workflow action buttons.

**Data:** `useApplication(id)` — reads `id` from URL params.

**Loading / error states:** Shows `<LoadingSpinner>` while fetching; shows `<ErrorMessage>` if the request fails or the record is not found.

---

### `ApplicationFormPage`

**Route (create):** `/applications/new`  
**Route (edit):** `/applications/:id/edit`

Dual-use form. When accessed via the edit route the component fetches the existing record and pre-fills all fields. On submit it calls either `useCreateApplication` or `useUpdateApplication` depending on whether an `id` param is present.

After a successful save the user is navigated to the detail page for the application.

**Fields:**

| Field               | Input type | Notes                                      |
|---------------------|------------|--------------------------------------------|
| `applicant_name`    | `text`     | Required                                   |
| `applicant_email`   | `email`    | Required                                   |
| `company_name`      | `text`     | Required                                   |
| `application_type`  | `select`   | Options from `APPLICATION_TYPES` constant  |
| `description`       | `textarea` | Free text                                  |

**Loading state:** Shows `<LoadingSpinner>` while fetching existing data (edit mode only).

**Error state:** Shows `<ErrorMessage>` inline above the form if the mutation fails.

---

## Shared Components

### `StatusBadge`

Renders the application status as a small colored pill.

```tsx
<StatusBadge status="Under Review" />
```

**Props:**

| Prop     | Type                | Required | Description            |
|----------|---------------------|----------|------------------------|
| `status` | `ApplicationStatus` | Yes      | The status to display  |

**Status → color mapping:**

| Status                 | Background token       | Text token            |
|------------------------|------------------------|-----------------------|
| Draft                  | `--color-gray-bg`      | `--color-gray-text`   |
| Submitted              | `--color-blue-bg`      | `--color-blue-text`   |
| Under Review           | `--color-purple-bg`    | `--color-purple-text` |
| Need More Information  | `--color-amber-bg`     | `--color-amber-text`  |
| Approved               | `--color-green-bg`     | `--color-green-text`  |
| Rejected               | `--color-red-bg`       | `--color-red-text`    |

---

### `ActionButtons`

Renders the correct set of action buttons based on the application's current status. This component is used exclusively on `ApplicationDetailPage`.

```tsx
<ActionButtons application={app} />
```

**Props:**

| Prop          | Type          | Required | Description                 |
|---------------|---------------|----------|-----------------------------|
| `application` | `Application` | Yes      | The full application record |

**Behavior by status:**

| Status                | Buttons shown                                          |
|-----------------------|--------------------------------------------------------|
| Draft                 | Edit (link), Submit                                    |
| Submitted             | Start Review                                           |
| Under Review          | Approve, Request More Information, Reject              |
| Need More Information | Edit (link), Resubmit                                  |
| Approved              | None                                                   |
| Rejected              | None                                                   |

When a reviewer clicks Approve, Request Info, or Reject, the component renders `<ReviewerDecisionForm>` inline for the chosen decision.

---

### `ReviewerDecisionForm`

Inline form for submitting a reviewer decision. Rendered inside `ActionButtons` — not used directly elsewhere.

```tsx
<ReviewerDecisionForm
  applicationId={42}
  decision="Rejected"
  onClose={() => setActiveDecision(null)}
/>
```

**Props:**

| Prop            | Type                                              | Required | Description                                 |
|-----------------|---------------------------------------------------|----------|---------------------------------------------|
| `applicationId` | `number`                                          | Yes      | ID of the application being reviewed        |
| `decision`      | `"Approved" \| "Need More Information" \| "Rejected"` | Yes  | The decision type to record                 |
| `onClose`       | `() => void`                                      | Yes      | Called when the form is dismissed           |

A comment is **required** for `"Need More Information"` and `"Rejected"` decisions. For `"Approved"` a comment is optional.

---

### `LoadingSpinner`

Simple centered loading indicator. Shown while async data is being fetched.

```tsx
<LoadingSpinner />
```

No props.

---

### `ErrorMessage`

Red error box. Shown when a query or mutation fails.

```tsx
<ErrorMessage message="Application not found." />
```

**Props:**

| Prop      | Type     | Required | Default                   |
|-----------|----------|----------|---------------------------|
| `message` | `string` | No       | `"Something went wrong."` |
