# Campus Care API

Base path: /api. JSON requests and responses. Authentication uses an HTTP-only campus_session cookie.

| Method and endpoint | Access | Result |
| --- | --- | --- |
| GET /health | Public | Database readiness; 200 or 503 |
| POST /auth/register | Public | Create student account; 201 |
| POST /auth/login | Public | Set session cookie; 200 |
| POST /auth/logout | Public | Clear session cookie; 204 |
| GET /auth/me | Signed in | Public user profile |
| GET /meta | Signed in | Allowed categories, statuses, priorities, teams |
| GET /issues | Signed in | Own reports, or all for admins |
| GET /issues/stats | Signed in | Scoped totals and category counts |
| POST /issues | Signed in | Create owned Open report; 201 |
| GET /issues/:id | Owner or admin | Report with activity history |
| PATCH /issues/:id | Owner or admin | Edit details while Open |
| DELETE /issues/:id | Owner or admin | Delete while Open; 204 |
| POST /issues/:id/comments | Owner or admin | Add comment; 201 |
| PATCH /issues/:id/manage | Admin | Update status, team, priority |

Registration requires name (2–80 characters), email, and password (12–72 characters and at most 72 UTF-8 bytes). A submitted role is rejected.

Report creation requires title (5–120), description (15–3000), location (2–120), category, and priority. Owner, status, assignee and history are supplied by the server. Editing accepts a non-empty subset of creation fields. Comments require message (1–1000 characters). Admin updates require status, assignee and priority.

List query: page (1+), limit (1–50, default 8), search (up to 100 characters), optional status/category/priority, sort (newest, oldest, updated).

List response: items, total, page, pages. Single-report response: issue. Error response: message and optional fields.

## Status transitions

Open → In progress or Closed  
In progress → Open or Resolved  
Resolved → In progress or Closed  
Closed → Open

Same-status updates can change assignment or priority.

## Error statuses

400 invalid input; 401 unauthenticated; 403 wrong role/origin; 404 missing or inaccessible report; 409 duplicate account, concurrent edit, invalid transition, or non-open edit/delete; 429 rate limit; 500 generic unexpected error.

Permissions are read from the database on each request. Student ownership restrictions also apply to counts and category statistics.

