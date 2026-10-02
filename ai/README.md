# CalmStacks LegalConnect - AI Case Intake Assistant Module

## Overview

The `ai/` module provides automated, procedural intake normalization and entity extraction for **LegalConnect MVP**.

It translates plain-language, unstructured dispute narratives submitted by Indian citizens and MSMEs into structured, actionable legal dossiers for verified advocates, strictly adhering to **Bar Council of India (BCI) Rule 36** guidelines.

---

## Architectural Principles

1. **Statutory Non-Legal Advice Guardrail**:
   - The AI Assistant functions exclusively as a data normalizer (extracting core facts, parties, timeline, and relief sought).
   - It **strictly does NOT** evaluate merits, predict chances of winning, or formulate legal theories.
   - Every summary generated is permanently coupled with the mandatory statutory disclaimer:
     > *"LEGAL NOTICE & STATUTORY DISCLAIMER: This summary is automatically synthesized by an automated artificial intelligence system solely to assist you in organizing your factual statements for a legal practitioner. The AI Case Assistant does NOT provide legal advice, legal counsel, or legal representation. No advocate-client relationship is created by using this feature. Only a verified, enrolled advocate licensed by a State Bar Council can provide formal legal advice upon consultation."*

2. **Deterministic Dual-Mode Operation**:
   - **Local Deterministic Extractor (`src/intake-parser.ts`)**: Pure rule-based NLP taxonomy scoring, regex entity identification, and timeline extraction covering key Indian practice areas and judicial forums.
   - **Gemini LLM Adapter (`src/gemini-adapter.ts`)**: Optional LLM adapter invoked when `GEMINI_API_KEY` is present, with zero-latency deterministic fallback to the local parser on timeouts or errors.

3. **Domain Taxonomy**:
   - Banking & Cheque Bounce / Sec 138 NI Act
   - Real Estate & RERA
   - Matrimonial & Family Law
   - Labour & Employment
   - Intellectual Property
   - Consumer Protection
   - Corporate & Contractual
   - Criminal Law

---

## Directory Structure

```
ai/
├── src/
│   ├── intake-parser.ts       # Deterministic entity & taxonomy extractor
│   ├── gemini-adapter.ts      # Google Gemini LLM adapter with fallback
│   └── index.ts               # Public module exports
├── evals/
│   ├── benchmark-cases.json   # 5 canonical Indian legal dispute benchmarks
│   └── run-benchmarks.ts      # Automated benchmark harness
├── package.json
└── tsconfig.json
```

---

## Benchmark Execution

To run the automated 5-case benchmark evaluation suite:

```bash
cd ai
npm test
# or
node --no-warnings --experimental-strip-types evals/run-benchmarks.ts
```
