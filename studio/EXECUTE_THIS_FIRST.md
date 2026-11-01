# CanTheySeeIt? — Launch your current ZIP

## What is currently working

- **Four selectable sectors:** Restaurants, Grocery/Stationery, Clinics, College/Institution Events.
- **Sector-specific test PLAN generation:** all four sectors. This is not a live security scan.
- **Live authorization verification:** approved synthetic local Grocery and Clinic demo apps only.
- **ZIP upload:** accepts only the supplied approved Sprout & Stone sample ZIP (it does not run arbitrary uploads).
- **Important:** the four-sector wizard currently starts from **website-link mode**, while the accepted **ZIP upload mode is grocery-specific**. Combining sector selection + arbitrary ZIP + live tests requires more implementation.

## Mac / Linux

In Terminal, `cd` into this folder (the one with `package.json`) and run:

```bash
bash START_CANTHEYSEEIT_MAC_LINUX.sh --both
```

The launcher installs npm dependencies if absent (internet required), starts the dashboard + both local sample apps, and opens http://127.0.0.1:4100/.

To check the code without npm dependencies:

```bash
bash START_CANTHEYSEEIT_MAC_LINUX.sh --check
```

To start only one sample app alongside the dashboard, pass `--grocery` or `--clinic`. Use Ctrl+C to stop.

## Windows PowerShell

Open the folder in VS Code and launch the 3 terminals:

**Terminal A:**

```powershell
npm.cmd run lab:start
```

**Terminal B:**

```powershell
npm.cmd run hospital:start
```

**Terminal C:**

```powershell
npm.cmd install
npm.cmd run dev
```

Then open http://127.0.0.1:4100/.

Alternative: double-click `START_GROCERY_LAB_WINDOWS.cmd`, `START_HOSPITAL_LAB_WINDOWS.cmd`, and `START_SECURITY_DASHBOARD_WINDOWS.cmd`.

## Try two live flows

1. **Grocery:** use **Upload website ZIP** and **Use the sample grocery shop** (or upload `demo-upload/SproutStone_Approved_Website.zip`). Select predefined rules, approve synthetic writes if asked, and run. Grocery lab: http://127.0.0.1:4200/.
2. **Clinic:** choose website link, select **Clinics & patient management**, use **Try the clinic example**, review the plan, and select the available local checks. Clinic lab: http://127.0.0.1:4300/.
3. **Restaurants / College Events:** choose these sectors and get a test **plan**; they cannot yet run live against arbitrary uploaded ZIP files.

## Status checks

```bash
node --check dashboard/app.js
npm run test:frontend
npm run test:multisite
npm run typecheck
npm test
```

In the sandbox, the standalone dependency-free tests passed: 38/38. Both grocery/clinic HTTP labs started and their live tests passed; full dashboard startup was not verified because npm package installation was blocked by registry connectivity.

Do not run the intentionally vulnerable demos on public network interfaces or real user data.
