# CanTheySeeIt? — Soft Light Theme

A presentation-only style update of the **Sector Wizard Edition**. The application and testing logic are unchanged.

## What changed
- Entire workspace uses a low-glare, light background; dark sidebar and hero removed.
- Gentle blue-grey accent, warm white surfaces, softer neutral borders and less visual noise.
- Windows-native Segoe UI Variable / Segoe UI typography (no downloadable fonts).
- More comfortable heading weights, improved labels, and calmer selection, hover and focus states.
- PASS/FAIL/INCONCLUSIVE retain green/red/amber indicators for accessibility.
- Works with original restaurant, grocery/stationery, clinic and student-event wizard, ZIP flow, and advanced results/history.

## Run (Windows)
From this folder:

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:4100/ . For supported demos use `npm.cmd run lab:start` (grocery) or `npm.cmd run hospital:start` (fictional clinic).

## Files changed
- `dashboard/soft-light.css` (new, purely visual theme override)
- `dashboard/index.html` (adds stylesheet and light browser chrome)

All backend files, routes, verifiers, adapters, security tests and stored verdict logic remain untouched.
