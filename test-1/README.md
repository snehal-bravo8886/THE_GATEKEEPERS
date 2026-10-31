# CanTheySeeIt? — Test 1

Beginner-friendly permission-management prototype for Business and Organisation projects.

## First-time flow
1. Choose **Business** or **Organisation**.
2. Choose how to add the project:
   - **Website link:** paste the URL, or drag the link from the browser.
   - **Source code:** drag a project folder, ZIP archive, multiple source files, or a selected code snippet. You can also use the file/folder pickers.
3. Select a user category (Customer, Employee, Owner, Student or Teacher) and configure its permissions.
4. Review that project's permissions, estimated risk and activity timeline.

## Source-code import
Supported inputs include ZIP archives, project folders and common source/config files such as TS/TSX, JS/JSX, HTML, CSS, JSON, Python, Java, SQL, YAML, Markdown and plain-text code snippets. The importer ignores common generated/dependency folders such as `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage` and `vendor`. It currently imports up to 250 supported files, with per-file and total size limits.

Source files are saved locally in the browser's IndexedDB for each project workspace. They are not transmitted to a server by this prototype.

## Models and roles
- **Business:** Customer, Employee, Owner
- **Organisation:** Student, Teacher

## Run locally
Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173).

## Multiple workspaces
Use the **Model** tab to start a new Business or Organisation project. Use the **Project** tab to add a website link or source-code project. Each workspace has its own role permissions, risk estimate and activity timeline. Switch between existing projects from the saved-project list.

## Important scope and safety notes
Adding a URL only registers the target; it does not crawl the site or send security requests. Uploading source code only stores the files locally in this browser. Neither action performs a security scan yet. Actual static-code analysis or live website verification requires a connected backend, suitable test fixtures/credentials, and explicit authorisation to assess the target. The displayed risk percentage is a heuristic based on configured permissions, not a calibrated score. Real breach detection requires verified backend or monitoring events. Sample alerts are demonstrations, not real breaches.
