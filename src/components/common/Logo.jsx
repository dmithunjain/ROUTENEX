import { Link } from 'react-router-dom'

import { APP } from '@/constants/app'
import { cn } from '@/lib/utils'

/** ROUTENEX route-mark logo and wordmark. */
export default function Logo({ to = '/', tone = 'dark', className }) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label={`${APP.name} home`}
    >
      <span
        className={cn(
          'grid size-9 place-items-center rounded-xl transition-transform duration-200 group-hover:-rotate-6',
          tone === 'dark' ? 'bg-pine-900 text-pine-100' : 'bg-pine-100 text-pine-900',
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
          <path
            d="M6 18c0-4 3-4.5 6-4.5S18 12.5 18 8.5 15 4 12 4h-1"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="6.5" cy="18" r="2" fill="currentColor" />
          <circle cx="18" cy="8" r="2" fill="currentColor" opacity="0.55" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-[17px] font-semibold tracking-[0.12em]',
            tone === 'dark' ? 'text-slate-900' : 'text-white',
          )}
        >
          {APP.name}
        </span>
        <span
          className={cn(
            'mt-1 text-[10px] font-medium tracking-[0.14em] uppercase',
            tone === 'dark' ? 'text-slate-500' : 'text-pine-200',
          )}
        >
          Rural mobility
        </span>
      </span>
    </Link>
  )
}
