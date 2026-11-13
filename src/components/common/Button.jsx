import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

const VARIANTS = {
  primary:
    'bg-pine-900 text-white shadow-sm shadow-pine-900/20 hover:bg-pine-800 active:bg-pine-950',
  secondary:
    'bg-white text-pine-900 ring-1 ring-pine-900/15 hover:bg-pine-50 hover:ring-pine-900/25',
  light: 'bg-white text-pine-900 hover:bg-pine-50',
  outline: 'text-white ring-1 ring-white/30 hover:bg-white/10',
}

const SIZES = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-[15px]',
}

/**
 * Navigation and action button.
 * Renders a router link for `to`, a plain link for `href`, otherwise a button.
 */
export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200',
    VARIANTS[variant],
    SIZES[size],
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
