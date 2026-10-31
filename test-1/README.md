# CanTheySeeIt? — Test 1

Beginner-friendly permission management prototype for:
- **Business:** Customer, Employee, Owner
- **Organisation:** Student, Teacher

## Run locally
Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173).

## Included
- Plain-language permission presets for each role
- Grant/revoke permissions and add/remove custom permissions
- Dashboard with permission counts and a configuration-based risk estimate
- Activity timeline for permission changes and clearly labelled sample alerts
- Browser local-storage persistence

## Scope
This is a frontend prototype. Changes are stored in the current browser only and are not yet connected to the verification backend. Risk is a heuristic, not a calibrated score. Real breach detection requires verified backend or monitoring events. The sample alert is not a real breach.
