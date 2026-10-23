# Local verification results

Verified on 23 October 2026. These are local checks, not evidence of a live cloud deployment.

## Automated checks

- Production build: passed (Vite 7.3.7 and TypeScript).
- MongoDB API integration suite: **14 tests passed, 0 failed**.
- Installation audit at initial setup: 0 reported vulnerabilities. This is not a security certification.

| Test | Observed result |
| --- | --- |
| Protected requests | Anonymous list/stat requests return 401 |
| Registration | Forged admin role rejected; duplicate email returns 409 |
| Password storage | bcrypt hash stored; hash absent from public profile |
| Login | Bad and unknown credentials rejected; HTTP-only session cookie set |
| Input safety | Invalid report, forged fields and over-limit Unicode password rejected |
| Persistence | Created issue retrieved directly from MongoDB with owner/history |
| Student isolation | Other student cannot read/edit/delete/comment/count the issue |
| Owner updates | Open edit and comment persist correctly |
| Admin authorization | Student management request returns 403 |
| Status workflow | Invalid jump rejected; assignment/progress/resolution/closure succeed |
| Queries | Search, filters, counts and pagination consistent; invalid limits rejected |
| Delete rules | Open report deletes; missing/invalid IDs return safe 404 |
| Origin/logout | Untrusted browser origin rejected; cleared session loses access |
| Production configuration | Secure cookie emitted; health, compiled UI and SPA fallback work |

Tests use an isolated real MongoDB instance. Test account passwords are generated during the run.

## Browser acceptance

At http://127.0.0.1:5173:
- Registered a fictional student through the form.
- Created a report and observed it in both the list and detail dialog.
- Added a comment and observed the activity count increase.
- Logged out and signed in as the local demonstration administrator.
- Assigned the student's report to Facilities team.
- Changed Open to In progress, then Resolved, and observed actor/time history.
- Navigated to the next server-backed list page (records 9–9 of 9).
- Searched for a non-match and observed the empty state, then cleared it.
- Filtered Resolved and observed three matching reports.
- Checked desktop layout at 1440 x 1000.
- Checked mobile layout at 390 x 844: document client width and scroll width were both 375 CSS pixels (the vertical scrollbar accounts for the difference from the requested viewport).
- Confirmed compact navigation exposes accessible names.
- Captured login, overview, report form, detail and mobile screenshots.
- The captured browser warning/error log query returned no entries at the end of these checks.

## Corrections made during verification

Resolved an orphaned local MongoDB process, repaired text encoding in fictional seed locations, added mobile navigation labels, preserved the local session secret between restarts, and improved text readability. API deletion also checks the current status/version to avoid deleting a report changed concurrently.

## Not yet verified

Public GitHub publication, external production MongoDB, live HTTPS deployment, actual institutional access, email delivery, load/performance benchmarks, independent accessibility audit, or the live acceptance journey. Docker configuration is supplied but has not been built in this environment.

Run npm test and npm run build after future functional changes. Repeat the full student/admin journey on the live URL before submission.


## Development launcher restart verification

The final launcher passed two controlled startup/shutdown cycles. Each cycle returned health 200, authenticated the local administrator, retained all 9 demonstration reports, exited with code 0, and left the MongoDB lock file empty. Backend edits require restarting the API; the React development server still refreshes automatically.

