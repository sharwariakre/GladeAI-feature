> *Built by Sharwari Akre for a Glade.ai feature — demonstrating product thinking around a conflict-of-interest checker for legal workflow automation platforms.*

# Glade Conflict Checker

> **This is a prototype.** It demonstrates the core UX and matching logic of an AI-powered legal conflict-of-interest checker. The client database is hardcoded, the matching is string-based, and no external systems are connected. The sections below describe what a production version of this tool would look like.

---

## What This Demo Does

A law firm must check for conflicts of interest before taking on any new client. If the firm has previously represented someone who is now adverse to the incoming client — or if a related party has a prior relationship with the firm — taking the case can violate professional responsibility rules (ABA Model Rule 1.7, 1.9, 1.10).

This demo lets you:

- Enter a new client's name, case type, and related parties
- Run a conflict check against a static database of 15 fictional prior clients
- See a result: **Clear**, **Warning**, or **Conflict**, with a table explaining every match
- Load three preset scenarios that exercise each result state

The matching logic handles case-insensitive full-name matches, last-name-only fuzzy matches, adverse-party detection (a related party of the new client is an existing firm client), and cross-case related-party overlap.

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## What Production Would Actually Look Like

### The Core Problem

A mid-size law firm might have 10,000–200,000 prior matters. Parties appear under different spellings, maiden names, DBAs, shell companies, and trust names. A single conflict can expose the firm to malpractice liability, fee forfeiture, disqualification, and bar discipline. Manual conflict checks done by a paralegal with a spreadsheet miss things. The goal of a production system is to surface every plausible match and let an attorney make the final call — not to automate the decision.

---

### Data Sources

**Internal (Practice Management Systems)**

The primary source of truth. Production integrations would pull from:

| System | Data Available |
|---|---|
| [Clio](https://app.clio.com/api/v4) | Matters, clients, contacts, opposing counsel, case status, open/close dates, billing records |
| [MyCase](https://developers.mycase.com) | Cases, parties, documents, contacts |
| [PracticePanther](https://www.practicepanther.com/api) | Matters, contacts, related parties, notes |
| [Smokeball](https://smokeball.com) | Matters, staff assignments, client relationships |
| [Filevine](https://developer.filevine.io) | Cases, contacts, roles, custom fields |

Each matter record would be normalized into a canonical schema: matter ID, client name, aliases, case type, jurisdiction, status, opened/closed dates, assigned attorneys, and a full related-party graph with roles.

**Court Records**

| Source | Data Available |
|---|---|
| [PACER](https://pacer.uscourts.gov) | Federal dockets, party names, attorney appearances, case status |
| [CourtListener / Free Law Project](https://www.courtlistener.com/api/) | Federal and state opinions, party names, attorney records |
| State court APIs | Varies by state; docket data, party names, case outcomes |

This matters because an attorney's prior appearance on a federal docket — even at a different firm — is relevant. In a production system, conflict checks would extend beyond the current firm's database to an individual attorney's full professional history.

**Corporate and Entity Records**

Conflicts involving business entities require resolving shells, subsidiaries, and affiliates. Sources:

| Source | Data Available |
|---|---|
| [OpenCorporates](https://api.opencorporates.com) | 200M+ company records, officers, registered agents, jurisdictions |
| Secretary of State filings | LLC members, registered agents, dissolution status |
| [SEC EDGAR](https://www.sec.gov/developer) | Public company filings, beneficial ownership, subsidiaries |
| [Dun & Bradstreet](https://developer.dnb.com) | Corporate family trees, D-U-N-S numbers |

If a new client's employer is a wholly owned subsidiary of a company the firm is actively adverse to, that is a conflict. Without entity resolution, that link is invisible.

**People and Relationship Data**

| Source | Data Available |
|---|---|
| State bar directories | Attorney registration, discipline history, current firm |
| [LinkedIn API](https://developer.linkedin.com) | Employment history, current role, connections |
| Public records aggregators | Aliases, maiden names, prior addresses, family relationships |

---

### The Data Model

In production, each matter would be stored with a richer schema than this demo's flat array:

```typescript
interface Matter {
  id: string;
  source: "clio" | "mycase" | "practicepanther" | "manual";
  externalId: string;

  client: {
    id: string;
    name: string;
    aliases: string[];          // maiden names, DBAs, former legal names
    type: "individual" | "entity";
    entityType?: "llc" | "corp" | "trust" | "partnership";
    parentEntities?: string[];  // resolved corporate family
    taxId?: string;
  };

  matter: {
    caseType: string;
    practiceArea: string;
    jurisdiction: string;
    court?: string;
    docketNumber?: string;
    status: "active" | "closed" | "pending";
    openedDate: string;
    closedDate?: string;
    assignedAttorneys: string[];
  };

  parties: {
    name: string;
    aliases: string[];
    role: PartyRole;
    entityType?: string;
    resolvedEntityId?: string;  // linked to OpenCorporates/EDGAR
    counselOfRecord?: string;
  }[];

  embeddings?: {
    clientNameVector: number[];   // for semantic similarity search
    matterSummaryVector: number[];
  };
}
```

---

### Matching Pipeline

The demo uses simple string normalization and last-name extraction. Production matching would be a multi-stage pipeline:

**Stage 1 — Exact and Normalized Match**
Fast lookup against an indexed database. Handles case, punctuation, common abbreviations (Corp. vs Corporation, St. vs Street). Returns high-confidence hits immediately.

**Stage 2 — Phonetic and Edit-Distance Match**
Catches misspellings and transcription errors using Soundex, Metaphone, and Jaro-Winkler similarity. Weighted by field (legal name gets higher weight than alias). Threshold-gated to avoid noise.

**Stage 3 — Semantic Embedding Match**
Party names and matter descriptions are embedded using a text embedding model and stored in a vector database (Pinecone, pgvector, or Weaviate). A new intake runs a nearest-neighbor search across the embedding space. This catches cases where a known alias or DBA wasn't in the normalized match but is semantically close — e.g., "JTK Holdings LLC" surfacing a prior matter involving "Jason T. Kessler."

**Stage 4 — Entity Resolution**
Entities are resolved against OpenCorporates and EDGAR to build a corporate graph. A conflict against a subsidiary or parent is surfaced even if the name is completely different.

**Stage 5 — LLM Analysis**
All candidate matches from stages 1–4 are passed to an LLM with the full matter context. The model reasons over the match set, assigns severity, filters false positives, and generates a plain-English explanation for each real conflict. This is the step that replaces paralegal judgment.

---

### Models and AI Stack

**Embeddings**

| Model | Use |
|---|---|
| `text-embedding-3-large` (OpenAI) | High-dimensional name and matter embeddings for semantic search |
| `voyage-law-2` (Voyage AI) | Legal-domain-tuned embeddings; better precision on entity names, case citations, and legal terminology |

Embeddings are generated at intake time and stored alongside each matter. New client intake queries are embedded at runtime and matched via ANN search.

**LLM — Conflict Analysis and Explanation**

The core reasoning layer would be Claude. Specifically:

| Model | Role |
|---|---|
| `claude-opus-4-5` | Primary conflict analysis: given a set of candidate matches with full matter context, reason about whether each constitutes a real conflict, assign severity, and draft the attorney-facing explanation |
| `claude-sonnet-4-5` | Real-time intake assistance: as the user fills out the form, suggest likely related parties, flag incomplete entries, auto-classify case type from a description |
| `claude-haiku-4-5` | High-volume preprocessing: normalize incoming party names, extract structured data from unstructured intake notes, classify entity types |

A typical conflict check prompt to Claude Opus would include:
- The new client's full intake record
- The full matter record for each candidate match (not just the matched name)
- The firm's conflict rules and jurisdiction-specific requirements
- Prior conflict check decisions for similar patterns (few-shot examples)

Claude would return a structured JSON object: match verdicts, severity scores, explanations, and a recommended action (proceed / review / decline).

**Named Entity Recognition**

Many intakes start with a description written in plain text ("representing a nurse who was injured at Mercy General during a procedure performed by Dr. Kevin Park"). An NER model extracts party names, roles, and entities before the conflict check runs. Fine-tuned legal NER models (spaCy with a legal corpus, or a fine-tuned BERT variant) outperform general-purpose models on this task.

---

### Architecture Overview

```
Intake Form (Next.js)
        │
        ▼
  API Route /api/check
        │
        ├─► Stage 1: Exact match against PostgreSQL (indexed)
        │
        ├─► Stage 2: Phonetic/edit-distance match (in-process)
        │
        ├─► Stage 3: Vector search via pgvector / Pinecone
        │
        ├─► Stage 4: Entity resolution via OpenCorporates API
        │
        └─► Stage 5: Claude Opus conflict analysis
                │
                ▼
        ConflictResult (structured JSON)
                │
                ▼
        Result UI + attorney review queue
```

Background jobs (triggered via Inngest or a cron) keep the database current:
- Nightly sync from practice management system APIs
- Weekly re-embedding of any updated matter records
- Real-time webhooks from Clio/MyCase on matter status changes

---

### What the LLM Adds That String Matching Cannot

1. **Reasoning about role combinations.** A party listed as "Business Partner" in one matter and "Employer" in another may or may not be a conflict depending on the nature of both cases. Claude can read both matter summaries and reason about whether the relationships are materially adverse.

2. **False positive suppression.** Common names ("Smith," "Johnson," "Lee") generate enormous noise in a large database. Claude can read the full context and determine that two matches with the same last name are almost certainly different people given the jurisdiction, case type, and date range.

3. **Explanation quality.** The explanation the attorney reads determines whether they act on the conflict. A string-match system can say "name found in database." Claude can say "Marcus Bellini is an active client in a Chapter 7 proceeding. The incoming client's listed employer, Apex Lending Group, is the primary creditor in that case. Representing the new client in a contract dispute with Apex would be directly adverse to the firm's position in the Bellini matter."

4. **Jurisdiction-specific analysis.** Conflict rules vary by state. Claude prompted with the relevant rules can apply them correctly without hard-coding every jurisdiction's standards.

---

### What This Demo Does Not Cover

- Authentication and attorney-level access controls
- Audit logging (every conflict check must be logged for malpractice defense)
- Matter assignment and the "screening wall" (isolating conflicted attorneys)
- Waiver and informed consent workflow
- Multi-office and lateral hire conflict checks
- Integration with document management (iManage, NetDocuments) for deeper matter context
- Real-time collaboration on conflict reviews

---

## Tech Stack (Demo)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Matching | Custom string normalization + last-name extraction |
| Database | Hardcoded static array (`lib/clientDatabase.ts`) |
| Deployment | Vercel |

---

*Built as a concept prototype for Glade.ai.*
