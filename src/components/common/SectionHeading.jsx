import { cn } from '@/lib/utils'

/** Section label, heading and optional supporting copy. */
export default function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-pine-600 uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 text-balance sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{description}</p>
      )}
    </div>
  )
}
