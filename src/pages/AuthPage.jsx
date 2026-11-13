import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
  Zap,
} from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Container from '@/components/common/Container'
import Logo from '@/components/common/Logo'
import { Field, Input, Select } from '@/components/ui/Field'
import { useAppData } from '@/context/AppDataContext'
import { ROLE_HOME, useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ROUTES } from '@/routes/paths'
import { ADMIN_LOGIN } from '@/config/auth'

const ROLE_OPTIONS = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'provider', label: 'Provider', icon: Bus },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
]

const ROLE_COPY = {
  student: {
    title: 'Student sign in',
    subtitle: 'Plan journeys, find travel partners and request community EV rides.',
  },
  provider: {
    title: 'Provider sign in',
    subtitle: 'Manage your vehicles, availability and incoming ride requests.',
  },
  admin: {
    title: 'Administrator sign in',
    subtitle: 'Operate routes, schedules, providers and the shared fleet.',
  },
}

export default function AuthPage() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { db } = useAppData()
  const { user, login, register, logout } = useAuth()

  const isRegister = pathname === ROUTES.register
  const requestedRole = params.get('role')
  const [role, setRole] = useState(
    ['student', 'provider', 'admin'].includes(requestedRole) ? requestedRole : 'student',
  )
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    villageId: db.villages[0]?.id ?? 'v1',
    college: 'Govt. Arts & Science College, Uthiramerur',
  })

  useDocumentTitle(isRegister ? 'Create account' : 'Sign in')

  const nextPath = params.get('next')

  useEffect(() => {
    if (['student', 'provider', 'admin'].includes(requestedRole)) {
      setRole(requestedRole)
      setError('')
      setNotice('')
    }
  }, [requestedRole])

  const submitLogin = (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    const result = login({ role, email: loginForm.email, password: loginForm.password })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(nextPath || ROLE_HOME[result.user.role] || ROUTES.student, { replace: true })
  }

  const submitRegister = (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (role === 'admin') {
      setError('Administrator accounts are created by the platform team.')
      return
    }
    setBusy(true)
    const result = register({ role, ...registerForm })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(ROLE_HOME[result.user.role] || ROUTES.student, { replace: true })
  }

  const fillDemoAccount = (demoRole) => {
    setError('')
    setNotice('')
    setRole(demoRole)
    if (demoRole === 'student') {
      setLoginForm({ email: 'ananya@example.edu', password: 'routenex123' })
      setNotice('Sample student credentials filled. Password: routenex123 (any 6+ characters work in this demo).')
    } else if (demoRole === 'provider') {
      setLoginForm({ email: 'prakash@greenwheels.in', password: 'routenex123' })
      setNotice('Sample provider credentials filled. Password: routenex123 (any 6+ characters work in this demo).')
    } else {
      setLoginForm({ email: ADMIN_LOGIN.email, password: ADMIN_LOGIN.password })
      setNotice('Demo administrator credentials filled.')
    }
  }

  if (user) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-pine-100 text-pine-800">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-slate-900">
            You are signed in
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {user.name} · {user.role} workspace
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button to={ROLE_HOME[user.role] ?? ROUTES.home} size="sm">
              Open dashboard
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                logout()
                setNotice('Signed out.')
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="py-10 sm:py-14">
      <Link
        to={ROUTES.home}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-pine-800"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to home
      </Link>

      <div className="mt-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden bg-pine-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Logo tone="light" />
            <Badge tone="dark" className="mt-8">
              {ROLE_COPY[role].title}
            </Badge>
            <h1 className="mt-4 font-display text-3xl leading-tight font-semibold">
              Every Student.
              <br />
              Every Route.
              <br />
              Every Destination.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-pine-200/80">
              Sign in to a connected rural mobility network where students, providers and
              administrators work from the same transport records.
            </p>

            <ul className="mt-8 space-y-3 text-xs text-pine-100/85">
              {[
                'Bus, EV and walking journeys in one planner',
                'Verified community EV providers only',
                'Pooling and shared rides linked end to end',
                'Admin changes reflected in student search',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-inset ring-white/10">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-pine-100">
              <Zap className="size-3.5 text-amber-300" aria-hidden="true" />
              One network, three workspaces
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-pine-200/70">
              Sample transport data is used throughout. Fares, seats and availability are clearly
              labelled estimates.
            </p>
          </div>
        </aside>

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                {isRegister ? 'Create your account' : ROLE_COPY[role].title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {isRegister ? 'Choose the workspace you need.' : ROLE_COPY[role].subtitle}
              </p>
            </div>
            <Link
              to={isRegister ? ROUTES.login : ROUTES.register}
              className="shrink-0 text-xs font-semibold text-pine-800 hover:underline"
            >
              {isRegister ? 'Sign in' : 'Create account'}
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-1.5 rounded-xl bg-sand-100 p-1">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon
              const disabled = isRegister && option.id === 'admin'
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setRole(option.id)
                    setError('')
                    setNotice('')
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    role === option.id
                      ? 'bg-white text-pine-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {option.label}
                </button>
              )
            })}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-4 rounded-xl border border-pine-200 bg-pine-50 px-3 py-2.5 text-xs text-pine-900">
              {notice}
            </div>
          )}

          {isRegister ? (
            <form onSubmit={submitRegister} className="mt-5 grid gap-3">
              <Field label="Full name">
                <div className="relative">
                  <UserRound
                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    className="pl-8"
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, name: event.target.value })
                    }
                    placeholder="Your full name"
                    required
                  />
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email">
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      className="pl-8"
                      type="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm({ ...registerForm, email: event.target.value })
                      }
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </Field>
                <Field label="Mobile number">
                  <Input
                    value={registerForm.phone}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, phone: event.target.value })
                    }
                    placeholder="98400 00000"
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Home / service village">
                  <Select
                    value={registerForm.villageId}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, villageId: event.target.value })
                    }
                  >
                    {db.villages.map((village) => (
                      <option key={village.id} value={village.id}>
                        {village.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Password">
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      className="pl-8"
                      type="password"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm({ ...registerForm, password: event.target.value })
                      }
                      placeholder="6+ characters"
                      minLength={6}
                      required
                    />
                  </div>
                </Field>
              </div>
              {role === 'student' && (
                <Field label="College">
                  <Input
                    value={registerForm.college}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, college: event.target.value })
                    }
                  />
                </Field>
              )}
              <p className="rounded-xl bg-sand-100 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
                {role === 'provider'
                  ? 'New providers are reviewed by an administrator. Your vehicles stay hidden from student search until the account is verified.'
                  : 'Your college, village and contact details stay editable from your student dashboard.'}
              </p>
              <Button type="submit" size="sm" disabled={busy} className="mt-1 w-full">
                {busy ? 'Creating account…' : 'Create account'}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </form>
          ) : (
            <form onSubmit={submitLogin} className="mt-5 grid gap-3">
              <Field label={role === 'admin' ? 'Administrator ID' : 'Email address'}>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    className="pl-8"
                    type={role === 'admin' ? 'text' : 'email'}
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm({ ...loginForm, email: event.target.value })
                    }
                    placeholder={role === 'admin' ? 'routenex@1' : 'you@example.com'}
                    autoComplete="username"
                    required
                  />
                </div>
              </Field>
              <Field label="Password" hint="Use at least 6 characters.">
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <Input
                    className="pl-8"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm({ ...loginForm, password: event.target.value })
                    }
                    placeholder="Your password"
                    autoComplete="current-password"
                    minLength={6}
                    required
                  />
                </div>
              </Field>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {role === 'admin' ? 'Administrator access' : 'Secure workspace access'}
                </span>
                <a
                  href={`mailto:${'support@routenex.in'}?subject=Password%20reset`}
                  className="font-semibold text-pine-800 hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              <Button type="submit" size="sm" disabled={busy} className="mt-1 w-full">
                {busy ? 'Signing in…' : 'Sign in'}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              Demo access
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['student', 'provider', 'admin'].map((demoRole) => (
                <button
                  key={demoRole}
                  type="button"
                  onClick={() => fillDemoAccount(demoRole)}
                  className="rounded-full bg-sand-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600 capitalize hover:bg-sand-200"
                >
                  {demoRole} credentials
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
              Sample accounts are stored in this browser. Provider verification, vehicle and route
              data are labelled sample records.
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}
