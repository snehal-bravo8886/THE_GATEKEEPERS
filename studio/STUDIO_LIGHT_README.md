# CanTheySeeIt? — Studio Light Edition

This release is a **presentation-only redesign** of the previous Soft Light / Sector Wizard Edition. It keeps all existing security testing logic and the same backend endpoints, approved ZIP flow, website-link planning, restaurant/retail/clinic/campus selections, hospital/grocery synthetic labs, saved findings and advanced pages.

## Visual approach

- **Softer, more human typography:** Lora for calm, editorial headings and DM Sans for straightforward interface copy. The browser fetches them from Google Fonts when available. If offline, headings fall back to Georgia and interface text to Trebuchet MS / Segoe UI. **No font files are included.**
- Warm paper background, neutral white panels, sage/moss accents, quieter feedback colors.
- Simplified welcome area: no illustration, rings, floating cards, chip badges or marketing-style decoration.
- Minimal numbered steps, plain category choices, consistent button sizes, readable controls.
- PASS/FAIL/INCONCLUSIVE still retain distinct green/red/amber meanings.

## Windows run

Open this extracted folder in VS Code. In PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:4100/`.

Optional local training environments, in a **separate terminal**:

```powershell
npm.cmd run lab:start
```

or

```powershell
npm.cmd run hospital:start
```

If the local lab port is in use, close the older terminal. Do not start two copies of the same lab. The grocery lab uses `127.0.0.1:4200`; the hospital lab uses `127.0.0.1:4300`.

## Validation

- `npm.cmd run dashboard:check`
- `npm.cmd run test:frontend`

Visual checks were performed on desktop (1440 px) and mobile (390 px) using a static API stub for category data. This is **not** an end-to-end backend verification run. A complete integrated browser check should be performed on the target Windows machine with actual npm dependencies and both services started.

## Changed files

- `dashboard/index.html`: simpler introductory copy and styling link; existing form IDs and functionality preserved.
- `dashboard/studio-light.css`: new **last-loaded** presentation layer, leaving original styles intact.
- `tests/frontend/studio-light-theme.test.mjs`: regression checks for the presentation contract.

No verifier, adapter, fixture, security result, or authentication code was modified.
