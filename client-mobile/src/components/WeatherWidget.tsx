import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSun, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherData {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
}

interface WeatherWidgetProps {
  selectedDate: Date | null;
}

export default function WeatherWidget({ selectedDate }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchWeather(selectedDate);
    } else {
      setWeather(null);
    }
  }, [selectedDate]);

  const fetchWeather = async (date: Date) => {
    setIsLoading(true);
    try {
      // TODO: Phase 3 - Wetter-API Integration
      // Für jetzt: Placeholder-Daten
      const dateStr = date.toISOString().split('T')[0];
      
      // Simuliere API-Call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Placeholder-Wetterdaten
      setWeather({
        date: dateStr,
        temperature: 15,
        condition: 'Bewölkt',
        icon: 'cloud',
        humidity: 65,
        windSpeed: 12
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sun':
        return <Sun className="w-5 h-5" />;
      case 'cloud-sun':
        return <CloudSun className="w-5 h-5" />;
      case 'cloud':
        return <Cloud className="w-5 h-5" />;
      case 'rain':
        return <CloudRain className="w-5 h-5" />;
      case 'snow':
        return <CloudRain className="w-5 h-5" />;
      default:
        return <Cloud className="w-5 h-5" />;
    }
  };

  if (!selectedDate) {
    return null;
  }

  const dateStr = selectedDate.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Wetter</h4>
        <span className="text-[10px] text-muted-foreground">{dateStr}</span>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="text-xs text-muted-foreground">Lädt...</div>
        </div>
      ) : weather ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.icon)}
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{weather.temperature}°</span>
                <span className="text-xs text-muted-foreground">C</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{weather.condition}</div>
            </div>
          </div>
          
          {weather.humidity !== undefined && weather.windSpeed !== undefined && (
            <div className="flex gap-3 text-[9px] text-muted-foreground pt-1 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>{weather.windSpeed} km/h</span>
              </div>
              <div>
                <span>Luftfeuchtigkeit: {weather.humidity}%</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-2">
          Keine Wetterdaten verfügbar
        </div>
      )}
    </div>
  );
}
