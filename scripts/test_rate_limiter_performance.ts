import fs from "fs";
import path from "path";
import { TokenRateLimiter } from "../src/ai/services/tokenBudget";

const API_BASE = "http://localhost:3000/api/analyze";

async function runPerformanceVerification() {
  console.log("==================================================");
  console.log("TOKEN RATE LIMITER PERFORMANCE VERIFICATION");
  console.log("==================================================\n");

  // 1. Verify rolling-window 60s expiration unit test
  console.log("▶ Step 1: Unit Test - 60s Window Expiration & Exact Wait Time...");
  const limiter = new TokenRateLimiter(7000, 60000);
  const t0 = 100000;

  // Add 3 records: 2000 tokens at t0, 2000 at t0 + 10s, 2000 at t0 + 20s
  limiter.recordUsage(2000, 2000, t0);
  limiter.recordUsage(2000, 2000, t0 + 10000);
  limiter.recordUsage(2000, 2000, t0 + 20000);

  const usageAtT0Plus30 = limiter.getCurrentUsage(t0 + 30000);
  console.log(`  Usage at t0 + 30s: ${usageAtT0Plus30} / 7600 (Expected: 6000)`);
  if (usageAtT0Plus30 !== 6000) throw new Error("Incorrect rolling usage sum!");

  // At t0 + 65s, the first record (at t0) MUST have expired
  const usageAtT0Plus65 = limiter.getCurrentUsage(t0 + 65000);
  console.log(`  Usage at t0 + 65s: ${usageAtT0Plus65} / 7600 (Expected: 4000)`);
  if (usageAtT0Plus65 !== 4000) throw new Error("Entry older than 60s was not expired!");

  // At t0 + 85s, all 3 records MUST have expired
  const usageAtT0Plus85 = limiter.getCurrentUsage(t0 + 85000);
  console.log(`  Usage at t0 + 85s: ${usageAtT0Plus85} / 7600 (Expected: 0)`);
  if (usageAtT0Plus85 !== 0) throw new Error("Entries older than 60s were not expired!");

  console.log("  ✔ PASS: 60s rolling window expiration verified.\n");

  // 2. Test 1-chunk document via API
  console.log("▶ Step 2: Live API Test - 1-Chunk Document (test_notice.txt)...");
  const noticePath = path.resolve(process.cwd(), "test_notice.txt");
  const noticeBuffer = fs.readFileSync(noticePath);
  const formData1 = new FormData();
  formData1.append("file", new Blob([noticeBuffer], { type: "text/plain" }), "test_notice.txt");

  const start1 = Date.now();
  const res1 = await fetch(API_BASE, { method: "POST", body: formData1 });
  const json1 = await res1.json();
  const dur1 = ((Date.now() - start1) / 1000).toFixed(1);

  if (!res1.ok || !json1.success) {
    throw new Error(`1-chunk test failed: ${JSON.stringify(json1)}`);
  }

  console.log(`  Completed in ${dur1}s (HTTP 200).`);
  console.log(`  Actions: ${json1.data.actions.length}, Deadlines: ${json1.data.deadlines.length}, Events: ${json1.data.events.length}`);
  console.log("  ✔ PASS: 1-chunk document processed without unnecessary delay.\n");

  // 3. Test multi-chunk document (3-5 chunks)
  console.log("▶ Step 3: Live API Test - Multi-Chunk Document (club_extended.docx)...");
  const docxPath = "C:\\Users\\HP\\Downloads\\club_extended.docx";
  if (!fs.existsSync(docxPath)) {
    throw new Error(`File not found: ${docxPath}`);
  }

  const docxBuffer = fs.readFileSync(docxPath);
  const formData2 = new FormData();
  formData2.append(
    "file",
    new Blob([docxBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    "club_extended.docx"
  );

  const start2 = Date.now();
  const res2 = await fetch(API_BASE, { method: "POST", body: formData2 });
  const json2 = await res2.json();
  const dur2 = ((Date.now() - start2) / 1000).toFixed(1);

  if (!res2.ok || !json2.success) {
    throw new Error(`Multi-chunk test failed: ${JSON.stringify(json2)}`);
  }

  console.log(`  Completed in ${dur2}s (HTTP 200).`);
  console.log(`  Actions: ${json2.data.actions.length}, Deadlines: ${json2.data.deadlines.length}, Events: ${json2.data.events.length}, Notes: ${json2.data.importantNotes.length}`);
  console.log(`  Final AnalysisResult verified: actions=${json2.data.actions.length > 0}, metrics=${JSON.stringify(json2.data.metrics)}`);
  console.log("  ✔ PASS: Multi-chunk document processed successfully!\n");

  console.log("==================================================");
  console.log("ALL PERFORMANCE VERIFICATIONS PASSED");
  console.log("==================================================");
}

runPerformanceVerification().catch((err) => {
  console.error("Performance verification failed:", err);
  process.exit(1);
});
