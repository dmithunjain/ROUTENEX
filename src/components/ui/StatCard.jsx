import { cn } from '@/lib/utils'

export default function StatCard({ label, value, hint, icon: Icon, tone = 'bg-pine-100 text-pine-800' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
        {Icon && (
          <span className={cn('grid size-8 place-items-center rounded-xl', tone)}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{hint}</p>}
    </div>
  )
}
