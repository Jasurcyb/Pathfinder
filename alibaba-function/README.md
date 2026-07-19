# PathFinder — Alibaba Cloud Function Compute: Negotiator Agent

## Purpose

This directory contains a **standalone serverless function** that demonstrates the **Negotiator Agent** logic from PathFinder running independently on **Alibaba Cloud Function Compute (FC)**.

This is **separate** from the main Vercel-hosted Next.js application, serving as **proof of Alibaba Cloud infrastructure usage** for the hackathon submission.

## What It Does

The Negotiator Agent is the final decision-maker in PathFinder's multi-agent debate system. In the full app, three AI agents collaborate:

1. **Matcher Agent** — evaluates how well a candidate matches an opportunity
2. **Writer Agent** — evaluates the effort required to apply
3. **Negotiator Agent** — resolves disagreements and makes the final apply/maybe/skip decision

This Function Compute deployment isolates the **Negotiator's decision logic** as a lightweight microservice. It:

- Starts an HTTP server on port `FC_SERVER_PORT` (set automatically by Alibaba FC, defaults to `9000`)
- Accepts HTTP POST requests with `opportunityId` and `userProfile`
- Handles CORS preflight (OPTIONS) requests
- Calls the **Qwen API** (via DashScope `qwen3.7-max` model) to run one simplified negotiation step
- Returns the Negotiator's final decision as JSON

## Architecture

```
┌─────────────────────────────────────┐
│  Next.js App (Vercel)               │
│  - UI / Dashboard                   │
│  - /api/debate (full 3-round        │
│    debate with Matcher, Writer,     │
│    Negotiator calling Qwen API)     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Alibaba Cloud Function Compute     │  ← THIS FUNCTION
│  - Custom Runtime Web Function      │
│  - HTTP server on FC_SERVER_PORT    │
│  - Negotiator Agent microservice    │
│  - Calls Qwen API independently     │
│  - Stateless, scales to zero        │
└─────────────────────────────────────┘
```

## Deployment Instructions

### Prerequisites

- Alibaba Cloud account with Function Compute enabled
- `QWEN_API_KEY` from DashScope console (https://dashscope.console.aliyun.com/)

### Steps

1. **Log in** to [Alibaba Cloud Function Compute Console](https://fcnext.console.aliyun.com/)
2. **Create a new service** (e.g., `pathfinder-service`)
3. **Create a new function**:
   - Runtime: **Custom Runtime** → **Node.js 18** or **Node.js 20**
   - Function Type: **Web Function** (not Event Function)
   - Startup Command: `node index.js`
   - Listening Port: `9000` (the function reads `FC_SERVER_PORT` automatically)
4. **Upload code**: Zip this entire `alibaba-function/` directory and upload it
5. **Set environment variables**:
   - `QWEN_API_KEY` — your DashScope API key
   - `ALLOWED_ORIGIN` — (optional) set to your frontend URL for CORS
6. **Test**: Use the console's built-in test feature or `curl`:

```bash
curl -X POST https://<your-function-url>/ \
  -H "Content-Type: application/json" \
  -d '{
    "opportunityId": "1",
    "userProfile": {
      "name": "Ibrahim Ismailov",
      "university": "Tashkent State Technical University",
      "fieldOfStudy": "Computer Science",
      "gpa": 3.8,
      "englishLevel": "Pre-IELTS",
      "skills": ["AI", "Cybersecurity", "Python", "Machine Learning"],
      "interests": ["AI Research", "Cybersecurity", "Open Source"]
    }
  }'
```

### Local Testing

```bash
# Load your API key and start the server locally
export QWEN_API_KEY="your-key-here"
node index.js
# Server listening on port 9000

# In another terminal:
curl -X POST http://localhost:9000/ \
  -H "Content-Type: application/json" \
  -d '{"opportunityId":"1","userProfile":{"name":"Test","university":"MIT","fieldOfStudy":"CS","gpa":3.9,"englishLevel":"C1","skills":["AI"],"interests":["ML"]}}'
```

### Expected Response

```json
{
  "success": true,
  "negotiatorDecision": {
    "final_decision": "maybe",
    "justification": "While the candidate has strong technical skills that align well with the opportunity, the Pre-IELTS English level presents a significant barrier. The application effort is manageable but the language gap may reduce chances of acceptance."
  },
  "metadata": {
    "model": "qwen3.7-max",
    "runtime": "alibaba-fc",
    "opportunityId": "1",
    "timestamp": "2026-07-18T07:00:00.000Z",
    "requestId": "abc123"
  }
}
```

## Technical Details

- **Function Type**: Custom Runtime Web Function (HTTP server via `http.createServer`)
- **Runtime**: Node.js 18+ (uses native `fetch`, zero external dependencies)
- **Port**: Reads `FC_SERVER_PORT` env var (Alibaba FC sets this automatically), fallback `9000`
- **API**: Qwen `qwen3.7-max` model via DashScope OpenAI-compatible endpoint
- **Base URL**: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- **Auth**: Bearer token via `QWEN_API_KEY` environment variable
- **Cold start**: Minimal (~100ms) due to zero dependencies
- **Security**: Input validation, sanitization, size limits (64KB request, 8KB response)
- **Retries**: Automatic retry with exponential backoff for 429/5xx errors (up to 2 retries)
