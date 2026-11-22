# TrustDesk — Implementation Plan

**Tech Stack:** Java 17 · Spring Boot 3.2 · React 18 + Vite · Groq API · JWT · PostgreSQL 16 + pgvector (H2 fallback) · Maven   
**Goal:** Build the Must-Have Workflow (60% weight) + AI Quality & Guardrails (25%) + Engineering Quality (15%)

> **Status:** Modules 1–15 are implemented in `backend/` (20 automated tests passing).
> Remaining work is frontend pages for approvals/traces/eval and production hardening.

---

## 1. Project Structure (Monorepo)

```
trustdesk/
├── backend/                      # Spring Boot application
│   ├── src/main/java/com/trustdesk/
│   │   ├── config/               # Security, OpenAPI, CORS, Groq config
│   │   ├── controller/           # REST controllers
│   │   ├── service/              # Business logic services
│   │   ├── dto/                  # Request/Response DTOs
│   │   ├── entity/               # JPA entities
│   │   ├── repository/           # Spring Data JPA repositories
│   │   ├── security/             # JWT filter, utils, user details
│   │   ├── guardrail/            # Prompt injection, PII, adversarial checks
│   │   ├── groq/                 # Groq client adapter (interface + impl + mock)
│   │   ├── retrieval/            # Knowledge-base search (local/hybrid)
│   │   ├── eval/                 # Evaluation runner
│   │   ├── loader/               # Data seeding (CommandLineRunner)
│   │   └── exception/            # Global exception handler
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── data/                 # Seed JSON/CSV files
│   │   └── kb/                   # Knowledge-base documents (KB-*.txt)
│   └── src/test/                 # Unit + integration tests
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Route-level pages
│   │   ├── services/             # Axios API client + auth service
│   │   ├── store/                # Zustand/Redux state (auth, tickets)
│   │   ├── hooks/                # Custom hooks
│   │   ├── utils/                # Validation, formatting
│   │   └── App.tsx / App.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── data/
│   └── eval_cases.jsonl          # Evaluation cases
├── docker-compose.yml            # (Optional) Postgres + backend + frontend
├── README.md
└── architecture.md
```

---

## 2. Backend Plan (Spring Boot)

### 2.1 Module: Security & Authentication (JWT)

| Component | Details |
|-----------|---------|
| `JwtAuthFilter` | `OncePerRequestFilter` — extracts Bearer token, validates signature, sets `SecurityContext` |
| `JwtUtil` | `io.jsonwebtoken` — generate token (username + roles + expiration), validate, extract claims |
| `UserDetailsServiceImpl` | Loads `User` entity by username for Spring Security |
| `SecurityConfig` | `HttpSecurity` — stateless (SESSION_CREATION_STATELESS), permit login/register, protect all other endpoints |
| `AuthController` | `POST /auth/login` → returns JWT; `POST /auth/register` (demo) |

**JWT Payload:** `{ sub: username, roles: [AGENT|ADMIN], exp, iat }`  
**Token Expiry:** 8 hours (configurable)

### 2.2 Module: Data Loading

| Component | Details |
|-----------|---------|
| `DataLoader` | `CommandLineRunner` (runs on startup) — loads customers, orders, tickets, KB documents from `src/main/resources/data/` |
| `KBDocumentLoader` | Reads `src/main/resources/kb/*.txt`, preserves IDs (`KB-REFUND-001`, etc.), stores in `document` table |
| `EvalCaseLoader` | Reads `data/eval_cases.jsonl` for the evaluation runner |

**Important:** Evaluate return/warranty windows against each ticket's `created_at`, **never** the current date.

### 2.3 Module: Ticket & Context APIs

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/tickets` | GET | List all tickets (with pagination) | JWT |
| `/tickets/{id}` | GET | Fetch ticket + linked customer + order context | JWT |
| `/tickets` | POST | Create a new ticket | JWT |
| `/customers/{id}` | GET | Customer profile | JWT |
| `/orders/{id}` | GET | Order details + warranty window | JWT |

### 2.4 Module: AI Triage Service

| Component | Details |
|-----------|---------|
| `TriageService` | Calls Groq via `GroqClient` to classify ticket |
| `TriageRequestDTO` | ticketText, customerContext, orderContext |
| `TriageResponseDTO` | category (shipping/refund/warranty/billing/account_security/general), priority (low/medium/high/urgent), escalation (boolean), reasoning |

**Groq Prompt (system):**  
"Classify this support ticket into one of: shipping, refund, warranty, billing, account_security, general. Assign priority low/medium/high/urgent. Decide if escalation is needed. Respond with JSON only."

### 2.5 Module: Knowledge Retrieval & Cited Drafts

| Component | Details |
|-----------|---------|
| `KnowledgeBaseService` | Full-text search / keyword matching against KB documents. Local substitute (no vector DB required for MVP). Returns matched doc IDs + snippets. |
| `DraftGenerationService` | Builds prompt: ticket + customer/order context + retrieved KB docs → calls Groq → returns draft + citation IDs |
| `DraftController` | `POST /drafts/generate` |

**Draft Prompt (system):**  
"You are a support agent. Answer using ONLY the retrieved policy documents. Cite document IDs (e.g., KB-REFUND-001). If the answer is not supported, refuse or escalate. Do not invent policies."

### 2.6 Module: Guardrails & Safety Layer

| Guardrail | Implementation |
|-----------|----------------|
| **Prompt Injection** | Detect hidden-coupon, "ignore previous instructions", system-prompt-reveal patterns via regex + Groq secondary check |
| **Identity Bypass** | Detect requests to skip identity verification; block and escalate |
| **PII Leakage** | Mask emails, phone numbers, card numbers in logs and responses |
| **KB-ADVERSARIAL-001** | Flag document ID `KB-ADVERSARIAL-001` as unsafe — never follow its instructions |
| **Excessive Agency** | AI can only *recommend* actions; never auto-execute sensitive tools |

**Guardrail Service:** Runs before and after every Groq call. Returns `GuardrailResult { passed: boolean, violations: List<String>, action: BLOCK|WARN|ESCALATE }`.

### 2.7 Module: Approval-Gated Tool Action

| Component | Details |
|-----------|---------|
| `ToolActionService` | Implements `start_refund_review` and `create_replacement_order` |
| `IdempotencyKey` | UUID generated per action request; stored in DB; duplicate key → returns existing result (no duplicate action) |
| `ApprovalGateway` | AI recommends → `POST /actions/{id}/approve` (human) → executes |
| `ToolCall` Entity | status: PENDING_APPROVAL | APPROVED | REJECTED | EXECUTED | FAILED |

**Endpoints:**
- `POST /actions/recommend` — AI suggests action, returns pending ToolCall ID
- `POST /actions/{id}/approve` — Human approves
- `POST /actions/{id}/reject` — Human rejects

### 2.8 Module: Groq AI Provider Adapter

| Component | Details |
|-----------|---------|
| `GroqClient` (interface) | `String generate(List<Message> messages, double temperature)` — mockable |
| `GroqClientImpl` | `RestTemplate`/`WebClient` call to `https://api.groq.com/openai/v1/chat/completions` with `Authorization: Bearer <GROQ_API_KEY>` |
| `GroqClientMock` | Returns hardcoded responses for unit tests (no network) |

**Models:** `llama-3.1-8b-instant` (fast, cheap), fallback `mixtral-8x7b-32768`

### 2.9 Module: Traces & Evaluation

| Component | Details |
|-----------|---------|
| `TraceService` | Stores one `Trace` per AI run: ticket ID, run type (triage/draft/action), retrieved doc IDs, tool actions, guardrail result, final status |
| `EvaluationRunner` | `CommandLineRunner` or `@Scheduled` — reads `data/eval_cases.jsonl`, runs each case, compares output, produces summary |
| `EvalController` | `POST /eval/run` — trigger evaluation via HTTP |

**Eval Metrics:**
- Triage accuracy (% correct category)
- Citation coverage (% drafts with valid citations)
- Unsafe-action blocking (% adversarial cases blocked)
- Escalation behavior (% uncertain cases escalated)

### 2.10 Database Schema (JPA)

See `architecture.md` Section 9 for entity definitions with JPA annotations.

**Key constraints:**
- `idempotency_key` on `tool_call` — `UNIQUE`
- `kb_id` on `document` — `UNIQUE`
- Foreign keys: ticket→customer, ticket→order, draft→ticket, tool_call→ticket, trace→ticket

---

## 3. Frontend Plan (React + Vite)

### 3.1 Tech Choices

| Choice | Reason |
|--------|--------|
| Vite | Fast dev server, optimized build |
| React 18 | Component-based UI |
| React Router DOM | Client-side routing |
| Axios | HTTP client with JWT interceptor |
| Zustand (lightweight) | Auth + ticket state management |
| Tailwind CSS | Rapid styling (optional, or plain CSS) |
| Lucide React | Icons |

### 3.2 Folder Structure

```
frontend/src/
├── components/
│   ├── common/           # Button, Input, Card, Modal, Spinner
│   ├── layout/           # Navbar, Sidebar, ProtectedRoute
│   ├── tickets/          # TicketList, TicketCard, TicketDetail
│   ├── draft/            # DraftViewer, CitationList
│   ├── action/           # ActionReview, ApproveRejectButtons
│   └── eval/             # EvalResults, MetricCard
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx       # Ticket list + quick actions
│   ├── TicketPage.jsx          # Ticket detail + triage + draft
│   ├── ApprovalsPage.jsx       # Pending actions awaiting human approval
│   ├── EvalPage.jsx            # Evaluation results dashboard
│   └── NotFoundPage.jsx
├── services/
│   ├── api.js              # Axios instance + base URL
│   ├── authService.js        # login, register, getToken, setToken
│   ├── ticketService.js      # ticket CRUD
│   ├── draftService.js       # generate draft
│   ├── actionService.js      # recommend, approve, reject
│   └── evalService.js        # run eval
├── store/
│   ├── authStore.js          # token, user, login, logout
│   └── ticketStore.js        # selected ticket, draft
├── hooks/
│   ├── useAuth.js
│   └── useApi.js
├── utils/
│   ├── validate.js
│   └── format.js
├── App.jsx
└── main.jsx
```

### 3.3 Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage | Username/password → JWT → redirect to `/dashboard` |
| `/dashboard` | DashboardPage | Ticket list, search, filter by status/priority |
| `/tickets/:id` | TicketPage | Ticket detail, customer/order context, trigger triage, generate draft, view citations |
| `/approvals` | ApprovalsPage | List pending approval-gated actions, approve/reject |
| `/eval` | EvalPage | Run evaluation, view metrics (triage accuracy, citation coverage, etc.) |

### 3.4 Key User Flows

1. **Login:** User enters credentials → JWT stored in `localStorage` → axios interceptor attaches `Authorization: Bearer <token>` to all requests.
2. **Triage:** Open ticket → click "Run Triage" → POST to backend → displays category, priority, escalation flag.
3. **Draft:** After triage → click "Generate Draft" → backend retrieves KB docs + calls Groq → displays draft with citation IDs (clickable to show source doc).
4. **Action:** Draft may recommend `start_refund_review` → appears in Approvals page → human clicks Approve → backend executes (idempotency key prevents duplicates).
5. **Eval:** Click "Run Eval" → backend processes `eval_cases.jsonl` → displays summary report.

### 3.5 Auth Guard

`ProtectedRoute` wrapper: if no valid JWT → redirect to `/login`. Token expiry handled via 401 interceptor → auto logout.

---

## 4. Detailed API Contract (Backend)

### Auth
```
POST   /auth/login        { username, password } → { token, user }
POST   /auth/register     { username, password, role } → { user }
```

### Tickets
```
GET    /tickets?page=0&size=20&status=open
GET    /tickets/{id}      → Ticket + Customer + Order
POST   /tickets           { customerId, orderId, subject, description }
```

### Triage
```
POST   /tickets/{id}/triage   → { category, priority, escalationNeeded, reasoning }
```

### Drafts
```
POST   /drafts/generate           { ticketId } → { draftId, content, citationIds[], status }
PATCH  /drafts/{id}/review        { decision: APPROVED|REJECTED }
GET    /drafts/{id}
```

### Actions (Approval-Gated)
```
POST   /tickets/{id}/actions/recommend        → ActionRecommendation
POST   /tickets/{id}/actions                  → { toolCallId, actionType, parameters, status: PENDING_APPROVAL, duplicate }
GET    /tickets/{id}/actions                  → List[ToolCall]
GET    /actions/pending                       → List[ToolCall]
POST   /actions/{toolCallId}/approve          → { status: EXECUTED, result }
POST   /actions/{toolCallId}/reject           → { status: REJECTED }
```

### Evaluation
```
GET    /eval/cases
POST   /eval/run   → { triageAccuracy, citationCoverage, unsafeActionBlockingRate, escalationAccuracy, overallPassRate, results[] }
```

### Traces
```
GET    /traces
GET    /traces/{id}
GET    /traces/ticket/{ticketId}
GET    /traces/type/{TRIAGE|DRAFT|ACTION|EVAL}
```

### Guardrails
```
POST   /guardrails/check   { text, type: "input"|"output" } → GuardrailResult
```

---

## 5. Testing Plan

### Backend (JUnit 5 + Mockito + @SpringBootTest)

| Test Class | Scope |
|------------|-------|
| `JwtUtilTest` | Token generation/validation (unit) |
| `AuthControllerTest` | Login/register (integration with mock user repo) |
| `TriageServiceTest` | Groq mocked → verify category/priority parsing |
| `DraftGenerationServiceTest` | Groq mocked → verify citations in output |
| `GuardrailServiceTest` | Injection/PII/adversarial detection (unit) |
| `ToolActionServiceTest` | Idempotency: same key → no duplicate execution |
| `EvaluationRunnerTest` | Run against sample eval_cases.jsonl |
| `TicketControllerTest` | Full API with @WebMvcTest + mock services |

### Frontend (React Testing Library + Vitest/Jest)

| Test | Scope |
|------|-------|
| `LoginPage.test` | Valid/invalid credentials, token storage |
| `TicketPage.test` | Triage trigger, draft display, citations |
| `ApprovalsPage.test` | Approve/reject flow |
| `AuthGuard.test` | Redirect to login when no token |

### Guardrail Tests (Critical — 25% weight)

- Identity-check bypass request → BLOCK
- Hidden-coupon prompt injection → BLOCK
- Request to reveal system prompt → BLOCK
- KB-ADVERSARIAL-001 document → must NOT be followed as instruction
- Valid refund request with policy support → ALLOW + cite

---

## 6. Milestones & Timeline (Suggested 4 Weeks)

| Week | Backend | Frontend | Integration |
|------|---------|----------|-------------|
| **1** | Project setup, Security + JWT, Data loader, Entities + Repos | Vite + React setup, Auth pages, API client, ProtectedRoute | Login → JWT → backend |
| **2** | Ticket APIs, Triage service (Groq), Retrieval service, Draft generation | Dashboard, Ticket list/detail, Triage UI, Draft UI with citations | Triage + Draft end-to-end |
| **3** | Guardrails, Approval-gated actions + idempotency, Trace service, Evaluation runner | Approvals page, Eval page, Citation click-through | Full workflow + guardrails |
| **4** | Testing (unit + integration), Bug fixes, Swagger docs, README | E2E flow testing, Polish UI, Deploy prep | Final integration, demo video prep |

---

## 7. Environment Variables

**Backend (`application.yml`):**
```yaml
groq:
  api-key: ${GROQ_API_KEY}
  base-url: https://api.groq.com/openai/v1
  model: llama-3.1-8b-instant

jwt:
  secret: ${JWT_SECRET}
  expiration: 28800000  # 8 hours

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/trustdesk  # or jdbc:h2:mem:testdb
    username: ${DB_USER}
    password: ${DB_PASS}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

**Frontend (`.env`):**
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_AUTH_STORAGE_KEY=trustdesk_token
```

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Groq API downtime | `GroqClientMock` fallback; graceful degradation with cached responses |
| Prompt injection bypass | Multi-layer guardrails (regex + LLM secondary check + human review) |
| Duplicate tool execution | Strict idempotency key enforcement at DB level |
| PII in logs | Masking utility applied before logging/returning |
| No vector DB | pgvector implemented; keyword fallback keeps H2/test mode working |

---

## 9. Definition of Done (Must-Have 60%)

- [x] Data loads on startup (customers, orders, tickets, KB docs, eval cases)
- [x] REST APIs for tickets, customers, orders work with JWT auth
- [x] Triage classifies category + priority + escalation via Groq
- [x] Draft generation cites KB document IDs
- [x] Refusal/escalation when policy doesn't support answer
- [x] One approval-gated action (`start_refund_review` or `create_replacement_order`)
- [x] Idempotency key prevents duplicate actions
- [x] Traces stored per AI run
- [x] Eval runner produces summary report
- [x] Frontend shows tickets, triage, cited drafts, approvals, traces, guardrails, knowledge base, and eval results

---

*Created for TrustDesk — AI Support Operations Agent (Airtribe Capstone)*  
*Updated: Tech Stack = Java Spring Boot + React + Groq + JWT*