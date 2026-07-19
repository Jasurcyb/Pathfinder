interface MatchScoreBadgeProps {
  score: number;
  className?: string;
}

export function MatchScoreBadge({ score, className = '' }: MatchScoreBadgeProps) {
  let bgColor = 'bg-red-500/20 text-red-400';
  let borderColor = 'border-red-500/30';

  if (score >= 80) {
    bgColor = 'bg-green-500/20 text-green-400';
    borderColor = 'border-green-500/30';
  } else if (score >= 70) {
    bgColor = 'bg-amber-500/20 text-amber-400';
    borderColor = 'border-amber-500/30';
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${bgColor} ${borderColor} ${className}`}
    >
      <span className="text-xs font-semibold">{score}%</span>
    </div>
  );
}
