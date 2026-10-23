# Campus Care

A campus issue tracker built with **MongoDB, Express, React, and Node.js**.

**Student:** Albert Jaison  
**Institution:** Sahrdaya College of Engineering and Technology  
**Course context:** ICT Academy of Kerala full stack development project

Students report campus issues and see only their own reports. Administrators review all reports, assign a campus team, adjust priority, and record progress.

## Run locally

Prerequisite: Node.js 22.12 or later and npm. The first launch downloads a MongoDB binary and needs internet access. Local data stays in the ignored .local-data folder.

~~~powershell
npm ci
npm run dev
~~~

Open **http://127.0.0.1:5173**. The API runs on port 5000. Vite forwards /api requests to it.

Create your own student account through **Create an account**. Passwords must have 12–72 characters and use at most 72 UTF-8 bytes.

For a local demonstration with fictional reports, open **.local-data/credentials.json**. Use its adminEmail or studentEmail and its generated password to sign in. **This ignored file also contains a local session secret; never upload or share it.** No demo password is committed to source control.

Use Ctrl+C to stop the application. React refreshes automatically during frontend edits. Restart npm run dev after changing backend files.

## Main features

- Student registration, login, logout, and an eight-hour HTTP-only cookie session.
- Create, view, edit, and delete reports; editing and deleting require Open status.
- Category, location, priority, assigned team, and a timestamped activity history.
- Comments from the report owner and administrators.
- Server-enforced ownership and administrator permissions.
- Administrator workflow: Open → In progress → Resolved → Closed.
- Exceptions: Open → Closed; In progress → Open; Resolved → In progress; Closed → Open.
- Literal text search, filters, sorting, and server-side pagination.
- Dashboard totals, resolution/closure percentage, and category counts.
- Responsive layouts, labelled inputs, keyboard focus, and modal focus trapping.
- Server validation, safe errors, rate limits, origin checks, and password hashing.

The percentage combines **Resolved and Closed** reports. Closed reports can include duplicates; the percentage is not a measure of satisfaction or verified repairs.

## Project structure

~~~text
client/src/          React UI, shared types, API client, styles
server/src/          Express API and Mongoose schemas
server/scripts/      Local MongoDB startup and account setup
server/test/         MongoDB-backed API integration tests
docs/                SRS, report, screenshots, and supporting notes
~~~

## Commands

| Command | Purpose |
| --- | --- |
| npm run dev | Start React, API, and a persistent local MongoDB |
| npm run check | Check frontend TypeScript |
| npm test | Run integration tests in an isolated MongoDB |
| npm run build | Compile the React production bundle |
| npm start | Start the production API and compiled frontend |
| npm run create-admin -w server | Create an administrator using environment variables |

## Use an existing MongoDB

Copy server/.env.example to server/.env and set MONGODB_URI, a random JWT_SECRET of at least 32 characters, and CLIENT_ORIGIN. With MONGODB_URI set, development connects to that database and does **not** seed demonstration accounts or reports.

Only the development launcher starts a local MongoDB automatically. Production requires an external MongoDB service.

## Production deployment

Express serves both the API and client/dist, so the frontend and API share an origin.

1. Push this repository to a public GitHub repository after checking ignored files.
2. Provision MongoDB Atlas, create a database user limited to the app database, and allow the host's outbound addresses in the Atlas access list.
3. Create a Node web service on Render, connect the repository, and select a service plan deliberately.
4. Build command: **npm ci --include=dev && npm run build && npm prune --omit=dev**
5. Start command: **npm start**
6. Set NODE_ENV=production, MONGODB_URI, JWT_SECRET (32+ random characters), and CLIENT_ORIGIN (the exact HTTPS app origin). The host supplies PORT.
7. In a trusted environment, set ADMIN_EMAIL and ADMIN_PASSWORD and run **npm run create-admin -w server**. Remove ADMIN_PASSWORD from hosting configuration afterward.
8. Verify registration, login, reporting, comments, admin updates, and logout on the live URL.

Official references: [Render Express guide](https://render.com/docs/deploy-node-express-app) and [Atlas IP access](https://www.mongodb.com/docs/atlas/security/ip-access-list/). The submitted application runs on a Render Free web service with MongoDB Atlas Free. No paid resource was provisioned. Free instances sleep after inactivity, so the first request may take around a minute.

## Verification and documentation

- docs/TEST_RESULTS.md records checks actually performed.
- docs/API.md describes endpoints and access rules.
- docs/SUBMISSION_CHECKLIST.md tracks publication and submission.
- docs/LEARNING_GUIDE.md explains the implementation.
- docs/Campus_Care_SRS.docx contains the software requirements.
- docs/Campus_Care_Internship_Report.docx follows the supplied report template.

**Repository:** https://github.com/albertjaison18/campus-care.

**Live application:** https://campus-care-h82p.onrender.com

**Deployment status:** deployed over HTTPS on Render Free with MongoDB Atlas. The live registration, reporting, comments, assignment and resolution journey passed on 23 October 2026. Screenshots show fictional demonstration data from the hosted application. Create a student account to explore it. Administrator credentials are kept outside the repository.

## Known limits

No email verification, password reset, image upload, email notifications, institutional SSO, or real-time push updates. Assignments use fixed teams rather than staff accounts. Registration is not restricted to a verified college domain. Activity has a 200-entry application limit. Logout clears the cookie; issued tokens expire after eight hours rather than being revoked server-side. Local demo MongoDB binds only to loopback and is not a production deployment.

## Submission

Planning target: **6 November 2026**. Confirm the actual deadline with the institution. Submission requires the SRS, final report, public GitHub URL, hosted URL, and screenshots. Complete publication checks before submitting.
