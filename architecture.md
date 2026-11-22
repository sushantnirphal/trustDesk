# TrustDesk Architecture Document

## Overview

TrustDesk is an **AI-first AI Support Operations Agent** designed as a case study project for the Airtribe AI-first Software Engineering Program. The platform enables support teams to handle customer conversations reliably by combining AI capabilities with policy grounding, human-in-the-loop approval gates, adversarial guardrails, and full audit traceability.

**Source:** TrustDesk.pdf (Airtribe Case Study)  
**GitHub Repository:** https://github.com/airtribe-projects/trustdesk-capstone  
**Tech Stack:** Java 17, Spring Boot 3.2, React 18, Groq API, JWT Authentication, PostgreSQL + pgvector (H2 + keyword fallback for dev)

---

## 1. Background & Objectives

### Problem Statement
Modern support teams handle thousands of repetitive but high-stakes customer conversations. A good support system must:
- Answer quickly
- Cite the right policy
- Understand customer and order context
- Route edge cases to humans
- Avoid taking risky actions without approval

Traditional chatbots fail because they hallucinate answers, ignore company policy, or cannot safely act on behalf of support teams.

### Objectives
TrustDesk must be able to:

| # | Objective |
|---|-----------|
| 1 | Ingest company support documents and retrieve relevant policy context |
| 2 | Triage incoming support tickets by intent, priority, and escalation need |
| 3 | Generate grounded draft replies with citations from the knowledge base |
| 4 | Suggest safe operational actions (replacement, refund review, coupon creation, escalation) |
| 5 | Require human approval before executing sensitive actions |
| 6 | Defend against prompt injection, unsupported policy claims, PII leakage, and excessive agency |
| 7 | Track evaluations and the minimum trace data needed to debug AI decisions |

---

## 2. Chosen Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React + Vite | React 18, Vite 5 | SPA support-agent UI |
| Backend | Java + Spring Boot | Java 17, Spring Boot 3.2.5 | REST APIs, business logic, security |
| AI Provider (LLM) | Groq API | llama-3.1-8b-instant | Triage + draft generation |
| Embeddings | OpenAI text-embedding-3-small (or mock) | 1536-dim | Vector embeddings for retrieval |
| Vector Store | pgvector (PostgreSQL extension) | pg16 | Cosine-similarity document search |
| Authentication | JWT (Spring Security) | Spring Security 6.x | Stateless token-based auth |
| Database | PostgreSQL 16 (prod) / H2 (test) | — | Persistent store for all entities |
| Build Tool | Maven | 3.9+ | Dependency management, build |
| Testing | JUnit 5, Mockito, React Testing Library | — | Unit + integration tests |
| API Docs | SpringDoc OpenAPI (Swagger UI) | — | REST API documentation |

### Why This Stack
- **Spring Boot**: Production-grade Java framework with built-in security, data access, and REST support. Easy to mock the Groq provider behind an interface.
- **React + Vite**: Fast, modern frontend with hot reloading. Simple to build the support-agent dashboard.
- **Groq**: Extremely low-latency LLM inference, ideal for real-time triage and draft generation.
- **pgvector**: Keeps vector search inside PostgreSQL — one database, ACID transactions, no separate vector service.
- **JWT**: Stateless authentication fits the "demo token or login flow" requirement without session management overhead.
- **PostgreSQL/H2**: Reliable relational store; H2 enables fast local dev and testing without Docker.

## 3. System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REACT FRONTEND (Vite + React 18)                 │
│  • Login / JWT token storage                                                │
│  • Ticket list, ticket detail, customer/order context                       │
│  • Triage trigger, draft generation, citations view                         │
│  • Approval-gated action review (refund/replacement)                        │
│  • Eval results dashboard                                                   │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │ HTTPS / REST + JWT Bearer
┌─────────────────────────▼───────────────────────────────────────────────────┐
│                     SPRING BOOT API GATEWAY / CONTROLLER                    │
│  • REST Controllers (@RestController)                                       │
│  • JWT Authentication Filter (OncePerRequestFilter)                         │
│  • Global Exception Handler                                                 │
│  • CORS configuration                                                       │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────▼────────┐ ┌─────▼─────────┐ ┌─▼──────────────────────┐
│   AI TRIAGE      │ │ KNOWLEDGE    │ │ APPROVAL-GATED         │
│   SERVICE        │ │ RETRIEVAL    │ │ TOOL EXECUTION         │
│  (@Service)      │ │   (@Service) │ │   (@Service)           │
│                  │ │              │ │                          │
│ • Groq LLM call  │ │ • KB search  │ │ • start_refund_review  │ │
│   (category,     │ │   (local/    │ │ • create_replacement_  │ │
│   priority,      │ │    hybrid)   │ │   order                  │ │
│   escalation)    │ │ • Citation   │ │ • Idempotency key      │ │
│ • JSON output    │ │   matching   │ │   (UUID)                 │ │
│ • Structured     │ │              │ │ • Human approval gate    │ │
│   parsing        │ │              │ │   (endpoint + DB)        │ │
└─────────┬────────┘ └─────┬─────────┘ └─┬──────────────────────┘
          │                │             │
          └────────────────┼─────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────────────────┐
│                    GUARDRAILS & SAFETY LAYER                                │
│  • @Component / @Service — pre/post-processing interceptors                 │
│  • Treat customer messages & retrieved docs as untrusted input              │
│  • Identity-check bypass detection                                           │
│  • Hidden-coupon prompt injection detection                                 │
│  • Hidden prompt/secret reveal detection                                     │
│  • KB-ADVERSARIAL-001: intentionally unsafe document — must not be followed │
│  • PII leakage prevention (regex masking)                                   │
│  • Excessive agency prevention                                               │
└──────────────────────────┬─────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────────────────┐
│                    GROQ AI PROVIDER ADAPTER                                  │
│  • GroqClient interface (@FeignClient or RestTemplate)                      │
│  • GroqClientImpl — real implementation                                      │
│  • GroqClientMock — test double                                              │
│  • Models: llama-3.1-8b-instant, mixtral-8x7b, etc.                         │
└──────────────────────────┬─────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────────────────┐
│                      PERSISTENT STORE (PostgreSQL / H2)                    │
│  • JPA Entities + Spring Data JPA repositories                              │
│  • Tickets, customers, orders                                                │
│  • Documents (KB), drafts                                                    │
│  • Tool calls, approvals                                                     │
│  • Traces (per AI run)                                                       │
│  • Users + roles (JWT auth)                                                  │
└──────────────────────────┬─────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────────────────┐
│                  DATA LOADING & EVALUATION                                   │
│  • CommandLineRunner / @Scheduled for data seeding                          │
│  • Load: customers, orders, tickets, tool catalog, eval cases, KB docs      │
│  • Preserve document IDs (e.g., KB-REFUND-001)                               │
│  • Eval runner: run data/eval_cases.jsonl → summary report                  │
│  • Metrics: triage accuracy, citation coverage,                             │
│    unsafe-action blocking, escalation behavior                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.1 Implemented Architecture (Detailed, with Vector DB)

This is the actual architecture implemented in the `backend/` and `frontend/` folders.

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              REACT FRONTEND (Vite, port 5173)                          │
│  LoginPage (JWT)   DashboardPage   TicketsPage + TicketDetailPage                     │
│  ApprovalsPage     EvaluationsPage KnowledgeBasePage   TracesPage   GuardrailsPage    │
│  Shared AppShell + React Query + Auth/Toast providers + accessible modals             │
│         │                  │                 │                                         │
│         └──────────────────┴─────────────────┘                                         │
│                            │ Axios (Authorization: Bearer <JWT>)                       │
│                            │ Vite proxy /api -> http://localhost:8080                   │
└────────────────────────────┼──────────────────────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                        SPRING BOOT BACKEND (port 8080)                                 │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ SECURITY LAYER                                                                    │  │
│  │  JwtAuthFilter (OncePerRequestFilter) ── validates Bearer token                   │  │
│  │  SecurityConfig (stateless, CORS, method security)                                │  │
│  │  CustomUserDetailsService ── loads users/roles                                     │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ CONTROLLERS (REST)                                                                │  │
│  │  AuthController        POST /auth/login, /auth/register, GET /auth/me             │  │
│  │  TicketController      GET  /tickets, /tickets/{id}, /tickets/{id}/context         │  │
│  │  TriageController      POST /tickets/{id}/triage, POST /tickets/classify          │  │
│  │  DraftController       POST /drafts/generate, GET /drafts/{id}                    │  │
│  │  KnowledgeBaseController POST /kb/search, GET /kb/{kbId}                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌───────────────────────┐ ┌───────────────────────────┐ ┌──────────────────────────┐  │
│  │ TriageService         │ │ DraftGenerationService    │ │ KnowledgeBaseService     │  │
│  │ • builds prompt       │ │ • retrieves KB docs       │ │ • vector search (pgvector│  │
│  │ • calls GroqClient    │ │ • builds grounded prompt  │ │   cosine distance <=>)   │  │
│  │ • parses JSON         │ │ • validates grounding     │ │ • keyword fallback       │  │
│  │ • updates Ticket      │ │ • saves Draft + citations │ │ • relevance scoring      │  │
│  └───────────┬───────────┘ └─────────────┬─────────────┘ └────────────┬─────────────┘  │
│              │                           │                            │                │
│              │                           ▼                            ▼                │
│              │              ┌─────────────────────────┐   ┌──────────────────────────┐ │
│              │              │ EmbeddingService        │   │ DocumentRepository       │ │
│              │              │ • embedToPgVector(text) │   │ • findNearestByEmbedding │ │
│              │              │ • delegates to          │   │ • searchByKeyword        │ │
│              │              │   EmbeddingClient       │   │ • findByKbId / category  │ │
│              │              └───────────┬─────────────┘   └────────────┬─────────────┘ │
│              │                          │                              │               │
│              ▼                          ▼                              ▼               │
│  ┌───────────────────────┐ ┌───────────────────────────┐  ┌──────────────────────────┐ │
│  │ GroqClient (interface)│ │ EmbeddingClient (iface)   │  │ PostgreSQL 16 + pgvector │ │
│  │ ├ GroqClientImpl      │ │ ├ OpenAiEmbeddingClient   │  │  documents               │ │
│  │ │   (Groq API)        │ │ │   (text-embedding-3)    │  │   ├ kb_id, title, content│ │
│  │ └ GroqClientMock      │ │ └ MockEmbeddingClient     │  │   ├ category             │ │
│  │     (@Profile test)   │ │   (deterministic, dev)    │  │   └ embedding vector(1536│ │
│  └───────────┬───────────┘ └─────────────┬─────────────┘  │   (ivfflat cosine index) │ │
│              │                           │                │ tickets, customers,      │ │
│              │                           │                │ orders, drafts, tool_calls│ │
│              │                           │                │ approvals, traces, users │ │
│              │                           │                └────────────▲─────────────┘ │
│              │                           │                             │               │
│  ┌───────────▼───────────────────────────▼─────────────────────────────┴─────────────┐ │
│  │ DATA LOADER (CommandLineRunner)                                                   │ │
│  │  • seeds users (admin/admin123, agent/agent123)                                   │ │
│  │  • seeds customers, orders, tickets, eval cases                                   │ │
│  │  • seeds 6 KB documents (incl. KB-ADVERSARIAL-001) + generates embeddings         │ │
│  │  • VectorStoreInitializer: CREATE EXTENSION vector, convert column, ivfflat index │ │
│  └──────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────────────────────────────┘
                             │  HTTPS (API key)
              ┌──────────────┴───────────────┐
              ▼                              ▼
┌───────────────────────────┐   ┌────────────────────────────────┐
│ GROQ API                  │   │ OPENAI EMBEDDINGS API          │
│ /chat/completions         │   │ /embeddings                    │
│ llama-3.1-8b-instant      │   │ text-embedding-3-small         │
│ (triage + draft LLM)      │   │ (only when provider=openai)    │
└───────────────────────────┘   └────────────────────────────────┘
```

### Vector Retrieval Sequence (Draft Generation)

```
Agent        Frontend        DraftController     DraftGenerationService   KnowledgeBaseService   EmbeddingService   pgvector(DB)      Groq API
  │              │                  │                      │                       │                   │              │               │
  │ click Draft  │                  │                      │                       │                   │              │               │
  │─────────────▶│ POST /drafts/generate {ticketId}        │                       │                   │              │               │
  │              │─────────────────▶│                      │                       │                   │              │               │
  │              │                  │ generateDraft()      │                       │                   │              │               │
  │              │                  │─────────────────────▶│                       │                   │              │               │
  │              │                  │                      │ search(description)   │                   │              │               │
  │              │                  │                      │──────────────────────▶│                   │              │               │
  │              │                  │                      │                       │ embed(query)      │              │               │
  │              │                  │                      │                       │──────────────────▶│              │               │
  │              │                  │                      │                       │  query vector     │              │               │
  │              │                  │                      │                       │◀──────────────────│              │               │
  │              │                  │                      │                       │ findNearest(<=>)  │              │               │
  │              │                  │                      │                       │─────────────────────────────────▶│               │
  │              │                  │                      │                       │  top-K docs+dist  │              │               │
  │              │                  │                      │                       │◀─────────────────────────────────│               │
  │              │                  │                      │◀──────────────────────│                   │              │               │
  │              │                  │                      │ build prompt + docs   │                   │              │               │
  │              │                  │                      │──────────────────────────────────────────────────────────────────────────▶│
  │              │                  │                      │  grounded JSON draft  │                   │              │               │
  │              │                  │                      │◀──────────────────────────────────────────────────────────────────────────│
  │              │                  │                      │ validate grounding    │                   │              │               │
  │              │                  │                      │ save Draft + citations│                   │              │               │
  │              │                  │◀─────────────────────│                       │                   │              │               │
  │              │◀─────────────────│ {content, citations, status, groundingScore}   │                   │              │               │
  │◀─────────────│                  │                      │                       │                   │              │               │
```

### Retrieval Modes

| Mode | When | Implementation |
|------|------|----------------|
| `vector` | PostgreSQL + pgvector (default) | Embed query → `ORDER BY embedding <=> CAST(:q AS vector)` → cosine distance → score = 1 − dist/2 |
| `keyword` | H2 / test profile / vector failure | LIKE-based term matching with title/content weights, automatic fallback |

Set via `retrieval.mode` (env `RETRIEVAL_MODE`) and `embedding.provider` (`mock` | `openai`).

### Data Flow

1. **Data Ingestion**: Customers, orders, tickets, tool catalog, eval cases, and knowledge-base documents are loaded into the persistent store. Document IDs (e.g., `KB-REFUND-001`) are preserved as evaluations depend on them.

2. **Ticket Processing**: A support agent opens a ticket via the frontend or API. The system fetches linked customer/order context.

3. **AI Triage**: The ticket is classified into a category (shipping, refund, warranty, billing, account_security, general) and assigned a priority (low, medium, high, urgent). Escalation need is determined.

4. **Knowledge Retrieval**: Relevant policy documents are retrieved from the knowledge base using the retrieval layer (full-text search, vector DB, hybrid, or local substitute).

5. **Draft Generation**: A grounded draft reply is generated using ticket context + customer/order context + retrieved documents, with citation IDs. If the answer isn't supported by retrieved policy, the system refuses or escalates.

6. **Guardrails Check**: Customer messages and retrieved documents are treated as untrusted input. Adversarial patterns (prompt injection, identity bypass, secret reveal) are detected and blocked.

7. **Approval-Gated Action**: If a sensitive action is recommended (e.g., `start_refund_review` or `create_replacement_order`), the AI recommends but a human must approve before execution. An idempotency key prevents duplicate actions on retry.

8. **Tracing**: A trace is stored per AI run containing: ticket ID, run type, retrieved doc IDs, tool actions, guardrail result, and final status.

9. **Evaluation**: The eval runner processes `data/eval_cases.jsonl` and produces a summary report covering triage accuracy, citation coverage, unsafe-action blocking, and escalation behavior.

---

## 4. Key Features

### 3.1 Data Loading
- Load customers, orders, tickets, tool catalog, eval cases, and knowledge-base documents
- Preserve document IDs (e.g., `KB-REFUND-001`) — evaluations depend on them
- Evaluate return/warranty windows against each ticket's `created_at`, never the current date

### 3.2 Ticket APIs and Support-Agent Frontend
- RESTful APIs to list tickets, fetch a ticket, and view linked customer/order context
- Production-style React SPA with JWT auth, protected routes, dashboard metrics, URL-driven ticket filters, ticket detail with triage, cited drafts, approval-gated actions and trace timeline, approval queue, evaluation runner, knowledge-base search, trace explorer, and guardrail playground

### 3.3 Knowledge Retrieval & Cited Draft Replies
- Search knowledge-base docs for policy context relevant to a ticket
- Generate a draft using ticket + customer/order context + retrieved documents, with citation IDs
- Refuse or escalate when the answer isn't supported by retrieved policy

### 3.4 AI Triage
- Classify into category: shipping, refund, warranty, billing, account_security, general
- Assign priority: low, medium, high, urgent
- Decide on escalation

### 3.5 One Approval-Gated Tool Action
- Implement `start_refund_review` or `create_replacement_order`
- AI recommends; a human must approve before execution
- Enforce an idempotency key so retries can't create duplicate actions

#### Implemented approval workflow

```
POST /tickets/{id}/actions/recommend   → rule-based recommendation (no side effects)
POST /tickets/{id}/actions             → ToolCall(PENDING_APPROVAL) + idempotency key
POST /actions/{id}/approve             → Approval(APPROVED) + simulated execution (EXECUTED)
POST /actions/{id}/reject              → Approval(REJECTED), never executed
```

Safety properties:
- The AI can only **propose**; execution requires an authenticated human (`AGENT`/`ADMIN`).
- One active action per `(ticket, actionType)`; repeated idempotency keys return the original record.
- Approval is idempotent: re-approving returns the existing result, never a second execution.
- Excessive-agency guards: security/escalated tickets cannot trigger monetary actions; refunds cannot exceed the order total; actions require a linked order and an eligible category.
- Execution is simulated (`confirmationId`, `simulated: true`) — no money moves.

### 3.6 Guardrails for Adversarial Cases
- Treat customer messages and retrieved documents as untrusted input
- Correctly handle: identity-check bypass requests, hidden-coupon prompt injection, and requests to reveal hidden prompts/secrets
- `KB-ADVERSARIAL-001` is an intentionally unsafe document — must not be followed as an instruction

#### Implemented guardrail pipeline

| Stage | Check | Outcome |
|-------|-------|---------|
| Input | Prompt injection (`ignore previous instructions`, hidden coupon, `system prompt`, jailbreak) | `BLOCK` — no LLM call |
| Input | Secret / credential / API-key reveal requests | `BLOCK` — no LLM call |
| Input | Identity-check bypass ("skip verification", "I am the admin") | `ESCALATE` to human |
| Input | PII (email, phone, card, SSN) | `WARN` + redact before LLM/logs |
| Retrieval | `KB-ADVERSARIAL-001`, `UNSAFE` titles, or docs containing injection text | Excluded from LLM context, ID recorded in the trace |
| Output | Leaked system prompt / secrets in AI text | `BLOCK` — replaced with safe refusal |
| Output | PII in AI text | Redacted before returning |

- `GuardrailAction` severity ordering: `ALLOW < WARN < ESCALATE < BLOCK`
- Every response exposes `guardrailAction`, `guardrailViolations`, and `blockedDocumentIds`
- `POST /guardrails/check` allows demoing the layer directly

### 3.7 Minimal Traces & Evaluation Runner
- Store a trace per AI run: ticket ID, run type, retrieved doc IDs, tool actions, guardrail result, final status
- One command/endpoint/flow to run `data/eval_cases.jsonl` and produce a summary report (triage accuracy, citation coverage, unsafe-action blocking, escalation behavior)

#### Implemented trace + evaluation

- `TraceService` records `TRIAGE`, `DRAFT` and `ACTION` runs automatically (ticket, doc IDs, tool actions, guardrail outcome, status).
- `GET /traces`, `/traces/{id}`, `/traces/ticket/{id}`, `/traces/type/{runType}` expose them.
- `POST /eval/run` runs the seeded eval cases (7, including 2 adversarial) and returns:
  - `triageAccuracy`, `escalationAccuracy`, `citationCoverage`, `unsafeActionBlockingRate`, `overallPassRate`
  - per-case expected/actual values, guardrail action and notes
- Adversarial cases assert that injection/identity-bypass inputs are blocked or escalated; citation coverage checks that a **safe** KB document of the right category is retrieved.

---

## 5. Technical Requirements

| Requirement | Description |
|-------------|-------------|
| RESTful APIs | Expose core functionality as RESTful APIs (or clearly documented equivalent) |
| Persistent Store | Reliable persistent store for tickets, customers, orders, documents, drafts, tool calls, approvals, and traces |
| Authentication | Simple authentication (demo token or login flow); full RBAC is Good-to-Have |
| Retrieval Layer | Full-text search, vector DB, hybrid, or documented local substitute |
| AI Provider Adapter | Keep the AI provider behind an adapter so it can be mocked in tests |
| Idempotency | Use idempotency for the approval-gated tool action |
| Automated Tests | Provide automated tests for critical flows and guardrails |
| Non-Blocking | Avoid blocking unrelated requests during long-running AI/eval operations |
| Provider Agnostic | No dependency on any specific language, framework, or hosted AI provider |

---

## 6. Assessment Criteria

| Category | Weight | Criteria |
|----------|--------|----------|
| Must-Have Workflow | 60% | Data loading, required APIs, simple frontend, triage, cited drafts, one approval-gated action with idempotency, minimal traces, and evals — all working |
| AI Quality & Guardrails | 25% | Answers grounded in policy, cited correctly, escalated when uncertain, safe on adversarial eval cases |
| Engineering Quality, Documentation & Demo | 15% | Maintainable code, clear setup, documented design decisions, demo clearly shows the core workflow |

Good-to-Have and stretch work can strengthen the project but does not compensate for missing Must-Have functionality.

---

## 7. Deliverables

1. The final, functional product
2. README file covering setup instructions, API documentation, architecture, design decisions, evaluation flow, and known limitations
3. Public link of the GitHub repository
4. Explainer video demonstrating the project workflow, including ticket triage, cited draft generation, approval-gated action, guardrail handling, and evaluation results
5. Evaluation summary showing triage accuracy, citation coverage, unsafe-action blocking, and escalation behavior

---

## 8. Design Decisions

### Architecture Style
- **Layered architecture**: Controllers → Service interfaces → Service implementations → Repositories. Controllers never access repositories directly.
- **Service interface + impl**: Auth, Customer, Order, Ticket, Triage, Draft and Eval each expose an interface (`XxxService`) with a separate `XxxServiceImpl` implementation.
- **Adapter pattern**: AI provider is abstracted behind an interface to enable mocking in tests and provider-agnostic implementation
- **Human-in-the-loop**: Sensitive actions require explicit human approval before execution

### Safety & Security
- **Untrusted input treatment**: All customer messages and retrieved documents are treated as untrusted input
- **Guardrail layer**: Dedicated layer for detecting and blocking adversarial inputs (prompt injection, identity bypass, secret reveal)
- **Idempotency**: Idempotency keys on approval-gated actions prevent duplicate executions from retries

### Observability
- **Per-run traces**: Every AI run produces a trace record with ticket ID, run type, retrieved doc IDs, tool actions, guardrail result, and final status
- **Evaluation runner**: Automated eval pipeline with summary reporting on key quality metrics

---

## 9. Data Model (Java/JPA Entities)

```
Ticket:        @Entity — id (@Id, @GeneratedValue), customer_id (@ManyToOne), 
                order_id (@ManyToOne), category (Enum), priority (Enum), 
                status (Enum), created_at, escalation_needed

Customer:      @Entity — id, name, email, ...

Order:         @Entity — id, customer_id (@ManyToOne), items, total, 
                status, created_at, warranty_window

Document:      @Entity — id, title, content, kb_id (e.g., KB-REFUND-001), category

Draft:         @Entity — id, ticket_id (@ManyToOne), content, citation_ids, status

ToolCall:      @Entity — id, ticket_id (@ManyToOne), action_type (Enum), 
                parameters, idempotency_key (@Column(unique=true)), 
                status (Enum), approved_by, approved_at

Approval:      @Entity — id, tool_call_id (@OneToOne), approver_id, 
                decision (Enum), timestamp

Trace:         @Entity — id, ticket_id, run_type, retrieved_doc_ids, 
                tool_actions, guardrail_result, final_status, timestamp

User (Auth):   @Entity — id, username (@Column(unique=true)), password, 
                role (Enum: AGENT, ADMIN)

EvalCase:      @Entity — id, input, expected_output, category, ...
```

---

## 10. Known Limitations

- Full RBAC is Good-to-Have (not required for MVP)
- Retrieval layer can be a documented local substitute instead of full vector DB
- Frontend is implemented as a React SPA; add automated frontend tests and ESLint in the post-capstone hardening pass
- No dependency on any specific language, framework, or hosted AI provider — implementation flexibility is intentional

---

*Generated from TrustDesk.pdf (Airtribe Case Study — AI-first Software Engineering Program)*