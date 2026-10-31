# Live integration testing

Do not enable integration checks until Suprita and Snehal have implemented and confirmed Checkpoint 0. These tests read the actual API and synthetic app on **127.0.0.1 only**, with no real credentials.

- \`runner-api.test.mjs\` creates and executes a promise and audits the API response and persistence.
- \`demo-http.test.mjs\` checks the protected portal revision's T1–T5 request/response behaviour.

## PowerShell (Windows)

From \`tests/qa\`, install dependencies once:

\`\`\`powershell
npm.cmd install
\`\`\`

Then, when API port 4100 and demo port 4000 are running:

\`\`\`powershell
$env:QA_INTEGRATION="1"
npm.cmd run test:integration
\`\`\`

To include the direct demo HTTP suite, ask Snehal for **synthetic** token provisioning; set ephemeral environment variables in the terminal, never in source control:

\`\`\`powershell
$env:QA_DEMO_TOKENS_READY="1"
$env:QA_ALICE_TOKEN="<synthetic Alice token>"
$env:QA_BOB_TOKEN="<synthetic Bob token>"
npm.cmd run test:integration
\`\`\`

Remove them afterward with \`Remove-Item Env:QA_ALICE_TOKEN, Env:QA_BOB_TOKEN\`.

The demo suite assumes the protected revision (both cross-owner requests return 403), not the intentionally regressed revision. Switch revisions only according to Snehal's documented real code changes.

These suites are **integration acceptance checks**, not mock demonstrations. If they fail because services or APIs are unfinished, record it as BLOCKED rather than editing expected results to pass.
