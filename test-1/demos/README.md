# Demo projects

These are separate demo applications stored under `test-1/demos/`. They do not replace the CanTheySeeIt frontend or its backend.

## 1. Thread & Thimble — security testing fixture

Path: `test-1/demos/thread-and-thimble/`

A local-only dress shop website with fake data and three intentional vulnerabilities: IDOR, missing role authorization on product updates, and client-controlled checkout prices.

Run it from that folder:

```powershell
npm start
```

Then open **http://127.0.0.1:3000**. See its README for demo accounts and safety boundaries. Never expose this intentionally vulnerable app publicly.

## 2. DesiThali — restaurant ordering UI

Path: `test-1/demos/desithali-website/`

The uploaded project included a React/Vite/Tailwind configuration, entry point, stylesheet and an `src/App.tsx` component. The configuration, entry point and stylesheet have been added to this folder, but the main `src/App.tsx` component from the upload is not yet present in this GitHub folder. Therefore this copy is **not ready to run/build yet**. Do not run `npm install` here expecting a working page until that component is added.

## 3. CanTheySeeIt

The actual CanTheySeeIt app remains at the root of `test-1/`. Start it from that folder using the instructions in `test-1/README.md`.
