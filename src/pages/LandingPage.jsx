import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Container from '@/components/common/Container'
import LiveConditions from '@/components/landing/LiveConditions'
import NetworkMapPreview from '@/components/landing/NetworkMapPreview'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { useAppData } from '@/context/AppDataContext'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { APP } from '@/constants/app'
import { ROUTES } from '@/routes/paths'

const FEATURES = [
  {
    id: 'student-dashboard',
    icon: LayoutDashboard,
    title: 'Student Dashboard',
    summary:
      'One home for your profile, journey search, saved routes, travel requests and live ride status.',
    points: [
      'Personal profile and home village',
      'Saved journeys and travel history',
      'Ride request and notification status',
    ],
    to: ROUTES.student,
  },
  {
    id: 'journey-planner',
    icon: Route,
    title: 'Smart Journey Planner',
    summary:
      'Compare connected bus, walking and EV options with fares, transfers and arrival times.',
    points: [
      'Bus + EV + walking combinations',
      'Missed my bus and return journey',
      'Grounded AI travel assistant',
    ],
    to: ROUTES.planner,
  },
  {
    id: 'student-pooling',
    icon: Users,
    title: 'Smart Student Pooling',
    summary:
      'Find classmates travelling from nearby stops at a similar time and share one verified EV.',
    points: [
      'Nearby origin and destination matching',
      '45-minute departure window',
      'Shared EV request tied to the group',
    ],
    to: ROUTES.pooling,
  },
  {
    id: 'ev-network',
    icon: Zap,
    title: 'Community EV Network',
    summary:
      'Registered EV auto and two-wheeler providers offer rides only after accepting a student request.',
    points: [
      'Verified provider matching within 3 km',
      'Legal seat capacity enforced',
      'Accept, reject and track requests',
    ],
    to: ROUTES.ev,
  },
  {
    id: 'admin',
    icon: ShieldCheck,
    title: 'Admin & Transport Management',
    summary:
      'Operate the whole network from one dashboard: students, providers, vehicles, routes and schedules.',
    points: [
      'Bus, route, stop and schedule management',
      'Provider verification and availability',
      'Cancellations reflected in student search',
    ],
    to: ROUTES.admin,
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Create your account',
    detail:
      'Register as a student to plan and pool, or as a local provider to offer verified EV rides.',
    icon: GraduationCap,
  },
  {
    number: '02',
    title: 'Plan or find your group',
    detail:
      'Search any village stop and college, or match with students leaving from nearby stops at a similar time.',
    icon: Route,
  },
  {
    number: '03',
    title: 'Request and get confirmation',
    detail:
      'Bus seats and EV rides show current availability. An EV ride is confirmed only when the provider accepts.',
    icon: CheckCircle2,
  },
  {
    number: '04',
    title: 'Travel and keep track',
    detail:
      'Track request status, see pickup details after acceptance and keep every journey saved in your dashboard.',
    icon: Clock,
  },
]

const PORTALS = [
  {
    role: 'student',
    icon: GraduationCap,
    title: 'Student portal',
    summary:
      'Plan a journey, match with classmates, request a community EV and keep your saved routes in one place.',
    accent: 'bg-pine-100 text-pine-800',
    actions: [
      { label: 'Student sign in', to: `${ROUTES.login}?role=student`, primary: true },
      { label: 'Create student account', to: `${ROUTES.register}?role=student` },
    ],
  },
  {
    role: 'provider',
    icon: Bus,
    title: 'Provider portal',
    summary:
      'Register your EV or bus service, manage availability and accept or reject incoming student requests.',
    accent: 'bg-amber-100 text-amber-800',
    actions: [
      { label: 'Provider sign in', to: `${ROUTES.login}?role=provider`, primary: true },
      { label: 'Register as provider', to: `${ROUTES.register}?role=provider` },
    ],
  },
  {
    role: 'admin',
    icon: ShieldCheck,
    title: 'Admin portal',
    summary:
      'Verify providers, manage the fleet, publish routes and schedules, and monitor every ride request.',
    accent: 'bg-blue-100 text-blue-700',
    actions: [{ label: 'Administrator sign in', to: `${ROUTES.login}?role=admin`, primary: true }],
  },
]

export default function LandingPage() {
  useDocumentTitle(null)
  const { db } = useAppData()
  const { user } = useAuth()
  const { hash } = useLocation()
  const [contact, setContact] = useState({ name: '', email: '', message: '' })
  const [contactSent, setContactSent] = useState(false)

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    const section = document.getElementById(hash.slice(1))
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const towns = db.villages.length
  const routes = db.routes.length
  const evProviders = db.providers.filter((provider) => provider.type === 'ev').length
  const verifiedProviders = db.providers.filter((provider) => provider.verified).length

  const submitContact = (event) => {
    event.preventDefault()
    if (!contact.name.trim() || !contact.email.trim() || !contact.message.trim()) return
    try {
      const key = 'routenex.contactMessages'
      const previous = JSON.parse(window.localStorage.getItem(key) || '[]')
      window.localStorage.setItem(
        key,
        JSON.stringify([
          { ...contact, createdAt: new Date().toISOString() },
          ...(Array.isArray(previous) ? previous : []),
        ]),
      )
    } catch {
      // The confirmation still appears when storage is unavailable.
    }
    setContactSent(true)
    setContact({ name: '', email: '', message: '' })
  }

  return (
    <>
      <section id="top" className="relative overflow-hidden border-b border-pine-900/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(21,116,86,0.14),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(217,119,6,0.12),transparent_40%)]"
        />
        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Badge tone="pine">Rural mobility, connected</Badge>
              <h1 className="mt-5 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.6rem]">
                Every Student.
                <br />
                Every Route.
                <br />
                <span className="text-pine-700">Every Destination.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
                ROUTENEX brings bus journeys, shared student rides, community EV providers and
                transport administration into one connected platform built for rural colleges.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {user ? (
                  <Button to={user.role === 'admin' ? ROUTES.admin : user.role === 'provider' ? ROUTES.provider : ROUTES.student} size="lg">
                    Open your dashboard
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button to={ROUTES.register} size="lg">
                    Get started
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                )}
                <Button to={ROUTES.planner} size="lg" variant="secondary">
                  Plan a journey
                </Button>
                {!user && (
                  <Link
                    to={ROUTES.login}
                    className="text-sm font-semibold text-pine-800 underline-offset-4 hover:underline"
                  >
                    Already registered? Sign in
                  </Link>
                )}
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Villages', value: towns },
                  { label: 'Bus routes', value: routes },
                  { label: 'EV providers', value: evProviders },
                  { label: 'Verified providers', value: verifiedProviders },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-semibold text-slate-900">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-pine-900/10 backdrop-blur">
                <div className="rounded-2xl bg-pine-950 p-5 text-pine-100">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wide uppercase">Today&apos;s network</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-pine-100">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Live schedule records
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {db.schedules
                      .filter((schedule) => schedule.status === 'running')
                      .slice(0, 3)
                      .map((schedule) => {
                        const route = db.routes.find((item) => item.id === schedule.routeId)
                        const bus = db.vehicles.find((item) => item.id === schedule.busId)
                        return (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-inset ring-white/10"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-white">
                                {route?.code} · {route?.name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-pine-200/70">
                                {bus?.registration} · {schedule.availableSeats} seats recorded
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-pine-100 px-2.5 py-1 text-[10px] font-bold text-pine-900">
                              {schedule.departureTime}
                            </span>
                          </div>
                        )
                      })}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] text-pine-200/70">
                    <span>{db.schedules.filter((item) => item.status === 'cancelled').length} cancellation(s) reflected</span>
                    <span>{db.vehicles.filter((item) => item.kind === 'bus').length} buses tracked</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                      <Zap className="size-3.5 text-amber-600" aria-hidden="true" />
                      EV network
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-800">
                      {db.vehicles.filter((item) => item.kind?.startsWith('ev-')).length} registered EVs
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Provider acceptance required
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                      <Users className="size-3.5 text-pine-700" aria-hidden="true" />
                      Student pooling
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-800">
                      {db.travelRequests.filter((item) => item.status === 'open').length} open requests
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Matched within 45 minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="about" className="scroll-mt-24 border-b border-slate-200 bg-white">
        <Container className="py-16">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-pine-700 uppercase">
                The problem we solve
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
                Rural students do not need another app. They need one reliable route.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Bus timetables are scattered, local EV rides are informal and students often miss a
                service without knowing there was an alternative. ROUTENEX connects these pieces so
                every decision is based on the same transport records.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-sand-50 p-5">
                <h3 className="text-sm font-semibold text-slate-900">Before ROUTENEX</h3>
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
                  <li>Separate bus lists, notices and word-of-mouth EV contacts.</li>
                  <li>No clear view of seats, cancellations or provider availability.</li>
                  <li>Students travel alone when a shared ride was possible.</li>
                  <li>Administrators update routes without reaching students quickly.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-pine-200 bg-pine-50 p-5">
                <h3 className="text-sm font-semibold text-pine-900">With ROUTENEX</h3>
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-pine-800">
                  <li>One shared transport record for students, providers and admins.</li>
                  <li>Journey results exclude cancelled services immediately.</li>
                  <li>Nearby students can form a group and request one verified EV.</li>
                  <li>Providers accept or reject every ride before it is confirmed.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Bus,
                title: 'One transport source',
                detail: 'Routes, stops, schedules and availability are maintained in one place.',
              },
              {
                icon: ShieldCheck,
                title: 'Verified local providers',
                detail: 'Only approved providers and available vehicles appear in student search.',
              },
              {
                icon: Sparkles,
                title: 'Guidance you can check',
                detail: 'The travel assistant answers from the same live app data, not invented routes.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pine-100 text-pine-800">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      <section id="features" className="scroll-mt-24 border-b border-slate-200">
        <Container className="py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.16em] text-pine-700 uppercase">
              Five connected features
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
              Everything a rural journey needs, in one place.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Students plan and travel, providers offer capacity, and administrators keep the
              network accurate — all through the same data.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-md"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-pine-100 text-pine-800">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{feature.summary}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {feature.points.map((point) => (
                      <li key={point} className="flex gap-2 text-[11px] leading-relaxed text-slate-600">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-pine-600" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={feature.to}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-pine-800 hover:underline"
                  >
                    Open feature
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </article>
              )
            })}

            <article className="flex flex-col justify-between rounded-2xl bg-pine-950 p-5 text-pine-100">
              <div>
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-pine-100">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">Travel assistant included</h3>
                <p className="mt-2 text-xs leading-relaxed text-pine-200/80">
                  Ask for a route, a cancellation update, a nearby EV or a pooling match. Every
                  answer is grounded in the current transport records.
                </p>
              </div>
              <Link
                to={ROUTES.assistant}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white hover:underline"
              >
                Ask the assistant
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </article>
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-b border-slate-200 bg-white">
        <Container className="py-16">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-pine-700 uppercase">
                How it works
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
                From your village stop to your college gate.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                ROUTENEX keeps the process simple. No ride is confirmed until the transport
                provider accepts it, and every fare shown before booking is an estimate based on
                the current sample records.
              </p>
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                <strong className="font-semibold">Capacity and safety:</strong> EV two-wheelers carry
                one student, EV autos use their registered legal capacity, and bus seat counts can
                never exceed the assigned bus capacity.
              </div>
            </div>

            <ol className="grid gap-3 sm:grid-cols-2">
              {STEPS.map((step) => {
                const Icon = step.icon
                return (
                  <li key={step.number} className="rounded-2xl border border-slate-200 bg-sand-50 p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-semibold text-pine-700">
                        {step.number}
                      </span>
                      <Icon className="size-4 text-pine-700" aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{step.detail}</p>
                  </li>
                )
              })}
            </ol>
          </div>

          <div id="network" className="mt-14 grid scroll-mt-24 gap-5 lg:grid-cols-[1.45fr_0.55fr]">
            <NetworkMapPreview />
            <div className="space-y-4">
              <LiveConditions />
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  Covered network
                </p>
                <ul className="mt-3 space-y-2 text-[11px] text-slate-600">
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-pine-700" aria-hidden="true" />
                    {db.stops.filter((stop) => !stop.isCollege).length} village and town stops
                  </li>
                  <li className="flex items-start gap-2">
                    <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-blue-700" aria-hidden="true" />
                    {db.stops.filter((stop) => stop.isCollege).length} college gate stops
                  </li>
                  <li className="flex items-start gap-2">
                    <Bus className="mt-0.5 size-3.5 shrink-0 text-pine-700" aria-hidden="true" />
                    {routes} published bus routes
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                    {db.vehicles.filter((vehicle) => vehicle.kind?.startsWith('ev-')).length} registered EV vehicles
                  </li>
                </ul>
                <Button to={ROUTES.planner} size="sm" variant="secondary" className="mt-4 w-full">
                  Open the journey planner
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="portals" className="scroll-mt-24 border-b border-slate-200">
        <Container className="py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-pine-700 uppercase">
              Portal access
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
              Sign in to your workspace.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Students, transport providers and administrators share one network but see only the
              tools their role needs.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PORTALS.map((portal) => {
              const Icon = portal.icon
              return (
                <article key={portal.role} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className={`grid size-11 place-items-center rounded-2xl ${portal.accent}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                    {portal.title}
                  </h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">
                    {portal.summary}
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    {portal.actions.map((action) => (
                      <Button
                        key={action.label}
                        to={action.to}
                        size="sm"
                        variant={action.primary ? 'primary' : 'secondary'}
                        className="w-full"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </Container>
      </section>

      <section id="contact" className="scroll-mt-24 bg-white">
        <Container className="py-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-pine-700 uppercase">
                Contact
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-900">
                Talk to the ROUTENEX team.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Questions about a student account, provider verification or a college route? Send a
                message and the team will get back to you.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pine-100 text-pine-800">
                    <Mail className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Email</p>
                    <a href={`mailto:${APP.supportEmail}`} className="text-sm font-medium text-slate-800 hover:underline">
                      {APP.supportEmail}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pine-100 text-pine-800">
                    <Phone className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Phone</p>
                    <a href={`tel:${APP.supportPhone.replace(/\s/g, '')}`} className="text-sm font-medium text-slate-800 hover:underline">
                      {APP.supportPhone}
                    </a>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pine-100 text-pine-800">
                    <MapPin className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Office</p>
                    <p className="text-sm font-medium text-slate-800">{APP.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-sand-50 p-6">
              <h3 className="font-display text-base font-semibold text-slate-900">Send a message</h3>
              <p className="mt-1 text-xs text-slate-500">
                Your message is stored in this browser for the demo contact inbox.
              </p>

              {contactSent ? (
                <div className="mt-4 rounded-xl border border-pine-200 bg-pine-50 px-4 py-4 text-sm text-pine-900">
                  <p className="font-semibold">Message received.</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    Thank you for contacting ROUTENEX. The support team will follow up at the email
                    address you provided.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSent(false)}
                    className="mt-3 text-xs font-semibold text-pine-800 underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={submitContact} className="mt-4 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Your name">
                      <Input
                        value={contact.name}
                        onChange={(event) => setContact({ ...contact, name: event.target.value })}
                        placeholder="Full name"
                        required
                      />
                    </Field>
                    <Field label="Email">
                      <Input
                        type="email"
                        value={contact.email}
                        onChange={(event) => setContact({ ...contact, email: event.target.value })}
                        placeholder="you@example.com"
                        required
                      />
                    </Field>
                  </div>
                  <Field label="Message">
                    <Textarea
                      value={contact.message}
                      onChange={(event) => setContact({ ...contact, message: event.target.value })}
                      placeholder="How can we help?"
                      rows={5}
                      required
                    />
                  </Field>
                  <Button type="submit" size="sm" className="justify-self-start">
                    Send message
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-pine-900 text-white">
        <Container className="flex flex-col items-start justify-between gap-5 py-10 md:flex-row md:items-center">
          <div>
            <p className="font-display text-xl font-semibold">Ready to plan your next journey?</p>
            <p className="mt-1 text-sm text-pine-200/80">
              Create an account or sign in to your student, provider or admin workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to={user ? ROUTES.student : ROUTES.register} variant="light" size="sm">
              {user ? 'Open student dashboard' : 'Create an account'}
            </Button>
            <Button to={ROUTES.login} variant="outline" size="sm">
              Sign in
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}
