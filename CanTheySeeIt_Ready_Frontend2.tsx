import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  Lock,
  FileText,
  Server,
  Terminal,
  Check,
  ChevronRight,
  Activity,
  Loader2,
  ShieldQuestion
} from "lucide-react";

type Verdict = "PASS" | "FAIL" | "INCONCLUSIVE";
type ExpectedPolicy = "ALLOW" | "DENY";
type Action = "read" | "update" | "delete";

type Actor = {
  id: string;
  name: string;
  role: string;
  description: string;
};

type Resource = {
  id: string;
  name: string;
  endpoint: string;
  ownerId: string;
  ownerName: string;
  type: string;
};

type RuleContract = {
  name: string;
  actorId: string;
  resourceId: string;
  resourceOwnerId: string;
  action: Action;
  expected: ExpectedPolicy;
  targetUrl: string;
};

type TestResult = {
  id: string;
  timestamp: string;
  rule: string;
  actorId: string;
  resourceId: string;
  action: Action;
  expected: ExpectedPolicy;
  verdict: Verdict;
  target: string;
  observed: string;
  explanation: string;
  suggestion?: string;
  evidence?: {
    httpStatus?: number;
    recordExposed?: boolean;
    responseSummary?: string;
  };
  // Keep the exact rule so a retest repeats the same configuration.
  contract: RuleContract;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
// Demo mode is for UI demonstrations only; it does not perform real security tests.\nconst DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const HISTORY_KEY = "cantheyseeit-test-history-v2";

const actors: Actor[] = [
  { id: "bob", name: "Bob (Student)", role: "student", description: "A student attempting to access another student's private record." },
  { id: "alice", name: "Alice (Student)", role: "student", description: "The owner of the example examination record." },
  { id: "anonymous", name: "Anonymous User", role: "guest", description: "A visitor without an authenticated session." },
  { id: "instructor", name: "Dr. Smith (Instructor)", role: "faculty", description: "An instructor identity for testing an explicitly permitted role." }
];

const resources: Resource[] = [
  { id: "exam_alice_101", name: "Alice's Exam Results", endpoint: "/api/records/alice", ownerId: "alice", ownerName: "Alice", type: "Private academic record" },
  { id: "exam_bob_102", name: "Bob's Exam Results", endpoint: "/api/records/bob", ownerId: "bob", ownerName: "Bob", type: "Private academic record" },
  { id: "campus_directory", name: "Campus Directory", endpoint: "/api/directory", ownerId: "public", ownerName: "Public", type: "Public directory" }
];

function isAllowedLocalTarget(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const loopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
    return (url.protocol === "http:" || url.protocol === "https:") && loopback;
  } catch {
    return false;
  }
}

function readHistory(): TestResult[] {
  try {
    const value = localStorage.getItem(HISTORY_KEY);
    return value ? JSON.parse(value) as TestResult[] : [];
  } catch {
    return [];
  }
}

function makeDemoResult(rule: RuleContract, verdict: Verdict): TestResult {
  const actor = actors.find(item => item.id === rule.actorId);
  const resource = resources.find(item => item.id === rule.resourceId);
  const now = new Date().toISOString();

  const observed =
    verdict === "FAIL" ? "PROTECTED_RECORD_RECEIVED" :
    verdict === "PASS" ? "ACCESS_DENIED_WITHOUT_RECORD_DISCLOSURE" :
    "TEST_PREREQUISITE_INVALID";

  return {
    id: `DEMO-${Date.now()}`,
    timestamp: now,
    rule: `${actor?.name ?? rule.actorId} → ${rule.action} ${resource?.name ?? rule.resourceId}`,
    actorId: rule.actorId,
    resourceId: rule.resourceId,
    action: rule.action,
    expected: rule.expected,
    verdict,
    target: rule.targetUrl,
    observed,
    explanation:
      verdict === "FAIL"
        ? "Demo scenario: the synthetic actor received the protected record despite a DENY expectation."
        : verdict === "PASS"
        ? "Demo scenario: the request was denied and the protected record was not disclosed. A valid control test is assumed."
        : "Demo scenario: the session or target prerequisite was invalid, so the permission rule could not be evaluated.",
    suggestion: verdict === "FAIL"
      ? "Enforce server-side authorization and verify resource ownership before returning private data."
      : undefined,
    evidence: {
      httpStatus: verdict === "FAIL" ? 200 : verdict === "PASS" ? 403 : undefined,
      recordExposed: verdict === "FAIL",
      responseSummary: observed
    },
    contract: rule
  };
}

function StatusBadge({ verdict }: { verdict: Verdict }) {
  const styles: Record<Verdict, string> = {
    PASS: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    FAIL: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    INCONCLUSIVE: "bg-amber-500/15 text-amber-300 border-amber-500/30"
  };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${styles[verdict]}`}>{verdict}</span>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"wizard" | "dashboard" | "history">("wizard");
  const [step, setStep] = useState(1);
  const [actorId, setActorId] = useState("bob");
  const [resourceId, setResourceId] = useState("exam_alice_101");
  const [action, setAction] = useState<Action>("read");
  const [expected, setExpected] = useState<ExpectedPolicy>("DENY");
  const [targetUrl, setTargetUrl] = useState("http://localhost:3000/api/records/alice");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [demoVerdict, setDemoVerdict] = useState<Verdict>("FAIL");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"ALL" | Verdict>("ALL");

  const selectedActor = actors.find(actor => actor.id === actorId)!;
  const selectedResource = resources.find(resource => resource.id === resourceId)!;

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // The app remains usable if browser storage is unavailable.
    }
  }, [history]);

  const rule: RuleContract = useMemo(() => ({
    name: `${selectedActor.name} ${action} ${selectedResource.name}`,
    actorId,
    resourceId,
    resourceOwnerId: selectedResource.ownerId,
    action,
    expected,
    targetUrl
  }), [selectedActor.name, action, selectedResource, actorId, resourceId, expected, targetUrl]);

  function selectResource(nextId: string) {
    setResourceId(nextId);
    const nextResource = resources.find(item => item.id === nextId);
    if (nextResource) setTargetUrl(`http://localhost:3000${nextResource.endpoint}`);
  }

  async function executeTest(existingResult?: TestResult) {
    setError("");
    const ruleToRun = existingResult?.contract ?? rule;
    if (!isAllowedLocalTarget(ruleToRun.targetUrl)) {
      setError("Use an authorised localhost or loopback URL (for example, http://localhost:3000). The backend must enforce this restriction too.");
      setStep(2);
      setActiveTab("wizard");
      return;
    }

    setIsVerifying(true);
    try {
      let result: TestResult;

      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 700));
        result = makeDemoResult(ruleToRun, demoVerdict);
      } else {
        const url = existingResult
          ? `${API_BASE_URL}/api/tests/${encodeURIComponent(existingResult.id)}/retest`
          : `${API_BASE_URL}/api/tests`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: existingResult ? undefined : JSON.stringify(ruleToRun)
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Verification request failed (${response.status}).`);
        }

        const payload = await response.json();
        if (!["PASS", "FAIL", "INCONCLUSIVE"].includes(payload.verdict)) {
          throw new Error("Backend response did not contain a valid verdict.");
        }

        result = {
          id: String(payload.testId ?? payload.id ?? `TEST-${Date.now()}`),
          timestamp: payload.timestamp ?? new Date().toISOString(),
          rule: payload.ruleName ?? ruleToRun.name,
          actorId: payload.actorId ?? ruleToRun.actorId,
          resourceId: payload.resourceId ?? ruleToRun.resourceId,
          action: payload.action ?? ruleToRun.action,
          expected: payload.expected ?? ruleToRun.expected,
          verdict: payload.verdict,
          target: payload.target ?? ruleToRun.targetUrl,
          observed: payload.observed ?? "Observation not supplied",
          explanation: payload.explanation ?? "No explanation was supplied by the verification engine.",
          suggestion: payload.suggestion,
          evidence: payload.evidence,
          contract: ruleToRun
        };
      }

      setLatestResult(result);
      setHistory(previous => [result, ...previous.filter(item => item.id !== result.id)]);
      setActiveTab("dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "An unexpected verification error occurred.");
    } finally {
      setIsVerifying(false);
    }
  }

  function startNewRule() {
    setStep(1);
    setError("");
    setActiveTab("wizard");
  }

  const currentResult = latestResult ?? history[0] ?? null;
  const passCount = history.filter(item => item.verdict === "PASS").length;
  const failCount = history.filter(item => item.verdict === "FAIL").length;
  const inconclusiveCount = history.filter(item => item.verdict === "INCONCLUSIVE").length;
  const filteredHistory = history.filter(item => {
    const query = historyQuery.trim().toLowerCase();
    const matchesQuery = !query || [item.rule, item.id, item.target, item.actorId, item.resourceId]
      .some(value => value.toLowerCase().includes(query));
    const matchesVerdict = historyFilter === "ALL" || item.verdict === historyFilter;
    return matchesQuery && matchesVerdict;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-2">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-cyan-300">CanTheySeeIt?</span>
                <span className="rounded-full border border-cyan-800 bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-300">v1.1</span>
              </div>
              <p className="text-xs text-slate-400">Zero-Expertise Cyber Defense</p>
            </div>
          </div>

          <nav className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
            {([
              ["wizard", "Rule Wizard"],
              ["dashboard", "Results"],
              ["history", `History (${history.length})`]
            ] as const).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${activeTab === tab ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className={`mb-6 rounded-xl border p-4 ${DEMO_MODE ? "border-amber-500/40 bg-amber-950/20" : "border-emerald-500/30 bg-emerald-950/10"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{DEMO_MODE ? "DEMO MODE — simulated results" : "Backend mode — live verification"}</p>
              <p className="mt-1 text-xs text-slate-400">
                {DEMO_MODE
                  ? "Results below are illustrative only. They are not evidence from a real application."
                  : `Requests are sent to ${API_BASE_URL}. No verdict is fabricated by the frontend.`}
              </p>
            </div>
            {DEMO_MODE && (
              <div className="flex flex-wrap gap-2">
                {(["FAIL", "PASS", "INCONCLUSIVE"] as Verdict[]).map(verdict => (
                  <button key={verdict} onClick={() => setDemoVerdict(verdict)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${demoVerdict === verdict ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-300"}`}>
                    Demo {verdict}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div><strong>Could not complete verification.</strong><p className="mt-1">{error}</p></div>
          </div>
        )}

        {activeTab === "wizard" && (
          <section className="mx-auto max-w-4xl space-y-7">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Guided permission test</p>
              <h1 className="mt-2 text-3xl font-extrabold">Define your access rule</h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">Tell us who is trying to access which resource, what action they are taking, and whether access should be allowed.</p>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {["Actor", "Resource", "Action & policy", "Review"].map((label, index) => {
                const number = index + 1;
                return <React.Fragment key={label}>
                  <button onClick={() => number < step && setStep(number)}
                    className={`flex items-center gap-2 text-xs ${step === number ? "text-white" : step > number ? "text-emerald-300" : "text-slate-500"}`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border font-bold ${step === number ? "border-cyan-400 bg-cyan-500 text-slate-950" : step > number ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700"}`}>
                      {step > number ? <Check size={15}/> : number}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                  {number < 4 && <div className="h-px w-5 bg-slate-700 sm:w-12" />}
                </React.Fragment>;
              })}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-8">
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3"><UserCheck className="text-cyan-400"/><div><h2 className="text-lg font-bold">Who is attempting the request?</h2><p className="text-xs text-slate-400">This is the synthetic test identity, also called the actor.</p></div></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {actors.map(actor => (
                      <button key={actor.id} onClick={() => setActorId(actor.id)}
                        className={`rounded-2xl border p-5 text-left transition ${actorId === actor.id ? "border-cyan-400 bg-cyan-950/30" : "border-slate-700 bg-slate-950/50 hover:border-slate-500"}`}>
                        <div className="flex items-center justify-between"><span className="font-semibold">{actor.name}</span>{actorId === actor.id && <Check className="text-cyan-300"/>}</div>
                        <span className="mt-2 inline-block rounded bg-slate-800 px-2 py-1 font-mono text-[10px] text-cyan-300">{actor.role}</span>
                        <p className="mt-3 text-xs leading-relaxed text-slate-400">{actor.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3"><Lock className="text-cyan-400"/><div><h2 className="text-lg font-bold">What resource is being accessed?</h2><p className="text-xs text-slate-400">Choose a known test fixture belonging to a user or marked public.</p></div></div>
                  <div className="space-y-3">
                    {resources.map(resource => (
                      <button key={resource.id} onClick={() => selectResource(resource.id)}
                        className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left ${resourceId === resource.id ? "border-cyan-400 bg-cyan-950/30" : "border-slate-700 bg-slate-950/50 hover:border-slate-500"}`}>
                        <span><span className="block font-semibold">{resource.name}</span><span className="mt-1 block font-mono text-xs text-cyan-300">{resource.endpoint}</span><span className="mt-2 block text-xs text-slate-400">{resource.type} · Owner: {resource.ownerName}</span></span>
                        {resourceId === resource.id && <Check className="shrink-0 text-cyan-300"/>}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <label htmlFor="targetUrl" className="mb-2 block text-xs font-semibold text-slate-300">Local test application URL</label>
                    <input id="targetUrl" value={targetUrl} onChange={event => setTargetUrl(event.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-cyan-200 outline-none focus:border-cyan-400"/>
                    <p className="mt-2 text-[11px] text-slate-500">Only localhost/loopback targets are accepted by this UI. The verification backend must independently enforce the same allowlist.</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3"><ShieldAlert className="text-cyan-400"/><div><h2 className="text-lg font-bold">What action is being attempted?</h2><p className="text-xs text-slate-400">Choose the operation, then specify the expected permission.</p></div></div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {([
                      ["read", "View", "Read or retrieve a record"],
                      ["update", "Edit", "Modify an existing record"],
                      ["delete", "Delete", "Remove a record"]
                    ] as const).map(([value, label, description]) => (
                      <button key={value} onClick={() => setAction(value)}
                        className={`rounded-xl border p-4 text-left ${action === value ? "border-cyan-400 bg-cyan-950/30" : "border-slate-700 bg-slate-950/50"}`}>
                        <span className="block font-semibold">{label}</span><span className="mt-1 block text-xs text-slate-400">{description}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button onClick={() => setExpected("DENY")} className={`rounded-2xl border p-5 text-left ${expected === "DENY" ? "border-rose-400 bg-rose-950/20" : "border-slate-700 bg-slate-950/50"}`}>
                      <span className="font-bold text-rose-300">DENY access</span><p className="mt-2 text-xs text-slate-400">{selectedActor.name} should not be allowed to {action} {selectedResource.name}.</p>
                    </button>
                    <button onClick={() => setExpected("ALLOW")} className={`rounded-2xl border p-5 text-left ${expected === "ALLOW" ? "border-emerald-400 bg-emerald-950/20" : "border-slate-700 bg-slate-950/50"}`}>
                      <span className="font-bold text-emerald-300">ALLOW access</span><p className="mt-2 text-xs text-slate-400">{selectedActor.name} should be allowed to {action} {selectedResource.name}.</p>
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
                    <strong>Plain-language rule:</strong> {selectedActor.name} should {expected === "ALLOW" ? "be allowed" : "not be allowed"} to {action} {selectedResource.name}.
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3"><FileText className="text-cyan-400"/><div><h2 className="text-lg font-bold">Review your test configuration</h2><p className="text-xs text-slate-400">Confirm the rule before sending it to the verification engine.</p></div></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Actor", selectedActor.name],
                      ["Protected resource", selectedResource.name],
                      ["Resource owner", selectedResource.ownerName],
                      ["Action", action.toUpperCase()],
                      ["Expected permission", expected],
                      ["Target", targetUrl]
                    ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 break-all text-sm font-semibold text-slate-200">{value}</p></div>)}
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400"><Terminal size={14}/> JSON rule contract preview</div>
                    <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-relaxed text-cyan-200">{JSON.stringify(rule, null, 2)}</pre>
                  </div>
                  <p className="text-xs text-slate-500">The frontend sends actor IDs, not authentication tokens. The backend is responsible for resolving synthetic sessions and validating the target.</p>
                </div>
              )}

              <div className="mt-8 flex justify-between border-t border-slate-800 pt-5">
                <button onClick={() => step === 1 ? startNewRule() : setStep(value => value - 1)} className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm text-slate-200 hover:bg-slate-700">{step === 1 ? "Reset" : "Back"}</button>
                {step < 4 ? (
                  <button onClick={() => { setError(""); setStep(value => value + 1); }} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400">Continue <ChevronRight size={16}/></button>
                ) : (
                  <button disabled={isVerifying} onClick={() => executeTest()} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">
                    {isVerifying ? <Loader2 className="animate-spin" size={17}/> : <Play size={17}/>}
                    {isVerifying ? "Verifying…" : "Run verification"}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "dashboard" && (
          <section className="mx-auto max-w-5xl space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total test runs", history.length, "All recorded executions"],
                ["Passed", passCount, "Expected behaviour observed"],
                ["Failed", failCount, "Unexpected access or behaviour"],
                ["Inconclusive", inconclusiveCount, "Could not establish a verdict"]
              ].map(([label, value, hint]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center">
              <div><p className="text-xs uppercase tracking-widest text-cyan-400">Verification report</p><h1 className="mt-1 text-2xl font-bold">{currentResult?.rule ?? "No verification run yet"}</h1><p className="mt-2 break-all font-mono text-xs text-slate-500">{currentResult?.target ?? "Run a rule from the wizard to see results."}</p></div>
              <div className="flex items-center gap-3">
                {currentResult && <StatusBadge verdict={currentResult.verdict}/>}
                <button onClick={() => currentResult && executeTest(currentResult)} disabled={!currentResult || isVerifying} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm hover:bg-slate-700 disabled:opacity-40"><RotateCcw size={16}/> Retest</button>
              </div>
            </div>

            {!currentResult ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center"><ShieldQuestion className="mx-auto mb-3 text-slate-500" size={36}/><p className="font-semibold">No results yet</p><p className="mt-1 text-sm text-slate-400">Create a rule and run a verification to populate this dashboard.</p><button onClick={startNewRule} className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">Create a test</button></div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3"><ShieldCheck className="text-cyan-400"/><h2 className="font-bold">Expected behaviour</h2></div>
                    <p className="text-xs text-slate-500">Configured permission</p><p className={`mt-2 text-xl font-bold ${currentResult.expected === "DENY" ? "text-rose-300" : "text-emerald-300"}`}>{currentResult.expected}</p>
                    <p className="mt-4 text-sm text-slate-300">{currentResult.actorId} should {currentResult.expected === "ALLOW" ? "be allowed" : "not be allowed"} to {currentResult.action} resource {currentResult.resourceId}.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3"><Server className="text-cyan-400"/><h2 className="font-bold">Observed behaviour</h2></div>
                    <p className="text-xs text-slate-500">Backend observation</p><p className="mt-2 break-words font-mono text-sm text-cyan-200">{currentResult.observed}</p>
                    {currentResult.evidence?.httpStatus && <p className="mt-3 text-xs text-slate-400">HTTP status: {currentResult.evidence.httpStatus}</p>}
                    {typeof currentResult.evidence?.recordExposed === "boolean" && <p className="mt-1 text-xs text-slate-400">Protected record disclosed: {currentResult.evidence.recordExposed ? "Yes" : "No"}</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-3 flex items-center gap-2"><Activity className="text-cyan-400"/><h2 className="font-bold">Explanation and evidence</h2></div>
                  <p className="text-sm leading-relaxed text-slate-300">{currentResult.explanation}</p>
                  {currentResult.evidence?.responseSummary && <p className="mt-3 rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300">{currentResult.evidence.responseSummary}</p>}
                  {currentResult.evidence?.httpStatus && (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs font-semibold text-slate-300">HTTP response interpretation</p>
                      <p className="mt-2 text-sm text-slate-400">
                        {currentResult.evidence.httpStatus === 401
                          ? "401 Unauthorized: the request did not establish a valid authenticated identity."
                          : currentResult.evidence.httpStatus === 403
                          ? "403 Forbidden: the server refused the requested action. Check that this matches the configured policy."
                          : currentResult.evidence.httpStatus >= 200 && currentResult.evidence.httpStatus < 300
                          ? "2xx Success: the server accepted the request. For a DENY rule, check carefully whether protected data was exposed or changed."
                          : "Review the response status together with the returned evidence and expected policy."}
                      </p>
                    </div>
                  )}
                  {currentResult.suggestion && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-300">Suggested remediation</p><p className="mt-2 text-sm text-slate-200">{currentResult.suggestion}</p></div>}
                  <details className="mt-5 rounded-xl border border-slate-800 bg-slate-950">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-cyan-200">View complete technical evidence (JSON)</summary>
                    <pre className="max-h-96 overflow-auto border-t border-slate-800 p-4 text-xs leading-relaxed text-slate-300">{JSON.stringify(currentResult, null, 2)}</pre>
                  </details>
                  <p className="mt-4 text-[11px] text-slate-500">A PASS applies only to this configured rule and test setup. It does not certify the whole application as secure.</p>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "history" && (
          <section className="mx-auto max-w-5xl space-y-5">
            <div><p className="text-xs uppercase tracking-widest text-cyan-400">Previous runs</p><h1 className="mt-1 text-2xl font-bold">Verification history</h1><p className="mt-2 text-sm text-slate-400">This browser stores a local history. Connect the history API for shared/server-side persistence.</p></div>
            {history.length > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:flex-row">
                <input value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Search by rule, test ID, actor, resource or URL…" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400" />
                <select value={historyFilter} onChange={event => setHistoryFilter(event.target.value as "ALL" | Verdict)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400">
                  <option value="ALL">All verdicts</option>
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                  <option value="INCONCLUSIVE">INCONCLUSIVE</option>
                </select>
              </div>
            )}
            {history.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-sm text-slate-400">No test history yet. Run your first verification to see it here.</div> : filteredHistory.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">No runs match those search or filter settings.</div> : (
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {filteredHistory.map(item => (
                  <div key={item.id} className="flex flex-col justify-between gap-3 border-b border-slate-800 p-5 last:border-0 sm:flex-row sm:items-center">
                    <div><p className="font-semibold">{item.rule}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">{item.id} · {item.target}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p></div>
                    <div className="flex items-center gap-3"><StatusBadge verdict={item.verdict}/><button onClick={() => { setLatestResult(item); setActiveTab("dashboard"); }} className="rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700">View result</button><button onClick={() => executeTest(item)} disabled={isVerifying} className="rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700">Retest</button></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-800 py-7 text-center text-xs text-slate-500">
        CanTheySeeIt? · The Gatekeepers · Kodikon 6.0
      </footer>
    </div>
  );
}
