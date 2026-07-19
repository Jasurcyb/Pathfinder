'use client';

import Link from 'next/link';
import { Opportunity } from '@/types';
import { MatchScoreBadge } from './MatchScoreBadge';

const categoryLabels: Record<string, string> = {
  grant: 'Грант',
  hackathon: 'Хакатон',
  scholarship: 'Стипендия',
  research: 'Исследование',
  competition: 'Конкурс',
};

const categoryColors: Record<string, string> = {
  grant: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  hackathon: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  scholarship: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  research: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  competition: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
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

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const daysUntil = getDaysUntilDeadline(opportunity.deadline);
  const isExpired = new Date(opportunity.deadline) < new Date();
  const categoryColor = categoryColors[opportunity.category] || categoryColors.grant;

  return (
    <Link href={`/opportunity/${opportunity.id}`}>
      <div className="group h-full p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors cursor-pointer hover:border-primary/50">
        {/* Header with category and deadline */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${categoryColor}`}>
              {categoryLabels[opportunity.category]}
            </span>
          </div>
          <div className={`text-right text-xs font-semibold px-2 py-1 rounded ${isExpired ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
            {daysUntil}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {opportunity.title}
        </h3>

        {/* Organization */}
        <p className="text-sm text-muted-foreground mb-3">{opportunity.organization}</p>

        {/* Description preview */}
        <p className="text-xs text-foreground/70 mb-4 line-clamp-2">{opportunity.description}</p>

        {/* Location */}
        <p className="text-xs text-muted-foreground mb-3">
          📍 {opportunity.location}
        </p>

        {/* Footer with match score and button */}
        <div className="flex items-center justify-between">
          <MatchScoreBadge score={opportunity.matchScore} />
          <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/10">
            Подробнее →
          </button>
        </div>
      </div>
    </Link>
  );
}
