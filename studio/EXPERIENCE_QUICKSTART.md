# CanTheySeeIt? — Experience Edition quickstart

**This is a local, intentionally vulnerable training application. Do not deploy it publicly.**

1. Install Node.js 22 or a compatible supported LTS and extract the ZIP.
2. Open the extracted folder containing `package.json` in VS Code.
3. Terminal A: `npm.cmd run lab:start` (grocery site at `http://127.0.0.1:4200`).
4. Terminal B: `npm.cmd install`, then `npm.cmd run dev` (CanTheySeeIt? at `http://127.0.0.1:4100`).
5. Click **Use the sample grocery shop** (or upload `demo-upload/SproutStone_Approved_Website.zip`).
6. Confirm plain-English rules; optionally paste the original AI prompt and ask for suggestions.
7. Approve **safe changes to test accounts** if any editing/admin rule is selected.
8. Click **Check my website**. Read findings on the same page, expand technical evidence or download your simple report.

**Expected vulnerable local lab:** tested address/inventory controls should PASS; the shop's cross-customer order view and unauthorized shop-settings edit should FAIL. Exact counts depend on the rules you select.

**Important:** An invalid login is not proof of safe authorization. `INCONCLUSIVE` is not a security PASS. ZIP uploads merely identify the matching preinstalled local demo — they are never executed.

**More detail:** `PRODUCT_VISION_AND_HANDOFF.md`, `FRONTEND_RUNBOOK.md`, and `FINAL_APP_QUICKSTART.md`.
