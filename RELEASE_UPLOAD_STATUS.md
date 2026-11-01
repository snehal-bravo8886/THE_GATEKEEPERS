# CanTheySeeIt? — Campus Adapter Edition release

**Status: release branch prepared; application source upload pending.**

This release is intended to preserve and extend the team's existing work without overwriting it. The complete source will live in `app/` once uploaded from the prepared local ZIP.

## Release content to publish
- Studio Light beginner-first dashboard and sector wizard
- Existing generic verifier and saved-run/history architecture
- Supported grocery shop, fictional hospital, and CampusCircle event integrations
- Controlled authorization test suites, fixtures and documentation

## Safe publishing
1. Download the `CanTheySeeIt_GitHub_Ready.zip` package from the ChatGPT conversation.
2. Extract it in Windows Downloads.
3. Run `./PUBLISH_FINAL_APP_TO_GITHUB.ps1` from PowerShell in the extracted folder.
4. Confirm the new `app/` folder appears on this branch.
5. Review the source and create a pull request against `main` when ready.

**Security note:** The grocery, hospital and CampusCircle demos intentionally contain broken access controls and synthetic logins. They are local training applications only; do not deploy them publicly. Do not commit environment variables, real credentials, or `node_modules`.

This file by itself does **not** mean the app has been uploaded. The application source must appear in `app/` for the release to be complete.
