import { Bus, Clock, Footprints, IndianRupee, ShieldCheck, Zap } from 'lucide-react'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { formatClock } from '@/services/transportService'

const MODE_META = {
  walk: { icon: Footprints, label: 'Walk', classes: 'bg-slate-100 text-slate-600' },
  bus: { icon: Bus, label: 'Bus', classes: 'bg-pine-100 text-pine-800' },
  'ev-auto': { icon: Zap, label: 'EV auto', classes: 'bg-amber-100 text-amber-800' },
  'ev-two-wheeler': { icon: Zap, label: 'EV two-wheeler', classes: 'bg-amber-100 text-amber-800' },
}

export default function JourneyOptionCard({ option, onSave, onRequestEv, saved = false, busy = false }) {
  const evSegments = option.segments.filter((segment) => segment.mode.startsWith('ev-'))
  const seatNote = option.segments.find((segment) => segment.seatsLeft !== undefined)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            {option.modes.map((mode) => {
              const meta = MODE_META[mode] ?? MODE_META.bus
              const Icon = meta.icon
              return (
                <span
                  key={mode}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.classes}`}
                >
                  <Icon className="size-3" aria-hidden="true" />
                  {meta.label}
                </span>
              )
            })}
            {option.badges?.map((badge) => (
              <Badge
                key={badge}
                tone={badge === 'Cheapest' ? 'amber' : badge === 'Fastest' ? 'pine' : 'neutral'}
                className="px-2 py-0.5 text-[10px]"
              >
                {badge}
              </Badge>
            ))}
          </div>
          <p className="mt-2 font-display text-lg font-semibold text-slate-900">
            {formatClock(option.departMin)} → {formatClock(option.arriveMin)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {option.durationMin} min travel
            </span>
            <span className="inline-flex items-center gap-1">
              <IndianRupee className="size-3.5" aria-hidden="true" />
              {option.fare} estimated
            </span>
            <span>
              {option.transfers} transfer{option.transfers === 1 ? '' : 's'}
            </span>
            {seatNote?.seatsLeft !== undefined && (
              <span className="text-pine-700">{seatNote.seatsLeft} seats recorded</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {onSave && (
            <Button size="sm" variant="secondary" onClick={() => onSave(option)} disabled={saved}>
              {saved ? 'Saved' : 'Save journey'}
            </Button>
          )}
          {onRequestEv && evSegments.length > 0 && (
            <Button size="sm" onClick={() => onRequestEv(option)} disabled={busy}>
              {busy ? 'Requesting…' : 'Request EV ride'}
            </Button>
          )}
        </div>
      </div>

      <ol className="mt-4 space-y-2">
        {option.segments.map((segment, index) => {
          const meta = MODE_META[segment.mode] ?? MODE_META.bus
          const Icon = meta.icon
          return (
            <li key={`${segment.fromStopId}-${segment.toStopId}-${index}`} className="flex gap-3">
              <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${meta.classes}`}>
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 border-b border-dashed border-slate-200 pb-2 last:border-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800">
                    {segment.fromName} → {segment.toName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatClock(segment.departMin)}–{formatClock(segment.arriveMin)}
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{segment.detail}</p>
                {segment.subdetail && (
                  <p className="text-[11px] text-slate-400">{segment.subdetail}</p>
                )}
                {segment.mode.startsWith('ev-') && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-700">
                    <ShieldCheck className="size-3" aria-hidden="true" />
                    Provider must accept before this ride is confirmed
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-3 text-[10px] text-slate-400">
        Sample estimate — fares and seat counts are simulated, not live availability.
      </p>
    </article>
  )
}
