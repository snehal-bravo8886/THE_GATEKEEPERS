# CanTheySeeIt? — Test 1

A beginner-friendly permission-management prototype with scenario-specific access presets, a dashboard activity timeline and incident-triggered risk indicator.

## First-time flow
1. Choose **Business** or **Organisation**.
2. Choose a real-world scenario. The app loads matching role permissions and example ALLOW/DENY cases.
3. Add the project as a **Website link** or **Source code**. The project name is generated automatically.
4. Select a user category and edit its permissions.
5. Review the dashboard activity timeline and incident-triggered risk indicator.

## Scenario library

### Business
- **Medical clinic:** patient profiles, appointments, prescriptions, clinical notes and clinic administration.
- **Restaurant:** menus, customer orders, order status, refunds and payout settings.
- **Small business:** customer invoices, inventory, orders, staff access and business finances.
- **College event:** attendee tickets, check-in, registration lists, event settings and refunds.

### Organisation
- **Marks & grades:** personal results, marks cards, re-evaluation requests and assigned gradebooks.
- **Attendance management:** personal attendance, correction requests and class registers.
- **Library management:** book catalogue, member loans, renewals and librarian operations.

Every scenario card previews example access cases marked **ALLOW** or **DENY**. Selecting a scenario loads its editable permission list for the matching roles.

## Incident-triggered risk indicator
Normal role permissions and ordinary permission changes do **not** add risk. A teacher, employee or owner using the permissions required for their expected duties keeps the dashboard risk indicator at **0%**.

Risk is calculated only from timeline events explicitly recorded as security incidents with a non-zero impact value. Incident impacts are combined cumulatively. The dashboard places the risk panel directly beside the activity timeline; risk is not displayed on the permission-editing screen.

The **Simulate unexpected access** button creates a clearly labelled sample incident in the timeline and demonstrates how the dashboard risk score changes. It is a simulation, not a real request or a live breach detection. Actual incident values must be supplied by verified backend/security-monitoring events. This indicator is an incident-impact score, not a calibrated probability of breach.

## Activity timeline
The dashboard timeline records workspace creation, permission grants/removals, custom permission changes and clearly labelled sample security events. It can be filtered to all activity, changes or alerts. Clearing the timeline also clears the incident history used by the risk indicator.

## Source-code import
Supported inputs include ZIP archives, project folders and common source/config files such as TS/TSX, JS/JSX, HTML, CSS, JSON, Python, Java, SQL, YAML, Markdown and plain-text code snippets. The importer skips common generated/dependency folders such as `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage` and `vendor`. It currently imports up to 250 supported files, with per-file and total size limits.

Source files are saved locally in the browser's IndexedDB for each project workspace. They are sent to the local scan backend only after the owner explicitly starts a source-code review. The scanner reads files as text and never executes them.

## Run locally
Requires Node.js 18 or newer.

```bash
npm install
npm test
npm run dev
```

Open the Vite URL (normally http://127.0.0.1:5173). The dev command starts both the React frontend and the local API scan engine. Keep the terminal open while using the app. The local API is available at http://127.0.0.1:8787/api/health.

## Run a real first-pass scan

1. Add a website URL or import your source-code ZIP/folder.
2. Configure the roles and permissions for the project.
3. Open the Dashboard.
4. In **Run a security check**, confirm that you own the project or have permission to assess it.
5. Choose **Check website now** or **Analyse source code now**.
6. Review the measured checks, findings, evidence locations and suggested fixes.

### What the backend checks
- **Website URL:** makes a bounded homepage check (including limited redirects) and reviews the HTTP status, HTTPS, CSP, HSTS, clickjacking protection, MIME-sniffing protection, Referrer-Policy, Permissions-Policy, observed cookie flags and technology-banner disclosure. It does not crawl pages, log in, submit forms or test protected endpoints.
- **Source code:** reads imported files as text and looks for heuristic patterns related to IDOR-style record routes, missing role guards on sensitive write routes, client-controlled checkout prices and possible SQL string construction. These are review hints, not confirmed vulnerabilities.
- **Permission matrix:** checks enabled non-owner grants for descriptions suggesting broad access to other users' records or sensitive business settings.

Results are returned to the dashboard for the current session; the backend does not store uploaded source files or scan history. The local development server binds to 127.0.0.1. Local/private website targets are enabled only by the bundled development launcher for local demos. Do not expose this unauthenticated development scanner to the public internet.

### Current limitations
This is a first-pass MVP. A website scan checks only the supplied homepage response; it does not dynamically test role-specific API behaviour. Static source findings are rule-based and may produce false positives or miss vulnerabilities. To verify real customer/employee/owner permissions end-to-end, the next integration needs test accounts and explicit API endpoint mappings for each role. A clean result is not proof that the application is secure.

## Multiple workspaces
Use the **Model** tab to start a new Business or Organisation project, select its scenario, then use the **Project** tab to add a website link or source code. Each workspace keeps its own selected scenario, editable role permissions, event timeline and incident-triggered risk indicator.

## Important scope and safety notes
The ALLOW/DENY examples are scenario templates, not results from a live role-by-role API test. Website and source-code scans are now available through the local backend, but their coverage is limited to the checks described above. Real role-by-role API verification requires test accounts and explicit endpoint mappings. Real breach detection requires verified backend or monitoring events.
