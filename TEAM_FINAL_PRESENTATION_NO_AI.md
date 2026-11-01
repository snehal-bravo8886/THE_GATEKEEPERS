# CanTheySeeIt? — Final Team Presentation & Contribution Handoff

**Team:** The Gatekeepers | **Event:** Kodikon 6.0 | **Edition:** Final non-AI demo  
**Target duration:** 5–6 minutes plus live demo and questions  
**Team:** Suprita Shinganmakki · Snehal Agrawal · Maulik Bishop · Arjun

> **Present only what you can actually demonstrate.** This script refers to the **non-AI, non-Docker** edition. The three included demo websites have real authorization verification; an unfamiliar uploaded ZIP gets route suggestions and five planned custom checks, **not an automatic security PASS/FAIL** until a compatible test setup exists.
>
> **Credit note:** The roles below follow the team's assignments and visible project contributions. Some later integrations and frontend adaptations were assembled collaboratively and with assistant support. Each member should check the “My contribution” line against the work they personally performed before saying “I built …”.

---

## At a glance: who speaks about what?

| Sequence | Speaker | Assigned responsibility | Time |
|---|---|---|---|
| 1 | **Suprita** | Backend, security logic and verifier | 60–75 sec |
| 2 | **Snehal** | Synthetic website fixtures, test scenarios, setup | 50–60 sec |
| 3 | **Maulik** | Frontend flow, usability and results | 50–60 sec |
| 4 | **Arjun** | QA, integration, live demo and limitations | 90–120 sec |
| 5 | **All** | Questions | As needed |

## One-sentence product explanation

**“CanTheySeeIt? helps beginners verify whether their website respects the privacy and access rules they intended, using understandable checks and evidence from actual test requests.”**

Our target audience is students, freelancers, and small businesses building websites with inexpensive or free coding tools. We **do not** claim their choice of AI model alone determines whether their code is secure.

---

## Speaker 1 — Suprita: problem and the verification engine

### Say this

> “People can build functioning websites using AI-assisted coding, but they may not know how to check that their privacy and permission rules are actually enforced.
>
> For example, a student shouldn't be able to see another student's private registration, and a customer shouldn't be able to edit shopkeeper settings.
>
> Our solution, CanTheySeeIt?, turns understandable security promises into repeatable checks. We have three supported local website types: grocery or shop, restaurant dine-in ordering, and student or college festivals.
>
> The backend performs real requests with practice users and checks whether the correct record was exposed or a forbidden change was saved. We return **PASS** when a particular rule was correctly enforced, **FAIL** when we confirmed a violation, and **INCONCLUSIVE** when we didn't have trustworthy test conditions.
>
> This edition does not depend on an LLM for its verdicts. Our testing rules and evidence checks are deterministic.”

### What I contributed — verified role scope

- Backend/verifier design: test contracts, execution logic, evidence, error handling, and verdict classification.
- Keeping the distinction between authentication problems and actual authorization failures.
- Supporting test runs and saved evidence/history in the integrated local application.

**Show:** a security rule, an individual PASS/FAIL record, and its underlying evidence (not just the headline number).

### If a judge asks

**Why isn't a 403 always a PASS?** “We also establish the user's identity and positive controls. An expired login or an unrelated missing record cannot prove authorization works.”

---

## Speaker 2 — Snehal: repeatable websites and test data

### Say this

> “To test permissions properly, we need to know exactly who owns which record. We use disposable practice identities and fictional data so we can deliberately test unauthorized access without touching real customers.
>
> Our example websites cover different business rules. The grocery site has customers, orders, delivery addresses, inventory, and a shopkeeper. The restaurant has table guests, bills, and staff-only changes. The student-fest site has student registrations, tickets, and organizer-only settings.
>
> For each supported category, we present ten reviewed checks. Some test legitimate actions, like viewing your own record; others test whether another user is blocked.
>
> We deliberately included a few authorization mistakes in the local demonstration websites, giving us a reliable way to prove that our verifier catches real violations rather than simply showing green results.”

### What I contributed — verified role scope

- Scenario and fixture definitions: synthetic users, records, ownership markers, and expected policy outcomes.
- Test-case data and integration/adapter planning for the demo applications.
- Providing repeatable setups for authorized and unauthorized-user scenarios.

**Attribution caution:** The later full grocery/restaurant/student demo code was assembled in several integration passes. Credit exact file authorship only after the team confirms it.

**Show:** one logged-in practice user and a private resource belonging to another user.

### If a judge asks

**Why do you need two users?** “Without a verified owner and another user, we cannot prove that private data was accessed across accounts.”

---

## Speaker 3 — Maulik: frontend and the beginner experience

### Say this

> “The typical user doesn't understand API endpoints or cybersecurity terminology. Our interface therefore starts with one familiar question: ‘What kind of website is it?’
>
> The user chooses grocery/shop, restaurant dine-in, student fest, or custom. They can upload their project ZIP and review the checks in plain English.
>
> For the three supported demo categories, there are ten targeted permission checks. For a custom website, there are five general checks, such as ownership, unauthorized editing, admin-only actions, and private information for logged-out visitors.
>
> For supported integrations, the results appear in simple terms — working, needs fixing, or couldn't confirm — with evidence and explanations. We also keep history and detailed views for users who want them.
>
> Crucially, we don't tell users that an unfamiliar ZIP passed live testing when it has only been inspected or mapped.”

### What I contributed — verified role scope

- Original React/TypeScript frontend work and dashboard direction.
- User journey, readability, evidence viewer, and history UX.
- Frontend integration goals: make security results understandable and actionable.

**Attribution caution:** The simplified no-AI interface and later integration changes were adaptations of Maulik's original frontend. Describe this as a team-integrated frontend, not necessarily one person's sole code.

**Show:** homepage category choices → uploaded ZIP → ten or five planned checks → results or “needs setup”.

### If a judge asks

**Why can custom websites show only plans?** “A ZIP alone cannot prove who owns a real record or provide working login sessions. We explain the missing prerequisites rather than inventing results.”

---

## Speaker 4 — Arjun: QA, integration and live proof

### Say this

> “My role is QA, integration, and demonstrating that CanTheySeeIt?'s results are trustworthy. I test whether the frontend, verifier, and website work together, and especially whether our tool avoids false PASS results.
>
> On our **grocery demo**, the ten-case run is expected to show **eight PASS and two FAIL**: one customer can access another customer's order, and a customer can change shopkeeper-only settings.
>
> On the **restaurant demo**, the ten-case run is expected to show **nine PASS and one FAIL**, detecting an unauthorized change to staff-controlled table status.
>
> On the **student-fest demo**, the ten-case run is expected to show **eight PASS and two FAIL**, detecting private-registration exposure and organizer-settings modification.
>
> These failures are actually successes for our security-testing product: they demonstrate that the verifier found the deliberate vulnerabilities in the local examples.
>
> Finally, we can upload a completely different custom project. The app gives a general five-check plan and any supported source-review warnings, while clearly showing that live authorization tests need a compatible integration. That is an honest limitation, not a fake all-clear.”

### What I contributed — verified role scope

- Independent QA oracle and negative-test coverage, API integration checks, manual browser reproduction, and regression testing.
- Verifying the distinction between secure behavior, confirmed exposure, inconclusive setup, and not-yet-run checks.
- Preparing the live demonstration, interpreting results, and reporting integration limitations.

**Show:** the grocery two-failure result, then the student-fest result, then the custom-site five-check plan. If time permits, reproduce the grocery order leak in Firefox.

### If a judge asks

**Why does a FAIL count as a good demo?** “It means our verifier caught a confirmed security violation in an intentionally vulnerable test website.”

---

## Live demo order (approximately 3 minutes)

### Preparation before judges arrive

1. Extract the final **non-AI** CanTheySeeIt? ZIP into a clean folder and open the directory containing `package.json`.
2. Double-click **`START_ONE_CLICK_DEMO_WINDOWS.cmd`**; alternatively use separate PowerShell terminals:

   ```powershell
   npm.cmd install
   npm.cmd run dev               # Dashboard at http://127.0.0.1:4100
   npm.cmd run lab:start         # Grocery at http://127.0.0.1:4200
   npm.cmd run restaurant:start  # Restaurant at http://127.0.0.1:4500
   npm.cmd run campus:start      # Student fest at http://127.0.0.1:4400
   ```

3. Confirm the three websites are reachable and close old servers using the same ports.
4. Keep fictional test data separate from real users. Never deploy these intentionally vulnerable sites to the public internet.

### Demo 1 — Grocery (60 seconds)

**Arjun operates; Suprita explains one finding.** Choose **Shop or grocery store**, use the included sample ZIP or ready-made example, prepare ten checks, approve fictional test edits, and run. **Expected:** 8 PASS, 2 FAIL.

For extra proof, in the **logged-in** grocery site's browser Console as Alice (`alice@sprout.local`, `AppleA!26`):

```javascript
fetch('/api/orders/order-b-1002', { credentials: 'same-origin' })
  .then(async r => ({ status: r.status, data: await r.json() }))
  .then(console.log);
```

A vulnerable HTTP 200 containing Bob's private order is an authorization failure. If HTTP 401 appears, authenticate again before interpreting the result.

### Demo 2 — Student fest or restaurant (45 seconds)

- Student Fest: choose **Student / College Fest**, run ten approved checks. **Expected:** 8 PASS, 2 FAIL.
- Restaurant: choose **Restaurant dine-in**, run ten approved checks. **Expected:** 9 PASS, 1 FAIL.

Show one case's explanation and evidence. **Don't conflate a case's FAIL with the testing software malfunctioning.**

### Demo 3 — Custom basic website (45 seconds)

Upload the supplied `EverydayDesk_Custom_Login.zip` (a separate fictional login/admin website). Select **Custom / Another website**. Show that CanTheySeeIt? prepares **five basic checks**, possibly source-review hints, and **zero live authorization verdicts** without a site-specific approved test setup.

You can separately run the custom website at `http://127.0.0.1:4700/` to show a working user/admin login. Its own test script is **not** evidence that CanTheySeeIt?'s custom adapter executed the five checks.

---

## Current product scope: what we can and can't claim

| Claim | Status in non-AI release |
|---|---|
| Real permission checks against included grocery, restaurant, student-fest labs | **Supported** — ten reviewed cases each |
| PASS/FAIL/INCONCLUSIVE based on HTTP and saved-state evidence | **Supported** for matching local integrations |
| Upload arbitrary website ZIP and receive candidate route mappings | **Supported** for recognized source patterns |
| Upload custom ZIP and see five basic proposed security tests | **Supported** |
| Automatically host and test every unrelated ZIP, with no configuration | **Not supported** in this edition |
| Detect all vulnerabilities in AI-generated websites | **Not supported; no tool can guarantee this** |
| AI/LLM-based adapter generation or Docker hosting | **Not used in this edition** |

**Technical caveat:** Source inspection may suggest risks, but source warnings are not equivalent to experimentally confirmed authorization bugs.

---

## Likely mentor questions — short responses

**Q: Who is the target user?**  
Students, freelancers, and small organizations building apps without dedicated security expertise or a budget for professional security reviews.

**Q: What differentiates this from a normal scanner?**  
We focus on plain-language, requirement-first permission testing and understandable evidence rather than claiming to invent security scanning. Our beginner-friendly onboarding is what we want to validate.

**Q: Why ten checks?**  
They are a manageable curated set for each supported category, including authorized controls and unauthorized access attempts. Ten is a scope choice, not a guarantee of complete coverage.

**Q: Why only five for custom websites?**  
We supply five broad permission checks that users can understand. Running them requires a compatible staging site, confirmed test users, resource ownership, and a trusted adapter.

**Q: Does the system fix code automatically?**  
No. It can provide explanations or suggestions, but production code changes and deployment are outside the current non-AI demo.

**Q: What is the biggest limitation?**  
Automatic setup for a truly unfamiliar app. We can inspect its source and propose tests, but a real verdict requires a compatible, authenticated test connection.

**Q: Why might a 401 or missing record be inconclusive?**  
Because an invalid test session or missing fixture is not proof that ownership checks work.

**Q: Why not use AI?**  
This edition is intentionally deterministic and low-cost. We choose verified behavior over a model-generated security opinion.

---

## Final closing statement — any one speaker

> “Our goal is simple: make it possible for beginners to check whether the privacy and permission rules they intended are actually being enforced. CanTheySeeIt? gives them a clear starting point, real evidence where testing is supported, and an honest explanation of what still needs checking.”

### Rehearsal checklist

- [ ] Confirm all four team members agree with the specific contribution descriptions.
- [ ] Check the included sample sites and the ports before presenting.
- [ ] Rehearse one confirmed authorization FAIL and one actual PASS.
- [ ] Show that custom website checks are **planned**, not magically executed.
- [ ] Keep prepared screenshots as a fallback if a live server fails.
- [ ] Avoid claiming universal ZIP testing or automatic repair.