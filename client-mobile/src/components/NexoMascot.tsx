import { useTheme } from '@/contexts/ThemeContext';

interface NexoMascotProps {
  size?: number;
  opacity?: number;
  className?: string;
}

export default function NexoMascot({ size = 200, opacity = 0.1, className = '' }: NexoMascotProps) {
  const { theme } = useTheme();
  // Check if dark mode is active (either theme is dark, or system prefers dark)
  const isDark = theme === 'dark' || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches && theme !== 'light');

  return (
    <img
      src="/brand-assets/png/transparent/ninja-base.png"
      alt="NEXO Ninja Mascot"
      className={className}
      style={{
        width: size,
        height: size,
        opacity,
        filter: isDark ? 'invert(1)' : 'none',
      }}
    />
  );
}
