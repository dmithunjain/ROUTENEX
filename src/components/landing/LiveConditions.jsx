import { useEffect, useState } from 'react'
import { CloudSun, Droplets, RefreshCw, Wind } from 'lucide-react'

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=12.6167&longitude=79.75&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FKolkata'

const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
}

/**
 * Live weather for the Uthiramerur hub, using the free Open-Meteo API
 * (public-apis directory). Transport records in ROUTENEX remain sample data.
 */
export default function LiveConditions() {
  const [state, setState] = useState({ status: 'loading', data: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setState((previous) => ({ ...previous, status: previous.data ? 'refreshing' : 'loading' }))
      try {
        const response = await fetch(WEATHER_URL, { signal: controller.signal })
        if (!response.ok) throw new Error(`Open-Meteo responded ${response.status}`)
        const payload = await response.json()
        setState({ status: 'ready', data: payload.current })
      } catch (error) {
        if (error.name === 'AbortError') return
        setState({ status: 'error', data: null })
      }
    }

    load()
    return () => controller.abort()
  }, [attempt])

  const data = state.data

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Live campus weather
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Uthiramerur hub · Open-Meteo public API
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          disabled={state.status === 'loading' || state.status === 'refreshing'}
          aria-label="Refresh live weather"
          className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <RefreshCw
            className={`size-3.5 ${state.status === 'refreshing' ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {state.status === 'loading' && (
        <div className="mt-4 animate-pulse space-y-2">
          <div className="h-8 w-24 rounded bg-slate-100" />
          <div className="h-3 w-40 rounded bg-slate-100" />
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-[11px] leading-relaxed text-slate-500">
          Live weather is unavailable right now. Transport schedules and availability continue to
          use the labelled sample data.
        </div>
      )}

      {data && (
        <>
          <div className="mt-3 flex items-end gap-3">
            <p className="font-display text-3xl font-semibold text-slate-900">
              {Math.round(data.temperature_2m)}°
            </p>
            <div className="pb-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <CloudSun className="size-3.5 text-amber-600" aria-hidden="true" />
                {WEATHER_CODES[data.weather_code] ?? 'Current conditions'}
              </p>
              <p className="text-[11px] text-slate-500">
                Feels like {Math.round(data.apparent_temperature)}°
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Droplets className="size-3.5 text-sky-600" aria-hidden="true" />
              {data.relative_humidity_2m}% humidity
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind className="size-3.5 text-slate-500" aria-hidden="true" />
              {Math.round(data.wind_speed_10m)} km/h wind
            </span>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-400">
            Live weather from Open-Meteo, a free API in the public-apis directory. Travel times and
            provider availability remain simulated sample data.
          </p>
        </>
      )}
    </div>
  )
}
