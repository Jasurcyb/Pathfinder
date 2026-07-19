# PathFinder — Architecture Overview

## System Architecture

PathFinder is a multi-agent AI system that helps students discover and evaluate academic opportunities (scholarships, hackathons, grants, research programs). It uses a **debate-based consensus protocol** where multiple AI agents analyze each opportunity from different perspectives.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER (Browser)                              │
│                                                                      │
│   /                    /agents              /opportunity/:id         │
│   Dashboard            Agent Debate         Opportunity Details      │
│   (opportunity list)   (live debate UI)     (view/apply)             │
└──────────────────┬───────────────────────────────────────────────────┘
                   │
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Next.js 15 App (Vercel)                            │
│                                                                      │
│   App Router                                                         │
│   ├── /api/debate          → POST: runs full 3-round debate          │
│   ├── /app/page.tsx        → Dashboard UI                            │
│   ├── /app/agents/page.tsx → Debate visualization UI                 │
│   └── /app/profile/        → User profile management                 │
│                                                                      │
│   Lib Layer                                                          │
│   ├── lib/qwen.ts          → Qwen API client (DashScope)             │
│   ├── lib/debate-engine.ts → Multi-agent debate orchestration        │
│   └── lib/mock-data.ts     → Opportunity & profile data              │
│                                                                      │
│   Tech: Next.js 15, React 19, TypeScript, Tailwind CSS v4            │
└──────────────────┬───────────────────────────────────────────────────┘
                   │
                   │ HTTPS (Authorization: Bearer QWEN_API_KEY)
                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Alibaba Cloud — DashScope API                           │
│                                                                      │
│   Endpoint: https://dashscope-intl.aliyuncs.com/compatible-mode/v1   │
│   Model:    qwen-plus                                                │
│   Protocol: OpenAI-compatible chat completions                       │
└──────────────────────────────────────────────────────────────────────┘

              ┌────────────────────────────────────────┐
              │                                        │
              ▼                                        │
┌──────────────────────────────────────────────────────┤
│   Alibaba Cloud — Function Compute (FC)              │
│                                                      │
│   /alibaba-function/index.js                         │
│   - Negotiator Agent as isolated microservice         │
│   - Independent Qwen API calls                       │
│   - Demonstrates Alibaba Cloud infrastructure         │
│   - Runtime: Node.js 18+, zero dependencies          │
│   - Triggered via HTTP POST                          │
└──────────────────────────────────────────────────────┘
```

## Multi-Agent Debate Protocol

The debate engine (`lib/debate-engine.ts`) orchestrates a **3-round protocol** between AI agents:

### Round 1: Propose
- **Matcher Agent** evaluates candidate-opportunity fit → produces a match score (0-100) with reasoning
- **Writer Agent** evaluates application effort → produces effort level (low/medium/high) with obstacles
- Both agents run in parallel via `Promise.all`

### Round 2: Challenge
- Each agent reads the other's Round 1 output
- **Matcher** challenges or reinforces based on Writer's effort assessment
- **Writer** challenges or reinforces based on Matcher's match score
- Cross-agent debate via specific counter-arguments

### Round 3: Revise & Vote
- Each agent reconsiders their position given the challenge
- Both produce a **final vote**: `apply` | `maybe` | `skip`
- If votes agree → **consensus** reached
- If votes differ → **Negotiator Agent** is invoked as tiebreaker

### Negotiator (Conditional)
- Only invoked when Matcher and Writer disagree
- Weighs both agents' revised reasoning
- Makes the **final decision** with justification

## Alibaba Cloud Integration

### DashScope API (Primary)
The Next.js app calls the Qwen `qwen-plus` model via DashScope's OpenAI-compatible endpoint for all agent interactions. This powers the full 3-round debate system with 5-7 API calls per debate session.

### Function Compute (Hackathon Proof)
A separate lightweight serverless function (`/alibaba-function/`) runs the Negotiator Agent's final decision logic independently on Alibaba Cloud Function Compute. This demonstrates:

- **Real Alibaba Cloud infrastructure usage** beyond just API calls
- **Microservice architecture** — the Negotiator can run as an isolated service
- **Serverless scalability** — scales to zero when not in use, handles spikes automatically
- **Independent deployment** — the FC function operates separately from the Vercel-hosted app

## Deployment Topology

| Component | Platform | Purpose |
|-----------|----------|---------|
| Next.js 15 App | Vercel | UI, API routes, full debate engine |
| Qwen API | Alibaba Cloud DashScope | LLM inference (qwen-plus) |
| Negotiator FC | Alibaba Cloud Function Compute | Isolated decision microservice |

## Key Design Decisions

1. **OpenAI-compatible API**: Using DashScope's compatible endpoint means the Qwen integration mirrors standard OpenAI SDK patterns, making it easy to swap models if needed.

2. **Server-side API calls only**: The `QWEN_API_KEY` never reaches the client. All Qwen calls happen in Next.js API routes or the FC function.

3. **Debate, not single-shot**: The multi-round debate protocol produces more nuanced recommendations than a single LLM call, as agents challenge each other's assumptions.

4. **Parallel execution**: Round 1 and Round 2 each run both agents in parallel via `Promise.all`, minimizing total latency.

5. **Graceful degradation**: Each round catches errors independently, so a failure in Round 2 still preserves Round 1 results.
