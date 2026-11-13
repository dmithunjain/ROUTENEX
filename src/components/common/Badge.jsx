import { cn } from '@/lib/utils'

const TONES = {
  pine: 'bg-pine-100 text-pine-800 ring-pine-700/15',
  amber: 'bg-amber-100 text-amber-800 ring-amber-700/15',
  neutral: 'bg-white/70 text-slate-600 ring-slate-900/10',
  dark: 'bg-white/10 text-pine-100 ring-white/15',
}

/** Small status or category label. */
export default function Badge({ tone = 'pine', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
