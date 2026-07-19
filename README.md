# PathFinder — Multi-Agent Opportunity Navigator

AI-powered multi-agent system that discovers, evaluates, and negotiates the best grants, hackathons, and scholarships for students.

## Submission Details
- **Hackathon**: Global AI Hackathon with Qwen Cloud
- **Track**: Track 3 - Agent Society

---

## Problem Statement

Students worldwide miss out on life-changing opportunities—such as prestigious international scholarships, research grants, and high-impact hackathons—due to severe information overload, complex multilingual requirements, and a lack of personalized guidance. Traditional search engines and listing sites do not analyze a student's unique academic profile, nor do they evaluate the risk-to-reward ratio of the time investment required to apply. PathFinder bridges this gap by deploying an autonomous "agent society" that researches, analyzes, debates, and provides clear, tailored recommendations for every student.

---

## Architecture Overview

PathFinder is built around a collaborative, multi-agent debate society that simulates a human advisory panel. By leveraging different specialized models from the latest Qwen series, we maximize reasoning depth while keeping latency and costs low.

```
                  ┌───────────────────────────────────────────┐
                  │                 User Profile              │
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────┐
                  │             1. Scout Agent                │
                  │             (qwen3.6-flash)               │
                  │  - Gathers real-time search context       │
                  └─────────────────────┬─────────────────────┘
                                        │
                                        ├─────────────────────────────────────────┐
                                        ▼                                         ▼
                  ┌───────────────────────────────────────────┐     ┌───────────────────────────────────────────┐
                  │             2. Matcher Agent              │     │             3. Writer Agent               │
                  │             (qwen3.6-plus)                │     │             (qwen3.6-flash)               │
                  │  - Proposes suitability score (0-100)     │     │  - Evaluates writing/documentation effort │
                  └─────────────────────┬─────────────────────┘     └─────────────────────┬─────────────────────┘
                                        │                                         │
                                        └────────────────────┬────────────────────┘
                                                             │
                                                             ▼ (Debate & Revisions)
                                                    [ Consensus Vote? ]
                                                     /             \
                                                   YES              NO
                                                   /                 \
                                                  ▼                   ▼
                                            [Final Vote]    ┌───────────────────────────────────┐
                                                            │       4. Negotiator Agent         │
                                                            │          (qwen3.7-max)            │
                                                            │  - Resolves conflicts & decides   │
                                                            └─────────────────┬─────────────────┘
                                                                              │
                                                                              ▼
                                                                     [Final Decision]
```

### The 4 Specialized Agents:
1. **Scout Agent (`qwen3.6-flash` with search)**: Checks for recent, time-sensitive updates (extended deadlines, modified requirements, current news) to feed into the debate context.
2. **Matcher Agent (`qwen3.6-plus`)**: Analyzes the student's technical skills, GPA, and language level against the opportunity criteria to suggest a compatibility score.
3. **Writer Agent (`qwen3.6-flash`)**: Identifies writing bottlenecks (essays, recommendation letters, visa prep) and gauges the application difficulty level (low, medium, high).
4. **Negotiator Agent (`qwen3.7-max`)**: If Matcher and Writer votes diverge in the revision phase, the Negotiator steps in. Using Qwen's flagship model, it arbitrates the arguments and outputs a final decision (`apply`, `maybe`, or `skip`) with detailed justification.

### Multi-Round Debate Protocol:
- **Round 0: Scout**: Gathers real-time web context.
- **Round 1: Propose**: Matcher and Writer submit initial evaluations in parallel.
- **Round 2: Challenge**: Each agent writes a counter-argument challenging the other's proposal.
- **Round 3: Revise & Vote**: Agents update their perspectives and cast final votes.
- **Verdict**: If votes disagree, the Negotiator resolves the deadlock.

---

## Technical Stack

- **Frontend / API Route Framework**: Next.js 15 (App Router), TypeScript, Vanilla CSS
- **Styling**: Tailwind CSS
- **Large Language Models**: Qwen API via Alibaba Cloud DashScope (compatible mode)
- **Serverless Infrastructure**: Alibaba Cloud Function Compute (FC) Custom Runtime Web Function

---

## Alibaba Cloud Function Compute Proof

A production proof of the Negotiator Agent's independent decision microservice is located in the [/alibaba-function/](file:///c:/Users/REPUBLIC%20OF%20GAMERS/Desktop/path-finder-app-development/alibaba-function) directory. 

This is deployed as a standalone **Custom Runtime Web Function** on Alibaba Cloud Function Compute, running a lightweight Node.js HTTP server. It allows other systems or workflows to invoke the Negotiator Agent decision-maker independently.
- [Negotiator FC Service README](file:///c:/Users/REPUBLIC%20OF%20GAMERS/Desktop/path-finder-app-development/alibaba-function/README.md)

---

## Getting Started

### Prerequisites
- Node.js 18.0+
- DashScope API Key with Qwen access

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd path-finder-app-development
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   QWEN_API_KEY=your_dashscope_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to explore the dashboard.

---

## Deployments and Media

- **Live Demo Link**: *[Add Vercel/Alibaba URL after deployment]*
- **Project Walkthrough Video**: *[Add Video Link]*

### Screenshots

*[Screenshots showing Dashboard, Profile Customization, and Multi-Agent Debate in Action will be added before final submission]*
