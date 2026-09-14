import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CloudRain,
  CloudSun,
  Cloudy,
  Droplets,
  Loader2,
  Sun,
  Wind,
} from "lucide-react";
import { useEffect, useState } from "react";

const LILONGWE_LAT = -13.9833;
const LILONGWE_LON = 33.7833;

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  weather_code: number;
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
}

interface WeatherState {
  temperature: number;
  humidity: number;
  wind: number;
  condition: string;
  code: number;
}

/** Map WMO weather codes to a human-readable condition label. */
function conditionFromCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Variable conditions";
}

function conditionIcon(code: number) {
  if (code === 0 || code === 1) return Sun;
  if (code === 2) return CloudSun;
  if (code === 3) return Cloudy;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95) return CloudRain;
  return CloudSun;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LILONGWE_LAT}&longitude=${LILONGWE_LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather request failed");
        const data = (await res.json()) as OpenMeteoResponse;
        if (cancelled) return;
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          humidity: Math.round(data.current.relative_humidity_2m),
          wind: Math.round(data.current.wind_speed_10m),
          condition: conditionFromCode(data.current.weather_code),
          code: data.current.weather_code,
        });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  const CurrentIcon = weather ? conditionIcon(weather.code) : CloudSun;

  return (
    <Card className="gap-0 p-0 shadow-subtle">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="font-display text-base font-semibold">
          Weather Update
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading ? (
          <div
            data-ocid="weather.loading_state"
            className="flex items-center gap-3 py-6 text-sm text-muted-foreground"
          >
            <Loader2 className="size-5 animate-spin text-primary" />
            Loading live weather for Lilongwe…
          </div>
        ) : error || !weather ? (
          <div
            data-ocid="weather.error_state"
            className="flex flex-col gap-2 py-4 text-sm"
          >
            <p className="font-medium text-foreground">Weather unavailable</p>
            <p className="text-muted-foreground">
              Live conditions could not be loaded right now. Please try again
              shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CurrentIcon className="size-7" />
              </div>
              <div>
                <p className="font-display text-3xl font-bold tracking-tight text-foreground">
                  {weather.temperature}°C
                </p>
                <p className="text-sm text-muted-foreground">
                  Lilongwe, Malawi
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              {weather.condition}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Droplets className="size-3.5 text-primary" />
                {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind className="size-3.5 text-primary" />
                {weather.wind} km/h
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
