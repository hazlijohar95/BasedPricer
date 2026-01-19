/**
 * BasedPricer Logo Component
 *
 * A geometric, pixel-inspired logo that represents pricing/value
 * with a modern minimalist aesthetic inspired by OpenCode.
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'wordmark';
  animated?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 14, gap: 8 },
  md: { icon: 32, text: 18, gap: 10 },
  lg: { icon: 40, text: 24, gap: 12 },
  xl: { icon: 56, text: 32, gap: 16 },
};

export function Logo({
  size = 'md',
  variant = 'full',
  animated = false,
  className = ''
}: LogoProps) {
  const s = sizes[size];

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: s.gap }}
    >
      {variant !== 'wordmark' && (
        <LogoIcon size={s.icon} animated={animated} />
      )}
      {variant !== 'icon' && (
        <LogoWordmark size={s.text} animated={animated} />
      )}
    </div>
  );
}

/**
 * The icon mark - a geometric "B" made of price bars
 */
function LogoIcon({ size, animated }: { size: number; animated: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={animated ? 'logo-icon-animated' : ''}
    >
      {/* Background square */}
      <rect
        width="32"
        height="32"
        rx="6"
        className="fill-brand-primary"
      />

      {/* Price bars forming abstract "B" / chart pattern */}
      <g className="logo-bars">
        {/* Left column - base */}
        <rect x="7" y="7" width="4" height="18" rx="1" fill="white" fillOpacity="0.95" />

        {/* Top bar */}
        <rect
          x="13" y="7" width="6" height="4" rx="1"
          fill="white" fillOpacity="0.7"
          className={animated ? 'logo-bar-1' : ''}
        />

        {/* Middle bar */}
        <rect
          x="13" y="13" width="8" height="4" rx="1"
          fill="white" fillOpacity="0.85"
          className={animated ? 'logo-bar-2' : ''}
        />

        {/* Bottom bar - longest, represents growth */}
        <rect
          x="13" y="19" width="12" height="6" rx="1"
          fill="white" fillOpacity="1"
          className={animated ? 'logo-bar-3' : ''}
        />
      </g>
    </svg>
  );
}

/**
 * The wordmark with pixel-inspired typography
 */
function LogoWordmark({ size, animated }: { size: number; animated: boolean }) {
  return (
    <div
      className={`logo-wordmark ${animated ? 'logo-wordmark-animated' : ''}`}
      style={{
        fontSize: size,
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        fontWeight: 600,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      <span className="text-brand-primary">based</span>
      <span className="text-gray-400">pricer</span>
    </div>
  );
}

/**
 * Animated logo for loading states
 */
export function LogoLoader({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="logo-loader">
        <LogoIcon size={s.icon} animated={true} />
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Favicon/App icon variant
 */
export function LogoFavicon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0A0A0A"/>
      <rect x="7" y="7" width="4" height="18" rx="1" fill="#3B82F6"/>
      <rect x="13" y="7" width="6" height="4" rx="1" fill="#3B82F6" fillOpacity="0.5"/>
      <rect x="13" y="13" width="8" height="4" rx="1" fill="#3B82F6" fillOpacity="0.7"/>
      <rect x="13" y="19" width="12" height="6" rx="1" fill="#3B82F6"/>
    </svg>
  );
}
