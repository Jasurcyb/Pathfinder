'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getOpportunityById, defaultUserProfile } from '@/lib/mock-data';
import { MatchScoreBadge } from '@/components/MatchScoreBadge';
import { UserProfile } from '@/types';

const categoryLabels: Record<string, string> = {
  grant: 'Грант',
  hackathon: 'Хакатон',
  scholarship: 'Стипендия',
  research: 'Исследование',
  competition: 'Конкурс',
};

function getDaysUntilDeadline(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const days = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return 'Истекло';
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  return `${days} дн.`;
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const opportunity = getOpportunityById(id);
  const [draftApplication, setDraftApplication] = useState(opportunity?.draftApplication || '');
  const [showRequirements, setShowRequirements] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);

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
              Назад на панель
            </Link>
          </div>
        </nav>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Возможность не найдена</h1>
          <p className="text-foreground/70 mb-4">Возможность с ID {id} не существует</p>
          <Link href="/" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90">
            Вернуться на панель
          </Link>
        </div>
      </main>
    );
  }

  const daysUntil = getDaysUntilDeadline(opportunity.deadline);
  const isExpired = new Date(opportunity.deadline) < new Date();
  const deadlineDate = new Date(opportunity.deadline).toLocaleDateString('ru-RU', {
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
            ← Назад на панель
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
                      {categoryLabels[opportunity.category]}
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
                <div className="text-sm text-muted-foreground mb-1">Крайний срок</div>
                <div className="text-lg font-semibold text-foreground">{deadlineDate}</div>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <div className="text-sm text-muted-foreground mb-1">Локация</div>
                <div className="text-lg font-semibold text-foreground">📍 {opportunity.location}</div>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold text-foreground mb-3">Описание</h2>
              <p className="text-foreground/80 leading-relaxed">{opportunity.description}</p>
            </div>

            {/* Original Requirements (Collapsible) */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <button
                onClick={() => setShowRequirements(!showRequirements)}
                className="w-full flex items-center justify-between font-semibold text-foreground hover:text-primary transition-colors"
              >
                <h2 className="text-xl">Оригинальные требования (английский)</h2>
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
                <h2 className="text-xl font-semibold text-foreground">Упрощенное объяснение на русском</h2>
              </div>
              <p className="text-foreground/80 leading-relaxed">{opportunity.translatedRequirements}</p>
            </div>

            {/* Match Score Breakdown */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold text-foreground mb-4">Почему эта оценка совпадения?</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Сильное совпадение навыков</p>
                    <p className="text-sm text-foreground/70">Ваши навыки в {profile.skills.slice(0, 2).join(', ')} отлично соответствуют требованиям</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-1">✓</span>
                  <div>
                    <p className="font-medium text-foreground">Отличный GPA</p>
                    <p className="text-sm text-foreground/70">Ваш GPA {profile.gpa} выше среднего требуемого</p>
                  </div>
                </div>
                {opportunity.matchScore < 80 && (
                  <div className="flex items-start gap-3">
                    <span className="text-amber-400 font-bold mt-1">!</span>
                    <div>
                      <p className="font-medium text-foreground">Требования к английскому</p>
                      <p className="text-sm text-foreground/70">Уровень {profile.englishLevel} ниже требуемого. Рассмотрите подготовку.</p>
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
                  <h2 className="text-xl font-semibold text-foreground">Черновик заявления</h2>
                </div>
                <button
                  onClick={handleRegenerateDraft}
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Переделать
                </button>
              </div>
              <textarea
                value={draftApplication}
                onChange={e => setDraftApplication(e.target.value)}
                className="w-full h-48 p-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                placeholder="Ваше заявление появится здесь..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Это предварительный черновик, созданный AI. Отредактируйте его под себя перед подачей.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <a
                href="#"
                className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-center hover:bg-primary/90 transition-colors"
              >
                Отправить заявление
              </a>
              <button
                onClick={() => setDraftApplication('')}
                className="px-4 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-card/50 transition-colors"
              >
                Очистить
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Quick Stats */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-4">Быстрая информация</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Статус</span>
                    <p className="text-foreground font-medium capitalize">
                      {opportunity.status === 'discovered' && '🔍 Обнаружено'}
                      {opportunity.status === 'matched' && '✓ Совпадает'}
                      {opportunity.status === 'drafted' && '✍ Черновик'}
                      {opportunity.status === 'applied' && '📤 Подано'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Совпадение</span>
                    <p className="text-foreground font-medium">{opportunity.matchScore}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Тип</span>
                    <p className="text-foreground font-medium">{categoryLabels[opportunity.category]}</p>
                  </div>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">Требования</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-foreground/80">Бакалавр</span>
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
                    <span className="text-foreground/80">Английский {profile.englishLevel}</span>
                  </li>
                </ul>
              </div>

              {/* AI Agent Note */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🤖</span>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">Совет от агентов</h4>
                    <p className="text-xs text-foreground/70">
                      {opportunity.matchScore >= 80
                        ? 'Высокий приоритет! Подайте заявление как можно скорее.'
                        : 'Хорошая возможность, но требуется подготовка. Рассмотрите другие варианты в первую очередь.'}
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
