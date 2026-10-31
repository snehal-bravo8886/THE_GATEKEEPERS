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

Source files are saved locally in the browser's IndexedDB for each project workspace. They are not transmitted to a server by this prototype.

## Run locally
Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173).

## Multiple workspaces
Use the **Model** tab to start a new Business or Organisation project, select its scenario, then use the **Project** tab to add a website link or source code. Each workspace keeps its own selected scenario, editable role permissions, event timeline and incident-triggered risk indicator.

## Important scope and safety notes
The ALLOW/DENY examples are scenario templates, not results from a live test. Adding a URL only registers the target; it does not crawl the site or send security requests. Uploading source code only stores the files locally in this browser. Neither action performs a security scan yet. Actual static-code analysis or live website verification requires a connected backend, suitable test fixtures/credentials, and explicit authorisation to assess the target. Real breach detection requires verified backend or monitoring events.
