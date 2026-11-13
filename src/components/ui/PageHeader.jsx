import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

/** Page heading with optional actions and section tabs. */
export default function PageHeader({ title, description, actions, tabs = [] }) {
  return (
    <div className="border-b border-slate-200 pb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
              Sample data
            </span>
          </div>
          {description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {tabs.length > 0 && (
        <nav aria-label="Section" className="mt-5 flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                tab.active
                  ? 'bg-pine-900 text-white'
                  : 'text-slate-600 hover:bg-pine-900/5 hover:text-pine-900',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
