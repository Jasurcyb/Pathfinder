import { AgentMessage as AgentMessageType } from '@/types';

const agentConfig = {
  scout: { label: 'Scout Agent', color: 'bg-blue-500/20 border-blue-500/30', textColor: 'text-blue-400' },
  matcher: { label: 'Matcher Agent', color: 'bg-green-500/20 border-green-500/30', textColor: 'text-green-400' },
  translator: { label: 'Translator Agent', color: 'bg-purple-500/20 border-purple-500/30', textColor: 'text-purple-400' },
  writer: { label: 'Writer Agent', color: 'bg-orange-500/20 border-orange-500/30', textColor: 'text-orange-400' },
  negotiator: { label: 'Negotiator Agent', color: 'bg-red-500/20 border-red-500/30', textColor: 'text-red-400' },
};

interface AgentMessageProps {
  message: AgentMessageType;
}

export function AgentMessage({ message }: AgentMessageProps) {
  const config = agentConfig[message.agent];
  const timestamp = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-3 p-3 rounded-lg border ${config.color}`}>
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${config.textColor}`}>
            {message.agent === 'scout' && '🔍'}
            {message.agent === 'matcher' && '✓'}
            {message.agent === 'translator' && '🔤'}
            {message.agent === 'writer' && '✍'}
            {message.agent === 'negotiator' && '⚖'}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm ${config.textColor}`}>{config.label}</span>
            {message.model && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-foreground/10 text-muted-foreground">
                {message.model}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{message.message}</p>
      </div>
    </div>
  );
}
