import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookOpen,
  Bus,
  Clock,
  RefreshCw,
  Route,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatCard from '@/components/ui/StatCard'
import StatusPill from '@/components/ui/StatusPill'
import { useAppData } from '@/context/AppDataContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import {
  getAdminStats,
  getDemandByVillage,
  getRideStatusCounts,
} from '@/services/analyticsService'
import { formatClock, getStop, getStudent, getVillage, toMinutes } from '@/services/transportService'

const BAR_COLORS = ['#157456', '#248f6b', '#46ab85', '#7cc8a8', '#aedfc9', '#d6efe4']

export default function AdminDashboardPage() {
  const { db, verifyProvider, updateSchedule, resetDemoData } = useAppData()
  useDocumentTitle('Admin dashboard')

  const stats = getAdminStats(db)
  const demand = getDemandByVillage(db)
  const rideStatuses = getRideStatusCounts(db)
  const pendingProviders = db.providers.filter((provider) => !provider.verified)
  const cancelled = db.schedules.filter((schedule) => schedule.status === 'cancelled')
  const pendingRequests = db.rideRequests.filter((request) => request.status === 'pending')
  const recentRequests = [...db.travelRequests]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, 6)

  return (
    <PortalPage>
      <PageHeader
        title="Admin & transport overview"
        description="One control centre for students, providers, buses, routes, schedules and ride requests. Every update writes to the shared database used by the student modules."
        tabs={adminTabs(ROUTES.admin)}
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (window.confirm('Reset all demo data to the seeded sample records? This removes local changes.')) {
                resetDemoData()
              }
            }}
          >
            <RefreshCw className="size-3.5" aria-hidden="true" /> Reset demo data
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={stats.students} icon={Users} hint={`${stats.openTravelRequests} open travel requests`} />
        <StatCard label="Transport providers" value={stats.providers} hint={`${stats.verifiedProviders} verified`} icon={ShieldCheck} tone="bg-blue-100 text-blue-700" />
        <StatCard label="Buses" value={stats.buses} hint={`${stats.routes} routes · ${stats.schedules} schedules`} icon={Bus} />
        <StatCard label="EV vehicles" value={stats.evs} hint={`${stats.availableEvs} marked available`} icon={Zap} tone="bg-amber-100 text-amber-800" />
        <StatCard label="Cancelled services" value={stats.cancelled} hint="Excluded from student planning" icon={Clock} tone="bg-red-100 text-red-700" />
        <StatCard label="Pending EV requests" value={stats.pendingRides} hint="Awaiting provider action" icon={Zap} tone="bg-amber-100 text-amber-800" />
        <StatCard label="Pooling groups" value={stats.activePools} hint="Proposed or awaiting vehicle" icon={Users} tone="bg-blue-100 text-blue-700" />
        <StatCard label="Verified providers" value={`${stats.verifiedProviders}/${stats.providers}`} hint="Verification controls EV visibility" icon={ShieldCheck} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">Demand by home village</h2>
            <Badge tone="neutral">Sample requests</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Total seats requested by pickup village.</p>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demand} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="village" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Bar dataKey="requests" radius={[6, 6, 0, 0]}>
                  {demand.map((entry, index) => (
                    <Cell key={entry.village} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">Ride request activity</h2>
            <Link to={ROUTES.adminRequests} className="text-xs font-semibold text-pine-700 hover:underline">
              Manage requests
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Every state change comes from the shared ride records.</p>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rideStatuses} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Bar dataKey="value" fill="#248f6b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">Provider verification</h2>
            <Link to={ROUTES.adminProviders} className="text-xs font-semibold text-pine-700 hover:underline">
              All providers
            </Link>
          </div>
          {pendingProviders.length === 0 ? (
            <p className="mt-4 rounded-xl bg-pine-50 px-3 py-3 text-xs text-pine-800">
              All providers are verified. Verification makes EV providers visible to students.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {pendingProviders.map((provider) => (
                <li key={provider.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{provider.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {provider.type === 'ev' ? 'EV provider' : 'Bus operator'} · {provider.contact || 'No contact'} ·{' '}
                      {(provider.serviceAreas ?? []).map((id) => getVillage(db, id)?.name).filter(Boolean).join(', ') || 'No service area'}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => verifyProvider(provider.id, true)}>
                    <ShieldCheck className="size-3.5" aria-hidden="true" /> Verify
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">Cancelled services</h2>
            <Link to={ROUTES.adminTransport} className="text-xs font-semibold text-pine-700 hover:underline">
              Manage schedules
            </Link>
          </div>
          {cancelled.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">No cancellations recorded.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {cancelled.map((schedule) => {
                const route = db.routes.find((item) => item.id === schedule.routeId)
                const bus = db.vehicles.find((item) => item.id === schedule.busId)
                return (
                  <li key={schedule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50/50 px-3 py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {route?.code} · {route?.name} · {schedule.departureTime}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {bus?.registration} · {schedule.note || 'No reason recorded'} · students already excluded
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => updateSchedule(schedule.id, { status: 'running', note: '' })}>
                      Restore
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
              <BookOpen className="size-4 text-pine-700" aria-hidden="true" /> Latest travel requests
            </h2>
            <Badge tone="neutral">{db.travelRequests.length} total</Badge>
          </div>
          {recentRequests.length === 0 ? (
            <EmptyState className="mt-4" title="No travel requests" description="Student pooling requests will appear here." />
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="py-2">Student</th>
                    <th className="py-2">Journey</th>
                    <th className="py-2">Window</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-2.5 text-xs text-slate-800">{getStudent(db, request.studentId)?.name}</td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {getStop(db, request.originStopId)?.name} → {getStop(db, request.destinationStopId)?.name}
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">{request.date} · {request.departAfter}</td>
                      <td className="py-2.5"><StatusPill status={request.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
              <Route className="size-4 text-pine-700" aria-hidden="true" /> Pending EV decisions
            </h2>
            <Link to={ROUTES.adminRequests} className="text-xs font-semibold text-pine-700 hover:underline">
              Open requests
            </Link>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">No ride requests waiting.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {pendingRequests.slice(0, 4).map((request) => (
                <li key={request.id} className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-800">
                    {getStudent(db, request.studentId)?.name} · {request.seats} seat{request.seats > 1 ? 's' : ''}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {formatClock(toMinutes(request.pickupTime))} · {getStop(db, request.originStopId)?.name} →{' '}
                    {getStop(db, request.destinationStopId)?.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        <strong className="font-semibold">Demo data:</strong> all students, providers, vehicles, fares and availability are
        simulated. Changes persist in this browser and can be reset from the button above.
      </div>
    </PortalPage>
  )
}
