# Specification 03: Document Processing Pipeline Contract

**Project:** Doc2Action (Document → Action Automator)  
**Status:** Implemented & Verified on `main`  

---

## 1. Document Processing Pipeline Overview

The document processing subsystem transforms incoming static documents into structured, deduplicated action items:

```
[ Uploaded Document ]
        │
        ▼
Stage 1: File Validation (Format, Size, Integrity)
        │
        ▼
Stage 2: Text Extraction (pdf-parse / mammoth / UTF-8)
        │
        ▼
Stage 3: Chunking & Token Budgeting (Sliding window ~1800 tokens + Rolling TPM limiter)
        │
        ▼
Stage 4: Groq AI Extraction (openai/gpt-oss-20b, low reasoning, strict JSON schema)
        │
        ▼
Stage 5: Normalization & Deterministic Deduplication
        │
        ▼
Stage 6: PostgreSQL Persistence (Prisma ORM) & Bounded Retention
```

---

## 2. Pipeline Stages in Detail

### Stage 1: File Validation
- **Accepted Formats:** `.pdf` (`application/pdf`), `.docx` (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`), `.doc` (`application/msword`), `.txt` (`text/plain`).
- **File Size Limit:** 10 MB per file.
- **Batch Limit:** Up to 5 documents per upload request.

### Stage 2: Text Extraction
- **PDF Documents:** Extracted using `pdf-parse`, retrieving digital text streams, formatting text by page breaks, and filtering non-printable control characters.
- **Word Documents (`.docx`):** Extracted using `mammoth`, converting document XML trees into clean plaintext paragraphs.
- **Plain Text (`.txt`):** Decoded directly from binary buffer using UTF-8 encoding.

### Stage 3: Chunking & Token Budgeting
- **Chunking Algorithm:** Documents exceeding single-call token ceilings are segmented into sliding window chunks:
  - Chunk target size: ~1,800 tokens.
  - Chunk overlap: ~200 tokens (preserves cross-boundary sentences and directives).
  - Word boundary snapping: Chunks are split on punctuation and space boundaries, never cutting words in half.
- **Token Rate Limiting (`TokenRateLimiter`):**
  - Maintains a strict 60-second sliding window of rolling token usage.
  - Pre-allocates estimated token costs before dispatching requests.
  - Synchronizes dynamically with provider telemetry (`x-ratelimit-remaining-tokens`, `x-ratelimit-reset-tokens`).
  - Pauses execution if rolling usage approaches TPM limits, preventing provider rate-limit errors.

### Stage 4: Groq AI Extraction
- **Model:** `openai/gpt-oss-20b` (configurable via `GROQ_MODEL`).
- **Reasoning Effort:** Configured to `low` (`GROQ_REASONING_EFFORT=low`) to maximize speed, minimize token burn, and eliminate internal monologue leakage.
- **Token Ceiling:** Strict `max_completion_tokens: 1200` to prevent verbose responses.
- **Output Enforcement:** Strict JSON schema (`response_format: { type: "json_schema", strict: true }`).
- **Prompt Guidelines:**
  - Extracts genuine human obligations (omits internal software architecture or generic prose).
  - Consolidates sub-steps into clear primary actions.
  - Targets 3–8 high-value actions per section.
  - Normalizes deadlines into ISO strings (`YYYY-MM-DD`) or `null`.

### Stage 5: Normalization & Deduplication
- **Entity Normalization:** Standardizes dates, cleans quotation marks, trims whitespace, and normalizes priority strings.
- **Deterministic Deduplication:** Merges identical actions extracted across overlapping chunks:
  - Generates normalized matching keys based on title similarity and deadline congruence.
  - When duplicates occur, merges descriptions and retains the highest priority ranking.

### Stage 6: Database Persistence & Retention
- Atomic persistence of document records, actions, deadlines, events, and notes in PostgreSQL via Prisma transactions.
- Automatically purges documents older than the 20 most recent per workspace to maintain bounded database usage.

---

## 3. Note on OCR (Future Scope)

> **Planned Future Scope:**  
> Optical Character Recognition (OCR) for scanned, photographed, or image-only documents is an active research and future scope track for Doc2Action.  
> An experimental prototype utilizing the **Sarvam AI Vision API** with an offline **Tesseract.js** fallback was implemented and tested on a separate development branch (`feature/ai`).  
> Because it is experimental and not yet stabilized, it is **not merged into `main` and is not part of the production deployment**. The `main` branch processes digital text documents natively.
