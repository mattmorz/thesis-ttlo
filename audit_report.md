# 🔍 Full Codebase Audit Report
**Application:** thesis-ttlo-OJT-Dave (IP Management System)
**Audit Date:** 2026-07-19
**Auditor:** Antigravity (Senior SE + QA + Security + UX Review)
**Scope:** Full codebase — authentication, authorization, API routes, TRPC, database, UI, UX, security, performance, production readiness

---

## ⚠️ EXECUTIVE SUMMARY

This audit identified **43 confirmed issues** across all categories. The most urgent concern is a **systemic, application-wide security vulnerability**: the majority of TRPC mutations and queries — including those that create, read, and modify IP application data — use `publicProcedure` instead of `protectedProcedure`, meaning **they require zero authentication**. Additionally, the Settings page, several admin features, and document workflows contain completely simulated (non-functional) implementations.

---

## ISSUE LIST

---

--------------------------------------------------
ISSUE #1
SEVERITY: CRITICAL

TITLE:
Majority of TRPC Procedures Use `publicProcedure` — No Authentication Required

CATEGORY:
Security / Authentication

LOCATION:
- `src/features/client/form-integration/trpc.ts` — all procedures (lines 54, 118, 286, 325, 336, 359, 382, 393, 402)
- `src/features/client/ip-disclosure/trpc.ts` — all procedures (lines 116, 340, 720, 845, 1095, 1253, 1428, 1451, 1543, 1570, 1773, 2231, 2253, 2294)
- `src/features/client/dashboard/trpc/index.ts` — all procedures (lines 16, 33, 54, 80, 103, 110, 136, 162)
- `src/features/admin/archives/trpc/index.ts` — all procedures (lines 12, 50, 65)
- `src/features/admin/client-project-dashboard/trpc/index.ts` — `get`, `updatePhase`, `addUpdatePhase` (lines 43, 65, 131)

PROBLEM:
Virtually every TRPC procedure that touches real business data — creating IP applications, saving IP disclosures, reading all applications, archiving records, updating project phases — is declared as `publicProcedure`. This means any unauthenticated actor can call these endpoints directly via `/api/trpc`. Authentication is not enforced at the procedure level.

EXPECTED BEHAVIOR:
All procedures that read, write, or modify business data should use `protectedProcedure` to enforce authentication at the TRPC middleware level.

EVIDENCE:
```ts
// src/features/client/form-integration/trpc.ts
export const formIntegrationRouter = router({
  createApplication: publicProcedure  // ← No auth required
    .input(z.object({ userId: z.string(), ... }))
    .mutation(async ({ input }) => { ... }) // Creates DB record

  getUserApplications: publicProcedure  // ← No auth required
  submitForProcessing: publicProcedure  // ← No auth required
  registerSubmission: publicProcedure   // ← No auth required
  ...
});

// src/features/client/ip-disclosure/trpc.ts
export const ipDisclosureRouter = router({
  createIpDisclosure: publicProcedure   // ← No auth required
  updateIpDisclosure: publicProcedure   // ← No auth required
  submitIpDisclosure: publicProcedure   // ← No auth required
  saveTrademarkApplication: publicProcedure // ← No auth required
  ...
});
```

IMPACT:
Any person without a session can call `createApplication`, `createIpDisclosure`, `submitIpDisclosure`, read all IP applications, archive records, etc. This is a full authorization bypass affecting the core business functionality of the system.

RECOMMENDED FIX:
Replace `publicProcedure` with `protectedProcedure` for every mutation and every query that reads or writes business data. Use `publicProcedure` only for truly public endpoints (e.g., public tracking link, public status check).

--------------------------------------------------

--------------------------------------------------
ISSUE #2
SEVERITY: CRITICAL

TITLE:
`getAvailableApplications` Loads All Database Records into Memory for In-JS Filtering

CATEGORY:
Performance / Database

LOCATION:
`src/trpc/routers/ipApplicationEnrollment.ts` — lines 206–245

PROBLEM:
The procedure fetches ALL IP applications from the database with no `WHERE` clause, then filters them in JavaScript using `Array.filter()`, and applies pagination with `Array.slice()`. As the dataset grows, this will load tens of thousands of rows into memory, causing out-of-memory crashes and extremely slow responses.

EXPECTED BEHAVIOR:
The SQL query should use a `NOT IN` or `LEFT JOIN ... WHERE NULL` clause to exclude already-enrolled application IDs, and the `LIMIT` clause should be applied at the SQL level.

EVIDENCE:
```ts
// Fetches EVERYTHING from DB
let applications = await db.select({...}).from(ipApplication)
  .orderBy(desc(ipApplication.createdAt));

// Filters in JavaScript memory
let availableApplications = applications.filter(
  (app) => !enrolledIds.includes(app.id)
);
// Paginates in JavaScript memory
availableApplications = availableApplications.slice(0, input.limit);
```

IMPACT:
Critical performance degradation and eventual memory crash in production as data grows. Current implementation will fail under any realistic load.

RECOMMENDED FIX:
Use SQL-level filtering with `notInArray(ipApplication.id, enrolledIds)` and `limit(input.limit)` in the Drizzle query directly.

--------------------------------------------------

--------------------------------------------------
ISSUE #3
SEVERITY: CRITICAL

TITLE:
All Non-API Routes (Including Admin Pages) Bypass Middleware Authentication Check

CATEGORY:
Security / Authentication

LOCATION:
`src/middleware.ts` — lines 68–71

PROBLEM:
The middleware explicitly skips all authentication checks for **all** `/api/*` routes that are not `/api/trpc`:

```ts
const isApiPath = pathname.startsWith("/api");
if (isApiPath && !pathname.startsWith("/api/trpc")) {
  return NextResponse.next(); // ← Skip all auth checks for REST API routes
}
```

This means all REST API routes (`/api/documents`, `/api/client-profile`, `/api/ip-disclosure`, `/api/admin/*`, etc.) are completely unprotected at the middleware level. Each route must implement its own auth check or remain publicly accessible.

EXPECTED BEHAVIOR:
Middleware should either protect API routes or ensure each route handler independently validates the session.

EVIDENCE:
```ts
// middleware.ts line 68-71
const isApiPath = pathname.startsWith("/api");
if (isApiPath && !pathname.startsWith("/api/trpc")) {
  return NextResponse.next(); // All REST APIs pass through with no auth check
}
```

IMPACT:
If any individual API route handler fails to call `auth()` and validate session, it is fully exposed to unauthenticated access.

RECOMMENDED FIX:
Audit every API route handler for an explicit `auth()` call and `session` validation. Consider adding middleware-level API protection or document which routes are intentionally public.

--------------------------------------------------

--------------------------------------------------
ISSUE #4
SEVERITY: CRITICAL

TITLE:
`archives` Router — `create` and `delete` Use `publicProcedure` (No Auth Enforced)

CATEGORY:
Security / Authentication

LOCATION:
`src/features/admin/archives/trpc/index.ts` — lines 50–72

PROBLEM:
The `create` archive procedure uses `publicProcedure` but then calls `auth()` internally and uses `userId ?? ""`. If `auth()` returns `null`, it inserts an archive record with `archivedBy: ""`. The `delete` archive procedure uses `publicProcedure` with no auth check at all.

EXPECTED BEHAVIOR:
Both `create` and `delete` should use `protectedProcedure`. Archive operations are admin-only and should be strictly gated.

EVIDENCE:
```ts
create: publicProcedure  // ← No auth enforcement
  .mutation(async ({ input }) => {
    const session = await auth();
    const userId = session?.user?.id;
    await db.insert(archives).values({
      archivedBy: userId ?? "", // ← Empty string if no session
    });
  }),
delete: publicProcedure  // ← No auth at all
  .mutation(async ({ input }) => {
    await db.delete(archives)
      .where(eq(archives.applicationId, input.applicationId!));
  }),
```

IMPACT:
Unauthenticated users can delete any archive record or create spurious archive records.

RECOMMENDED FIX:
Replace `publicProcedure` with `protectedProcedure` for both procedures. Add role-check (admin/staff only) for delete.

--------------------------------------------------

--------------------------------------------------
ISSUE #5
SEVERITY: CRITICAL

TITLE:
`clientProjectDashboard` Router — `get`, `updatePhase`, `addUpdatePhase` Publicly Accessible Without Auth

CATEGORY:
Security / Authentication

LOCATION:
`src/features/admin/client-project-dashboard/trpc/index.ts` — lines 43, 65, 131

PROBLEM:
Three procedures in the admin client project dashboard router use `publicProcedure`:
- `get` — reads full project data including all phases and tasks
- `updatePhase` — modifies all tasks in a phase (via `edge.transaction`)
- `addUpdatePhase` — creates/updates phases and phase reminders

All three are admin-only operations that should require authentication.

EXPECTED BEHAVIOR:
Use `protectedProcedure` for all three, with role checks ensuring only `admin` or `ttlo_staff` can call them.

EVIDENCE:
```ts
get: publicProcedure  // ← No auth
  .query(async ({ input }) => {
    const res = await db.query.ipApplication.findFirst({...});
    return res;
  }),
updatePhase: publicProcedure  // ← No auth
  .mutation(async ({ input }) => {
    await edge.transaction(...); // Modifies all phase tasks
  }),
```

IMPACT:
Anyone can read full project details and modify phase tasks without logging in.

RECOMMENDED FIX:
Use `protectedProcedure` with an additional admin/staff role check.

--------------------------------------------------

--------------------------------------------------
ISSUE #6
SEVERITY: CRITICAL

TITLE:
Settings Page — Profile Save, Notifications Save, and Password Change Are All Fake (No Database Operation)

CATEGORY:
Incomplete Feature / Bug

LOCATION:
`src/app/(admin)/admin/settings/page.tsx` — lines 141–220

PROBLEM:
All three settings form submissions simulate an API call using `await new Promise(resolve => setTimeout(resolve, 1000))` and then show a success toast. No data is actually saved to the database or session.

EXPECTED BEHAVIOR:
- Profile form should update `userAccount.name` in the database and refresh the session.
- Notifications form should persist notification preferences somewhere.
- Password/security form is irrelevant since the app uses Google OAuth (no password), but should either be removed or replaced with account security settings.

EVIDENCE:
```ts
const handleProfileSubmit = async (values) => {
  setIsLoading(true);
  try {
    // "In a real app, you would make an API call..."
    await new Promise((resolve) => setTimeout(resolve, 1000)); // ← FAKE
    toast({ title: "Profile updated" }); // ← User sees false success
  }
};

const handleSecuritySubmit = async (values) => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // ← FAKE
  toast({ title: "Password updated" }); // ← App uses Google OAuth, no password
};
```

IMPACT:
Users believe their settings were saved but nothing persists. Security tab presents a password-change form that is completely inapplicable to the OAuth-only authentication model.

RECOMMENDED FIX:
Connect profile form to a real TRPC mutation updating `userAccount`. Remove the Security (password) tab since app uses Google OAuth exclusively.

--------------------------------------------------

--------------------------------------------------
ISSUE #7
SEVERITY: HIGH

TITLE:
`useDocumentActions` Hook — All Document Operations Return "Not Implemented" Error

CATEGORY:
Incomplete Feature / Button

LOCATION:
`src/features/admin/client-project-dashboard/hooks/useDocumentActions.ts` — lines 17–50

PROBLEM:
Three hook functions — `uploadDocument`, `validateDocument`, and `cancelValidation` — all immediately return `false` and set an error string `"Not implemented in production environment."`. These back the admin document upload/validation workflow in the client project dashboard.

EXPECTED BEHAVIOR:
These functions should call real TRPC mutations or API endpoints to upload, validate, and cancel document validations.

EVIDENCE:
```ts
const uploadDocument = async (files, metadata) => {
  setActionState({ loading: false, error: "Not implemented in production environment.", success: false });
  return false;
};
const validateDocument = async (documentId, status, remarks, validationFile) => {
  setActionState({ loading: false, error: "Not implemented in production environment.", success: false });
  return false;
};
```

IMPACT:
Admins cannot upload documents to projects, validate documents, or cancel validations. Critical admin workflow is broken.

RECOMMENDED FIX:
Implement actual TRPC mutations connecting to the existing `addUpdateDeleteInternalValidation` or a dedicated document upload API route.

--------------------------------------------------

--------------------------------------------------
ISSUE #8
SEVERITY: HIGH

TITLE:
`usePhases` Hook — `handleSubtaskComplete` Is a Simulated In-Memory Update with No Database Persistence

CATEGORY:
Incomplete Feature / Bug

LOCATION:
`src/features/admin/client-project-dashboard/hooks/usePhases.ts` — lines 48–73

PROBLEM:
`handleSubtaskComplete` uses `await new Promise(resolve => setTimeout(resolve, 500))` to simulate loading, then updates local React state only. No API call is made. The subtask completion is lost on page reload.

EXPECTED BEHAVIOR:
Should call a TRPC mutation (e.g., `addUpdateDeletePhaseTask`) to persist the subtask completion status in the database.

EVIDENCE:
```ts
const handleSubtaskComplete = async (phaseId, taskId, completed) => {
  try {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500)); // ← FAKE API
    setPhases((current) => current.map(...)); // ← Only local state, not saved
  }
```

IMPACT:
Admin marking a subtask as complete loses that data on refresh. The UI gives false feedback of persistence.

RECOMMENDED FIX:
Replace the timeout with a real TRPC mutation call to update `phaseTask.status` in the database.

--------------------------------------------------

--------------------------------------------------
ISSUE #9
SEVERITY: HIGH

TITLE:
`profile-section.tsx` — Avatar Upload Is a Stub with TODO Comment

CATEGORY:
Incomplete Feature

LOCATION:
`src/features/admin/settings/components/profile-section.tsx` — lines 13–21, 31–32

PROBLEM:
The component has a `TODO: Implement avatar upload` comment. The handler simulates a delay then does nothing. The avatar image always shows `"/placeholder-avatar.jpg"` with the hardcoded fallback initials `"JD"` instead of real user data.

EXPECTED BEHAVIOR:
Avatar upload should store the image (e.g., to Google Drive or cloud storage) and update `userAccount.image`. Fallback initials should be derived from the actual logged-in user.

EVIDENCE:
```ts
const handleAvatarUpload = async (e) => {
  // TODO: Implement avatar upload
  await new Promise((resolve) => setTimeout(resolve, 1000)); // ← FAKE
};
// ...
<AvatarImage src="/placeholder-avatar.jpg" alt="Profile picture" />
<AvatarFallback>JD</AvatarFallback>  // ← Hardcoded initials
```

IMPACT:
Profile picture settings are non-functional. Users see placeholder image and wrong initials.

RECOMMENDED FIX:
Implement actual file upload logic. Pull avatar from session/database. Use real initials from user name.

--------------------------------------------------

--------------------------------------------------
ISSUE #10
SEVERITY: HIGH

TITLE:
`recent-tasks.tsx` — Available Projects Tab Shows Hardcoded Dummy Data

CATEGORY:
Incomplete Feature / Bug

LOCATION:
`src/features/admin/dashboard/components/recent-tasks.tsx` — lines 231–266

PROBLEM:
The "Available Projects" tab renders a hardcoded array of strings: `["Testing 3", "AI-Based Water Quality Monitoring System", "Hello"]`. These are dummy values, not real database records. The "Assign" button also has no `onClick` handler.

EXPECTED BEHAVIOR:
Should query unassigned applications from `getUnassignedApplications` TRPC procedure and render real project names with functional assignment logic.

EVIDENCE:
```tsx
{["Testing 3", "AI-Based Water Quality Monitoring System", "Hello"].map((project) => (
  <div ...>
    <div>{project}</div>
    <Button variant="outline" size="sm">Assign</Button>  {/* No onClick */}
  </div>
))}
```

IMPACT:
Admin dashboard shows hardcoded test data. "Assign" button does nothing. Admin cannot assign projects from this panel.

RECOMMENDED FIX:
Fetch real unassigned applications via TRPC. Connect "Assign" button to enrollment mutation with confirmation dialog.

--------------------------------------------------

--------------------------------------------------
ISSUE #11
SEVERITY: HIGH

TITLE:
Duplicate `useFormSubmission` Files — `.ts` vs `.tsx` Naming Conflict

CATEGORY:
Bug / Production Readiness

LOCATION:
- `src/features/client/form-integration/hooks/useFormSubmission.ts` (real implementation)
- `src/features/client/form-integration/hooks/useFormSubmission.tsx` (mock that throws errors)

PROBLEM:
Two files exist with identical base names and different extensions. The `.tsx` file is the mock/disabled version that throws `"Mock useFormSubmission hook is disabled in production."`. All form components import from `"@/features/client/form-integration/hooks/useFormSubmission"` without extension. Depending on bundler/TypeScript resolution order, the mock `.tsx` file may be resolved instead of the real `.ts` file, crashing all form submissions.

EXPECTED BEHAVIOR:
Only one `useFormSubmission` file should exist — the real implementation (`.ts`).

EVIDENCE:
```
useFormSubmission.ts   ← Real hook (line 19: export function useFormSubmission(options))
useFormSubmission.tsx  ← Mock that throws errors
  // line 8: throw new Error("Mock useFormSubmission hook is disabled in production.");
```

IMPACT:
If `.tsx` is resolved by the bundler, every form submission in the entire client application will crash with a runtime error. Affects client profile form, deed of assignment, substantial use, and IP disclosure.

RECOMMENDED FIX:
Delete the `.tsx` mock file. Keep only the real `.ts` implementation.

--------------------------------------------------

--------------------------------------------------
ISSUE #12
SEVERITY: HIGH

TITLE:
`DocumentsView.tsx` — Missing Error State Causes Infinite Loading Spinner

CATEGORY:
Bug / UX

LOCATION:
`src/features/admin/client-project-dashboard/components/documents/DocumentsView.tsx` — lines 23–30

PROBLEM:
The component checks `isPending || !data` to show a loading spinner, but never checks `isError`. If the TRPC query fails (network error, unauthorized, DB error), `isPending` becomes `false` but `data` remains `undefined`, so the loading spinner displays indefinitely.

EXPECTED BEHAVIOR:
Should check `isError` separately and render an error state or retry option.

EVIDENCE:
```tsx
const { data, isPending } = trpc.projects.getDocuments.useQuery(applicationId);
if (isPending || !data)
  return <LoadingSpinner />;  // ← Never resolves if query errors
```

IMPACT:
On any query failure, admin is stuck on a loading spinner with no way to recover, no error message, and no retry.

RECOMMENDED FIX:
Destructure `isError` and `error` from the query and render an error state with a retry button.

--------------------------------------------------

--------------------------------------------------
ISSUE #13
SEVERITY: HIGH

TITLE:
`getApplicationStatusStats` and `getApplicationTypeStats` — 4 Separate Queries Instead of Aggregate SQL

CATEGORY:
Performance / Database

LOCATION:
`src/features/client/dashboard/trpc/index.ts` — lines 136–185

PROBLEM:
Each statistics procedure fires 4 separate database queries using `findMany` (which returns all rows for each status/type), then counts the returned arrays. This is both N+1 style querying and over-fetching — returning all rows in each status just to count them.

EXPECTED BEHAVIOR:
Should use a single `GROUP BY` SQL query or `COUNT(*)` per category in a single trip to the database.

EVIDENCE:
```ts
const [pending, inProgress, approved, completed] = await Promise.all([
  db.query.ipApplication.findMany({ where: eq(ipApplication.status, "pending") }),    // all rows
  db.query.ipApplication.findMany({ where: eq(ipApplication.status, "in_progress") }), // all rows
  db.query.ipApplication.findMany({ where: eq(ipApplication.status, "approved") }),    // all rows
  db.query.ipApplication.findMany({ where: eq(ipApplication.status, "completed") }),   // all rows
]);
return { pending: pending.length, ... }; // Just counting length
```

IMPACT:
4× more network round trips and 4× more data transferred than necessary. Will become very slow as the application table grows.

RECOMMENDED FIX:
Use `SELECT status, COUNT(*) FROM ip_application GROUP BY status` via Drizzle's `sql` tag or `count()` aggregate.

--------------------------------------------------

--------------------------------------------------
ISSUE #14
SEVERITY: HIGH

TITLE:
`enroll` Procedure Allows Any Authenticated User to Enroll Any User into Any Application

CATEGORY:
Security / Authorization

LOCATION:
`src/trpc/routers/ipApplicationEnrollment.ts` — lines 26–71

PROBLEM:
The `enroll` procedure uses `protectedProcedure` (good), but takes `userId` from the **client input** (not the session). Any authenticated user can supply an arbitrary `userId` to enroll someone else. There is no check that `input.userId === ctx.session.user.id` or that the caller has admin/staff role.

EXPECTED BEHAVIOR:
Either enforce that `input.userId` must match `ctx.session.user.id` (for self-enrollment), or require admin/staff role for cross-user enrollment.

EVIDENCE:
```ts
enroll: protectedProcedure
  .input(enrollmentInputSchema) // { applicationId: uuid, userId: uuid }
  .mutation(async ({ input, ctx }) => {
    // No check that input.userId === ctx.session.user.id
    // No admin role check
    await db.insert(ipApplicationEnrollment).values({
      applicationId: input.applicationId,
      userId: input.userId, // ← Can be any userId
    });
  }),
```

IMPACT:
An authenticated client user can enroll any other user (including admin accounts) into any application, or remove other users' enrollments via `unenroll`.

RECOMMENDED FIX:
Verify `input.userId === ctx.session.user.id` or that `ctx.session.user.role === "admin" || "ttlo_staff"` before proceeding.

--------------------------------------------------

--------------------------------------------------
ISSUE #15
SEVERITY: HIGH

TITLE:
Missing Transactions on Multi-Table IP Application Creation

CATEGORY:
Database / Data Integrity

LOCATION:
`src/features/client/form-integration/trpc.ts` — lines ~150–200 (createApplication mutation)

PROBLEM:
Creating a new IP application involves inserting into `ipApplication` and then inserting an initial `applicationPhase`. These are done as sequential awaited calls without a database transaction. If the phase insertion fails after the application is inserted, the database is left in an inconsistent state (orphaned application with no phases).

EXPECTED BEHAVIOR:
Both inserts should be wrapped in `db.transaction()` to ensure atomicity.

EVIDENCE:
```ts
// Sequential inserts without transaction
await db.insert(ipApplication).values({ ... });
await db.insert(applicationPhase).values({ ... }); // If this fails, ipApplication is stranded
```

IMPACT:
Data integrity risk. Orphaned application records with no phases can break the entire client form flow.

RECOMMENDED FIX:
Wrap both inserts in `db.transaction(async (tx) => { ... })`.

--------------------------------------------------

--------------------------------------------------
ISSUE #16
SEVERITY: HIGH

TITLE:
Missing Transactions on IP Disclosure Multi-Table Insert

CATEGORY:
Database / Data Integrity

LOCATION:
`src/features/client/ip-disclosure/trpc.ts` — createIpDisclosure mutation (~lines 116–340)

PROBLEM:
Creating an IP disclosure involves separate sequential inserts: `ipDisclosure`, `ipDisclosureApplicant`, `ipDisclosureInventor`. These run independently without a transaction wrapper. A failure mid-way leaves partial, corrupt disclosure data.

EXPECTED BEHAVIOR:
All related inserts should be wrapped in a single `db.transaction()`.

IMPACT:
Partial disclosure records in the database break retrieval and display of disclosure data.

RECOMMENDED FIX:
Use `db.transaction()` to wrap all three inserts atomically.

--------------------------------------------------

--------------------------------------------------
ISSUE #17
SEVERITY: HIGH

TITLE:
TRPC `onMutationSuccess` Global Hook Adds 2-Second Artificial Delay and Double-Invalidates Queries

CATEGORY:
Performance / Bug

LOCATION:
`src/trpc/client.tsx` — lines 26–43

PROBLEM:
The global `onSuccess` handler in the TRPC provider:
1. Calls `invalidateQueries()`, waits 500ms
2. Calls `refetchQueries()`, waits 500ms  
3. Calls `invalidateQueries()` again, waits 500ms
4. Calls `refetchQueries()` again

This means every single TRPC mutation adds a minimum 2-second delay to UI updates and makes 4 redundant cache operations.

EXPECTED BEHAVIOR:
A single `invalidateQueries()` call is sufficient. No artificial delays needed.

EVIDENCE:
```ts
async onSuccess(opts) {
  await opts.originalFn();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await opts.queryClient.invalidateQueries();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await opts.queryClient.refetchQueries();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await opts.queryClient.invalidateQueries();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await opts.queryClient.refetchQueries();
},
```

IMPACT:
All mutations feel artificially slow. UI takes 2+ seconds to update after any save. Redundant network calls waste bandwidth.

RECOMMENDED FIX:
Remove the double invalidation and all `setTimeout` delays. A single `invalidateQueries()` after `originalFn()` is the correct pattern.

--------------------------------------------------

--------------------------------------------------
ISSUE #18
SEVERITY: HIGH

TITLE:
`calendarRouter.deleteEvent` — No Authorization Check (Any User Can Delete Any Event)

CATEGORY:
Security / Authorization

LOCATION:
`src/features/admin/calendar/trpc/index.ts` — lines 75–84

PROBLEM:
The `deleteEvent` mutation uses `protectedProcedure` (requiring login) but does not check whether the requesting user created the event or has admin role. Any authenticated user can delete any calendar event by its ID.

EXPECTED BEHAVIOR:
Verify that the requesting user is either the creator of the event (`calendarEvent.createdBy === ctx.session.user.id`) or has admin/staff role.

EVIDENCE:
```ts
deleteEvent: protectedProcedure
  .input(z.string().uuid())
  .mutation(async ({ input }) => {
    // No ownership or role check
    await db.delete(calendarEvent).where(eq(calendarEvent.id, input));
  }),
```

IMPACT:
Any logged-in client user can delete admin/staff calendar events.

RECOMMENDED FIX:
Add a role check or ownership check before executing the delete.

--------------------------------------------------

--------------------------------------------------
ISSUE #19
SEVERITY: HIGH

TITLE:
`console.log` Statements Throughout Production Code — Sensitive Data Logged

CATEGORY:
Security / Production Readiness

LOCATION:
Multiple files, including:
- `src/middleware.ts` — lines 73–100 (logs ALL request cookies and full token details)
- `src/trpc/init.ts` — lines 21–25 (logs user ID and session status)
- `src/trpc/routers/ipApplicationEnrollment.ts` — lines 58, 204, 221, 228
- `src/features/admin/client-project-dashboard/trpc/index.ts` — line 62, 82
- `src/app/(admin)/admin/forms-page/forms/SubstantialUsePdf.tsx` — 20+ console.log calls
- `src/app/(auth)/auth/_components/login-form.tsx` — line 27

PROBLEM:
Production code contains extensive `console.log` statements that log sensitive data including:
- **All request cookies** (`request.cookies.getAll()`) — includes session tokens
- **Full JWT token details** — may include user ID, role, email
- **User enrollment actions** — records user activity in plaintext logs
- **IP disclosure data** — sensitive business information

EXPECTED BEHAVIOR:
Production code should use a structured logger with log levels. Debug-level logs should be disabled in production. Sensitive data (cookies, tokens, PII) should never be logged.

EVIDENCE:
```ts
// middleware.ts line 73-100
console.log("🍪 Middleware cookies:", request.cookies.getAll()); // ← All cookies logged!
console.log("Token details:", token); // ← Full JWT token logged!
```

IMPACT:
Session tokens, user data, and sensitive application data are written to server logs. In any centralized logging system, this constitutes a data exposure risk.

RECOMMENDED FIX:
Remove all `console.log` statements from production paths. Replace with conditional `if (process.env.NODE_ENV === 'development')` guards or a proper structured logger.

--------------------------------------------------

--------------------------------------------------
ISSUE #20
SEVERITY: HIGH

TITLE:
`getAllApplications`, `getAllEnrollments`, `getAll` (Users) — No Pagination

CATEGORY:
Performance / Database

LOCATION:
- `src/features/client/dashboard/trpc/index.ts` — line 103–107
- `src/trpc/routers/ipApplicationEnrollment.ts` — line 128–131
- `src/trpc/routers/users.ts` — lines 26–33

PROBLEM:
Three queries fetch entire database tables without any `LIMIT`/`OFFSET` or cursor-based pagination:
- `getAllApplications` returns all IP applications
- `getAllEnrollments` returns all enrollments
- `getAll` (users) returns all user accounts

EXPECTED BEHAVIOR:
All listing queries should support pagination.

EVIDENCE:
```ts
getAllApplications: publicProcedure.query(async () => {
  return db.query.ipApplication.findMany({ // ← No limit
    orderBy: desc(ipApplication.createdAt),
  });
}),
getAllEnrollments: protectedProcedure.query(async () => {
  const allEnrollments = await db.select().from(ipApplicationEnrollment); // ← No limit
  return allEnrollments;
}),
```

IMPACT:
As data grows, these queries will return megabytes of data, causing slow API responses and high memory usage.

RECOMMENDED FIX:
Add `limit`/`offset` or cursor-based pagination inputs to all list queries.

--------------------------------------------------

--------------------------------------------------
ISSUE #21
SEVERITY: MEDIUM

TITLE:
`proj-inventory/page.tsx` — Debugging Text Visible to End Users in Production

CATEGORY:
UX / Production Readiness

LOCATION:
`src/app/(admin)/admin/proj-inventory/page.tsx` — lines 89–92, 128–131

PROBLEM:
Two wrapper components in the inventory page render visible debug messages to the user:
- `"Debugging: OtherIpTypesInventory is being rendered"`
- `"Debugging: NoneIpTypesInventory is being rendered"`

These appear as amber warning boxes visible to any admin user viewing those inventory tabs.

EXPECTED BEHAVIOR:
Debug messages should never appear in production UI.

EVIDENCE:
```tsx
function OtherIpTypesWrapper() {
  return (
    <Card>
      <CardContent>
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 text-sm">
            Debugging: OtherIpTypesInventory is being rendered
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

IMPACT:
Unprofessional appearance. Exposes internal debugging context to users.

RECOMMENDED FIX:
Remove all debug text from these wrapper components. Rename wrappers appropriately.

--------------------------------------------------

--------------------------------------------------
ISSUE #22
SEVERITY: MEDIUM

TITLE:
`useDebounce.ts` Hook — Memory Leak (No Cleanup on Unmount)

CATEGORY:
Bug / Performance

LOCATION:
`src/hooks/useDebounce.ts` — lines 7–20

PROBLEM:
The `useDebounce` hook creates a `setTimeout` but the returned `useEffect` cleanup function is missing. When the component unmounts before the timeout fires, the callback still executes, potentially updating state on an unmounted component.

EXPECTED BEHAVIOR:
The hook should return a cleanup function (`clearTimeout`) to prevent the timer from firing after unmount.

IMPACT:
Memory leak and potential "Can't perform a React state update on an unmounted component" warnings. Can cause ghost state updates.

RECOMMENDED FIX:
Add `return () => clearTimeout(timeoutRef.current)` to the `useEffect` cleanup.

--------------------------------------------------

--------------------------------------------------
ISSUE #23
SEVERITY: MEDIUM

TITLE:
Login Page — "Terms of Service" and "Privacy Policy" Links Are Dead (`href="#"`)

CATEGORY:
UX / Incomplete Feature

LOCATION:
`src/app/(auth)/auth/_components/login-form.tsx` — lines 74, 78

PROBLEM:
The login form shows "By continuing, you agree to our Terms of Service and Privacy Policy" with both links pointing to `href="#"`. These are non-functional placeholder links visible on every login attempt.

EXPECTED BEHAVIOR:
Links should point to real Terms of Service and Privacy Policy pages, or should be removed if no such pages exist.

EVIDENCE:
```tsx
<Link href="#" className="mx-1 text-black/80">Terms of Service</Link>
<Link href="#" className="mx-1 text-black/80">Privacy Policy</Link>
```

IMPACT:
Legal/compliance concern: users are agreeing to terms they cannot read. Poor UX on first impression.

RECOMMENDED FIX:
Create or link to actual ToS and Privacy Policy pages, or remove the agreement text from the login form.

--------------------------------------------------

--------------------------------------------------
ISSUE #24
SEVERITY: MEDIUM

TITLE:
`SearchReportInventory.tsx` — Multiple Links with `href="#"` (Non-Functional Navigation)

CATEGORY:
UX / Incomplete Feature

LOCATION:
`src/features/admin/project-inventory/components/ip-disclosure-inventory/patent-um/SearchReportInventory.tsx` — lines 1095, 1119, 1139, 1153

PROBLEM:
Multiple `<a href="#">` links exist in the patent search report inventory component, pointing nowhere.

EXPECTED BEHAVIOR:
Links should navigate to actual content or be replaced with buttons if they trigger actions.

IMPACT:
Non-functional navigation controls confuse admin users.

RECOMMENDED FIX:
Replace with `<Link>` pointing to real routes or with `<Button>` components with proper handlers.

--------------------------------------------------

--------------------------------------------------
ISSUE #25
SEVERITY: MEDIUM

TITLE:
Admin Dashboard — Search Input Has No Filtering Logic Connected

CATEGORY:
Incomplete Feature

LOCATION:
`src/app/(admin)/admin/dashboard/page.tsx` — line ~231

PROBLEM:
The "Search applications..." input on the admin dashboard is a UI-only element. It is not connected to any filtering, search query, or state management. Typing in it has no effect.

EXPECTED BEHAVIOR:
Search input should filter the applications list displayed on the dashboard.

IMPACT:
Admin cannot search applications from the dashboard despite the search UI existing.

RECOMMENDED FIX:
Connect the search input to a debounced filter applied to the applications list or a TRPC query with a search parameter.

--------------------------------------------------

--------------------------------------------------
ISSUE #26
SEVERITY: MEDIUM

TITLE:
`window.location.reload()` / `window.location.href` Used Extensively Instead of Next.js Router

CATEGORY:
UX / Performance / Code Quality

LOCATION:
Multiple files — 30+ occurrences found, including:
- `src/app/(client)/forms/[formId]/_components/clientProfile/client-profile-form.tsx` (lines 374, 404, 908)
- `src/app/(client)/forms/[formId]/_components/substantialuse/substantial-use.tsx` (line 551)
- `src/features/admin/dashboard/components/available-applications.tsx` (line 253)
- `src/app/(client)/dashboard/page.tsx` (lines 770, 1025, 1036, 1057)

PROBLEM:
The application extensively uses `window.location.href` for navigation and `window.location.reload()` for refreshing data. These trigger full page reloads, destroying React state, TRPC cache, and session context, resulting in a poor SPA experience.

EXPECTED BEHAVIOR:
Navigation should use `useRouter().push()` from Next.js. Cache invalidation should use `queryClient.invalidateQueries()`.

IMPACT:
Poor user experience — full page flash on navigation. Lost form state on redirect. Defeats the purpose of Next.js SPA optimization.

RECOMMENDED FIX:
Replace `window.location.href = url` with `router.push(url)`. Replace `window.location.reload()` with targeted `queryClient.invalidateQueries()`.

--------------------------------------------------

--------------------------------------------------
ISSUE #27
SEVERITY: MEDIUM

TITLE:
`account` Table Missing Primary Key and Composite Unique Constraint

CATEGORY:
Database / Schema

LOCATION:
`src/drizzle/schema.ts` — `account` table definition (~line 559)

PROBLEM:
The `account` table (used for OAuth provider accounts) is missing a primary key. In the NextAuth adapter pattern, this table should have a composite primary key on `(provider, providerAccountId)` to prevent duplicate OAuth records.

EXPECTED BEHAVIOR:
Primary key constraint on `(provider, providerAccountId)`.

IMPACT:
Duplicate OAuth account entries possible, leading to authentication inconsistencies.

RECOMMENDED FIX:
Add composite primary key: `.primaryKey({ columns: [account.provider, account.providerAccountId] })`.

--------------------------------------------------

--------------------------------------------------
ISSUE #28
SEVERITY: MEDIUM

TITLE:
`getApplicationStatusStats` and `getApplicationTypeStats` — Missing `rejected` and `draft` Status in Stats

CATEGORY:
Bug / Incomplete Feature

LOCATION:
`src/features/client/dashboard/trpc/index.ts` — lines 136–185

PROBLEM:
`getApplicationStatusStats` queries for `pending`, `in_progress`, `approved`, and `completed` but omits `draft` and `rejected` statuses (which exist in the schema enum). The admin dashboard stats will never show draft or rejected counts.

EXPECTED BEHAVIOR:
All status values in the enum should be represented in the statistics response.

IMPACT:
Incomplete statistics shown on the admin dashboard; draft and rejected applications appear invisible in the stats panel.

RECOMMENDED FIX:
Include `draft` and `rejected` in the status query, or rewrite as a single GROUP BY query covering all statuses.

--------------------------------------------------

--------------------------------------------------
ISSUE #29
SEVERITY: MEDIUM

TITLE:
`PhaseList.tsx` — Clickable `<div>` Missing Accessibility Attributes

CATEGORY:
UX / Accessibility

LOCATION:
`src/features/admin/client-project-dashboard/components/phases/PhaseList.tsx` — lines 66–68

PROBLEM:
A `<div onClick={...}>` is used as an interactive button-like element without `role="button"`, `tabIndex={0}`, or `onKeyDown` handler. This makes it inaccessible to keyboard-only users and screen readers.

EXPECTED BEHAVIOR:
Interactive div elements should include accessibility attributes or be replaced with `<button>` elements.

IMPACT:
Keyboard navigation broken for this element. Screen reader users cannot interact with phase selection.

RECOMMENDED FIX:
Replace with `<button>` or add `role="button"`, `tabIndex={0}`, `onKeyDown` handler.

--------------------------------------------------

--------------------------------------------------
ISSUE #30
SEVERITY: MEDIUM

TITLE:
`agenda-view.tsx` — Event Click Handlers on `<div>` Without Accessibility Attributes

CATEGORY:
UX / Accessibility

LOCATION:
`src/components/blocks/event-calendar/agenda-view.tsx` — lines 142–144

PROBLEM:
Calendar event items use `<div onClick={() => onEventClick(event)}>` without keyboard event handling or ARIA role.

EXPECTED BEHAVIOR:
Interactive elements should use semantic HTML or include appropriate ARIA attributes and keyboard handlers.

IMPACT:
Keyboard-only users cannot click calendar events. Accessibility compliance failure.

RECOMMENDED FIX:
Use `<button>` elements or add `role="button"`, `tabIndex`, `onKeyDown`.

--------------------------------------------------

--------------------------------------------------
ISSUE #31
SEVERITY: MEDIUM

TITLE:
`auth.ts` — Role Assignment Based on Email Lists Stored in Environment Variables Without Rotation Mechanism

CATEGORY:
Security / Authentication

LOCATION:
`src/auth.ts` — lines 16–21, 76–87

PROBLEM:
Admin and staff roles are assigned at sign-in time based on `ADMIN_EMAILS` and `TTLO_STAFF_EMAILS` environment variables. Role assignment is permanent in the database and is not re-evaluated on subsequent logins (the DB `role` field from the existing user is used).

A user promoted to admin via `ADMIN_EMAILS` retains admin role even if removed from the env var list, because subsequent logins go to the `else` branch (existing user) which does NOT update the role.

EXPECTED BEHAVIOR:
Role should be re-evaluated on every login, or there should be an admin UI to manually change roles and the env var approach should be clearly documented.

EVIDENCE:
```ts
if (!existingUser) {
  // ← Role assigned from env var
  userRole = isAdmin ? "admin" : isStaff ? "ttlo_staff" : "client";
} else {
  // ← Existing user: role from DB, no re-evaluation from env
  user.role = existingUser.role || userRole;
}
```

IMPACT:
Removing a user from `ADMIN_EMAILS` does not revoke their admin access. Role management is fragile.

RECOMMENDED FIX:
Re-evaluate role on every login (apply env-based role if email matches, otherwise keep DB role). Or implement a proper admin UI for role management with this behavior clearly documented.

--------------------------------------------------

--------------------------------------------------
ISSUE #32
SEVERITY: MEDIUM

TITLE:
`ALLOWED_EMAIL_DOMAINS` Has a Hardcoded Default Fallback

CATEGORY:
Security / Configuration

LOCATION:
`src/auth.ts` — line 17

PROBLEM:
The allowed email domains default to `"dlsu.edu.ph,carsu.edu.ph"` when the environment variable is not set. This may not be the correct domain list for all deployment environments and creates a silent security misconfiguration risk.

EXPECTED BEHAVIOR:
If `ALLOWED_EMAIL_DOMAINS` is not set, the application should fail to start or log a clear warning, not silently default to specific institutional domains.

EVIDENCE:
```ts
const ALLOWED_DOMAINS = parseCommaSeparatedEnv(
  process.env.ALLOWED_EMAIL_DOMAINS ?? "dlsu.edu.ph,carsu.edu.ph" // ← Hardcoded default
);
```

IMPACT:
In a new deployment where `ALLOWED_EMAIL_DOMAINS` is not set, users from `dlsu.edu.ph` or `carsu.edu.ph` can still authenticate even if the deployment is meant to restrict access.

RECOMMENDED FIX:
Remove the hardcoded default and either throw if `ALLOWED_EMAIL_DOMAINS` is not set, or log a prominent warning.

--------------------------------------------------

--------------------------------------------------
ISSUE #33
SEVERITY: MEDIUM

TITLE:
`middleware.ts` — `/test-signin` Route Listed as Public Path

CATEGORY:
Security / Production Readiness

LOCATION:
`src/middleware.ts` — line 11

PROBLEM:
The `publicPaths` array includes `/test-signin` with the comment `// Our test page`. This page bypasses all authentication middleware. If this route still exists in production, it may expose testing functionality.

EXPECTED BEHAVIOR:
Test routes should be removed entirely before production deployment.

EVIDENCE:
```ts
const publicPaths = [
  "/",
  "/auth/signin",
  "/test-signin", // Our test page ← Should not exist in production
  ...
];
```

IMPACT:
Potential exposure of test authentication functionality. Publicly accessible test route.

RECOMMENDED FIX:
Remove `/test-signin` from public paths and delete the test sign-in page entirely.

--------------------------------------------------

--------------------------------------------------
ISSUE #34
SEVERITY: MEDIUM

TITLE:
`client-project-dashboard/trpc` — `updatePhase` Uses `edge` (Edge Runtime) Transaction Instead of `db`

CATEGORY:
Bug / Database

LOCATION:
`src/features/admin/client-project-dashboard/trpc/index.ts` — lines 84–128

PROBLEM:
The `updatePhase` mutation uses `edge.transaction()` while all other mutations in the same file use `db`. The `edge` client (`src/drizzle/edge.ts`) is intended for edge runtime environments (like Vercel Edge Functions) and uses a different connection strategy. TRPC routes run on Node.js, making this an inconsistent and potentially problematic choice.

EXPECTED BEHAVIOR:
Use `db.transaction()` consistently for all Node.js runtime operations.

IMPACT:
Potential connection pooling conflicts. Inconsistent transaction behavior between edge and Node runtimes.

RECOMMENDED FIX:
Replace `edge.transaction()` with `db.transaction()` in the `updatePhase` mutation.

--------------------------------------------------

--------------------------------------------------
ISSUE #35
SEVERITY: MEDIUM

TITLE:
`getEnrollments` Procedure — Filter Logic Bug for Combined `applicationId` + `userId` Filter

CATEGORY:
Bug

LOCATION:
`src/trpc/routers/ipApplicationEnrollment.ts` — lines 105–124

PROBLEM:
The query applies `applicationId` filter first and returns early (line 107–110). The `userId` filter block checks `if (input.userId)` then tries `if (input.applicationId)` inside (line 113) — but this inner condition can never be `true` because the outer `if (input.applicationId)` block already returned. The combined filter for both `applicationId` AND `userId` is unreachable dead code.

EXPECTED BEHAVIOR:
Should build filters incrementally and apply them together in a single query.

EVIDENCE:
```ts
if (input.applicationId) {
  return query.where(eq(...applicationId...)); // ← Returns here
}
if (input.userId) {
  if (input.applicationId) { // ← DEAD CODE: never reached
    return query.where(and(...)); // ← This block never executes
  }
  return query.where(eq(...userId...));
}
```

IMPACT:
Combined filtering by both `applicationId` and `userId` silently only filters by `applicationId`, ignoring the `userId` constraint.

RECOMMENDED FIX:
Refactor to build a filters array and apply `and(...filters)` in a single query.

--------------------------------------------------

--------------------------------------------------
ISSUE #36
SEVERITY: MEDIUM

TITLE:
`useFormSubmission.tsx` Mock File Incorrectly Exported — Both Exports Have Different Signatures

CATEGORY:
Bug / Code Quality

LOCATION:
`src/features/client/form-integration/hooks/useFormSubmission.tsx` — lines 3–15

PROBLEM:
The mock hook exports `useFormSubmission()` with no arguments, while the real hook in `.ts` exports `useFormSubmission(options = {})` with an optional options argument. If the `.tsx` file is resolved, calling `useFormSubmission({ applicationId, userId })` will fail or be ignored.

IMPACT:
If bundler resolves `.tsx` over `.ts`, forms fail silently or throw on load.

RECOMMENDED FIX:
Delete the `.tsx` file entirely.

--------------------------------------------------

--------------------------------------------------
ISSUE #37
SEVERITY: LOW

TITLE:
`SubstantialUsePdf.tsx` — 20+ `console.log` Statements Logging Form Data

CATEGORY:
Production Readiness / Security

LOCATION:
`src/app/(admin)/admin/forms-page/forms/SubstantialUsePdf.tsx` — lines 135, 279, 288, 302, 309–310, 440–449, 465, etc.

PROBLEM:
The PDF generation component contains extensive debug logging including raw form field values, laboratory facilities data, funding resources data, and API response bodies.

EXPECTED BEHAVIOR:
No debug logging in production. Sensitive form data should not appear in server logs.

IMPACT:
Sensitive IP application data (lab facilities, funding sources) written to server logs.

RECOMMENDED FIX:
Remove all `console.log` calls from this file.

--------------------------------------------------

--------------------------------------------------
ISSUE #38
SEVERITY: LOW

TITLE:
`event-dialog.tsx` — Save Button Outside `<form>` Element

CATEGORY:
UX / Code Quality

LOCATION:
`src/components/blocks/event-calendar/event-dialog.tsx` — line ~541

PROBLEM:
The dialog's Save button is positioned outside the `<form>` DOM node and submits via `onClick={() => form.handleSubmit(onSubmit)()}` instead of the standard `type="submit"` pattern. This prevents the native form submit event from firing, which may break browser validation, accessibility tools, and keyboard Enter-to-submit behavior.

EXPECTED BEHAVIOR:
Save button should be inside the form or use the `form="form-id"` HTML attribute.

IMPACT:
Non-standard form submission. Enter key may not submit form. Browser-native validation may not trigger.

RECOMMENDED FIX:
Move Save button inside the `<form>` element as `<Button type="submit">` or use the HTML `form` attribute.

--------------------------------------------------

--------------------------------------------------
ISSUE #39
SEVERITY: LOW

TITLE:
`calendar/trpc/index.ts` — `createUpdateEvent` Always Updates `createdBy` on Edit

CATEGORY:
Bug / Database

LOCATION:
`src/features/admin/calendar/trpc/index.ts` — lines 57–67

PROBLEM:
The `onConflictDoUpdate` block updates `createdBy: sql\`EXCLUDED.created_by\`` on upsert. This means editing an existing event changes its `createdBy` to the editing user, overwriting the original creator.

EXPECTED BEHAVIOR:
`createdBy` should only be set on initial creation and should not be overwritten on updates.

EVIDENCE:
```ts
.onConflictDoUpdate({
  target: calendarEvent.id,
  set: {
    createdBy: sql`EXCLUDED.created_by`, // ← Overwrites original creator on edit
  },
})
```

IMPACT:
Event creator information is lost when any user edits the event.

RECOMMENDED FIX:
Remove `createdBy` from the `onConflictDoUpdate` set block so it only applies to initial inserts.

--------------------------------------------------

--------------------------------------------------
ISSUE #40
SEVERITY: LOW

TITLE:
`DeedofAssignmentPdf.tsx` — Fallback to Empty Data on API Failure Produces Blank PDF

CATEGORY:
UX / Bug

LOCATION:
`src/app/(admin)/admin/forms-page/forms/DeedofAssignmentPdf.tsx` — lines 127–128

PROBLEM:
On API failure, the component falls back to using empty/null data and generates a blank PDF rather than showing an error state.

EVIDENCE:
```ts
} catch {
  console.log("API request failed, using fallback data");
  // Falls through with null data, generates empty PDF
}
```

IMPACT:
Admin downloads a blank PDF without knowing the data fetch failed.

RECOMMENDED FIX:
Show an error message and block PDF download if data is unavailable.

--------------------------------------------------

--------------------------------------------------
ISSUE #41
SEVERITY: LOW

TITLE:
`layout-detector.tsx` — Reload Loop Risk via `sessionStorage` Guard

CATEGORY:
Bug / Performance

LOCATION:
`src/components/global/layout-detector.tsx` — lines 35–41

PROBLEM:
The layout detector calls `window.location.reload()` to fix layout issues, guarded by a `sessionStorage` flag to prevent infinite loops. However, if the page keeps triggering the detector condition after the reload (e.g., due to a persistent layout issue), the flag prevents further reloads but the layout remains broken. Also, the reload approach destroys TRPC cache and React state unnecessarily.

EXPECTED BEHAVIOR:
Layout issues should be fixed programmatically without forcing full page reloads.

IMPACT:
Unpredictable UX — occasional unexpected page reloads for users. Lost form state and cache on reload.

RECOMMENDED FIX:
Investigate the root cause of the layout issue and fix it instead of using reload as a workaround.

--------------------------------------------------

--------------------------------------------------
ISSUE #42
SEVERITY: LOW

TITLE:
`getAllEnrollments` Procedure Accessible to Any Authenticated User — No Role Check

CATEGORY:
Security / Authorization

LOCATION:
`src/trpc/routers/ipApplicationEnrollment.ts` — lines 127–132

PROBLEM:
`getAllEnrollments` fetches all enrollments from all users in the system. It uses `protectedProcedure` (requires login) but has no role check. Any client user can call this and see enrollment data for all other users.

EXPECTED BEHAVIOR:
Viewing all enrollments should be restricted to admin/staff roles.

IMPACT:
Client users can see which other users are enrolled in which applications.

RECOMMENDED FIX:
Add role check: `if (ctx.session.user.role !== "admin" && ctx.session.user.role !== "ttlo_staff") throw new TRPCError({ code: "FORBIDDEN" })`.

--------------------------------------------------

--------------------------------------------------
ISSUE #43
SEVERITY: LOW

TITLE:
Dead Code — `updatePhase` Mutation Has Commented-Out Logic Block

CATEGORY:
Code Quality

LOCATION:
`src/features/admin/client-project-dashboard/trpc/index.ts` — lines 72–79

PROBLEM:
A large commented-out destructuring block exists inside `updatePhase` that references unused variable names (`applicationPhaseInput`, `phaseTasksInput`, etc.).

EVIDENCE:
```ts
// const {
//   applicationPhaseInput,
//   phaseTasksInput = [],
//   internalValidationInput,
//   externalCollaborationInput,
// } = input;
```

IMPACT:
Dead code adds confusion and makes the codebase harder to maintain.

RECOMMENDED FIX:
Remove the commented-out block.

--------------------------------------------------

---

## SUMMARY

### 1. TOTAL ISSUES FOUND
**43 confirmed issues**

### 2. CRITICAL ISSUES (5)
| # | Title |
|---|-------|
| 1 | Majority of TRPC Procedures Use `publicProcedure` — No Authentication |
| 2 | `getAvailableApplications` Loads Entire Table to Memory |
| 3 | All REST API Routes Bypass Middleware Auth Check |
| 4 | Archives Router — Create/Delete With No Auth |
| 5 | Settings Page — All Three Forms Are Completely Non-Functional Simulations |

### 3. HIGH PRIORITY ISSUES (12)
Issues #6–#17: Unimplemented document actions, simulated subtask completion, fake avatar upload, hardcoded dummy data in admin dashboard, duplicate hook files, infinite loading spinner, N+1 query patterns, missing transactions, TRPC double-invalidation delay, calendar event deletion auth bypass, extensive console.log with sensitive data, no pagination.

### 4. MEDIUM PRIORITY ISSUES (18)
Issues #18–#35: Various auth gaps, dead code, accessibility failures, window.location misuse, missing schema constraints, debug text in UI, memory leak in debounce hook, incorrect filter logic, etc.

### 5. LOW PRIORITY ISSUES (8)
Issues #36–#43: Minor bugs, code quality, dead code, blank PDF fallback, layout reload risk.

---

### 6. UNFINISHED FEATURES
1. Settings — Profile save (simulated)
2. Settings — Notifications save (simulated)  
3. Settings — Password change (simulated, also inapplicable since app uses Google OAuth)
4. Profile section — Avatar upload (TODO stub)
5. Document upload / validate / cancel validation (all return "Not Implemented")
6. Subtask completion (in-memory only, not persisted)
7. Admin dashboard — "Assign" button (no onClick handler)
8. Admin dashboard — Search input (no filter logic)

---

### 7. BROKEN OR INCOMPLETE BUTTONS
| Button | Location | Problem |
|--------|----------|---------|
| "Save Changes" (Profile) | Settings page | Simulates but does nothing |
| "Save Preferences" (Notifications) | Settings page | Simulates but does nothing |
| "Update Password" (Security) | Settings page | Simulates but does nothing |
| "Assign" (Available Projects) | Admin Dashboard recent-tasks | No onClick handler |
| "View All (3)" (Available Projects) | Admin Dashboard | No onClick handler |
| Upload Document | Client Project Dashboard | Returns "Not Implemented" error |
| Validate Document | Client Project Dashboard | Returns "Not Implemented" error |
| Cancel Validation | Client Project Dashboard | Returns "Not Implemented" error |

---

### 8. BROKEN USER WORKFLOWS
1. **Admin saves profile settings** → Appears to save but nothing persists in DB
2. **Admin uploads document to project** → Error "Not implemented in production"
3. **Admin validates a document** → Error "Not implemented in production"
4. **Admin marks subtask complete** → Appears to save, lost on page reload
5. **Client creates IP application** → Missing transaction; partial data on failure
6. **Client submits IP disclosure** → Missing transaction; partial data on failure
7. **Admin views documents for project** → Infinite spinner on any query failure

---

### 9. SECURITY CONCERNS
1. **Authentication bypass (CRITICAL)** — ~40 TRPC procedures require zero authentication
2. **Authorization bypass** — `enroll` allows enrolling arbitrary users
3. **Authorization bypass** — `deleteEvent` allows deleting others' events
4. **Authorization gap** — `getAllEnrollments` accessible to any client user
5. **Sensitive data in logs** — cookies, tokens, user IDs logged in middleware
6. **Role staleness** — Removing email from admin list does not revoke DB role
7. **Hardcoded default domains** — Silent misconfiguration risk
8. **Test route in production** — `/test-signin` still in public paths

---

### 10. TOP 10 RECOMMENDED FIXES IN PRIORITY ORDER

| Priority | Fix |
|----------|-----|
| 1 | Replace ALL `publicProcedure` with `protectedProcedure` for every data-touching TRPC procedure |
| 2 | Fix `getAvailableApplications` to use SQL-level filtering and pagination |
| 3 | Delete `useFormSubmission.tsx` mock file to eliminate bundler resolution ambiguity |
| 4 | Remove all `console.log` statements from middleware, TRPC context, and PDF generators |
| 5 | Add `db.transaction()` wrappers to `createApplication` and `createIpDisclosure` |
| 6 | Implement real Settings profile save endpoint connected to database |
| 7 | Implement real document upload/validation actions in `useDocumentActions` |
| 8 | Fix the 2-second TRPC mutation delay — remove the double invalidation pattern in `client.tsx` |
| 9 | Replace all `window.location.href` navigation with `router.push()` |
| 10 | Remove debug text from `proj-inventory/page.tsx` wrapper components |
