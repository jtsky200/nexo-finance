import { ReactNode } from 'react';
import NexoMascot from './NexoMascot';

interface OnboardingThemeProps {
  children: ReactNode;
}

// Get current season based on month
function getSeason(): 'winter' | 'spring' | 'summer' | 'autumn' {
  const month = new Date().getMonth() + 1; // 1-12
  if (month === 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
}

// Season-specific styling
const seasonStyles = {
  winter: {
    background: 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100',
    accent: 'border-blue-200',
    icon: '❄',
    iconColor: 'text-blue-400',
  },
  spring: {
    background: 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100',
    accent: 'border-green-200',
    icon: '🌸',
    iconColor: 'text-green-400',
  },
  summer: {
    background: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100',
    accent: 'border-orange-200',
    icon: '☀',
    iconColor: 'text-orange-400',
  },
  autumn: {
    background: 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100',
    accent: 'border-orange-300',
    icon: '🍂',
    iconColor: 'text-orange-500',
  },
};

export default function OnboardingTheme({ children }: OnboardingThemeProps) {
  const season = getSeason();
  const styles = seasonStyles[season];

  return (
    <div className={`min-h-screen ${styles.background} p-4 relative overflow-hidden`}>
      {/* Honey Badger Mascot - Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top right corner - larger mascot */}
        <div className="absolute top-8 right-8">
          <NexoMascot size={300} opacity={0.08} />
        </div>
        {/* Bottom left corner - smaller mascot */}
        <div className="absolute bottom-8 left-8">
          <NexoMascot size={200} opacity={0.05} />
        </div>
        {/* Center right - medium mascot */}
        <div className="absolute top-1/2 right-16 -translate-y-1/2">
          <NexoMascot size={250} opacity={0.06} />
        </div>
      </div>
      
      {/* Subtle seasonal icon in top-right corner */}
      <div className={`absolute top-4 right-4 text-2xl opacity-15 ${styles.iconColor} z-10`}>
        {styles.icon}
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function getSeasonalCardClass(): string {
  const season = getSeason();
  return `bg-white/95 backdrop-blur-sm shadow-xl border ${seasonStyles[season].accent} rounded-3xl`;
}

