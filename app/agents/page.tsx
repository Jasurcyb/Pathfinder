'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { mockOpportunities, defaultUserProfile } from '@/lib/mock-data';
import { AgentMessage } from '@/components/AgentMessage';
import { AgentMessage as AgentMessageType } from '@/types';
import { UserProfile } from '@/types';
import { useLanguage, type Locale } from '@/lib/language-context';

interface DebateApiMessage {
  id: string;
  agent: AgentMessageType['agent'];
  model: string;
  text: string;
  timestamp: string;
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  uz: "O'zbek",
};

/**
 * Read the latest user profile from localStorage (or fall back to default).
 * Called fresh on every debate request to avoid stale data.
 */
function getLatestProfile(): UserProfile {
  if (typeof window === 'undefined') return defaultUserProfile;
  try {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name && parsed.skills) {
        return parsed;
      }
    }
  } catch {
    console.log('[v0] Failed to load profile from localStorage');
  }
  return defaultUserProfile;
}

export default function AgentsPage() {
  const [messages, setMessages] = useState<AgentMessageType[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(mockOpportunities[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale } = useLanguage();

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleRunNewAnalysis = async () => {
    setIsRunning(true);
    setMessages([]);

    // Read fresh profile at click time — not a stale reference
    const currentProfile = getLatestProfile();
    console.log('[v0] Running debate with profile:', currentProfile.name, '| GPA:', currentProfile.gpa);

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: selectedOpportunityId,
          locale,
          userProfile: currentProfile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run debate');
      }

      const data = await response.json();
      const debateMessages = (data.messages as DebateApiMessage[]).map(msg => ({
        id: msg.id,
        agent: msg.agent,
        model: msg.model,
        message: msg.text,
        timestamp: msg.timestamp,
      }));

      // Stream messages with delay for visual effect
      debateMessages.forEach((msg, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, msg]);
        }, index * 800);
      });

      // Set running false after all messages are shown
      setTimeout(() => {
        setIsRunning(false);
      }, debateMessages.length * 800 + 500);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('[v0] Debate API error:', errorMsg);

      setMessages([
        {
          id: `error-${Date.now()}`,
          agent: 'negotiator',
          message: `Ошибка при запуске дебатов: ${errorMsg}. Пожалуйста, проверьте, что установлена переменная окружения QWEN_API_KEY.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PathFinder
          </Link>
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
              href="/"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Панель управления
            </Link>
            <Link
              href="/profile"
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Профиль
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Debate Area */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Дебаты агентов</h1>
              <p className="text-foreground/70 mb-4">
                Посмотрите, как AI-агенты общаются, обсуждают и принимают консенсус по вашим возможностям
              </p>

              {/* Opportunity Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Выберите возможность для анализа:
                </label>
                <select
                  value={selectedOpportunityId}
                  onChange={e => setSelectedOpportunityId(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {mockOpportunities.map(opp => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title} ({opp.organization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chat Container */}
            <div
              ref={scrollContainerRef}
              className="h-[600px] overflow-y-auto rounded-lg border border-border bg-background/50 p-4 mb-4 space-y-3"
            >
              {messages.length === 0 && !isRunning && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">Нажмите кнопку ниже, чтобы запустить анализ</p>
                  </div>
                </div>
              )}

              {isRunning && messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="flex justify-center gap-1 mb-4">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="text-muted-foreground">Агенты думают...</p>
                  </div>
                </div>
              )}

              {messages.map(message => (
                <AgentMessage key={message.id} message={message} />
              ))}

              {isRunning && messages.length > 0 && (
                <div className="flex justify-center gap-1 py-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunNewAnalysis}
              disabled={isRunning}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isRunning ? 'Анализ в процессе...' : 'Запустить новый анализ'}
            </button>
          </div>

          {/* Agent Legend Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-4">Агенты дебатов</h3>
                <div className="space-y-3">
                  {[
                    { agent: 'scout', label: 'Scout Agent', model: 'qwen3.6-flash', desc: 'Ищет актуальную информацию', color: 'bg-blue-500/20 border-blue-500/30' },
                    { agent: 'matcher', label: 'Matcher Agent', model: 'qwen3.6-plus', desc: 'Оценивает соответствие профилю', color: 'bg-green-500/20 border-green-500/30' },
                    { agent: 'writer', label: 'Writer Agent', model: 'qwen3.6-flash', desc: 'Оценивает требуемые усилия', color: 'bg-orange-500/20 border-orange-500/30' },
                    { agent: 'negotiator', label: 'Negotiator Agent', model: 'qwen3.7-max', desc: 'Принимает финальное решение', color: 'bg-red-500/20 border-red-500/30' },
                  ].map(item => (
                    <div key={item.agent} className={`p-3 rounded border ${item.color}`}>
                      <h4 className="font-medium text-sm text-foreground">{item.label}</h4>
                      <p className="text-xs text-primary/80 font-mono mt-0.5">{item.model}</p>
                      <p className="text-xs text-foreground/70 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground mb-3">Протокол дебатов</h3>
                <ol className="space-y-2 text-sm text-foreground/70">
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-bold text-primary">1.</span>
                    <span>Scout проверяет актуальную информацию</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-bold text-primary">2.</span>
                    <span>Matcher и Writer предлагают оценки</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-bold text-primary">3.</span>
                    <span>Агенты обсуждают позиции друг друга</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-bold text-primary">4.</span>
                    <span>Агенты пересматривают и голосуют</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0 font-bold text-primary">5.</span>
                    <span>Negotiator выносит финальное решение</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
