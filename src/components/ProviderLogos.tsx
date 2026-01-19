/**
 * AI Provider Logo Components
 * Official brand logos for all supported AI providers
 */

import type { AIProvider } from '../services/api-keys';

interface LogoProps {
  size?: number;
  className?: string;
}

export function OpenAILogo({ size = 20, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

export function AnthropicLogo({ size = 20, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm3.174 5.793L7.305 14.91h4.876l-2.438-5.597z" />
    </svg>
  );
}

// OpenRouter - official logo
export function OpenRouterLogo({ size = 20, className = '' }: LogoProps) {
  return (
    <img
      src="/logos/openrouter.svg"
      width={size}
      height={size}
      alt="OpenRouter"
      className={`object-contain ${className}`}
    />
  );
}

// MiniMax - sound wave icon (gradient from pink to orange)
export function MiniMaxLogo({ size = 20, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="minimax-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e84a5f" />
          <stop offset="100%" stopColor="#ff8c42" />
        </linearGradient>
      </defs>
      <rect x="2" y="8" width="2.5" height="8" rx="1.25" fill="url(#minimax-grad)" />
      <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" fill="url(#minimax-grad)" />
      <rect x="11" y="2" width="2.5" height="20" rx="1.25" fill="url(#minimax-grad)" />
      <rect x="15.5" y="5" width="2.5" height="14" rx="1.25" fill="url(#minimax-grad)" />
      <rect x="20" y="8" width="2.5" height="8" rx="1.25" fill="url(#minimax-grad)" />
    </svg>
  );
}

// GLM (Zhipu) - using actual logo file
export function GLMLogo({ size = 20, className = '' }: LogoProps) {
  return (
    <img
      src="/logos/glm.svg"
      width={size}
      height={size}
      alt="GLM"
      className={`object-contain ${className}`}
    />
  );
}

export function GitHubLogo({ size = 20, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

// Provider logo component that selects the right logo
export function ProviderLogo({ provider, size = 20, className = '' }: { provider: AIProvider; size?: number; className?: string }) {
  switch (provider) {
    case 'openai':
      return <OpenAILogo size={size} className={className} />;
    case 'anthropic':
      return <AnthropicLogo size={size} className={className} />;
    case 'openrouter':
      return <OpenRouterLogo size={size} className={className} />;
    case 'minimax':
      return <MiniMaxLogo size={size} className={className} />;
    case 'glm':
      return <GLMLogo size={size} className={className} />;
  }
}

// Provider colors for consistent branding
export const PROVIDER_COLORS: Record<AIProvider, { bg: string; text: string; border: string; accent: string }> = {
  openai: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    accent: 'text-emerald-600',
  },
  anthropic: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    accent: 'text-orange-600',
  },
  openrouter: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    accent: 'text-purple-600',
  },
  minimax: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    accent: 'text-blue-600',
  },
  glm: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    accent: 'text-indigo-600',
  },
};
