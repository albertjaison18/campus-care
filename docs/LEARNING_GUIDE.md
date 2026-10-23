# Explaining Campus Care

Campus Care lets students report campus issues and follow their resolution. Students see their own reports; an administrator sees all reports and assigns campus teams.

## Trace one request

1. The student fills in client/src/ReportForm.tsx.
2. client/src/api.ts sends JSON to POST /api/issues with the session cookie.
3. Express parses JSON. Authentication verifies the JWT and loads the user from MongoDB.
4. Zod validates input. The server supplies the owner, Open status, and history event.
5. Mongoose saves the report in MongoDB.
6. Express returns status 201 and the saved record.
7. React opens the detail dialog and refreshes the list and statistics.

## Concepts

- Authentication verifies who signed in; authorization checks what they may do.
- CRUD means create, read, update, delete.
- Mongoose schemas define fields, constraints, defaults, and indexes.
- HTTP-only cookies cannot be read directly by frontend JavaScript.
- Environment variables configure secrets without committing them.
- VITE_ frontend variables are visible to browser users.
- Pagination limits the records returned in a request.
- Optimistic concurrency prevents silent overwriting of conflicting edits.
- Integration tests call the API and check real database behavior.

## Demonstration

Create a student account, report an issue, edit it while Open, and add a comment. Sign in as the local demo administrator, assign the issue, move it to In progress, then Resolved. Return to the student view to show the status history. Explain why another student receives 404 for the report.

Seed reports are fictional. Do not describe them as real incidents or measured institutional improvements.

Read the SRS, run the application yourself, follow a request in DevTools, inspect the models, run npm test, and practise explaining failures and limitations. Follow your course's rules for disclosing coding assistance.

