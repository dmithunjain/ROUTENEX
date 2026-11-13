import { useEffect, useState } from 'react'
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import Button from '@/components/common/Button'
import Container from '@/components/common/Container'
import Logo from '@/components/common/Logo'
import { ROLE_HOME, useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/routes/paths'
import { cn } from '@/lib/utils'

const MARKETING_LINKS = [
  { label: 'Home', to: ROUTES.home },
  { label: 'About', to: `${ROUTES.home}#about` },
  { label: 'Features', to: `${ROUTES.home}#features` },
  { label: 'Contact', to: `${ROUTES.home}#contact` },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [pathname, hash])

  const signOut = () => {
    logout()
    navigate(ROUTES.home)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/5 bg-sand-50/92 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {MARKETING_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-pine-900/5 hover:text-pine-900',
                pathname === ROUTES.home && link.label === 'Home' && 'text-pine-900',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {user ? (
            <>
              <Link
                to={ROLE_HOME[user.role] ?? ROUTES.home}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-pine-900 hover:bg-pine-900/5"
              >
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Dashboard
              </Link>
              <span className="max-w-36 truncate text-xs text-slate-500">{user.name}</span>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-white hover:text-slate-800"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.login}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-pine-900 hover:bg-pine-900/5"
              >
                Login
              </Link>
              <Button to={ROUTES.register} size="sm">
                Register
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="grid size-10 place-items-center rounded-xl text-slate-700 ring-1 ring-slate-900/10 hover:bg-white lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open && (
        <div id="mobile-nav" className="border-t border-slate-900/5 bg-sand-50 lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {MARKETING_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-pine-900/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
              {user ? (
                <>
                  <Link
                    to={ROLE_HOME[user.role] ?? ROUTES.home}
                    className="rounded-xl bg-pine-900 px-3 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Open {user.role} dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-white"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to={ROUTES.login}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-pine-900 hover:bg-pine-900/5"
                  >
                    Login
                  </NavLink>
                  <Link
                    to={ROUTES.register}
                    className="rounded-xl bg-pine-900 px-3 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
