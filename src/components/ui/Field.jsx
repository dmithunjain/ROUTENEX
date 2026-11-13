import { cn } from '@/lib/utils'

const CONTROL =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

export function Field({ label, htmlFor, hint, error, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[11px] leading-relaxed text-slate-500">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function Input({ className, ...props }) {
  return <input className={cn(CONTROL, className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(CONTROL, 'pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(CONTROL, 'min-h-20 resize-y', className)} {...props} />
}
