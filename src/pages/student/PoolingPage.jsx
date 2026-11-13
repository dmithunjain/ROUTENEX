import { useState } from 'react'
import { ArrowRight, Clock, MapPin, ShieldCheck, UserPlus, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatusPill from '@/components/ui/StatusPill'
import { useAppData } from '@/context/AppDataContext'
import { useCurrentStudent } from '@/hooks/useCurrentUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { studentTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import {
  buildPoolingGroup,
  evOptionsForGroup,
  findMatchesForRequest,
  groupMembers,
  matchesForStudent,
} from '@/services/poolingService'
import { getStop, todayISO } from '@/services/transportService'

function minutesToTimeInput(minutes) {
  const value = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

export default function PoolingPage() {
  const { db, addTravelRequest, updateTravelRequest, addPoolingGroup, updatePoolingGroup, addRideRequest } =
    useAppData()
  const student = useCurrentStudent()
  useDocumentTitle('Smart student pooling')

  const defaultOrigin = db.stops.find((stop) => stop.villageId === student?.villageId)?.id ?? db.stops[0]?.id
  const defaultDestination = db.stops.find((stop) => stop.isCollege)?.id ?? db.stops[1]?.id
  const [form, setForm] = useState({
    originStopId: defaultOrigin,
    destinationStopId: defaultDestination,
    date: todayISO(),
    departAfter: student?.departurePreference || '08:00',
    seats: 1,
    note: '',
  })
  const [notice, setNotice] = useState('')

  if (!student) {
    return (
      <PortalPage>
        <EmptyState title="No student profile" description="Create a student in the admin portal first." />
      </PortalPage>
    )
  }

  const requestGroups = matchesForStudent(db, student.id)
  const myGroups = db.poolingGroups.filter((group) =>
    (group.memberStudentIds ?? []).includes(student.id),
  )
  const createRequest = (event) => {
    event.preventDefault()
    if (form.originStopId === form.destinationStopId) {
      setNotice('Origin and destination must be different.')
      return
    }
    const record = addTravelRequest({
      studentId: student.id,
      originStopId: form.originStopId,
      destinationStopId: form.destinationStopId,
      date: form.date,
      departAfter: form.departAfter,
      seats: Number(form.seats),
      note: form.note,
      status: 'open',
    })
    setNotice('Travel request added. Compatible students are checked against nearby origins, destination and a 45-minute window.')
    setForm({ ...form, note: '' })
  }

  const createGroup = (request) => {
    const matches = findMatchesForRequest(db, request)
    if (!matches.length) {
      setNotice('No compatible matches to group yet.')
      return
    }
    const group = buildPoolingGroup(db, request, matches)
    const record = addPoolingGroup({ ...group, createdBy: student.id })
    ;[request, ...matches.map((match) => match.request)].forEach((item) =>
      updateTravelRequest(item.id, { status: 'pooled', groupId: record.id }),
    )
    setNotice(
      `Pool proposed with ${matches.length + 1} students and ${group.seats} seat(s). No vehicle is booked until a provider accepts.`,
    )
  }

  return (
    <PortalPage>
      <PageHeader
        title="Smart student pooling"
        description="Match students by nearby pickup areas, the same destination and a compatible departure window. Pooling proposes groups; it never confirms transport by itself."
        tabs={studentTabs(ROUTES.pooling)}
        actions={
          <Link to={ROUTES.ev} className="text-xs font-semibold text-pine-700 hover:underline">
            Open EV network
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-pine-700" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-slate-900">New travel request</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">Shared with eligible students only. Phone numbers are never shown in matches.</p>
          <form onSubmit={createRequest} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Pickup stop">
              <Select value={form.originStopId} onChange={(event) => setForm({ ...form, originStopId: event.target.value })}>
                {db.stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>{stop.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Destination">
              <Select value={form.destinationStopId} onChange={(event) => setForm({ ...form, destinationStopId: event.target.value })}>
                {db.stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>{stop.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" min={todayISO()} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </Field>
            <Field label="Depart after">
              <Input type="time" value={form.departAfter} onChange={(event) => setForm({ ...form, departAfter: event.target.value })} />
            </Field>
            <Field label="Seats needed">
              <Select value={form.seats} onChange={(event) => setForm({ ...form, seats: Number(event.target.value) })}>
                {[1, 2, 3, 4].map((seat) => (
                  <option key={seat} value={seat}>{seat}</option>
                ))}
              </Select>
            </Field>
            <Field label="Note (optional)">
              <Textarea rows={1} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className="min-h-10" />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" className="w-full">Add request & find matches</Button>
            </div>
          </form>
          {notice && (
            <p className="mt-3 rounded-xl border border-pine-200 bg-pine-50 px-3 py-2 text-xs text-pine-900">{notice}</p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">Your open requests & potential matches</h2>
            <Badge tone="neutral">45 min · 2.5 km</Badge>
          </div>

          {requestGroups.length === 0 ? (
            <EmptyState
              title="No open travel requests"
              description="Add a request to see students travelling in the same direction at a compatible time."
            />
          ) : (
            requestGroups.map(({ request, matches }) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {getStop(db, request.originStopId)?.name} → {getStop(db, request.destinationStopId)?.name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {request.date} · after {request.departAfter} · {request.seats} seat{request.seats > 1 ? 's' : ''} · {request.note || 'No note'}
                    </p>
                  </div>
                  <StatusPill status={request.status} />
                </div>

                {matches.length === 0 ? (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                    No compatible students yet. Invite classmates to add a request for this window.
                  </p>
                ) : (
                  <>
                    <ul className="mt-3 space-y-2">
                      {matches.map((match) => (
                        <li key={match.request.id} className="rounded-xl border border-slate-100 bg-sand-50/60 px-3 py-2.5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-800">
                              {match.student?.name ?? 'Student'} · {match.student?.college?.split(',')[0]}
                            </p>
                            <span className="rounded-full bg-pine-100 px-2 py-0.5 text-[10px] font-semibold text-pine-800">
                              {match.score}% match
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" aria-hidden="true" />
                              {match.timeDiffMin} min apart
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3" aria-hidden="true" />
                              {match.originDistanceKm} km from your pickup
                            </span>
                            <span>Suggested pickup: {match.suggestedPickup?.name}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            From {match.origin.name} · {match.request.seats} seat{match.request.seats > 1 ? 's' : ''} · after {match.request.departAfter}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => createGroup(request)} disabled={request.status !== 'open'}>
                        <Users className="size-3.5" aria-hidden="true" />
                        Group with {matches.length} match{matches.length > 1 ? 'es' : ''}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateTravelRequest(request.id, { status: 'cancelled' })}
                        disabled={request.status !== 'open'}
                      >
                        Close request
                      </Button>
                    </div>
                  </>
                )}
              </article>
            ))
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-slate-900">Proposed pooling groups</h2>
          <Badge tone="amber">Vehicle acceptance required</Badge>
        </div>

        {myGroups.length === 0 ? (
          <EmptyState
            title="No pooling groups yet"
            description="Create a group from compatible matches. The group can then request a shared EV auto within its legal seating capacity."
          />
        ) : (
          myGroups.map((group) => {
            const members = groupMembers(db, group)
            const evOptions = evOptionsForGroup(db, group)
            const linked = db.rideRequests.find((request) => request.id === group.vehicleRequestId)
            return (
              <article key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {getStop(db, group.originStopId)?.name} → {getStop(db, group.destinationStopId)?.name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {group.date} · after {group.departAfter} · {group.seats} seat{group.seats > 1 ? 's' : ''} ·{' '}
                      {members.map((member) => member.name).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={group.status} />
                    {linked && <StatusPill status={linked.status} />}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="neutral">Pickup: {getStop(db, group.originStopId)?.name}</Badge>
                  <Badge tone="neutral">Privacy: names shared, phone hidden</Badge>
                </div>

                {linked ? (
                  <div className="mt-4 rounded-xl border border-pine-200 bg-pine-50 px-3 py-2.5 text-xs text-pine-900">
                    Shared EV request sent to {db.providers.find((provider) => provider.id === linked.providerId)?.name}. Status:{' '}
                    <strong className="font-semibold">{linked.status}</strong>. A ride is only confirmed after acceptance.
                  </div>
                ) : evOptions.length === 0 ? (
                  <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                    No verified EV auto has {group.seats} available legal seats for this window. The group stays proposed until capacity is available.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {evOptions.slice(0, 3).map((option) => {
                      const vehicle = option.vehicle
                      const evSegment = option.segments.filter((segment) => segment.mode.startsWith('ev-')).at(-1)
                      return (
                        <div key={vehicle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-sand-50/60 px-3 py-2.5">
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {option.provider.name} · {vehicle.kind === 'ev-auto' ? 'EV auto' : 'EV two-wheeler'} · {vehicle.model}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Pickup {option.pickupStop.name} ({option.distanceToPickupKm} km) · {vehicle.capacity} legal seats ·{' '}
                              {option.remainingSeats} available · ₹{evSegment.fare} est.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              const record = addRideRequest({
                                studentId: student.id,
                                vehicleId: evSegment.vehicleId,
                                providerId: evSegment.providerId,
                                originStopId: evSegment.fromStopId,
                                destinationStopId: evSegment.toStopId,
                                date: group.date,
                                pickupTime: minutesToTimeInput(evSegment.departMin),
                                seats: group.seats,
                                fareEstimate: evSegment.fare,
                                status: 'pending',
                                poolingGroupId: group.id,
                                note: `Shared EV request for a pooling group of ${group.seats}`,
                                decidedAt: null,
                                reason: '',
                              })
                              updatePoolingGroup(group.id, {
                                status: 'vehicle_requested',
                                vehicleRequestId: record.id,
                                vehicleId: vehicle.id,
                                providerId: option.provider.id,
                              })
                              setNotice('Shared EV request sent. Awaiting provider acceptance.')
                            }}
                          >
                            <Zap className="size-3.5" aria-hidden="true" />
                            Request shared EV
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            )
          })
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-sand-100/60 px-4 py-3 text-xs text-slate-600">
        <ShieldCheck className="size-4 text-pine-700" aria-hidden="true" />
        Pooling matches students only. A vehicle and fare are confirmed by the provider after accepting the ride request.
        <Link to={ROUTES.ev} className="ml-auto inline-flex items-center gap-1 font-semibold text-pine-700 hover:underline">
          Track shared EV requests <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
    </PortalPage>
  )
}
