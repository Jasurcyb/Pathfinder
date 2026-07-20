'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getOpportunityById, defaultUserProfile } from '@/lib/mock-data';
import { MatchScoreBadge } from '@/components/MatchScoreBadge';
import { UserProfile } from '@/types';
import { useLanguage, type Locale } from '@/lib/language-context';

const localeMap: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  uz: 'uz-UZ',
};

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const opportunity = getOpportunityById(id);
  const [draftApplication, setDraftApplication] = useState(opportunity?.draftApplication || '');
  const [showRequirements, setShowRequirements] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const { t, locale } = useLanguage();

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      grant: 'catGrant',
      hackathon: 'catHackathon',
      scholarship: 'catScholarship',
      research: 'catResearchSingular',
      competition: 'catCompetition',
    };
    return map[cat] ? t(map[cat] as any) : cat;
  };

  const getDaysUntilDeadline = (deadline: string): string => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const days = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) return t('expired');
    if (days === 0) return t('today');
    if (days === 1) return t('tomorrow');
    return `${days} ${t('daysLeftSuffix')}`;
  };

  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.log('[v0] Failed to load profile from localStorage');
      }
    }
  }, []);

  if (!opportunity) {
    return (
      <main className="min-h-screen bg-background">
        <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PathFinder
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {t('navBack')}
            </Link>
          </div>
        </nav>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('oppNotFound')}</h1>
          <p className="text-foreground/70 mb-4">{t('oppNotFoundDesc').replace('{id}', id)}</p>
          <Link href="/" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            {t('goBack')}
          </Link>
        </div>
      </main>
    );
  }

  const daysUntil = getDaysUntilDeadline(opportunity.deadline);
  const isExpired = new Date(opportunity.deadline) < new Date();
  const deadlineDate = new Date(opportunity.deadline).toLocaleDateString(localeMap[locale] || 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleRegenerateDraft = () => {
    setDraftApplication(opportunity.draftApplication);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PathFinder
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            ← {t('navBack')}
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                      {getCategoryLabel(opportunity.category)}
                    </span>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${isExpired ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                      {daysUntil}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">{opportunity.title}</h1>
                  <p className="text-lg text-foreground/70 mt-2">{opportunity.organization}</p>
                </div>
                <MatchScoreBadge score={opportunity.matchScore} />
              </div>
            </div>

            {/* Key Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="text-sm text-muted-foreground mb-1">{t('deadlineLabel')}</div>
                <div className="text-lg font-semibold text-foreground">{deadlineDate}</div>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="text-sm text-muted-foreground mb-1">{t('locationLabel')}</div>
                <div className="text-lg font-semibold text-foreground">📍 {opportunity.location}</div>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold text-foreground mb-3">{t('description')}</h2>
              <p className="text-foreground/80 leading-relaxed">{opportunity.description}</p>
            </div>

            {/* Original Requirements (Collapsible) */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <button
                onClick={() => setShowRequirements(!showRequirements)}
                className="w-full flex items-center justify-between font-semibold text-foreground hover:text-primary transition-colors"
              >
                <h2 className="text-xl">{t('originalRequirements')}</h2>
                <span className="text-xl">{showRequirements ? '−' : '+'}</span>
              </button>
              {showRequirements && (
                <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-foreground/80 leading-relaxed text-sm">{opportunity.requirements}</p>
                </div>
              )}
            </div>

            {/* Translator's Simplified Version */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔤</span>
                <h2 className="text-xl font-semibold text-foreground">{t('simplifiedExplanation')}</h2>
              </div>
              <p className="text-foreground/80 leading-relaxed">{opportunity.translatedRequirements}</p>
            </div>

            {/* Match Score Breakdown */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('whyThisScore')}</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-medium text-foreground">{t('strongSkillMatch')}</p>
                    <p className="text-sm text-foreground/70">{t('skillsMatchDesc').replace('{skills}', profile.skills.slice(0, 2).join(', '))}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-medium text-foreground">{t('greatGpa')}</p>
                    <p className="text-sm text-foreground/70">{t('gpaMatchDesc').replace('{gpa}', String(profile.gpa))}</p>
                  </div>
                </div>
                {opportunity.matchScore < 80 && (
                  <div className="flex items-start gap-3">
                    <span className="text-amber-400 font-bold mt-1">!</span>
                    <div>
                      <p className="font-medium text-foreground">{t('englishRequirement')}</p>
                      <p className="text-sm text-foreground/70">{t('englishWarningDesc').replace('{level}', profile.englishLevel)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Draft Application */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✍</span>
                  <h2 className="text-xl font-semibold text-foreground">{t('draftApplication')}</h2>
                </div>
                <button
                  onClick={handleRegenerateDraft}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {t('regenerate')}
                </button>
              </div>
              <textarea
                value={draftApplication}
                onChange={e => setDraftApplication(e.target.value)}
                className="w-full h-48 p-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                placeholder={t('draftPlaceholder')}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t('draftDisclaimer')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <a
                href="#"
                className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-center hover:bg-primary/90 transition-colors"
              >
                {t('submitApplication')}
              </a>
              <button
                onClick={() => setDraftApplication('')}
                className="px-4 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-card/50 transition-colors"
              >
                {t('clearDraft')}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Quick Stats */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-4">{t('quickInfo')}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('status')}</span>
                    <p className="text-foreground font-medium capitalize">
                      {opportunity.status === 'discovered' && `🔍 ${t('statusDiscovered')}`}
                      {opportunity.status === 'matched' && `✓ ${t('statusMatched')}`}
                      {opportunity.status === 'drafted' && `✍ ${t('statusDrafted')}`}
                      {opportunity.status === 'applied' && `📤 ${t('statusApplied')}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('match')}</span>
                    <p className="text-foreground font-medium">{opportunity.matchScore}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('type')}</span>
                    <p className="text-foreground font-medium">{getCategoryLabel(opportunity.category)}</p>
                  </div>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">{t('requirementsChecklist')}</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-foreground/80">{t('bachelor')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={profile.gpa >= 3.5 ? 'text-green-400' : 'text-amber-400'}>
                      {profile.gpa >= 3.5 ? '✓' : '!'}
                    </span>
                    <span className="text-foreground/80">GPA {profile.gpa}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={['B2', 'C1', 'C2'].includes(profile.englishLevel) ? 'text-green-400' : 'text-amber-400'}>
                      {['B2', 'C1', 'C2'].includes(profile.englishLevel) ? '✓' : '!'}
                    </span>
                    <span className="text-foreground/80">{t('english')} {profile.englishLevel}</span>
                  </li>
                </ul>
              </div>

              {/* AI Agent Note */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🤖</span>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">{t('agentTip')}</h4>
                    <p className="text-xs text-foreground/70">
                      {opportunity.matchScore >= 80
                        ? t('highPriority')
                        : t('goodOpportunity')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
