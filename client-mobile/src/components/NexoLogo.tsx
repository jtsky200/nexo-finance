import { useTheme } from '@/contexts/ThemeContext';

interface NexoLogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function NexoLogo({ variant = 'full', size = 'md', className = '' }: NexoLogoProps) {
  const { theme } = useTheme();
  // Check if dark mode is active (either theme is dark, or system prefers dark)
  const isDark = theme === 'dark' || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches && theme !== 'light');

  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-base' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl' },
  };

  const IconSVG = () => (
    <img
      src="/brand-assets/png/transparent/ninja-base.png"
      alt="NEXO Ninja"
      className={sizeClasses[size].icon}
      style={{
        filter: isDark ? 'invert(1)' : 'none',
      }}
    />
  );

  const TextSVG = () => (
    <span className={`font-bold ${sizeClasses[size].text} text-foreground`}>
      NEXO
    </span>
  );

  if (variant === 'icon') {
    return (
      <div className={`flex items-center ${className}`}>
        <IconSVG />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center ${className}`}>
        <TextSVG />
      </div>
    );
  }

  // Full variant (icon + text)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <IconSVG />
      <TextSVG />
    </div>
  );
}
