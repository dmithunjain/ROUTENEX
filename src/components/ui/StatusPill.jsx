import { cn } from '@/lib/utils'

const TONES = {
  pine: 'bg-pine-100 text-pine-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-100 text-blue-700',
}

const MAP = {
  running: 'pine',
  open: 'pine',
  accepted: 'pine',
  available: 'pine',
  verified: 'pine',
  active: 'pine',
  completed: 'blue',
  confirmed: 'pine',
  pooled: 'blue',
  vehicle_requested: 'amber',
  pending: 'amber',
  proposed: 'amber',
  cancelled: 'red',
  rejected: 'red',
  unverified: 'red',
  inactive: 'slate',
}

export default function StatusPill({ status, tone, className }) {
  const resolved = tone ?? MAP[String(status).toLowerCase()] ?? 'slate'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
        TONES[resolved],
        className,
      )}
    >
      {status}
    </span>
  )
}
