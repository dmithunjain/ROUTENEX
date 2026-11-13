import { Route } from 'lucide-react'

import { cn } from '@/lib/utils'

export default function EmptyState({ title, description, action, icon: Icon = Route, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-white text-pine-700 shadow-sm">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 font-display text-sm font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-600">{description}</p>
      )}
      {action}
    </div>
  )
}
