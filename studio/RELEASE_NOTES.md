# Experience Edition — Release Notes

### Improvements implemented

- Redesigned the default Start Here page around novice developers instead of API terminology.
- Four plain-English rule cards connected to the original approved security contracts.
- New independently selectable unauthenticated/private-address rule (`visitors.private_read`), reusing trusted positive-control G01 and anonymous-denial G03.
- Optional original website-prompt helper: transparent keyword suggestions, explicit user confirmation, and bounded saved requirement text; it does not generate unreviewed code or security verdicts.
- One-click local sample ZIP onboarding, while retaining normal drag/drop ZIP verification.
- Clear connectivity and synthetic-write approval states before executing tests.
- Inline, plain-English, fail-first findings driven by `run.results`, with suggested fixes and expandable technical evidence.
- Downloadable sanitized plain-text report and access to the existing run history.
- Progressive disclosure: the beginner sidebar shows just Check My Website, My Past Checks and Help; existing advanced views remain accessible.
- Original backend `runSuite`, server-side adapter, and on-disk evidence ledger are retained.

### Tests executed in this working environment

- `node --test tests/frontend/*.test.mjs` — **13 / 13 passed** (frontend source and contract checks, no full live browser verification).
- `node --test lab/grocery-security-lab/tests/lab.test.mjs` — **8 / 8 passed** (actual local HTTP training lab tests).
- `node --check dashboard/app.js` — passed.

### Not verified in this environment

- Browser-to-Express integrated run: npm dependency installation timed out; this end-to-end workflow must be confirmed after `npm.cmd install` on the demo laptop.
- Other website ZIPs, arbitrary website execution, OAuth login, general OpenAPI import, automatic code fixes/deployment: **not implemented**.

### Security warning

The bundled grocery store contains deliberately vulnerable endpoints for training. Bind to loopback; never deploy publicly or test production data.
