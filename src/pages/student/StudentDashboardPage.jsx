import { useState } from 'react'
import {
  ArrowRight,
  Bell,
  Bookmark,
  Pencil,
  Search,
  Users,
  Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatCard from '@/components/ui/StatCard'
import StatusPill from '@/components/ui/StatusPill'
import { Field, Input, Select } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import { useAppData } from '@/context/AppDataContext'
import { useCurrentStudent } from '@/hooks/useCurrentUser'
import { matchesForStudent } from '@/services/poolingService'
import { formatClock, getStop, getVillage, todayISO, toMinutes } from '@/services/transportService'
import { studentTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function StudentDashboardPage() {
  const { db, setStudentProfile } = useAppData()
  const student = useCurrentStudent()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const homeStop = student
    ? db.stops.find((stop) => stop.villageId === student.villageId)
    : db.stops[0]
  const collegeStop = db.stops.find((stop) => stop.isCollege) ?? db.stops[0]
  const [search, setSearch] = useState({
    originStopId: homeStop?.id ?? '',
    destinationStopId: collegeStop?.id ?? '',
    date: todayISO(),
    afterTime: student?.departurePreference || '08:00',
    seats: 1,
  })

  useDocumentTitle('Student dashboard')

  if (!student) {
    return (
      <PortalPage>
        <EmptyState
          title="No student profile"
          description="Add a student in the admin portal to start using the student workspace."
        />
      </PortalPage>
    )
  }

  const village = getVillage(db, student.villageId)

  const myRequests = db.travelRequests.filter((request) => request.studentId === student.id)
  const myRides = db.rideRequests.filter((request) => request.studentId === student.id)
  const saved = db.savedJourneys.filter((journey) => journey.studentId === student.id)
  const pooling = matchesForStudent(db, student.id)
  const matchCount = pooling.reduce((total, item) => total + item.matches.length, 0)
  const cancellations = db.schedules.filter((schedule) => schedule.status === 'cancelled')
  const pendingRides = myRides.filter((request) => request.status === 'pending').length

  const openEdit = () => {
    setProfile({
      name: student.name,
      email: student.email,
      phone: student.phone,
      college: student.college,
      villageId: student.villageId,
      departurePreference: student.departurePreference,
      budget: student.budget,
      emergencyContact: student.emergencyContact,
    })
    setEditOpen(true)
  }

  const saveProfile = (event) => {
    event.preventDefault()
    if (!profile.name.trim() || !profile.college.trim()) return
    setStudentProfile(student.id, {
      ...profile,
      budget: Number(profile.budget) || 0,
    })
    setEditOpen(false)
  }

  const submitSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams(search)
    navigate(`${ROUTES.planner}?${params.toString()}`)
  }

  const notifications = [
    ...myRides
      .filter((request) => request.status === 'accepted')
      .map((request) => ({
        id: `accepted-${request.id}`,
        tone: 'pine',
        text: `EV ride accepted for ${formatClock(toMinutes(request.pickupTime))}. Pickup at ${getStop(db, request.originStopId)?.name}.`,
      })),
    ...myRides
      .filter((request) => request.status === 'rejected')
      .map((request) => ({
        id: `rejected-${request.id}`,
        tone: 'amber',
        text: `An EV provider declined your request${request.reason ? `: ${request.reason}` : '.'}`,
      })),
    ...(matchCount
      ? [
          {
            id: 'pool',
            tone: 'pine',
            text: `${matchCount} compatible student request${matchCount > 1 ? 's' : ''} found for your pooling window.`,
          },
        ]
      : []),
    ...cancellations.slice(0, 2).map((schedule) => {
      const route = db.routes.find((item) => item.id === schedule.routeId)
      return {
        id: `cancel-${schedule.id}`,
        tone: 'amber',
        text: `${route?.code ?? 'A service'} at ${schedule.departureTime} is cancelled (${schedule.note || 'no reason recorded'}).`,
      }
    }),
  ]

  return (
    <PortalPage>
      <PageHeader
        title={`Good day, ${student.name.split(' ')[0]}`}
        description="Your journeys, pooling matches and EV ride requests in one place. All transport records are sample data."
        tabs={studentTabs(ROUTES.student)}
        actions={
          <div className="flex items-center gap-2">
            <Select
              aria-label="Demo student profile"
              value={student.id}
              onChange={(event) => setStudentProfile(event.target.value, {})}
              className="w-44"
            >
              {db.students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Button size="sm" variant="secondary" onClick={openEdit}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit profile
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open travel requests" value={myRequests.filter((item) => item.status === 'open').length} icon={Users} />
        <StatCard label="Pooling matches" value={matchCount} hint="Nearby origin, same destination, 45-min window" icon={Users} tone="bg-amber-100 text-amber-800" />
        <StatCard label="Saved journeys" value={saved.length} icon={Bookmark} />
        <StatCard label="EV rides pending" value={pendingRides} hint="Awaiting provider acceptance" icon={Zap} tone="bg-amber-100 text-amber-800" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-pine-700" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-slate-900">Plan a journey</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Bus, walking and registered EV combinations from the shared transport data.
          </p>
          <form onSubmit={submitSearch} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="From">
              <Select
                value={search.originStopId}
                onChange={(event) => setSearch({ ...search, originStopId: event.target.value })}
                required
              >
                {db.stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="To">
              <Select
                value={search.destinationStopId}
                onChange={(event) =>
                  setSearch({ ...search, destinationStopId: event.target.value })
                }
                required
              >
                {db.stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={search.date}
                min={todayISO()}
                onChange={(event) => setSearch({ ...search, date: event.target.value })}
                required
              />
            </Field>
            <Field label="Depart after">
              <Input
                type="time"
                value={search.afterTime}
                onChange={(event) => setSearch({ ...search, afterTime: event.target.value })}
                required
              />
            </Field>
            <Field label="Seats">
              <Select
                value={search.seats}
                onChange={(event) => setSearch({ ...search, seats: Number(event.target.value) })}
              >
                <option value={1}>1 student</option>
                <option value={2}>2 students</option>
                <option value={3}>3 students</option>
                <option value={4}>4 students</option>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Search journeys
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs">
            <Link to={ROUTES.pooling} className="rounded-full bg-sand-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-sand-200">
              Find travel partners
            </Link>
            <Link to={ROUTES.ev} className="rounded-full bg-sand-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-sand-200">
              Request an EV ride
            </Link>
            <Link to={ROUTES.assistant} className="rounded-full bg-sand-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-sand-200">
              Ask the travel assistant
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">Profile</h2>
            <Badge tone="neutral">{village?.name ?? 'Village not set'}</Badge>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">College</dt>
              <dd className="mt-0.5 text-slate-800">{student.college}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Usual departure</dt>
                <dd className="mt-0.5 text-slate-800">{student.departurePreference}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Budget</dt>
                <dd className="mt-0.5 text-slate-800">₹{student.budget}</dd>
              </div>
            </div>
            <div>
              <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Emergency contact</dt>
              <dd className="mt-0.5 text-slate-800">{student.emergencyContact || 'Not provided'}</dd>
            </div>
          </dl>
          <Button className="mt-4 w-full" variant="secondary" size="sm" onClick={openEdit}>
            Manage travel preferences
          </Button>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
              <Bell className="size-4 text-pine-700" aria-hidden="true" /> Updates
            </h2>
            <span className="text-[11px] text-slate-500">Derived from shared data</span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {notifications.length === 0 && (
              <li className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                No new updates. Create a journey request to see matching and ride updates.
              </li>
            )}
            {notifications.slice(0, 5).map((item) => (
              <li key={item.id} className="flex gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${item.tone === 'pine' ? 'bg-pine-500' : 'bg-amber-500'}`} />
                <p className="text-xs leading-relaxed text-slate-700">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
              <Bookmark className="size-4 text-pine-700" aria-hidden="true" /> Saved journeys
            </h2>
            <Link to={ROUTES.saved} className="text-xs font-semibold text-pine-700 hover:underline">
              View all
            </Link>
          </div>
          {saved.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
              No saved journeys yet. Save an option from the planner.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {saved.slice(0, 2).map((journey) => (
                <li key={journey.id} className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">{journey.label}</p>
                    <span className="text-[10px] text-slate-500">₹{journey.totalFare}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {journey.segments?.map((segment) => `${segment.fromName} → ${segment.toName}`).join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
              <Users className="size-4 text-pine-700" aria-hidden="true" /> Travel requests
            </h2>
            <Link to={ROUTES.pooling} className="text-xs font-semibold text-pine-700 hover:underline">
              Open pooling
            </Link>
          </div>
          {myRequests.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
              No requests yet. Add one in Smart Pooling to find compatible students.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {myRequests.slice(0, 3).map((request) => (
                <li key={request.id} className="rounded-xl border border-slate-100 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800">
                      {getStop(db, request.originStopId)?.name} → {getStop(db, request.destinationStopId)?.name}
                    </p>
                    <StatusPill status={request.status} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {request.date} · after {request.departAfter} · {request.seats} seat{request.seats > 1 ? 's' : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
              <Zap className="size-4 text-amber-600" aria-hidden="true" /> EV ride requests
            </h2>
            <Link to={ROUTES.ev} className="text-xs font-semibold text-pine-700 hover:underline">
              EV network
            </Link>
          </div>
          {myRides.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
              No EV requests yet. A ride is only confirmed after the provider accepts.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {myRides.slice(0, 3).map((request) => {
                const vehicle = db.vehicles.find((item) => item.id === request.vehicleId)
                return (
                  <li key={request.id} className="rounded-xl border border-slate-100 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">
                        {vehicle?.kind === 'ev-two-wheeler' ? 'EV two-wheeler' : 'EV auto'} · {request.pickupTime}
                      </p>
                      <StatusPill status={request.status} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {getStop(db, request.originStopId)?.name} → {getStop(db, request.destinationStopId)?.name} · ₹{request.fareEstimate} estimate
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
        <strong className="font-semibold">Sample data notice:</strong> fares, seats, battery
        levels, provider availability and cancellations are simulated for the demo. No live bus or
        EV tracking is connected.
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Student profile and preferences"
        description="Stored in the shared ROUTENEX data store."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="profile-form">
              Save profile
            </Button>
          </>
        }
      >
        {profile && (
          <form id="profile-form" onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} required />
            </Field>
            <Field label="Phone">
              <Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
            </Field>
            <Field label="Home village">
              <Select value={profile.villageId} onChange={(event) => setProfile({ ...profile, villageId: event.target.value })}>
                {db.villages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="College" className="sm:col-span-2">
              <Input value={profile.college} onChange={(event) => setProfile({ ...profile, college: event.target.value })} required />
            </Field>
            <Field label="Usual departure time">
              <Input type="time" value={profile.departurePreference} onChange={(event) => setProfile({ ...profile, departurePreference: event.target.value })} />
            </Field>
            <Field label="Daily budget (₹)">
              <Input type="number" min="0" value={profile.budget} onChange={(event) => setProfile({ ...profile, budget: event.target.value })} />
            </Field>
            <Field label="Emergency contact" className="sm:col-span-2">
              <Input value={profile.emergencyContact} onChange={(event) => setProfile({ ...profile, emergencyContact: event.target.value })} />
            </Field>
          </form>
        )}
      </Modal>
    </PortalPage>
  )
}
