// Qwen API wrapper for DashScope OpenAI-compatible endpoint

const BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const API_KEY = process.env.QWEN_API_KEY;

// Model assignments per agent role
export const AGENT_MODELS = {
  scout: 'qwen3.6-flash',
  matcher: 'qwen3.6-plus',
  writer: 'qwen3.6-flash',
  negotiator: 'qwen3.7-max',
} as const;

export type AgentRole = keyof typeof AGENT_MODELS;

export async function callQwen(
  systemPrompt: string,
  userMessage: string,
  model: string = 'qwen-plus',
  enableSearch: boolean = false
): Promise<string> {
  if (!API_KEY) {
    console.error('[v0] QWEN_API_KEY environment variable is not set');
    throw new Error('QWEN_API_KEY not configured');
  }

  const maxRetries = 2;
  const timeoutMs = 45000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[v0] Calling Qwen model: ${model}${enableSearch ? ' (with search)' : ''} | Attempt ${attempt + 1}/${maxRetries + 1}`);

      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          ...(enableSearch ? { enable_search: true } : {}),
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('No content in Qwen response');
        return content;
      }

      const errorData = await response.json().catch(() => ({}));
      console.error(`[v0] Qwen API error on attempt ${attempt + 1}:`, response.status, errorData);

      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 4000);
        console.warn(`[v0] Qwen API retryable error ${response.status}, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw new Error(`Qwen API error: ${response.status}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`[v0] Qwen API timeout on attempt ${attempt + 1}`);
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * 2 ** attempt, 4000);
          console.warn(`[v0] Retrying timeout in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error('Qwen API request timed out');
      }

      console.error(`[v0] callQwen failed on attempt ${attempt + 1}:`, error.message);
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 4000);
        console.warn(`[v0] Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('Qwen API request failed after retries');
}

/**
 * Scout Agent search logic. Queries Qwen with search enabled.
 * Falls back gracefully to Qwen without search if search fails, and returns a default if that fails too.
 */
export async function scoutSearch(
  opportunityTitle: string,
  opportunityOrg: string,
  langSuffix: string = ''
): Promise<string> {
  const systemPrompt = `You are the Scout Agent for PathFinder. Before the debate begins, check if there's any recent, time-sensitive information about this opportunity that Matcher and Writer should know (e.g., deadline extended, new requirements added, similar opportunities announced). If search is available and finds something relevant, summarize it in 1-2 sentences. If nothing new or search unavailable, respond with exactly: 'No new information found - proceeding with known details.'${langSuffix}`;
  const userMessage = `Search for updates on this opportunity: "${opportunityTitle}" by "${opportunityOrg}".`;

  try {
    // Try with search enabled
    return await callQwen(systemPrompt, userMessage, AGENT_MODELS.scout, true);
  } catch (error) {
    console.warn('[v0] scoutSearch with search failed, falling back to non-search call:', error);
    try {
      // Fallback: run without search
      return await callQwen(systemPrompt, userMessage, AGENT_MODELS.scout, false);
    } catch (fallbackError) {
      console.error('[v0] scoutSearch fallback also failed:', fallbackError);
      return 'No new information found - proceeding with known details.';
    }
  }
}

// Helper function to safely parse JSON from agent responses
export function parseAgentJSON<T>(text: string): T | null {
  try {
    // Try direct JSON parse
    return JSON.parse(text);
  } catch {
    // Try to extract JSON block from markdown code fences or extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('[v0] Failed to parse extracted JSON:', jsonMatch[0]);
        return null;
      }
    }
    console.error('[v0] Failed to parse agent JSON response:', text);
    return null;
  }
}
