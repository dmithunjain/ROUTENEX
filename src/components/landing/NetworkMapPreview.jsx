import { useMemo } from 'react'
import { Bus, GraduationCap, MapPin, Zap } from 'lucide-react'

import { useAppData } from '@/context/AppDataContext'
import { getProvider } from '@/services/transportService'

const WIDTH = 920
const HEIGHT = 520
const PADDING = 54

function project(stops) {
  const lats = stops.map((stop) => Number(stop.lat))
  const lngs = stops.map((stop) => Number(stop.lng))
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const spanLat = maxLat - minLat || 1
  const spanLng = maxLng - minLng || 1
  return (stop) => ({
    x: PADDING + ((Number(stop.lng) - minLng) / spanLng) * (WIDTH - PADDING * 2),
    y: HEIGHT - PADDING - ((Number(stop.lat) - minLat) / spanLat) * (HEIGHT - PADDING * 2),
  })
}

export default function NetworkMapPreview() {
  const { db } = useAppData()

  const points = useMemo(() => {
    const projectStop = project(db.stops)
    const map = new Map()
    db.stops.forEach((stop) => map.set(stop.id, projectStop(stop)))
    return map
  }, [db.stops])

  const evVehicles = db.vehicles.filter((vehicle) => vehicle.kind?.startsWith('ev-'))

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-slate-800">Network preview</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Villages, college stops, bus routes and registered EV providers from the shared data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-medium text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-pine-100 px-2 py-1 text-pine-800">
            <Bus className="size-3" aria-hidden="true" /> Bus route
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
            <MapPin className="size-3" aria-hidden="true" /> Village stop
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-700">
            <GraduationCap className="size-3" aria-hidden="true" /> College
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-800">
            <Zap className="size-3" aria-hidden="true" /> EV provider
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Schematic map of ROUTENEX villages, bus routes, college stops and EV providers"
        className="h-auto w-full bg-[#eef4ef]"
      >
        <defs>
          <pattern id="map-grid" width="46" height="46" patternUnits="userSpaceOnUse">
            <path d="M46 0H0V46" fill="none" stroke="#dbe7dd" strokeWidth="1" />
          </pattern>
          <filter id="marker-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" floodColor="#0f2e23" floodOpacity="0.22" />
          </filter>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#map-grid)" />
        <path
          d="M-20 410 C 150 340, 300 450, 500 350 S 820 300, 960 200"
          fill="none"
          stroke="#cfe1d2"
          strokeWidth="34"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M-20 410 C 150 340, 300 450, 500 350 S 820 300, 960 200"
          fill="none"
          stroke="#eaf3ea"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {db.routes.map((route) => {
          const coordinates = route.stops
            .map((stopId) => points.get(stopId))
            .filter(Boolean)
            .map((point) => `${point.x},${point.y}`)
            .join(' ')
          return (
            <polyline
              key={route.id}
              points={coordinates}
              fill="none"
              stroke={route.color || '#157456'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.72"
            >
              <title>{`${route.code} · ${route.name}`}</title>
            </polyline>
          )
        })}

        {evVehicles.map((vehicle, index) => {
          const base = points.get(vehicle.locationStopId)
          if (!base) return null
          const provider = getProvider(db, vehicle.providerId)
          const offset = ((index % 3) - 1) * 18
          return (
            <g key={vehicle.id} transform={`translate(${base.x + 18}, ${base.y - 18 + offset})`}>
              <rect
                x="-8"
                y="-8"
                width="16"
                height="16"
                rx="4"
                fill="#d97706"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#marker-shadow)"
                transform="rotate(45)"
              >
                <title>{`${provider?.name ?? 'EV provider'} · ${vehicle.model} · ${vehicle.registration}`}</title>
              </rect>
              <text
                x="0"
                y="3.2"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8"
                fontWeight="700"
              >
                EV
              </text>
            </g>
          )
        })}

        {db.stops.map((stop) => {
          const point = points.get(stop.id)
          if (!point) return null
          const isCollege = Boolean(stop.isCollege)
          return (
            <g key={stop.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isCollege ? 9 : 6}
                fill={isCollege ? '#1d4ed8' : '#ffffff'}
                stroke={isCollege ? '#ffffff' : '#157456'}
                strokeWidth={isCollege ? 2.5 : 2.5}
                filter="url(#marker-shadow)"
              >
                <title>{`${stop.name}${isCollege ? ' · college stop' : ''}`}</title>
              </circle>
              {isCollege && (
                <text
                  x={point.x}
                  y={point.y + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="#ffffff"
                >
                  C
                </text>
              )}
              <text
                x={point.x}
                y={point.y - (isCollege ? 15 : 12)}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#334155"
                stroke="#eef4ef"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {stop.name}
              </text>
            </g>
          )
        })}

        <g transform={`translate(${PADDING}, ${HEIGHT - 26})`}>
          <rect x="-12" y="-16" width="280" height="32" rx="8" fill="#ffffff" opacity="0.9" />
          <text x="0" y="4" fontSize="10" fill="#64748b">
            Schematic preview · not to scale · sample network data
          </text>
        </g>
      </svg>
    </div>
  )
}
