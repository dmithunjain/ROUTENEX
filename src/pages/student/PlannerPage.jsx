import { useMemo, useState } from 'react'
import { ArrowLeftRight, Bot, CalendarClock, Search, Sparkles, TriangleAlert } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import JourneyOptionCard from '@/components/journey/JourneyOptionCard'
import { useAppData } from '@/context/AppDataContext'
import { useCurrentStudent } from '@/hooks/useCurrentUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { studentTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import {
  formatClock,
  getActiveCancellations,
  getStop,
  planJourneys,
  todayISO,
  toMinutes,
} from '@/services/transportService'

function minutesToTimeInput(minutes) {
  const value = Math.round(minutes)
  const normalized = ((value % 1440) + 1440) % 1440
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`
}

export default function PlannerPage() {
  const { db, addSavedJourney, addRideRequest } = useAppData()
  const student = useCurrentStudent()
  const [params] = useSearchParams()
  useDocumentTitle('Journey planner')

  const defaultOrigin =
    db.stops.find((stop) => stop.villageId === student?.villageId)?.id ?? db.stops[0]?.id
  const defaultDestination = db.stops.find((stop) => stop.isCollege)?.id ?? db.stops[1]?.id

  const [form, setForm] = useState({
    originStopId: params.get('originStopId') || defaultOrigin,
    destinationStopId: params.get('destinationStopId') || defaultDestination,
    date: params.get('date') || todayISO(),
    afterTime: params.get('afterTime') || student?.departurePreference || '08:00',
    seats: Number(params.get('seats') || 1),
    preference: 'recommended',
  })
  const [savedIds, setSavedIds] = useState([])
  const [requested, setRequested] = useState({})
  const [requesting, setRequesting] = useState(null)
  const [notice, setNotice] = useState('')

  const result = useMemo(
    () =>
      planJourneys(db, {
        originStopId: form.originStopId,
        destinationStopId: form.destinationStopId,
        date: form.date,
        afterTime: form.afterTime,
        seats: Number(form.seats),
        preference: form.preference,
      }),
    [db, form],
  )

  const origin = getStop(db, form.originStopId)
  const destination = getStop(db, form.destinationStopId)
  const cancellations = getActiveCancellations(db, form.date)

  const saveJourney = (option) => {
    if (!student) return
    addSavedJourney({
      studentId: student.id,
      label: `${origin?.name} → ${destination?.name}`,
      date: form.date,
      modes: option.modes,
      totalFare: option.fare,
      durationMin: option.durationMin,
      transfers: option.transfers,
      segments: option.segments.map((segment) => ({
        mode: segment.mode,
        fromName: segment.fromName,
        toName: segment.toName,
        depart: formatClock(segment.departMin),
        arrive: formatClock(segment.arriveMin),
        detail: segment.detail,
      })),
      sample: true,
    })
    setSavedIds((previous) => [...previous, option.id])
    setNotice('Journey saved. You can find it under Saved journeys.')
  }

  const requestEv = (option) => {
    if (!student) return
    const evSegment = option.segments.find((segment) => segment.mode.startsWith('ev-'))
    if (!evSegment) return
    setRequesting(option.id)
    const record = addRideRequest({
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
      note: 'Requested from the multi-modal journey planner',
      decidedAt: null,
      reason: '',
    })
    setRequested((previous) => ({ ...previous, [option.id]: record.id }))
    setRequesting(null)
    setNotice(
      'EV request sent. The ride is not confirmed until the provider accepts it — track it in EV rides.',
    )
  }

  const missedBus = () => {
    const next = toMinutes(form.afterTime) + 45
    setForm({ ...form, afterTime: minutesToTimeInput(next), preference: 'recommended' })
    setNotice('Recalculated for 45 minutes later, excluding services you have already missed.')
  }

  const returnJourney = () => {
    setForm({
      ...form,
      originStopId: form.destinationStopId,
      destinationStopId: form.originStopId,
      afterTime: '17:30',
    })
    setNotice('Return journey prepared for the evening services. Check the latest schedule before travelling.')
  }

  return (
    <PortalPage>
      <PageHeader
        title="Smart multi-modal journey planner"
        description="Compare connected bus, EV auto, EV two-wheeler and walking options generated from the shared ROUTENEX transport data."
        tabs={studentTabs(ROUTES.planner)}
        actions={
          <Link
            to={ROUTES.assistant}
            className="inline-flex items-center gap-2 rounded-full bg-pine-900 px-4 py-2 text-xs font-semibold text-white hover:bg-pine-800"
          >
            <Bot className="size-3.5" aria-hidden="true" />
            Ask the AI assistant
          </Link>
        }
      />

      <section id="journey-form" className="rounded-2xl border border-slate-200 bg-white p-5">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault()
            setNotice('')
          }}
        >
          <Field label="From" className="lg:col-span-1">
            <Select
              value={form.originStopId}
              onChange={(event) => setForm({ ...form, originStopId: event.target.value })}
            >
              {db.stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To" className="lg:col-span-1">
            <Select
              value={form.destinationStopId}
              onChange={(event) => setForm({ ...form, destinationStopId: event.target.value })}
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
              min={todayISO()}
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </Field>
          <Field label="Depart after">
            <Input
              type="time"
              value={form.afterTime}
              onChange={(event) => setForm({ ...form, afterTime: event.target.value })}
            />
          </Field>
          <Field label="Seats">
            <Select
              value={form.seats}
              onChange={(event) => setForm({ ...form, seats: Number(event.target.value) })}
            >
              {[1, 2, 3, 4].map((seat) => (
                <option key={seat} value={seat}>
                  {seat} student{seat > 1 ? 's' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rank by">
            <Select
              value={form.preference}
              onChange={(event) => setForm({ ...form, preference: event.target.value })}
            >
              <option value="recommended">Recommended</option>
              <option value="fastest">Fastest arrival</option>
              <option value="cheapest">Lowest fare</option>
              <option value="fewest">Fewest transfers</option>
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-6">
            <Button type="submit" size="sm">
              <Search className="size-3.5" aria-hidden="true" />
              Search journeys
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={missedBus}>
              <CalendarClock className="size-3.5" aria-hidden="true" />
              Missed my bus
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={returnJourney}>
              <ArrowLeftRight className="size-3.5" aria-hidden="true" />
              Return journey
            </Button>
          </div>
        </form>
      </section>

      {notice && (
        <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-xs font-medium text-pine-900">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            {origin?.name} → {destination?.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {result.options.length} connected option{result.options.length === 1 ? '' : 's'} after{' '}
            {formatClock(toMinutes(form.afterTime))} · {form.date} · {form.seats} seat
            {form.seats > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="amber">Estimated fares</Badge>
          <Badge tone="neutral">Shared data · live view</Badge>
        </div>
      </div>

      {cancellations.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-semibold">{cancellations.length} cancelled service(s)</strong>{' '}
            excluded from these results:{' '}
            {cancellations
              .map((schedule) => `${schedule.route?.code} at ${schedule.departureTime}`)
              .join(', ')}
            . Admin updates appear here immediately.
          </p>
        </div>
      )}

      {result.options.length === 0 ? (
        <EmptyState
          title="No connected journey found"
          description="There is no bus, EV or walking combination for this origin, destination and time in the current sample data. Try a later departure, the return journey button, or check the EV network for a direct ride."
          action={
            <Button href="#journey-form" size="sm" variant="secondary" className="mt-4" onClick={missedBus}>
              Search 45 minutes later
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {result.options.map((option) => (
            <JourneyOptionCard
              key={option.id}
              option={option}
              saved={savedIds.includes(option.id)}
              onSave={student ? saveJourney : undefined}
              onRequestEv={student ? requestEv : undefined}
              busy={requesting === option.id}
            />
          ))}
        </div>
      )}

      {Object.keys(requested).length > 0 && (
        <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-xs text-pine-900">
          <p className="font-semibold">EV request sent — awaiting provider acceptance.</p>
          <Link to={ROUTES.ev} className="mt-1 inline-block font-medium underline">
            Track EV ride requests
          </Link>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-sand-100/60 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-pine-700" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold text-slate-900">How these options are built</h2>
        </div>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-600">
          The planner checks active schedules and verified provider availability, then connects
          walking access, bus legs and available EV vehicles within the recorded range and legal
          capacity. Cancelled schedules and rejected/unavailable vehicles are excluded. All fares
          are estimates from sample data.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="neutral">Bus capacity respected</Badge>
          <Badge tone="neutral">EV legal capacity respected</Badge>
          <Badge tone="neutral">Provider acceptance required</Badge>
        </div>
      </section>
    </PortalPage>
  )
}
