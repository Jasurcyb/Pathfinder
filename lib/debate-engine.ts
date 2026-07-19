import { Opportunity, UserProfile } from '@/types';
import { callQwen, parseAgentJSON, AGENT_MODELS, scoutSearch } from './qwen';

export type Locale = 'en' | 'ru' | 'uz';

export interface DebateMessage {
  id: string;
  agent: 'scout' | 'matcher' | 'writer' | 'negotiator';
  model: string;
  round: number;
  phase: 'scout' | 'propose' | 'challenge' | 'revise' | 'verdict';
  text: string;
  timestamp: string;
}

interface MatcherProposal {
  score: number;
  reasoning: string;
}

interface WriterProposal {
  effort: 'low' | 'medium' | 'high';
  obstacles: string;
}

interface Revision {
  revised_reasoning: string;
  final_vote: 'apply' | 'maybe' | 'skip';
}

interface NegotiatorDecision {
  final_decision: 'apply' | 'maybe' | 'skip';
  justification: string;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Returns a language instruction suffix to append to system prompts.
 * JSON keys remain in English; only string VALUES are localized.
 */
function getLanguageInstruction(locale: Locale): string {
  switch (locale) {
    case 'ru':
      return '\n\nIMPORTANT: Respond entirely in Russian language (по-русски), including all JSON string values (reasoning, obstacles, justification). Keep JSON keys in English.';
    case 'uz':
      return "\n\nIMPORTANT: Respond entirely in Uzbek language (o'zbek tilida), including all JSON string values (reasoning, obstacles, justification). Keep JSON keys in English.";
    case 'en':
    default:
      return '';
  }
}

// ==========================================
// Robust Parsers & Fallback Formatters
// ==========================================

function parseMatcherProposal(text: string): MatcherProposal {
  const parsed = parseAgentJSON<any>(text);
  if (parsed && typeof parsed === 'object') {
    const scoreVal = parseInt(parsed.score);
    return {
      score: isNaN(scoreVal) ? 70 : scoreVal,
      reasoning: parsed.reasoning || parsed.justification || parsed.text || JSON.stringify(parsed)
    };
  }
  // Fallback for plain text
  console.warn('[v0] Matcher proposal fallback used for text:', text);
  let score = 70;
  const scoreMatch = text.match(/(\d+)\s*\/\s*100/) || text.match(/score\s*(?:is|:)?\s*(\d+)/i);
  if (scoreMatch) score = parseInt(scoreMatch[1]);
  return {
    score: isNaN(score) ? 70 : score,
    reasoning: text
  };
}

function parseWriterProposal(text: string): WriterProposal {
  const parsed = parseAgentJSON<any>(text);
  if (parsed && typeof parsed === 'object') {
    let effort: 'low' | 'medium' | 'high' = 'medium';
    const rawEffort = (parsed.effort || parsed.difficulty || '').toLowerCase();
    if (rawEffort.includes('low')) effort = 'low';
    else if (rawEffort.includes('high')) effort = 'high';
    
    return {
      effort,
      obstacles: parsed.obstacles || parsed.reasoning || parsed.justification || parsed.text || JSON.stringify(parsed)
    };
  }
  // Fallback for plain text
  console.warn('[v0] Writer proposal fallback used for text:', text);
  let effort: 'low' | 'medium' | 'high' = 'medium';
  if (/low/i.test(text)) effort = 'low';
  else if (/high/i.test(text)) effort = 'high';
  return {
    effort,
    obstacles: text
  };
}

function parseChallenge(text: string): string {
  // If the agent mistakenly returns JSON, parse and extract the relevant text field
  const parsed = parseAgentJSON<any>(text);
  if (parsed && typeof parsed === 'object') {
    console.warn('[v0] Agent returned JSON instead of plain text in challenge phase:', parsed);
    return parsed.counterArgument || parsed.reasoning || parsed.obstacles || parsed.justification || parsed.text || JSON.stringify(parsed);
  }
  return text;
}

function parseRevision(text: string): Revision {
  const parsed = parseAgentJSON<any>(text);
  if (parsed && typeof parsed === 'object') {
    let vote: 'apply' | 'maybe' | 'skip' = 'maybe';
    const rawVote = (parsed.final_vote || parsed.vote || '').toLowerCase();
    if (rawVote.includes('apply')) vote = 'apply';
    else if (rawVote.includes('skip')) vote = 'skip';
    
    return {
      final_vote: vote,
      revised_reasoning: parsed.revised_reasoning || parsed.reasoning || parsed.justification || parsed.text || JSON.stringify(parsed)
    };
  }
  // Fallback for plain text
  console.warn('[v0] Revision fallback used for text:', text);
  let vote: 'apply' | 'maybe' | 'skip' = 'maybe';
  if (/apply/i.test(text)) vote = 'apply';
  else if (/skip/i.test(text)) vote = 'skip';
  return {
    final_vote: vote,
    revised_reasoning: text
  };
}

function parseNegotiatorDecision(text: string): NegotiatorDecision {
  const parsed = parseAgentJSON<any>(text);
  if (parsed && typeof parsed === 'object') {
    let decision: 'apply' | 'maybe' | 'skip' = 'maybe';
    const rawDecision = (parsed.final_decision || parsed.decision || '').toLowerCase();
    if (rawDecision.includes('apply')) decision = 'apply';
    else if (rawDecision.includes('skip')) decision = 'skip';

    return {
      final_decision: decision,
      justification: parsed.justification || parsed.reasoning || parsed.text || JSON.stringify(parsed)
    };
  }
  // Fallback for plain text
  console.warn('[v0] Negotiator decision fallback used for text:', text);
  let decision: 'apply' | 'maybe' | 'skip' = 'maybe';
  if (/apply/i.test(text)) decision = 'apply';
  else if (/skip/i.test(text)) decision = 'skip';
  return {
    final_decision: decision,
    justification: text
  };
}

// ==========================================
// Main Debate Runner
// ==========================================

export async function runDebate(
  opportunity: Opportunity,
  userProfile: UserProfile,
  locale: Locale = 'en'
): Promise<DebateMessage[]> {
  const messages: DebateMessage[] = [];
  const langSuffix = getLanguageInstruction(locale);

  console.log('[v0] Starting debate for:', opportunity.title, '| locale:', locale);
  console.log('[v0] User profile:', userProfile.name, '| GPA:', userProfile.gpa, '| English:', userProfile.englishLevel);
  console.log('[v0] Models: Matcher=', AGENT_MODELS.matcher, '| Writer=', AGENT_MODELS.writer, '| Negotiator=', AGENT_MODELS.negotiator);

  // ===== ROUND 0: SCOUT =====
  console.log('[v0] Round 0: Scout phase');
  let scoutOutput = '';
  try {
    scoutOutput = await scoutSearch(opportunity.title, opportunity.organization, langSuffix);
    messages.push({
      id: generateId(),
      agent: 'scout',
      model: AGENT_MODELS.scout,
      round: 0,
      phase: 'scout',
      text: scoutOutput,
      timestamp: getCurrentTimestamp(),
    });
  } catch (error) {
    console.error('[v0] Error in Scout Agent:', error);
    scoutOutput = 'No new information found - proceeding with known details.';
    messages.push({
      id: generateId(),
      agent: 'scout',
      model: AGENT_MODELS.scout,
      round: 0,
      phase: 'scout',
      text: scoutOutput,
      timestamp: getCurrentTimestamp(),
    });
  }
  console.log('[v0] Scout Output:', scoutOutput);

  // ===== ROUND 1: PROPOSE =====
  console.log('[v0] Round 1: Propose phase');

  const matcherSystem = `You are the Matcher Agent for PathFinder, an AI opportunity discovery system. Your role is to evaluate how well a candidate matches an opportunity.

Analyze the candidate's profile and the opportunity requirements. Consider:
- Academic background fit
- Required skills match
- GPA/grade requirements
- English language requirement fit
- Research/work experience relevance

Scout Agent found this additional context: ${scoutOutput}. Factor this into your assessment if relevant.

Return ONLY valid JSON with exactly these two keys (do not include "justification", "obstacles", "final_vote", or "revised_reasoning"):
{
  "score": <number 0-100>,
  "reasoning": "<2 sentences explaining the match score>"
}${langSuffix}`;

  const writerSystem = `You are the Writer Agent for PathFinder. Your role is to evaluate the effort required to write a strong application for an opportunity.

Consider:
- Language complexity of requirements
- Need for documentation (transcripts, recommendations, etc.)
- Time investment for essays/SOP
- Relevance of candidate's background to requirements

Scout Agent found this additional context: ${scoutOutput}. Factor this into your assessment if relevant.

Return ONLY valid JSON with exactly these two keys (do not include "score", "reasoning", "justification", "final_vote", or "revised_reasoning"):
{
  "effort": "<'low'|'medium'|'high'>",
  "obstacles": "<1-2 sentences about specific challenges the candidate faces>"
}${langSuffix}`;

  const contextMsg = `OPPORTUNITY:
Title: ${opportunity.title}
Organization: ${opportunity.organization}
Requirements: ${opportunity.requirements}
Description: ${opportunity.description}

CANDIDATE PROFILE:
Name: ${userProfile.name}
University: ${userProfile.university}
Field of Study: ${userProfile.fieldOfStudy}
GPA: ${userProfile.gpa}
English Level: ${userProfile.englishLevel}
Skills: ${userProfile.skills.join(', ')}
Interests: ${userProfile.interests.join(', ')}`;

  let matcherR1: MatcherProposal;
  let writerR1: WriterProposal;

  try {
    const [matcherText, writerText] = await Promise.all([
      callQwen(matcherSystem, contextMsg, AGENT_MODELS.matcher),
      callQwen(writerSystem, contextMsg, AGENT_MODELS.writer),
    ]);

    matcherR1 = parseMatcherProposal(matcherText);
    writerR1 = parseWriterProposal(writerText);

    messages.push({
      id: generateId(),
      agent: 'matcher',
      model: AGENT_MODELS.matcher,
      round: 1,
      phase: 'propose',
      text: `**Match Score: ${matcherR1.score}/100**\n\n${matcherR1.reasoning}`,
      timestamp: getCurrentTimestamp(),
    });

    const effortEmoji =
      writerR1.effort === 'low'
        ? '✅'
        : writerR1.effort === 'medium'
          ? '⚠️'
          : '❌';
    
    messages.push({
      id: generateId(),
      agent: 'writer',
      model: AGENT_MODELS.writer,
      round: 1,
      phase: 'propose',
      text: `**Effort Required: ${writerR1.effort}** ${effortEmoji}\n\nObstacles: ${writerR1.obstacles}`,
      timestamp: getCurrentTimestamp(),
    });
  } catch (error) {
    console.error('[v0] Error in Round 1:', error);
    messages.push({
      id: generateId(),
      agent: 'matcher',
      model: AGENT_MODELS.matcher,
      round: 1,
      phase: 'propose',
      text: 'Не удалось получить оценку (ошибка API)',
      timestamp: getCurrentTimestamp(),
    });
    return messages;
  }

  // ===== ROUND 2: CHALLENGE =====
  console.log('[v0] Round 2: Challenge phase');

  const matcherChallengeSystem = `You are the Matcher Agent. You previously proposed a match score of ${matcherR1.score}/100.

The Writer Agent assessed that the application effort would be ${writerR1.effort}, with these obstacles: "${writerR1.obstacles}"

Write ONE specific counter-argument (2-3 sentences) to either:
- Challenge their effort assessment if you disagree
- OR reinforce your match score if their obstacles don't matter given the score

Be direct and cite specifics. Return ONLY raw plain text. Do NOT use JSON formatting, code blocks, or any JSON structure.${langSuffix}`;

  const writerChallengeSystem = `You are the Writer Agent. You previously assessed the application effort as ${writerR1.effort}.

The Matcher Agent scored this opportunity ${matcherR1.score}/100 with reasoning: "${matcherR1.reasoning}"

Write ONE specific counter-argument (2-3 sentences) to either:
- Challenge their match score if you think the obstacles make it not worth pursuing
- OR acknowledge the score but highlight specific risks they overlooked

Be direct and cite specifics. Return ONLY raw plain text. Do NOT use JSON formatting, code blocks, or any JSON structure.${langSuffix}`;

  let matcherChallenge = '';
  let writerChallenge = '';

  try {
    const [matcherChallengeText, writerChallengeText] = await Promise.all([
      callQwen(matcherChallengeSystem, contextMsg, AGENT_MODELS.matcher),
      callQwen(writerChallengeSystem, contextMsg, AGENT_MODELS.writer),
    ]);

    matcherChallenge = parseChallenge(matcherChallengeText.trim());
    writerChallenge = parseChallenge(writerChallengeText.trim());

    if (matcherChallenge) {
      messages.push({
        id: generateId(),
        agent: 'matcher',
        model: AGENT_MODELS.matcher,
        round: 2,
        phase: 'challenge',
        text: matcherChallenge,
        timestamp: getCurrentTimestamp(),
      });
    }

    if (writerChallenge) {
      messages.push({
        id: generateId(),
        agent: 'writer',
        model: AGENT_MODELS.writer,
        round: 2,
        phase: 'challenge',
        text: writerChallenge,
        timestamp: getCurrentTimestamp(),
      });
    }
  } catch (error) {
    console.error('[v0] Error in Round 2:', error);
  }

  // ===== ROUND 3: REVISE & VOTE =====
  console.log('[v0] Round 3: Revise phase');

  const reviseMatcherSystem = `You are the Matcher Agent. You proposed a match score of ${matcherR1.score}/100.

You received this counter-argument from the Writer Agent: "${writerChallenge}"

Reconsider your position. Should the candidate apply to this opportunity given:
- The match score you assigned
- The effort and obstacles the Writer identified
- Your professional judgment as a matching expert

Return ONLY valid JSON with exactly these two keys (do not include "score", "reasoning", "justification", "effort", or "obstacles"):
{
  "revised_reasoning": "<1-2 sentences confirming or reconsidering your position>",
  "final_vote": "<'apply'|'maybe'|'skip'>"
}${langSuffix}`;

  const reviseWriterSystem = `You are the Writer Agent. You assessed effort as ${writerR1.effort}.

You received this counter-argument from the Matcher Agent: "${matcherChallenge}"

Reconsider your assessment. Given the match score and your evaluation of effort/obstacles, what's your final recommendation:
- apply: Worth the effort
- maybe: Could work but uncertain
- skip: Too risky or not worth it

Return ONLY valid JSON with exactly these two keys (do not include "score", "reasoning", "justification", "effort", or "obstacles"):
{
  "revised_reasoning": "<1-2 sentences explaining your final stance>",
  "final_vote": "<'apply'|'maybe'|'skip'>"
}${langSuffix}`;

  let matcherVote: Revision;
  let writerVote: Revision;

  try {
    const [matcherReviseText, writerReviseText] = await Promise.all([
      callQwen(reviseMatcherSystem, contextMsg, AGENT_MODELS.matcher),
      callQwen(reviseWriterSystem, contextMsg, AGENT_MODELS.writer),
    ]);

    matcherVote = parseRevision(matcherReviseText);
    writerVote = parseRevision(writerReviseText);

    const matcherVoteEmoji =
      matcherVote.final_vote === 'apply'
        ? '✅'
        : matcherVote.final_vote === 'maybe'
          ? '⚠️'
          : '❌';
    
    messages.push({
      id: generateId(),
      agent: 'matcher',
      model: AGENT_MODELS.matcher,
      round: 3,
      phase: 'revise',
      text: `**Final Vote: ${matcherVote.final_vote}** ${matcherVoteEmoji}\n\n${matcherVote.revised_reasoning}`,
      timestamp: getCurrentTimestamp(),
    });

    const writerVoteEmoji =
      writerVote.final_vote === 'apply'
        ? '✅'
        : writerVote.final_vote === 'maybe'
          ? '⚠️'
          : '❌';

    messages.push({
      id: generateId(),
      agent: 'writer',
      model: AGENT_MODELS.writer,
      round: 3,
      phase: 'revise',
      text: `**Final Vote: ${writerVote.final_vote}** ${writerVoteEmoji}\n\n${writerVote.revised_reasoning}`,
      timestamp: getCurrentTimestamp(),
    });
  } catch (error) {
    console.error('[v0] Error in Round 3:', error);
    return messages;
  }

  // ===== NEGOTIATOR: RESOLVE DISAGREEMENTS =====
  if (
    matcherVote &&
    writerVote &&
    matcherVote.final_vote !== writerVote.final_vote
  ) {
    console.log('[v0] Votes differ - invoking Negotiator');

    const negotiatorSystem = `You are the Negotiator Agent, acting as moderator between Matcher and Writer agents.

Matcher Agent voted "${matcherVote.final_vote}" with reasoning: "${matcherVote.revised_reasoning}"
Writer Agent voted "${writerVote.final_vote}" with reasoning: "${writerVote.revised_reasoning}"

Make a final decision considering risk/reward tradeoff for the candidate:
- apply: High match, reasonable effort
- maybe: Mixed signals, uncertain outcome
- skip: Too much risk or misalignment

Return ONLY valid JSON with exactly these two keys (do not include "score", "reasoning", "revised_reasoning", "effort", "obstacles", or "final_vote"):
{
  "final_decision": "<'apply'|'maybe'|'skip'>",
  "justification": "<2-3 sentences explaining your decision and reasoning>"
}${langSuffix}`;

    try {
      const negotiatorText = await callQwen(negotiatorSystem, contextMsg, AGENT_MODELS.negotiator);
      const negotiatorDecision = parseNegotiatorDecision(negotiatorText);

      const decisionEmoji =
        negotiatorDecision.final_decision === 'apply'
          ? '✅'
          : negotiatorDecision.final_decision === 'maybe'
            ? '⚠️'
            : '❌';
      
      messages.push({
        id: generateId(),
        agent: 'negotiator',
        model: AGENT_MODELS.negotiator,
        round: 3,
        phase: 'verdict',
        text: `**FINAL DECISION: ${negotiatorDecision.final_decision}** ${decisionEmoji}\n\n${negotiatorDecision.justification}`,
        timestamp: getCurrentTimestamp(),
      });
    } catch (error) {
      console.error('[v0] Error in Negotiator round:', error);
    }
  } else if (matcherVote && writerVote) {
    // Votes agree - consensus message
    const agreedVote = matcherVote.final_vote;
    const voteEmoji =
      agreedVote === 'apply'
        ? '✅'
        : agreedVote === 'maybe'
          ? '⚠️'
          : '❌';
    messages.push({
      id: generateId(),
      agent: 'negotiator',
      model: AGENT_MODELS.negotiator,
      round: 3,
      phase: 'verdict',
      text: `**CONSENSUS: ${agreedVote}** ${voteEmoji}\n\nBoth agents agree on this recommendation.`,
      timestamp: getCurrentTimestamp(),
    });
  }

  console.log('[v0] Debate completed with', messages.length, 'messages');
  return messages;
}
