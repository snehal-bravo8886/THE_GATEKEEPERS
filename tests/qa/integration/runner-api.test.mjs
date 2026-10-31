import { describe, it, expect, beforeAll } from "vitest";
import { PROMISE_ID, TEST_IDS, promiseInput } from "../fixtures/contract-v1.mjs";
import { auditGeneratedTests, auditRun, comparableRuns } from "../lib/qa-contract.mjs";

// Integration deliberately OPT-IN. Never runs against a public target.
// Run QA_INTEGRATION=1 after API and local demo implement Checkpoint 0.
const enabled = process.env.QA_INTEGRATION === "1";
const suite = enabled ? describe : describe.skip;
const API = process.env.QA_API_URL || "http://127.0.0.1:4100";
if (enabled && API !== "http://127.0.0.1:4100") {
  throw new Error("QA only permits the frozen loopback API http://127.0.0.1:4100");
}

async function call(path, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(API + path, {
      ...init, signal:controller.signal,
      headers:{"content-type":"application/json", ...(init?.headers||{})},
      redirect:"manual"
    });
    const data = await res.json();
    return {status:res.status,data};
  } finally { clearTimeout(timer); }
}

suite("Checkpoint 0: real verification API", () => {
  let promiseId;
  beforeAll(async () => {
    const h=await call("/api/health");
    expect(h.status).toBe(200);
    expect(h.data.contractVersion).toBe("1.0.0");
  });

  it("creates a promise and generates exact T1–T5 in the agreed order", async () => {
    const r = await call("/api/promises",{method:"POST",body:JSON.stringify(promiseInput())});
    expect(r.status).toBe(201);
    expect(r.data.promise.promiseId).toEqual(expect.any(String));
    promiseId = r.data.promise.promiseId;
    expect(r.data.promise.contractVersion).toBe("1.0.0");
    expect(r.data.promise.testIds).toEqual(TEST_IDS);
    expect(auditGeneratedTests(r.data.tests)).toEqual([]);
  });

  it("rejects unsupported methods and contracts before running them", async () => {
    const invalid = promiseInput();
    invalid.confirmedPolicy.method = "DELETE";
    const r=await call("/api/promises",{method:"POST",body:JSON.stringify(invalid)});
    expect(r.status).toBe(400);
    expect(r.data.error.code).toEqual(expect.any(String));
  });

  it("runs real checks, stores sanitized evidence and retrieves same run", async () => {
    if(!promiseId) throw new Error("Promise creation must succeed first");
    const r=await call("/api/promises/"+encodeURIComponent(promiseId)+"/run", {
      method:"POST",body:JSON.stringify({revisionLabel:"qa-local-run"})
    });
    expect(r.status).toBe(200);
    expect(r.data.run.promiseId).toBe(promiseId);
    expect(auditRun(r.data.run)).toEqual([]);
    const history=await call("/api/promises/"+encodeURIComponent(promiseId)+"/runs");
    expect(history.status).toBe(200);
    const saved=history.data.runs.find(x=>x.runId===r.data.run.runId);
    expect(saved).toBeTruthy();
    expect(comparableRuns(saved,r.data.run)).toBe(true);
    expect(saved.aggregateVerdict).toBe(r.data.run.aggregateVerdict);
  });
});
