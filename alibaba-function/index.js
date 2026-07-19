/**
 * Alibaba Cloud Function Compute - PathFinder Negotiator Agent
 * Custom Runtime WEB FUNCTION (HTTP server, not event handler)
 *
 * This serverless function demonstrates the Negotiator Agent logic
 * running independently on Alibaba Cloud Function Compute (FC),
 * separate from the main Vercel-hosted Next.js application.
 *
 * Runtime: Node.js 18+ (uses native fetch, no external HTTP dependencies)
 *
 * Environment Variables Required:
 *   QWEN_API_KEY     - DashScope API key for Qwen model access
 *   ALLOWED_ORIGIN   - (optional) Origin for CORS Access-Control-Allow-Origin header
 *   FC_SERVER_PORT   - (set automatically by Alibaba FC) port to listen on
 *
 * Input (HTTP POST body):
 *   {
 *     "opportunityId": "string",
 *     "userProfile": {
 *       "name": "string",
 *       "university": "string",
 *       "fieldOfStudy": "string",
 *       "gpa": number,
 *       "englishLevel": "string",
 *       "skills": ["string"],
 *       "interests": ["string"]
 *     }
 *   }
 *
 * Output:
 *   {
 *     "success": true,
 *     "negotiatorDecision": {
 *       "final_decision": "apply" | "maybe" | "skip",
 *       "justification": "string"
 *     },
 *     "metadata": {
 *       "model": "qwen3.7-max",
 *       "runtime": "alibaba-fc",
 *       "opportunityId": "string",
 *       "timestamp": "ISO string"
 *     }
 *   }
 */

const http = require('http');

const PORT = parseInt(process.env.FC_SERVER_PORT, 10) || 9000;
const QWEN_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = 'qwen3.7-max';
const MAX_BODY_BYTES = 64 * 1024; // 64 KB request body limit
const MAX_RESPONSE_BYTES = 8 * 1024; // 8 KB — cap on raw LLM response
const QWEN_TIMEOUT_MS = 45_000; // 45s per attempt
const VALID_DECISIONS = new Set(['apply', 'maybe', 'skip']);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

// ===================================================================
// Utility helpers
// ===================================================================

function log(level, msg, extra) {
  const entry = { level, msg, ts: new Date().toISOString(), ...extra };
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

/**
 * Call the Qwen API via DashScope OpenAI-compatible endpoint.
 * Includes timeout and retry for transient failures (429, 5xx).
 */
async function callQwen(systemPrompt, userMessage) {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    throw new Error('QWEN_API_KEY environment variable is not set');
  }

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), QWEN_TIMEOUT_MS);

    try {
      const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: QWEN_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('No content in Qwen API response');
        return content;
      }

      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 4000);
        log('warn', 'Qwen API retryable error, retrying', { status: response.status, attempt, delay });
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      // Non-retryable or exhausted — log status code only, no body
      log('error', 'Qwen API failed', { status: response.status, attempt });
      throw new Error('Qwen API request failed');
    } catch (err) {
      if (err.name === 'AbortError') {
        log('error', 'Qwen API timeout', { attempt, timeout: QWEN_TIMEOUT_MS });
        if (attempt < maxRetries) continue;
        throw new Error('Qwen API request timed out');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Safely parse JSON from LLM response, handling markdown code fences.
 */
function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function buildCORSHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGIN;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

/**
 * Validate userProfile fields have expected types. Returns an error string or null.
 */
function validateUserProfile(profile) {
  if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
    return 'userProfile must be an object';
  }
  if (profile.name != null && typeof profile.name !== 'string') return 'userProfile.name must be a string';
  if (profile.university != null && typeof profile.university !== 'string') return 'userProfile.university must be a string';
  if (profile.fieldOfStudy != null && typeof profile.fieldOfStudy !== 'string') return 'userProfile.fieldOfStudy must be a string';
  if (profile.gpa != null && typeof profile.gpa !== 'number') return 'userProfile.gpa must be a number';
  if (profile.englishLevel != null && typeof profile.englishLevel !== 'string') return 'userProfile.englishLevel must be a string';
  if (profile.skills != null && !Array.isArray(profile.skills)) return 'userProfile.skills must be an array';
  if (profile.interests != null && !Array.isArray(profile.interests)) return 'userProfile.interests must be an array';
  return null;
}

/**
 * Sanitize a string value — truncate and strip control characters to prevent abuse.
 */
function sanitize(value, maxLen) {
  if (typeof value !== 'string') return value;
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, maxLen);
}

// ===================================================================
// Request body reader
// ===================================================================

/**
 * Read the full request body as a string, enforcing MAX_BODY_BYTES.
 * Returns { ok: true, data: string } or { ok: false, error: string, status: number }.
 */
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let totalBytes = 0;

    req.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        req.destroy();
        resolve({ ok: false, error: 'Request body too large', status: 413 });
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve({ ok: true, data: Buffer.concat(chunks).toString('utf8') });
    });

    req.on('error', () => {
      resolve({ ok: false, error: 'Failed to read request body', status: 400 });
    });
  });
}

// ===================================================================
// Core request handler
// ===================================================================

async function handleRequest(req, res) {
  const requestId = req.headers['x-fc-request-id'] || crypto.randomUUID?.() || Date.now().toString(36);
  const corsHeaders = buildCORSHeaders();

  /** Helper: send a JSON response */
  function respond(status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, { ...corsHeaders, 'X-Request-Id': requestId });
    res.end(payload);
  }

  try {
    // --- CORS preflight ---
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Request-Id': requestId,
      });
      res.end();
      return;
    }

    // --- POST-only ---
    if (req.method !== 'POST') {
      log('warn', 'Method not allowed', { method: req.method, requestId });
      return respond(405, { success: false, error: 'Method not allowed' });
    }

    // --- Read & parse body ---
    const bodyResult = await readBody(req);
    if (!bodyResult.ok) {
      log('warn', bodyResult.error, { requestId });
      return respond(bodyResult.status, { success: false, error: bodyResult.error });
    }

    let body;
    try {
      body = JSON.parse(bodyResult.data);
    } catch {
      log('warn', 'Invalid JSON body', { requestId });
      return respond(400, { success: false, error: 'Invalid JSON body' });
    }

    const { opportunityId, userProfile } = body;

    // --- Field existence ---
    if (!opportunityId || !userProfile) {
      log('warn', 'Missing required fields', { requestId });
      return respond(400, { success: false, error: 'Missing required fields: opportunityId, userProfile' });
    }

    // --- Type validation ---
    if (typeof opportunityId !== 'string' || opportunityId.length > 256) {
      log('warn', 'Invalid opportunityId', { requestId });
      return respond(400, { success: false, error: 'opportunityId must be a string (max 256 chars)' });
    }
    const profileError = validateUserProfile(userProfile);
    if (profileError) {
      log('warn', 'Invalid userProfile', { error: profileError, requestId });
      return respond(400, { success: false, error: profileError });
    }

    // --- Sanitize inputs ---
    const safeId = sanitize(opportunityId, 256);
    const safeProfile = {
      name: sanitize(userProfile.name, 200),
      university: sanitize(userProfile.university, 200),
      fieldOfStudy: sanitize(userProfile.fieldOfStudy, 200),
      gpa: userProfile.gpa,
      englishLevel: sanitize(userProfile.englishLevel, 50),
      skills: Array.isArray(userProfile.skills) ? userProfile.skills.map(s => sanitize(String(s), 100)).slice(0, 50) : [],
      interests: Array.isArray(userProfile.interests) ? userProfile.interests.map(s => sanitize(String(s), 100)).slice(0, 50) : [],
    };

    // --- Build context for the Negotiator ---
    const candidateContext = `CANDIDATE PROFILE:
Name: ${safeProfile.name || 'Unknown'}
University: ${safeProfile.university || 'Unknown'}
Field of Study: ${safeProfile.fieldOfStudy || 'Unknown'}
GPA: ${safeProfile.gpa || 'N/A'}
English Level: ${safeProfile.englishLevel || 'Unknown'}
Skills: ${(safeProfile.skills || []).join(', ')}
Interests: ${(safeProfile.interests || []).join(', ')}

OPPORTUNITY ID: ${safeId}`;

    // --- Hypothetical agent inputs (simplified single-step negotiation) ---
    // In the full app, Matcher and Writer agents run 3 rounds of debate.
    // Here we simulate their final positions and let the Negotiator decide.
    const negotiatorSystemPrompt = `You are the Negotiator Agent for PathFinder, an AI opportunity discovery system.

You are given a candidate's profile and an opportunity reference. Two other AI agents have already analyzed this opportunity:

- The Matcher Agent evaluated how well the candidate's skills, GPA, and background fit the opportunity requirements. They voted "apply" with reasoning: "The candidate's technical skills and academic record align well with the opportunity requirements."

- The Writer Agent evaluated the effort required to write a strong application. They voted "maybe" with reasoning: "While the candidate is qualified, the application requires significant documentation effort and the English language requirement may be challenging given the candidate's current level."

As the Negotiator, make a final decision considering:
- The risk/reward tradeoff for the candidate
- Both agents' perspectives
- The candidate's realistic chances of success

Return ONLY valid JSON (no markdown, no extra text):
{
  "final_decision": "<'apply'|'maybe'|'skip'>",
  "justification": "<2-3 sentences explaining your decision and reasoning>"
}`;

    const qwenResponse = await callQwen(negotiatorSystemPrompt, candidateContext);

    // --- Response size cap ---
    if (Buffer.byteLength(qwenResponse, 'utf8') > MAX_RESPONSE_BYTES) {
      log('warn', 'LLM response exceeded size cap', { requestId });
      return respond(500, { success: false, error: 'Model response too large' });
    }

    const decision = parseJSON(qwenResponse);

    if (!decision || !decision.final_decision) {
      log('error', 'Failed to parse model response', { requestId });
      return respond(500, { success: false, error: 'Failed to parse model response' });
    }

    // --- Validate decision value ---
    if (!VALID_DECISIONS.has(decision.final_decision)) {
      log('error', 'Invalid decision value from model', { value: decision.final_decision, requestId });
      return respond(500, { success: false, error: 'Invalid decision value from model' });
    }

    log('info', 'Negotiator decision complete', { decision: decision.final_decision, requestId });

    return respond(200, {
      success: true,
      negotiatorDecision: {
        final_decision: decision.final_decision,
        justification: decision.justification,
      },
      metadata: {
        model: QWEN_MODEL,
        runtime: 'alibaba-fc',
        opportunityId: safeId,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  } catch (error) {
    log('error', 'Handler error', { requestId, message: error.message });
    return respond(500, { success: false, error: 'Internal server error' });
  }
}

// ===================================================================
// HTTP Server — Alibaba FC Custom Runtime Web Function entry point
// ===================================================================

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
