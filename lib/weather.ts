export type WeatherTag = { emoji: string; description: string; tempC: number } | null;

const EMOJI_BY_CONDITION: Record<string, string> = {
  Clear: "☀️",
  Clouds: "☁️",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "❄️",
  Mist: "🌫️",
  Fog: "🌫️",
  Haze: "🌫️",
};

/**
 * Shortcut: OpenWeatherMap's `q` param does a best-effort text match, so we
 * pass it the delivery's address as-is rather than geocoding first. This
 * works fine for "City, Country"-style addresses but can miss on a full
 * street address. A "real" version would geocode the address to lat/lon
 * (OWM's Geocoding API) and query by coordinates instead.
 */
export async function getWeatherForAddress(address: string): Promise<WeatherTag> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey || !address.trim()) return null;

  const city = address.split(",").pop()?.trim() || address.trim();

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city,
      )}&units=metric&appid=${apiKey}`,
      { next: { revalidate: 600 } }, // cache 10 min, weather doesn't need to be live-live
    );
    if (!res.ok) return null;
    const data = await res.json();
    const condition = data?.weather?.[0]?.main as string | undefined;
    const description = data?.weather?.[0]?.description as string | undefined;
    const temp = data?.main?.temp as number | undefined;
    if (temp === undefined || !description) return null;
    return {
      emoji: (condition && EMOJI_BY_CONDITION[condition]) || "🌡️",
      description,
      tempC: Math.round(temp),
    };
  } catch {
    return null;
  }
}
