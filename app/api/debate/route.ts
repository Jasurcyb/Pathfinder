import { NextRequest, NextResponse } from 'next/server';
import { mockOpportunities, defaultUserProfile } from '@/lib/mock-data';
import { runDebate, type Locale } from '@/lib/debate-engine';
import { UserProfile } from '@/types';

// In-memory store for rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return false;
  }

  record.count++;
  return record.count > limit;
}

export async function POST(request: NextRequest) {
  try {
    // Basic IP-based rate limiting (10 requests per minute per IP)
    const ip = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
    if (isRateLimited(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { opportunityId, locale = 'en', userProfile } = body;

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'opportunityId is required' },
        { status: 400 }
      );
    }

    // Validate locale
    const validLocales: Locale[] = ['en', 'ru', 'uz'];
    const safeLocale: Locale = validLocales.includes(locale) ? locale : 'en';

    // Find the opportunity
    const opportunity = mockOpportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Use provided userProfile if valid, otherwise fall back to default
    const profile: UserProfile = (userProfile && userProfile.name && userProfile.skills)
      ? userProfile
      : defaultUserProfile;

    console.log('[v0] Debate requested for opportunity:', opportunityId, '| locale:', safeLocale);
    console.log('[v0] Using profile:', profile.name, '| GPA:', profile.gpa, '| English:', profile.englishLevel);

    // Run the debate with locale and fresh profile
    const messages = await runDebate(opportunity, profile, safeLocale);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[v0] Debate API error:', errorMsg);

    return NextResponse.json(
      { error: 'Failed to run debate: ' + errorMsg },
      { status: 500 }
    );
  }
}
