'use client';

import { LanguageProvider } from '@/lib/language-context';
import type { ReactNode } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
