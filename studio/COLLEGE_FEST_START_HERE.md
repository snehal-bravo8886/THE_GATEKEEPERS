# CanTheySeeIt? Studio Light + AETHER College Fest

This edition extends the existing Studio Light product without removing its grocery and hospital demos. It adds the AETHER college-fest application and **real** suite execution for two intentional permission errors.

## Start on Mac (Node.js 22+)

From this project's root, in three terminals:

**Terminal A — AETHER Fest target:**
```bash
npm run fest:start
```

**Terminal B — CanTheySeeIt? frontend + backend:**
```bash
npm install
npm run dev
```

**Terminal C (optional) — exercise the verifier API without the dashboard:**
```bash
npm run test:fest:live
```

Open the target at http://127.0.0.1:4400 and the verifier dashboard at http://127.0.0.1:4100 . The browser can only access those addresses when the processes are running on your own computer.

## Start on Windows

Use PowerShell within this project root:

Terminal A:
```powershell
npm.cmd run fest:start
```

Terminal B:
```powershell
npm.cmd install
npm.cmd run dev
```

## Via your ZIP-upload dashboard

1. Open CanTheySeeIt? dashboard http://127.0.0.1:4100 .
2. Start here → **Upload website ZIP**.
3. Select **College Events / Fest** from the sector dropdown.
4. Upload `demo-upload/AetherFest_Approved_Website.zip`.
5. Select both proposed rules: **student registration privacy** and **head-only ticket pricing**.
6. Tick **approve fictional synthetic write checks**.
7. Click **Check my website**.

You should get **3 PASS, 2 FAIL** with the two expected failures `F03` and `F05`. The actual API requests go from CanTheySeeIt? to the running college fest server on port 4400; ZIPs are source-matched only, not executed.

## Compare with the secure version

Stop terminal A. On Mac:
```bash
FEST_MODE=secure npm run fest:start
```

On Windows PowerShell:
```powershell
$env:FEST_MODE = 'secure'
npm.cmd run fest:start
```

Re-run with the same approved ZIP and rules. Expected **5 PASS, 0 FAIL**.

## Optional legacy verifier suite view

Register the named suite by running:
```bash
npm run register:fest
```

Go to **Security promises**, select **AETHER College Fest**, and **Run this suite**. This requires approval of fictional PATCH tests. The `test:fest:live` script can also register and run the suite by API.

## Important technical boundaries

- Node.js 22+ is recommended because Studio Light uses TypeScript in development with `tsx` and other npm packages.
- The AETHER target itself uses only built-in Node.js modules and needs no npm install.
- The dashboard shows results produced by the real generic verifier. It does not simulate FAIL labels.
- At present, **only the exact approved college-fest ZIP matching the installed lab** is accepted in this path. This is not arbitrary ZIP execution or universal automatic testing.
- Fictional local test data only; no real student data, tuition, tickets or payments.
- If a write test changes a record, the adapter resets the synthetic fixture and independently verifies its cleanup before continuing.
- A deliberately vulnerable server is safe only in an isolated local training environment. Never publish it.
