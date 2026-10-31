# CanTheySeeIt? — Test 1

Beginner-friendly permission management prototype for multiple website workspaces.

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

## Website workspaces
1. Open the **Websites** tab.
2. Enter a friendly name and the website URL (for example, `https://your-site.com` or `http://localhost:3000`).
3. Confirm that you own the website or have permission to assess it.
4. Add the site. You can add more websites and switch between them later.

Each saved website has its own permission configuration, risk estimate and activity timeline. This version uses a fresh local-storage key and does not import data from older prototypes.

## Included
- Plain-language permission presets for each role
- Grant/revoke permissions and add/remove custom permissions
- Separate workspaces for multiple website targets
- Dashboard with permission counts and a configuration-based risk estimate
- Activity timeline for permission changes and clearly labelled sample alerts
- Browser local-storage persistence
- Quick link to open the selected website in another tab

## Important scope and safety notes
This is a frontend permission-configuration prototype. Adding a URL only creates a workspace and labels the site being reviewed; it does **not** crawl the site, send security test requests, discover its routes, or inspect its database. Actual live-site verification requires a connected backend, appropriate test fixtures/credentials, and explicit authorisation to test that website. Risk is a heuristic, not a calibrated score. Real breach detection requires verified backend or monitoring events. The sample alert is not a real breach.
