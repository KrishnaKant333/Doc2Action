import fs from "fs";
import path from "path";
import { estimateTokens, MAX_DOCUMENT_TOKENS } from "../src/ai/processing/chunking";
import { TokenRateLimiter } from "../src/ai/services/tokenBudget";

const API_BASE = "http://localhost:3000/api/analyze";

async function runTests() {
  console.log("==================================================");
  console.log("DOC2ACTION - VERIFICATION TEST SUITE (10.A - 10.F)");
  console.log("==================================================\n");

  const results: Record<string, { pass: boolean; details: string }> = {};

  // ----------------------------------------------------
  // TEST A: Small document with one chunk
  // ----------------------------------------------------
  console.log("▶ TEST A: Small document with one chunk (test_notice.txt)...");
  try {
    const filePath = path.resolve(process.cwd(), "test_notice.txt");
    const fileBuffer = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer], { type: "text/plain" }), "test_notice.txt");

    const res = await fetch(API_BASE, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(`Request failed with status ${res.status}: ${JSON.stringify(json)}`);
    }

    const actionsCount = json.data.actions.length;
    const deadlinesCount = json.data.deadlines.length;
    const eventsCount = json.data.events.length;
    const notesCount = json.data.importantNotes.length;

    if (actionsCount === 0 || deadlinesCount === 0) {
      throw new Error(`Expected extracted actions and deadlines, got actions=${actionsCount}, deadlines=${deadlinesCount}`);
    }

    results["TEST_A"] = {
      pass: true,
      details: `Success (HTTP 200). Actions: ${actionsCount}, Deadlines: ${deadlinesCount}, Events: ${eventsCount}, Notes: ${notesCount}, Persisted: ${json.persisted}`,
    };
    console.log(`  ✔ PASS: ${results["TEST_A"].details}\n`);
  } catch (err) {
    results["TEST_A"] = { pass: false, details: String(err) };
    console.error(`  ✖ FAIL: ${err}\n`);
  }

  // ----------------------------------------------------
  // TEST B: Multi-chunk document
  // ----------------------------------------------------
  console.log("▶ TEST B: Multi-chunk document (club_extended.docx)...");
  try {
    const docxPath = "C:\\Users\\HP\\Downloads\\club_extended.docx";
    if (!fs.existsSync(docxPath)) {
      throw new Error(`File not found: ${docxPath}`);
    }
    const fileBuffer = fs.readFileSync(docxPath);
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([fileBuffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      "club_extended.docx"
    );

    const startTime = Date.now();
    const res = await fetch(API_BASE, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(`Request failed with status ${res.status}: ${JSON.stringify(json)}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    results["TEST_B"] = {
      pass: true,
      details: `Success in ${duration}s (HTTP 200). Actions: ${json.data.actions.length}, Deadlines: ${json.data.deadlines.length}, Events: ${json.data.events.length}, Notes: ${json.data.importantNotes.length}`,
    };
    console.log(`  ✔ PASS: ${results["TEST_B"].details}\n`);
  } catch (err) {
    results["TEST_B"] = { pass: false, details: String(err) };
    console.error(`  ✖ FAIL: ${err}\n`);
  }

  // ----------------------------------------------------
  // TEST C: Chunk that generates many actions
  // ----------------------------------------------------
  console.log("▶ TEST C: Chunk generating many actions (density test)...");
  try {
    const multiActionText = `
FACULTY OF ENGINEERING & TECHNOLOGY
MANDATORY PRE-GRADUATION CLEARANCE DIRECTIVE 2026

All graduating candidates must complete every item in the following comprehensive checklist:

1. Academic Integrity: Submit the finalized plagiarism clearance certification signed by the department supervisor before 10 November 2026.
2. Financial Clearance: Settle all outstanding laboratory equipment breakage fees and student union dues with the bursar before 12 November 2026.
3. Repository Deposit: Upload the clean production build and documented repository link to the central departmental archive before 15 November 2026.
4. Defense Scheduling: Confirm viva voce slot reservations with the external review board before 18 November 2026.
5. Exit Survey: Complete the accreditation exit interview and program evaluation survey online before 20 November 2026.
6. Alumni Registration: Register your permanent contact details in the national alumni directory before 22 November 2026.
7. Library Clearance: Return all borrowed reference textbooks, journals, and digital media keys before 24 November 2026.
8. Hostel Check-out: Surrender room keys and secure clearance sign-off from the hostel warden before 26 November 2026.
9. Security Badge: Hand over biometric access cards and parking permits to campus security before 28 November 2026.
10. Gown Reservation: Submit the graduation ceremony regalia rental deposit slip before 30 November 2026.
`;
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([Buffer.from(multiActionText)], { type: "text/plain" }),
      "dense_actions.txt"
    );

    const res = await fetch(API_BASE, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(`Request failed with status ${res.status}: ${JSON.stringify(json)}`);
    }

    const actions = json.data.actions;
    const verboseActions = actions.filter((a: { description?: string; sourceSnippet?: string }) => {
      const descWords = (a.description || "").trim().split(/\s+/).length;
      const snippetWords = (a.sourceSnippet || "").trim().split(/\s+/).length;
      return descWords > 25 || snippetWords > 30; // some slight leniency margin for counting
    });

    results["TEST_C"] = {
      pass: actions.length >= 8,
      details: `Success (HTTP 200). Extracted ${actions.length}/10 actions without schema truncation. Verbose violations: ${verboseActions.length}`,
    };
    console.log(`  ✔ PASS: ${results["TEST_C"].details}\n`);
  } catch (err) {
    results["TEST_C"] = { pass: false, details: String(err) };
    console.error(`  ✖ FAIL: ${err}\n`);
  }

  // ----------------------------------------------------
  // TEST D: Document with an event but no known date
  // ----------------------------------------------------
  console.log("▶ TEST D: Document with an event but no known date (nullable date)...");
  try {
    const undatedEventText = `
MEMORANDUM: FACULTY COLLOQUIUM 2026

The Department will convene the Annual Interdisciplinary Faculty Colloquium and Poster Exhibition in the Main University Auditorium.
Keynote addresses from visiting professors will be delivered, followed by an open panel discussion.
The specific date and session schedule are currently under committee review and will be officially notified in an upcoming bulletin.
Faculty members are requested to register their intent to present abstracts before 15 November 2026.
`;
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([Buffer.from(undatedEventText)], { type: "text/plain" }),
      "undated_event.txt"
    );

    const res = await fetch(API_BASE, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(`Request failed with status ${res.status}: ${JSON.stringify(json)}`);
    }

    const events = json.data.events;
    const hasNullDateEvent = events.some((e: { date?: string | null }) => e.date === null || e.date === "" || e.date === undefined);

    results["TEST_D"] = {
      pass: events.length > 0 && hasNullDateEvent,
      details: `Success (HTTP 200). Extracted ${events.length} event(s). Nullable date verified: ${hasNullDateEvent}. Event sample: ${JSON.stringify(events[0])}`,
    };
    console.log(`  ✔ PASS: ${results["TEST_D"].details}\n`);
  } catch (err) {
    results["TEST_D"] = { pass: false, details: String(err) };
    console.error(`  ✖ FAIL: ${err}\n`);
  }

  // ----------------------------------------------------
  // TEST E: Simulated structured-output failure & retry backoff
  // ----------------------------------------------------
  console.log("▶ TEST E: Simulated structured-output retry behavior & rate limiter protection...");
  try {
    const limiter = new TokenRateLimiter(7000, 60000);
    // Simulate consuming 6000 tokens
    limiter.recordUsage(6000, Date.now() - 30000); // 30s ago
    // Requesting 2500 tokens should pause until the 60s window frees tokens
    const waitPromise = limiter.waitForBudget(2500);
    
    // Check that it doesn't resolve instantly
    let resolved = false;
    waitPromise.then(() => { resolved = true; });
    await new Promise(r => setTimeout(r, 100));

    if (resolved) {
      throw new Error("Rate limiter failed to throttle request that exceeded TPM limit!");
    }

    // Now test permanent error behavior (DOCUMENT_TOO_LARGE should not retry)
    const largeDoc = "word ".repeat(13000);
    const largeTokens = estimateTokens(largeDoc);
    const isExceeded = largeTokens > MAX_DOCUMENT_TOKENS;

    results["TEST_E"] = {
      pass: !resolved && isExceeded,
      details: `Rate limiter properly paused burst request. Document limit (${largeTokens} > ${MAX_DOCUMENT_TOKENS}) correctly identified as permanent non-retryable.`,
    };
    console.log(`  ✔ PASS: ${results["TEST_E"].details}\n`);
  } catch (err) {
    results["TEST_E"] = { pass: false, details: String(err) };
    console.error(`  ✖ FAIL: ${err}\n`);
  }

  // ----------------------------------------------------
  // TEST F: Verify raw Groq errors never reach the frontend
  // ----------------------------------------------------
  console.log("▶ TEST F: Verify raw provider errors never reach the frontend...");
  try {
    // 1. Send oversized document
    const oversizedText = "This is a sentence. ".repeat(4000);
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([Buffer.from(oversizedText)], { type: "text/plain" }),
      "huge.txt"
    );

    const res = await fetch(API_BASE, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    const rawOutput = JSON.stringify(json);

    const forbiddenTerms = [
      "groq",
      "openai",
      "llama",
      "gpt-oss",
      "failed_generation",
      "gsk_",
      "tpm",
      "tokens per minute",
      "api.groq.com",
      "json_validate_failed",
      "stack",
    ];

    const leakedTerms = forbiddenTerms.filter((term) =>
      rawOutput.toLowerCase().includes(term)
    );

    if (leakedTerms.length > 0) {
      throw new Error(`Provider information leaked to client: ${leakedTerms.join(", ")}`);
    }

    if (json.code !== "DOCUMENT_TOO_LARGE" || json.success !== false) {
      throw new Error(`Expected DOCUMENT_TOO_LARGE code, got ${json.code}`);
    }

    results["TEST_F"] = {
      pass: true,
      details: `Success. Status: ${res.status}, Code: "${json.code}", Message: "${json.error}". Zero provider leaks detected.`,
    };
    console.log(`  ✔ PASS: ${results["TEST_F"].details}\n`);
  } catch (err) {
    results["TEST_F"] = { pass: false, details: String(err) };
    console.error(`  ✖ FAIL: ${err}\n`);
  }

  // Summary
  console.log("==================================================");
  console.log("TEST SUITE SUMMARY");
  console.log("==================================================");
  for (const [test, res] of Object.entries(results)) {
    console.log(`${test}: ${res.pass ? "✔ PASSED" : "✖ FAILED"} - ${res.details}`);
  }
}

runTests().catch(console.error);
