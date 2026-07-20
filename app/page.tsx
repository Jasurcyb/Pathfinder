'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockOpportunities, calculateStats, filterOpportunities } from '@/lib/mock-data';
import { OpportunityCard } from '@/components/OpportunityCard';
import { useLanguage, type Locale } from '@/lib/language-context';

type CategoryFilter = 'all' | 'grants' | 'hackathons' | 'scholarships' | 'research' | 'competition';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');
  const stats = calculateStats();
  const { t, locale, setLocale } = useLanguage();

  const categoryTabs: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: t('catAll') },
    { id: 'grants', label: t('catGrants') },
    { id: 'hackathons', label: t('catHackathons') },
    { id: 'scholarships', label: t('catScholarships') },
    { id: 'research', label: t('catResearch') },
    { id: 'competition', label: t('catCompetitions') },
  ];

  const filteredOpportunities = filterOpportunities(
    activeTab === 'all' ? undefined : activeTab.slice(0, -1)
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PathFinder
          </h1>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-0.5">
              {(Object.keys(LOCALE_LABELS) as Locale[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    locale === loc
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
            <Link
              href="/agents"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {t('navDebate')}
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {t('navProfile')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              {t('title')}
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">{t('statFound')}</div>
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">{t('statMatches')}</div>
              <div className="text-2xl font-bold text-emerald-400">{stats.matched}</div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">{t('statApplied')}</div>
              <div className="text-2xl font-bold text-amber-400">{stats.applied}</div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">{t('statSuccess')}</div>
              <div className="text-2xl font-bold text-accent">{stats.successRate}%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Status */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('agentStatus')}</span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-foreground/80">{t('scoutScanning')}</span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-muted rounded-full"></span>
              <span className="text-foreground/80">{t('matcherReady')}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4 -my-4 px-4 -mx-4">
            {categoryTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap border ${activeTab === tab.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-foreground/70 border-border hover:text-foreground hover:border-primary/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunities Grid */}
      <section className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOpportunities.map(opportunity => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('noOpportunities')}</p>
              <button
                onClick={() => setActiveTab('all')}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                {t('showAll')}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
