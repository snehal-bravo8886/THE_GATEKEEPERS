# CanTheySeeIt? — Test 1

Beginner-friendly permission management prototype with separate workspaces for multiple websites.

## First-time flow
1. Choose a model: **Business** or **Organisation**.
2. Add the website you own or are explicitly authorised to assess. You can drag its link from the browser address bar into the drop area, or paste/type its URL.
3. Choose a category and manage its permissions.
4. Review that website's permission summary, estimated risk and activity timeline.

## Models and roles
- **Business:** Customer, Employee, Owner
- **Organisation:** Student, Teacher

## Run locally
Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173).

## Multiple website workspaces
- Use the **Model** tab to start a new Business or Organisation workspace.
- Use the **Website** tab to add another website under the selected model.
- Each saved website keeps its own permission configuration, risk estimate and activity timeline.
- Use the workspace list to switch between previously added sites.

## Included
- Plain-language permission presets for each role
- Grant/revoke permissions and add/remove custom permissions
- Drag-and-drop website-link input plus paste/type fallback
- Separate local workspaces for multiple website targets
- Dashboard with permission counts and a configuration-based risk estimate
- Activity timeline for permission changes and clearly labelled sample alerts
- Browser local-storage persistence

## Important scope and safety notes
Dragging or entering a URL only creates a workspace for the website. This frontend does **not** crawl the site, send security test requests, discover routes, or inspect its database. Actual live website verification requires a connected backend, suitable test fixtures/credentials, and explicit authorisation to assess the target. Risk is a heuristic based on configured permissions, not a calibrated score. Real breach detection requires verified backend or monitoring events. The sample alert is not a real breach.
