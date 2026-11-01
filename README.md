# CanTheySeeIt? — Studio Light + AETHER College Fest

A local-only authorization verification demonstration with multiple approved training applications. The AETHER college-fest app is **deliberately vulnerable** to two authorization mistakes for educational testing with synthetic identities. **Never deploy the vulnerable lab publicly.**

## Project directories

- [`studio/`](studio/) — Integrated CanTheySeeIt? backend/dashboard, registered adapters, sector tests, and synthetic grocery/clinic/college-fest labs.
- [`aetherfest/`](aetherfest/) — Standalone AETHER 2026 college-fest website, with three fictional logins, a reproduction script, secure mode, and adapter integration examples.
- `studio/demo-upload/AetherFest_Approved_Website.zip` — The approved target upload archive for the dashboard.

## Run the integrated demo (Node.js 22+)

Open two terminals:

```bash
cd studio
npm install
npm run fest:start
```

```bash
cd studio
npm run dev
```

Visit **http://127.0.0.1:4400** for the college fest and **http://127.0.0.1:4100** for the dashboard. On Windows, substitute `npm.cmd` for `npm`.

In the dashboard, choose the College Events/Fest option and upload `studio/demo-upload/AetherFest_Approved_Website.zip`. Select the predefined rules, approve synthetic write tests and run. The same verifier engine should detect the two deliberate authorization errors.

Detailed launch steps: [`studio/COLLEGE_FEST_START_HERE.md`](studio/COLLEGE_FEST_START_HERE.md). Standalone demo and reproduction: [`aetherfest/README.md`](aetherfest/README.md), [`aetherfest/DEMO_JUDGE_FLOW.md`](aetherfest/DEMO_JUDGE_FLOW.md).

## Safety and verification

The training labs are intended to run on loopback only with fictional data. ZIP upload recognizes approved packages; it does not safely execute arbitrary user-submitted source code. PASS and FAIL values must come from live backend checks. AETHER vulnerable/secure behavior is controlled by the demo application's `FEST_MODE` setting; the UI must not manufacture verdicts.

The integrated code includes tests and optional secure-mode demos. Do not treat the presence of the files as proof that all optional flows are live without starting the services and running the checks on your machine.
