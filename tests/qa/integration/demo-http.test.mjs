import { describe, it, expect } from "vitest";
import { RECORDS } from "../fixtures/contract-v1.mjs";

const enabled=process.env.QA_INTEGRATION==="1" && process.env.QA_DEMO_TOKENS_READY==="1";
const suite=enabled?describe:describe.skip;
const TARGET="http://127.0.0.1:4000";
const alice=process.env.QA_ALICE_TOKEN;
const bob=process.env.QA_BOB_TOKEN;
if(enabled && (!alice||!bob)) throw new Error("Set QA_ALICE_TOKEN and QA_BOB_TOKEN in this terminal, never in Git");

async function get(path, token) {
  const headers=token?{authorization:"Bearer "+token}:{};
  const res=await fetch(TARGET+path,{headers,redirect:"manual",signal:AbortSignal.timeout(2000)});
  return {status:res.status,body:await res.json()};
}

suite("Real synthetic student portal (protected revision)", () => {
  it("identifies synthetic Alice and Bob",async()=>{
    expect((await get("/api/me",alice)).body.userId).toBe("alice");
    expect((await get("/api/me",bob)).body.userId).toBe("bob");
  });
  it("T1 and T2 return the exact owned synthetic fixture",async()=>{
    for(const [actor,token,record] of [["alice",alice,RECORDS.aliceExam],["bob",bob,RECORDS.bobExam]]){
      const r=await get(record.path,token);
      expect(r.status).toBe(200);
      expect(r.body).toMatchObject({examId:record.resourceId,ownerUserId:actor,privateMarker:record.marker});
    }
  });
  it("T3 and T4 deny cross-owner reads with valid sessions",async()=>{
    expect((await get(RECORDS.aliceExam.path,bob)).status).toBe(403);
    expect((await get(RECORDS.bobExam.path,alice)).status).toBe(403);
    expect((await get("/api/me",bob)).status).toBe(200);
    expect((await get("/api/me",alice)).status).toBe(200);
  });
  it("T5 denies anonymous retrieval",async()=>{
    expect((await get(RECORDS.aliceExam.path)).status).toBe(401);
  });
});
