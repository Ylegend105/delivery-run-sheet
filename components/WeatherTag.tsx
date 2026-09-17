import type { WeatherTag as WeatherTagData } from "@/lib/weather";

export function WeatherTag({ weather }: { weather: WeatherTagData }) {
  if (!weather) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-800">
      {weather.emoji} {weather.tempC}°C, {weather.description}
    </span>
  );
}
