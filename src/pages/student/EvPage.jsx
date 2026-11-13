import { useMemo, useState } from 'react'
import { BatteryCharging, Clock, MapPin, Phone, ShieldCheck, Users, Zap } from 'lucide-react'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatusPill from '@/components/ui/StatusPill'
import { useAppData } from '@/context/AppDataContext'
import { useCurrentStudent } from '@/hooks/useCurrentUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { studentTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import {
  formatClock,
  getProvider,
  getStop,
  getVehicle,
  todayISO,
  toMinutes,
} from '@/services/transportService'
import { findEvOptions } from '@/services/transportService'

function minutesToTimeInput(minutes) {
  const value = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

export default function EvPage() {
  const { db, addRideRequest, updateRideRequest } = useAppData()
  const student = useCurrentStudent()
  useDocumentTitle('Community EV mobility')

  const homeStop = db.stops.find((stop) => stop.villageId === student?.villageId)?.id ?? db.stops[0]?.id
  const collegeStop = db.stops.find((stop) => stop.isCollege)?.id ?? db.stops[1]?.id
  const [form, setForm] = useState({
    originStopId: homeStop,
    destinationStopId: collegeStop,
    date: todayISO(),
    afterTime: student?.departurePreference || '08:00',
    seats: 1,
    kind: '',
  })
  const [notice, setNotice] = useState('')
  const [requested, setRequested] = useState([])

  const options = useMemo(() => {
    if (!form.originStopId || !form.destinationStopId || form.originStopId === form.destinationStopId) return []
    return findEvOptions(
      { ...db, __date: form.date },
      {
        originStopId: form.originStopId,
        destinationStopId: form.destinationStopId,
        afterMinutes: toMinutes(form.afterTime),
        seats: Number(form.seats),
        kind: form.kind || undefined,
      },
    )
  }, [db, form])

  const myRides = db.rideRequests
    .filter((request) => request.studentId === student?.id)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const requestRide = (option) => {
    if (!student) return
    const evSegment = option.segments.filter((segment) => segment.mode.startsWith('ev-')).at(-1)
    addRideRequest({
      studentId: student.id,
      vehicleId: evSegment.vehicleId,
      providerId: evSegment.providerId,
      originStopId: evSegment.fromStopId,
      destinationStopId: evSegment.toStopId,
      date: form.date,
      pickupTime: minutesToTimeInput(evSegment.departMin),
      seats: Number(form.seats),
      fareEstimate: evSegment.fare,
      status: 'pending',
      poolingGroupId: null,
      note: `Direct EV request from ${getStop(db, form.originStopId)?.name}`,
      decidedAt: null,
      reason: '',
    })
    setRequested((previous) => [...previous, evSegment.vehicleId])
    setNotice('Request sent. The ride is not confirmed until the provider accepts it.')
  }

  if (!student) {
    return (
      <PortalPage>
        <EmptyState title="No student profile" description="Create a student in the admin portal first." />
      </PortalPage>
    )
  }

  return (
    <PortalPage>
      <PageHeader
        title="Community EV mobility network"
        description="Find verified EV auto and EV two-wheeler providers near your pickup. Request a ride, then wait for the provider to accept or reject it."
        tabs={studentTabs(ROUTES.ev)}
        actions={<Badge tone="amber">Verified providers only</Badge>}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-600" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-slate-900">Find a nearby EV</h2>
        </div>
        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6" onSubmit={(event) => { event.preventDefault(); setNotice('') }}>
          <Field label="Pickup">
            <Select value={form.originStopId} onChange={(event) => setForm({ ...form, originStopId: event.target.value })}>
              {db.stops.map((stop) => (
                <option key={stop.id} value={stop.id}>{stop.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Drop">
            <Select value={form.destinationStopId} onChange={(event) => setForm({ ...form, destinationStopId: event.target.value })}>
              {db.stops.map((stop) => (
                <option key={stop.id} value={stop.id}>{stop.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" min={todayISO()} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </Field>
          <Field label="Pickup after">
            <Input type="time" value={form.afterTime} onChange={(event) => setForm({ ...form, afterTime: event.target.value })} />
          </Field>
          <Field label="Seats" hint={form.kind === 'ev-two-wheeler' ? 'Two-wheelers carry 1 passenger' : 'Within legal capacity'}>
            <Select value={form.seats} onChange={(event) => setForm({ ...form, seats: Number(event.target.value) })}>
              {[1, 2, 3, 4].map((seat) => (
                <option key={seat} value={seat}>{seat}</option>
              ))}
            </Select>
          </Field>
          <Field label="Vehicle type">
            <Select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}>
              <option value="">All EVs</option>
              <option value="ev-auto">EV auto</option>
              <option value="ev-two-wheeler">EV two-wheeler</option>
            </Select>
          </Field>
        </form>
        {notice && <p className="mt-3 rounded-xl border border-pine-200 bg-pine-50 px-3 py-2 text-xs text-pine-900">{notice}</p>}
      </section>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">Nearest available providers</h2>
          <p className="mt-1 text-xs text-slate-500">
            {options.length} eligible vehicle{options.length === 1 ? '' : 's'} within 3 km · sorted by distance to pickup · sample availability
          </p>
        </div>
        <Badge tone="neutral">Provider acceptance required</Badge>
      </div>

      {options.length === 0 ? (
        <EmptyState
          title="No eligible EV available"
          description="No verified provider is available within 3 km with enough legal seats and range for this trip. Try another pickup point, reduce seats, or check back after a provider updates availability."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {options.map((option) => {
            const vehicle = option.vehicle
            const evSegment = option.segments.filter((segment) => segment.mode.startsWith('ev-')).at(-1)
            const already = requested.includes(evSegment.vehicleId)
            return (
              <article key={vehicle.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-semibold text-slate-900">{option.provider.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {vehicle.kind === 'ev-auto' ? 'EV auto' : 'EV two-wheeler'} · {vehicle.model} · {vehicle.registration}
                    </p>
                  </div>
                  <Badge tone="pine">
                    <ShieldCheck className="size-3" aria-hidden="true" /> Verified
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 sm:grid-cols-4">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 text-pine-600" aria-hidden="true" />
                    {option.distanceToPickupKm} km walk
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5 text-pine-600" aria-hidden="true" />
                    {vehicle.capacity} legal · {option.remainingSeats} free
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BatteryCharging className="size-3.5 text-pine-600" aria-hidden="true" />
                    {vehicle.batteryPercent}% · {vehicle.rangeKm} km
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5 text-pine-600" aria-hidden="true" />
                    {evSegment.durationMin + (evSegment.pickupWait ?? 0)} min
                  </span>
                </div>

                <div className="mt-3 rounded-xl bg-sand-50 px-3 py-2.5 text-[11px] text-slate-600">
                  <p>
                    Pickup at <strong className="font-semibold text-slate-800">{option.pickupStop.name}</strong> · walk{' '}
                    {option.distanceToPickupKm} km · estimated arrival {formatClock(evSegment.arriveMin)}
                  </p>
                  <p className="mt-0.5">Trip {option.tripKm} km · ₹{evSegment.fare} sample estimate · {option.remainingSeats} seats available today</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400">Availability is provider-reported sample data.</p>
                  <Button size="sm" onClick={() => requestRide(option)} disabled={already}>
                    {already ? 'Request sent' : 'Request ride'}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-slate-900">My EV ride requests</h2>
          <span className="text-xs text-slate-500">Only accepted rides are confirmed</span>
        </div>

        {myRides.length === 0 ? (
          <EmptyState title="No EV ride requests" description="Choose a provider above and send a request to see its status here." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-sand-100/70 text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Journey</th>
                    <th className="px-4 py-3">Provider / vehicle</th>
                    <th className="px-4 py-3">Pickup</th>
                    <th className="px-4 py-3">Seats</th>
                    <th className="px-4 py-3">Fare est.</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRides.map((request) => {
                    const vehicle = getVehicle(db, request.vehicleId)
                    const provider = getProvider(db, request.providerId)
                    return (
                      <tr key={request.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-slate-800">
                            {getStop(db, request.originStopId)?.name} → {getStop(db, request.destinationStopId)?.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{request.date}</p>
                          {request.poolingGroupId && <Badge tone="neutral" className="mt-1">Pooling group</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-800">{provider?.name}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{vehicle?.model} · {vehicle?.registration}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {formatClock(toMinutes(request.pickupTime))}
                          {request.status === 'accepted' && (
                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-pine-700">
                              <Phone className="size-3" aria-hidden="true" /> {provider?.phone}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">{request.seats}</td>
                        <td className="px-4 py-3 text-xs text-slate-700">₹{request.fareEstimate}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={request.status} />
                          {request.reason && <p className="mt-1 max-w-40 text-[10px] text-slate-500">{request.reason}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {['pending', 'accepted'].includes(request.status) ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateRideRequest(request.id, { status: 'cancelled', reason: 'Cancelled by student' })}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-slate-200 bg-sand-100/60 px-4 py-3 text-xs leading-relaxed text-slate-600">
        <ShieldCheck className="mr-1 inline size-4 text-pine-700" aria-hidden="true" />
        EV availability is shown only when the provider is verified, marked available and the vehicle is active. Live location is not shared; pickup points are fixed stops chosen with consent. Capacity shown is the registered legal passenger capacity.
      </div>
    </PortalPage>
  )
}
