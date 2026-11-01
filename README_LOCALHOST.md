# CanTheySeeIt? — Run the original frontend on localhost

This branch adds Vite/React/TypeScript/Tailwind scaffolding around the existing `CanTheySeeIt_Ready_Frontend2.tsx` component and fixes a literal escaped newline which commented out `DEMO_MODE`.

## Windows PowerShell

```powershell
git clone --branch fix/frontend-localhost-ready https://github.com/snehal-bravo8886/THE_GATEKEEPERS.git
cd THE_GATEKEEPERS
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

Open **http://127.0.0.1:5173/**.

**Demo mode:** The example `.env` explicitly sets `VITE_DEMO_MODE=true`, so the frontend shows simulated verdicts for UI demonstrations only. This does **NOT** test a real website. To run against a real backend, set `VITE_DEMO_MODE=false`, set `VITE_API_BASE_URL` to the correct backend, and ensure it supports the frontend's `POST /api/tests` and `POST /api/tests/:id/retest` contract. The earlier integrated grocery verifier has different endpoints and is **not directly compatible** with this older standalone component.

Stop with Ctrl+C. If port 5173 is occupied, stop the other Vite process. Never commit `.env`.
