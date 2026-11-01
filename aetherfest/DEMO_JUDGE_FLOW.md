# Judge demonstration — AETHER + CanTheySeeIt?

1. Show the attractive AETHER fest landing page and log in as Student A. Student A sees only their own registration and does not have a manage-fest button.
2. Open CanTheySeeIt?, choose **College Events / Fest**, upload the approved AETHER ZIP, and select **both** rules.
3. Briefly explain the rules: *students see only their own registrations* and *only the fest head can modify prices/settings*.
4. Approve fictional synthetic writes and execute the checks. Show actual backend output: **F01 PASS, F02 PASS, F03 FAIL, F04 PASS, F05 FAIL**. The overall conclusion is FAIL.
5. Open the detailed evidence for **F03** (Student A received the exact protected Student B record) and **F05** (student price change persisted, even though the interface hid the admin form).
6. Reproduce the two flaws in the lab using `npm run test:exposure` if asked. It resets the data after the reproduction.
7. Explain the fix: restart with `FEST_MODE=secure`; run the same suite again. Expected: **5 PASS** because ownership and head-role authorization are enforced on the server.

Do not describe the results as having been produced by an arbitrary ZIP scan: the current demo uses a **pre-approved ZIP mapped to a running local lab and trusted adapter**. This is a controlled test environment intended to demonstrate the real verification engine.
