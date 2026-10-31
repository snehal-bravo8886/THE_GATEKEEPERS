# CanTheySeeIt? — Test 1

A beginner-friendly permission-management prototype with scenario-specific access presets, a contextual permission-risk estimate and an activity timeline.

## First-time flow
1. Choose **Business** or **Organisation**.
2. Choose a real-world scenario. The app loads matching role permissions and example ALLOW/DENY cases.
3. Add the project as a **Website link** or **Source code**. The project name is generated automatically.
4. Select a user category and edit its permissions.
5. Review the dashboard's permission exposure estimate and activity timeline.

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

## Risk estimate
The dashboard uses a weighted cumulative access-exposure index instead of a simple average. Each enabled permission starts with a severity weight (Low 4, Medium 13, High 29, Critical 46). The index increases for permissions involving access to other people's records, sensitive information, or powerful actions such as changing records and managing access. The dashboard also shows counts for high-impact, broad-access and sensitive-data permissions.

This is a configuration heuristic, **not** a calibrated probability of breach and **not** a live security scan. The actual security outcome must be verified by the backend.

## Activity timeline
The dashboard timeline records workspace creation, permission grants/removals, custom permission changes and clearly labelled sample alerts. It can be filtered to all activity, changes or alerts. Sample alerts are demonstrations only, not live detections.

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
Use the **Model** tab to start a new Business or Organisation project, select its scenario, then use the **Project** tab to add a website link or source code. Each workspace keeps its own selected scenario, editable role permissions, risk estimate and activity timeline.

## Important scope and safety notes
The ALLOW/DENY examples are scenario templates, not results from a live test. Adding a URL only registers the target; it does not crawl the site or send security requests. Uploading source code only stores the files locally in this browser. Neither action performs a security scan yet. Actual static-code analysis or live website verification requires a connected backend, suitable test fixtures/credentials, and explicit authorisation to assess the target. Real breach detection requires verified backend or monitoring events.
