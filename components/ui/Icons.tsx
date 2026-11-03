type IconProps = { className?: string };

const base = "h-4 w-4";

export function SearchIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function ChevronDown({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ArrowRight({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function Play({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5.2v13.6c0 .9 1 1.4 1.7.9l10-6.8a1 1 0 0 0 0-1.7l-10-6.9C8.9 3.8 8 4.3 8 5.2Z" />
    </svg>
  );
}

export function Pause({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="6" y="4" width="4.4" height="16" rx="1.4" />
      <rect x="13.6" y="4" width="4.4" height="16" rx="1.4" />
    </svg>
  );
}

export function SkipBack({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="5" y="5" width="2.6" height="14" rx="1.2" />
      <path d="M19 5.9v12.2c0 .9-1 1.4-1.7.9l-8.4-6.1a1 1 0 0 1 0-1.6l8.4-6.2c.7-.5 1.7 0 1.7.8Z" />
    </svg>
  );
}

export function SkipForward({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="16.4" y="5" width="2.6" height="14" rx="1.2" />
      <path d="M5 5.9v12.2c0 .9 1 1.4 1.7.9l8.4-6.1a1 1 0 0 0 0-1.6L6.7 5.1C6 4.6 5 5.1 5 5.9Z" />
    </svg>
  );
}

export function Reset({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export function Sparkle({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.6 13.9 8l5.5 1.9-5.5 1.9L12 17.4l-1.9-5.6L4.6 9.9 10.1 8 12 2.6Z" />
      <path d="M18.6 15.4 19.6 18l2.6 1-2.6 1-1 2.6-1-2.6L15 19l2.6-1 1-2.6Z" opacity=".7" />
    </svg>
  );
}

export function Check({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function Pin({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.4c-3.6 0-6.5 2.9-6.5 6.5 0 4.7 6.5 12.7 6.5 12.7s6.5-8 6.5-12.7c0-3.6-2.9-6.5-6.5-6.5Zm0 9a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

export function Globe({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9Z" />
    </svg>
  );
}

export function CodeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m8.5 7.5-5 4.5 5 4.5" />
      <path d="m15.5 7.5 5 4.5-5 4.5" />
    </svg>
  );
}

export function BookIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19v5H6.5A2.5 2.5 0 0 1 4 18.5Z" />
    </svg>
  );
}

export function Layers({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

export function Bolt({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.3 2 5 13.2h5.2L9.8 22l8.4-11.4h-5.3L13.3 2Z" />
    </svg>
  );
}

export function Copy({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6.5A2.5 2.5 0 0 0 4 5.5v6A2.5 2.5 0 0 0 6.5 14" />
    </svg>
  );
}

export function External({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18.5 14.5V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5h3.5" />
    </svg>
  );
}

export function Clock({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function Menu({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function Alert({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M12 3.5 21 20H3l9-16.5Z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function XIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
