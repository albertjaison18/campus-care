# Verification results

Verified on 23 October 2026. Local checks and subsequent hosted acceptance checks are recorded separately below.

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

Actual institutional access, email delivery, load/performance benchmarks, an independent accessibility audit, or long-term availability. Docker configuration is supplied but has not been built in this environment.

Run npm test and npm run build after future functional changes. Repeat the full student/admin journey on the live URL before submission.


## Development launcher restart verification

The final launcher passed two controlled startup/shutdown cycles. Each cycle returned health 200, authenticated the local administrator, retained all 9 demonstration reports, exited with code 0, and left the MongoDB lock file empty. Backend edits require restarting the API; the React development server still refreshes automatically.

## Hosted acceptance: 23 October 2026

URL: https://campus-care-h82p.onrender.com

The public GitHub source was deployed as a Node 22 web service on Render Free in Singapore, connected to MongoDB Atlas Free. The app database user has readWrite only on campus_care. Render's two outbound ranges are allowed; this computer's setup rule expires after six hours. No credentials are included in these artifacts.

- Health endpoint returned 200; an anonymous report-list request returned 401.
- Registered a fictional Demo Student through the live browser form.
- Submitted an explicitly fictional library-light report and added a comment.
- Refreshed the browser: the authenticated session and saved report persisted.
- Signed out and signed in as the production app administrator.
- Assigned Facilities team and changed Open to In progress to Resolved; all five activity entries were visible in the DOM.
- Dashboard changed to one resolved/closed report out of one total.
- Resolved filter returned that record; a non-matching search showed the empty state; clearing filters restored it.
- Checked desktop at 1440 x 1000 and mobile at 390 x 844. Mobile document client width and scroll width both measured 375 CSS pixels, with no document-wide horizontal overflow.
- Saved the major UI screenshots from the hosted application, then signed out and reset the temporary viewport override.
- Live API admin login and profile requests returned 200; role was admin; session cookie had Secure, HttpOnly and SameSite=Lax; logout returned 204.
- The captured browser error-log query returned no entries at the end of the journey.

The first deployment started before the network rules were active and failed its initial database connection. A second deployment with completed access rules and the exact HTTPS origin became live and passed the checks above. The generated bootstrap admin credential was reset with explicit user approval after a local storage error, then the replacement was saved outside Git and successfully tested.

These checks establish the tested live workflow, not institutional adoption, sustained uptime, performance under concurrent use, or a security certification. Free Render instances can sleep after inactivity. Local integration tests additionally cover isolation, validation, pagination, edit/delete rules and invalid transitions; those cases were not all repeated against the hosted database.
