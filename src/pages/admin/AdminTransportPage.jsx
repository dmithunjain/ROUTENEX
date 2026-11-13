import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Bus,
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Route,
  Trash2,
  X,
} from 'lucide-react'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatusPill from '@/components/ui/StatusPill'
import { useAppData } from '@/context/AppDataContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import { getProvider, getRouteStats, getVehicle } from '@/services/transportService'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const newBus = {
  registration: '',
  model: '',
  providerId: '',
  capacity: 40,
  available: true,
}

const newStop = { name: '', villageId: 'v1', lat: '', lng: '' }

const newSchedule = {
  routeId: '',
  busId: '',
  departureTime: '08:00',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fare: 20,
  availableSeats: 20,
  status: 'running',
  note: '',
}

export default function AdminTransportPage() {
  const {
    db,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addStop,
    updateStop,
    deleteStop,
    addRoute,
    updateRoute,
    deleteRoute,
    addSchedule,
    updateSchedule,
    deleteSchedule,
  } = useAppData()
  useDocumentTitle('Transport management')

  const [tab, setTab] = useState('buses')
  const [notice, setNotice] = useState('')
  const [busEditor, setBusEditor] = useState(null)
  const [stopEditor, setStopEditor] = useState(null)
  const [routeEditor, setRouteEditor] = useState(null)
  const [scheduleEditor, setScheduleEditor] = useState(null)

  const buses = db.vehicles.filter((vehicle) => vehicle.kind === 'bus')
  const busProviders = db.providers.filter((provider) => provider.type === 'bus')
  const tabs = [
    { id: 'buses', label: `Buses (${buses.length})`, icon: Bus },
    { id: 'routes', label: `Routes (${db.routes.length})`, icon: Route },
    { id: 'stops', label: `Stops (${db.stops.length})`, icon: MapPin },
    { id: 'schedules', label: `Schedules (${db.schedules.length})`, icon: CalendarDays },
  ]

  const openBus = (bus) => {
    setBusEditor(
      bus
        ? {
            id: bus.id,
            form: {
              registration: bus.registration,
              model: bus.model,
              providerId: bus.providerId,
              capacity: bus.capacity,
              available: bus.available !== false,
            },
          }
        : {
            id: null,
            form: { ...newBus, providerId: busProviders[0]?.id ?? db.providers[0]?.id ?? '' },
          },
    )
  }

  const saveBus = (event) => {
    event.preventDefault()
    const form = busEditor.form
    if (!form.registration.trim() || !form.model.trim()) return
    if (db.vehicles.some((vehicle) => vehicle.id !== busEditor.id && vehicle.registration.toLowerCase() === form.registration.trim().toLowerCase())) {
      setNotice('A vehicle with that registration already exists.')
      return
    }
    const usedSeats = Math.max(
      0,
      ...db.schedules
        .filter((schedule) => schedule.busId === busEditor.id)
        .map((schedule) => Number(schedule.availableSeats || 0)),
    )
    if (Number(form.capacity) < usedSeats) {
      setNotice(`Capacity cannot be below the ${usedSeats} seats already listed on this bus's schedules.`)
      return
    }
    const payload = {
      kind: 'bus',
      registration: form.registration.trim(),
      model: form.model.trim(),
      providerId: form.providerId,
      capacity: Math.max(1, Number(form.capacity) || 1),
      available: Boolean(form.available),
    }
    if (busEditor.id) updateVehicle(busEditor.id, payload)
    else addVehicle(payload)
    setBusEditor(null)
    setNotice('Bus saved. Student journey results use the updated bus data immediately.')
  }

  const removeBus = (bus) => {
    const used = db.schedules.some((schedule) => schedule.busId === bus.id)
    if (used) {
      setNotice(`Cannot delete ${bus.registration}: it is assigned to a schedule. Reassign or delete the schedule first.`)
      return
    }
    if (!window.confirm(`Delete bus ${bus.registration}?`)) return
    deleteVehicle(bus.id)
    setNotice('Bus deleted from the shared transport data.')
  }

  const openStop = (stop) => {
    setStopEditor(
      stop
        ? {
            id: stop.id,
            form: { name: stop.name, villageId: stop.villageId, lat: stop.lat, lng: stop.lng },
          }
        : { id: null, form: { ...newStop } },
    )
  }

  const saveStop = (event) => {
    event.preventDefault()
    const form = stopEditor.form
    if (!form.name.trim() || form.lat === '' || form.lng === '') return
    const payload = {
      name: form.name.trim(),
      villageId: form.villageId,
      lat: Number(form.lat),
      lng: Number(form.lng),
    }
    if (stopEditor.id) updateStop(stopEditor.id, payload)
    else addStop(payload)
    setStopEditor(null)
    setNotice('Stop saved. Routes and planner distances recalculate from coordinates.')
  }

  const removeStop = (stop) => {
    const used = db.routes.find((route) => route.stops.includes(stop.id))
    if (used) {
      setNotice(`Cannot delete ${stop.name}: it is used by route ${used.code}. Edit the route first.`)
      return
    }
    if (!window.confirm(`Delete stop ${stop.name}?`)) return
    deleteStop(stop.id)
    setNotice('Stop deleted.')
  }

  const openRoute = (route) => {
    setRouteEditor(
      route
        ? {
            id: route.id,
            form: { code: route.code, name: route.name, providerId: route.providerId, fare: route.fare },
            stopIds: [...route.stops],
            addId: db.stops.find((stop) => !route.stops.includes(stop.id))?.id ?? '',
          }
        : {
            id: null,
            form: { code: `R${db.routes.length + 1}`, name: '', providerId: busProviders[0]?.id ?? '', fare: 20 },
            stopIds: [],
            addId: db.stops[0]?.id ?? '',
          },
    )
  }

  const saveRoute = (event) => {
    event.preventDefault()
    if (!routeEditor) return
    if (routeEditor.form.name.trim().length < 3) {
      setNotice('Route name is required.')
      return
    }
    if (routeEditor.stopIds.length < 2) {
      setNotice('A route needs at least two stops, in travel order.')
      return
    }
    const payload = {
      code: routeEditor.form.code.trim().toUpperCase(),
      name: routeEditor.form.name.trim(),
      providerId: routeEditor.form.providerId,
      fare: Math.max(1, Number(routeEditor.form.fare) || 1),
      stops: routeEditor.stopIds,
      color: db.routes.find((route) => route.id === routeEditor.id)?.color ?? '#157456',
    }
    if (routeEditor.id) updateRoute(routeEditor.id, payload)
    else addRoute(payload)
    setRouteEditor(null)
    setNotice('Route saved. Schedules using it pick up the new stop order and distance.')
  }

  const removeRoute = (route) => {
    const used = db.schedules.some((schedule) => schedule.routeId === route.id)
    if (used) {
      setNotice(`Cannot delete route ${route.code}: it has schedules. Delete or reassign them first.`)
      return
    }
    if (!window.confirm(`Delete route ${route.code}?`)) return
    deleteRoute(route.id)
    setNotice('Route deleted.')
  }

  const moveRouteStop = (index, direction) => {
    setRouteEditor((previous) => {
      const stopIds = [...previous.stopIds]
      const target = index + direction
      if (target < 0 || target >= stopIds.length) return previous
      ;[stopIds[index], stopIds[target]] = [stopIds[target], stopIds[index]]
      return { ...previous, stopIds }
    })
  }

  const openSchedule = (schedule) => {
    setScheduleEditor(
      schedule
        ? {
            id: schedule.id,
            form: {
              routeId: schedule.routeId,
              busId: schedule.busId,
              departureTime: schedule.departureTime,
              days: schedule.days ?? [],
              fare: schedule.fare,
              availableSeats: schedule.availableSeats,
              status: schedule.status,
              note: schedule.note ?? '',
            },
          }
        : {
            id: null,
            form: {
              ...newSchedule,
              routeId: db.routes[0]?.id ?? '',
              busId: buses[0]?.id ?? '',
              fare: db.routes[0]?.fare ?? 20,
              availableSeats: buses[0]?.capacity ?? 20,
            },
          },
    )
  }

  const saveSchedule = (event) => {
    event.preventDefault()
    if (!scheduleEditor) return
    const form = scheduleEditor.form
    const bus = getVehicle(db, form.busId)
    if (!form.routeId || !bus) {
      setNotice('Choose a route and a bus for this schedule.')
      return
    }
    if (!form.days.length) {
      setNotice('Choose at least one operating day.')
      return
    }
    if (Number(form.availableSeats) > Number(bus.capacity)) {
      setNotice(`Available seats cannot exceed the bus capacity of ${bus.capacity}.`)
      return
    }
    if (form.status === 'running' && Number(form.availableSeats) < 0) {
      setNotice('Available seats cannot be negative.')
      return
    }
    const payload = {
      ...form,
      fare: Math.max(1, Number(form.fare) || 1),
      availableSeats: Math.max(0, Number(form.availableSeats) || 0),
    }
    if (scheduleEditor.id) updateSchedule(scheduleEditor.id, payload)
    else addSchedule(payload)
    setScheduleEditor(null)
    setNotice('Schedule saved. Cancellations and seat counts are reflected in student planning instantly.')
  }

  const cancelSchedule = (schedule) => {
    openSchedule(schedule)
    setScheduleEditor((previous) => ({
      ...previous,
      form: { ...previous.form, status: 'cancelled', note: previous.form.note || 'Cancelled by administrator' },
    }))
  }

  return (
    <PortalPage>
      <PageHeader
        title="Bus route management"
        description="Add and edit buses, organise route stops, assign buses to schedules, manage seat availability and record cancellations. Everything here updates the student planner immediately."
        tabs={adminTabs(ROUTES.adminTransport)}
      />

      {notice && (
        <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-xs font-medium text-pine-900">{notice}</div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                tab === item.id ? 'bg-pine-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sand-50'
              }`}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'buses' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">Buses</h2>
              <p className="mt-1 text-xs text-slate-500">Register buses, capacity and operator. Buses are assigned to schedules.</p>
            </div>
            <Button size="sm" onClick={() => openBus(null)}>
              <Plus className="size-3.5" aria-hidden="true" /> Add bus
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Registration</th>
                  <th className="py-2">Model</th>
                  <th className="py-2">Operator</th>
                  <th className="py-2">Capacity</th>
                  <th className="py-2">Availability</th>
                  <th className="py-2">Schedules</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buses.map((bus) => (
                  <tr key={bus.id}>
                    <td className="py-2.5 text-xs font-semibold text-slate-800">{bus.registration}</td>
                    <td className="py-2.5 text-xs text-slate-600">{bus.model}</td>
                    <td className="py-2.5 text-xs text-slate-600">{getProvider(db, bus.providerId)?.name}</td>
                    <td className="py-2.5 text-xs text-slate-600">{bus.capacity}</td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        onClick={() => updateVehicle(bus.id, { available: bus.available === false })}
                        className="text-[10px] font-semibold"
                      >
                        <StatusPill status={bus.available ? 'available' : 'inactive'} />
                      </button>
                    </td>
                    <td className="py-2.5 text-xs text-slate-600">
                      {db.schedules.filter((schedule) => schedule.busId === bus.id).length}
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openBus(bus)} aria-label={`Edit ${bus.registration}`} className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => removeBus(bus)} aria-label={`Delete ${bus.registration}`} className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'stops' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">Stops</h2>
              <p className="mt-1 text-xs text-slate-500">Stops are shared by routes, EVs and the planner. Coordinates drive walking and EV distances.</p>
            </div>
            <Button size="sm" onClick={() => openStop(null)}>
              <Plus className="size-3.5" aria-hidden="true" /> Add stop
            </Button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {db.stops.map((stop) => {
              const routeCount = db.routes.filter((route) => route.stops.includes(stop.id)).length
              return (
                <div key={stop.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{stop.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {db.villages.find((village) => village.id === stop.villageId)?.name} · {Number(stop.lat).toFixed(4)}, {Number(stop.lng).toFixed(4)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{routeCount} route(s) · {stop.isCollege ? 'College stop' : 'Village stop'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openStop(stop)} aria-label={`Edit ${stop.name}`} className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => removeStop(stop)} aria-label={`Delete ${stop.name}`} className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {tab === 'routes' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">Routes & stops</h2>
              <p className="mt-1 text-xs text-slate-500">Stop order defines travel direction and segment timing.</p>
            </div>
            <Button size="sm" onClick={() => openRoute(null)}>
              <Plus className="size-3.5" aria-hidden="true" /> Create route
            </Button>
          </div>

          <div className="grid gap-3">
            {db.routes.map((route) => {
              const stats = getRouteStats(db, route)
              return (
                <article key={route.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {route.code} · {route.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {getProvider(db, route.providerId)?.name} · {stats.totalKm.toFixed(1)} km · {stats.totalMinutes} min · ₹{route.fare} full-route fare
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openRoute(route)} aria-label={`Edit ${route.code}`} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                        <Pencil className="size-4" />
                      </button>
                      <button type="button" onClick={() => removeRoute(route)} aria-label={`Delete ${route.code}`} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {route.stops.map((stopId, index) => (
                      <span key={stopId} className="flex items-center gap-1.5">
                        {index > 0 && <span className="text-slate-300">→</span>}
                        <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[10px] font-medium text-slate-700">
                          {db.stops.find((stop) => stop.id === stopId)?.name ?? stopId}
                        </span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    {db.schedules.filter((schedule) => schedule.routeId === route.id).length} schedule(s) use this route
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {tab === 'schedules' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">Schedules & availability</h2>
              <p className="mt-1 text-xs text-slate-500">Assign a bus to a route, set departures and seats, then manage cancellations.</p>
            </div>
            <Button size="sm" onClick={() => openSchedule(null)}>
              <Plus className="size-3.5" aria-hidden="true" /> Add schedule
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-left text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Route</th>
                  <th className="py-2">Bus</th>
                  <th className="py-2">Departure</th>
                  <th className="py-2">Days</th>
                  <th className="py-2">Fare</th>
                  <th className="py-2">Seats</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.schedules.map((schedule) => {
                  const route = db.routes.find((item) => item.id === schedule.routeId)
                  const bus = db.vehicles.find((item) => item.id === schedule.busId)
                  return (
                    <tr key={schedule.id} className="align-top">
                      <td className="py-2.5 text-xs text-slate-800">{route?.code} · {route?.name}</td>
                      <td className="py-2.5 text-xs text-slate-600">{bus?.registration ?? 'Bus removed'}</td>
                      <td className="py-2.5 text-xs text-slate-600">{schedule.departureTime}</td>
                      <td className="py-2.5 text-[10px] text-slate-500">{schedule.days?.join(' ')}</td>
                      <td className="py-2.5 text-xs text-slate-600">₹{schedule.fare}</td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {schedule.availableSeats} / {bus?.capacity ?? '—'}
                      </td>
                      <td className="py-2.5">
                        <StatusPill status={schedule.status} />
                        {schedule.note && <p className="mt-1 max-w-40 text-[10px] text-slate-400">{schedule.note}</p>}
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1">
                          {schedule.status === 'cancelled' ? (
                            <button type="button" onClick={() => updateSchedule(schedule.id, { status: 'running', note: '' })} aria-label="Restore service" className="grid size-7 place-items-center rounded-lg text-pine-700 hover:bg-pine-50">
                              <RotateCcw className="size-3.5" />
                            </button>
                          ) : (
                            <button type="button" onClick={() => cancelSchedule(schedule)} aria-label="Cancel service" className="grid size-7 place-items-center rounded-lg text-amber-600 hover:bg-amber-50">
                              <X className="size-3.5" />
                            </button>
                          )}
                          <button type="button" onClick={() => openSchedule(schedule)} aria-label="Edit schedule" className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this schedule?')) deleteSchedule(schedule.id)
                            }}
                            aria-label="Delete schedule"
                            className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        open={Boolean(busEditor)}
        onClose={() => setBusEditor(null)}
        title={busEditor?.id ? 'Edit bus' : 'Add bus'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setBusEditor(null)}>Cancel</Button>
            <Button size="sm" type="submit" form="bus-form">Save bus</Button>
          </>
        }
      >
        {busEditor && (
          <form id="bus-form" onSubmit={saveBus} className="grid gap-3 sm:grid-cols-2">
            <Field label="Registration">
              <Input value={busEditor.form.registration} onChange={(event) => setBusEditor({ ...busEditor, form: { ...busEditor.form, registration: event.target.value } })} placeholder="TN-21-AX-0000" required />
            </Field>
            <Field label="Model">
              <Input value={busEditor.form.model} onChange={(event) => setBusEditor({ ...busEditor, form: { ...busEditor.form, model: event.target.value } })} required />
            </Field>
            <Field label="Operator">
              <Select value={busEditor.form.providerId} onChange={(event) => setBusEditor({ ...busEditor, form: { ...busEditor.form, providerId: event.target.value } })}>
                {db.providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Seating capacity">
              <Input type="number" min="1" max="60" value={busEditor.form.capacity} onChange={(event) => setBusEditor({ ...busEditor, form: { ...busEditor.form, capacity: Number(event.target.value) } })} required />
            </Field>
            <Field label="Availability" className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={busEditor.form.available} onChange={(event) => setBusEditor({ ...busEditor, form: { ...busEditor.form, available: event.target.checked } })} className="size-4 rounded border-slate-300 text-pine-600" />
                Bus is available for scheduling
              </label>
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(stopEditor)}
        onClose={() => setStopEditor(null)}
        title={stopEditor?.id ? 'Edit stop' : 'Add stop'}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setStopEditor(null)}>Cancel</Button>
            <Button size="sm" type="submit" form="stop-form">Save stop</Button>
          </>
        }
      >
        {stopEditor && (
          <form id="stop-form" onSubmit={saveStop} className="grid gap-3 sm:grid-cols-2">
            <Field label="Stop name" className="sm:col-span-2">
              <Input value={stopEditor.form.name} onChange={(event) => setStopEditor({ ...stopEditor, form: { ...stopEditor.form, name: event.target.value } })} required />
            </Field>
            <Field label="Village / area">
              <Select value={stopEditor.form.villageId} onChange={(event) => setStopEditor({ ...stopEditor, form: { ...stopEditor.form, villageId: event.target.value } })}>
                {db.villages.map((village) => (
                  <option key={village.id} value={village.id}>{village.name}</option>
                ))}
              </Select>
            </Field>
            <div />
            <Field label="Latitude">
              <Input type="number" step="0.0001" value={stopEditor.form.lat} onChange={(event) => setStopEditor({ ...stopEditor, form: { ...stopEditor.form, lat: event.target.value } })} placeholder="12.6167" required />
            </Field>
            <Field label="Longitude">
              <Input type="number" step="0.0001" value={stopEditor.form.lng} onChange={(event) => setStopEditor({ ...stopEditor, form: { ...stopEditor.form, lng: event.target.value } })} placeholder="79.7500" required />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(routeEditor)}
        onClose={() => setRouteEditor(null)}
        title={routeEditor?.id ? 'Edit route' : 'Create route'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRouteEditor(null)}>Cancel</Button>
            <Button size="sm" type="submit" form="route-form">Save route</Button>
          </>
        }
      >
        {routeEditor && (
          <form id="route-form" onSubmit={saveRoute} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Route code">
                <Input value={routeEditor.form.code} onChange={(event) => setRouteEditor({ ...routeEditor, form: { ...routeEditor.form, code: event.target.value } })} required />
              </Field>
              <Field label="Full-route fare (₹)">
                <Input type="number" min="1" value={routeEditor.form.fare} onChange={(event) => setRouteEditor({ ...routeEditor, form: { ...routeEditor.form, fare: Number(event.target.value) } })} />
              </Field>
              <Field label="Route name" className="sm:col-span-2">
                <Input value={routeEditor.form.name} onChange={(event) => setRouteEditor({ ...routeEditor, form: { ...routeEditor.form, name: event.target.value } })} placeholder="Uthiramerur – College via Salavakkam" required />
              </Field>
              <Field label="Operator" className="sm:col-span-2">
                <Select value={routeEditor.form.providerId} onChange={(event) => setRouteEditor({ ...routeEditor, form: { ...routeEditor.form, providerId: event.target.value } })}>
                  {db.providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700">Stops in travel order</p>
              <ol className="mt-2 space-y-1.5">
                {routeEditor.stopIds.map((stopId, index) => (
                  <li key={stopId} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-sand-50 px-3 py-2">
                    <span className="grid size-5 place-items-center rounded bg-pine-900 text-[10px] font-semibold text-white">{index + 1}</span>
                    <span className="flex-1 text-xs text-slate-700">{db.stops.find((stop) => stop.id === stopId)?.name ?? stopId}</span>
                    <button type="button" onClick={() => moveRouteStop(index, -1)} disabled={index === 0} aria-label="Move stop up" className="grid size-6 place-items-center rounded text-slate-500 hover:bg-white disabled:opacity-30">
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => moveRouteStop(index, 1)} disabled={index === routeEditor.stopIds.length - 1} aria-label="Move stop down" className="grid size-6 place-items-center rounded text-slate-500 hover:bg-white disabled:opacity-30">
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setRouteEditor({ ...routeEditor, stopIds: routeEditor.stopIds.filter((id) => id !== stopId) })} aria-label="Remove stop" className="grid size-6 place-items-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600">
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
                {routeEditor.stopIds.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">No stops added</li>}
              </ol>

              <div className="mt-3 flex gap-2">
                <Select
                  value={routeEditor.addId}
                  onChange={(event) => setRouteEditor({ ...routeEditor, addId: event.target.value })}
                  aria-label="Stop to add"
                >
                  {db.stops
                    .filter((stop) => !routeEditor.stopIds.includes(stop.id))
                    .map((stop) => (
                      <option key={stop.id} value={stop.id}>{stop.name}</option>
                    ))}
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (!routeEditor.addId || routeEditor.stopIds.includes(routeEditor.addId)) return
                    setRouteEditor({ ...routeEditor, stopIds: [...routeEditor.stopIds, routeEditor.addId] })
                  }}
                >
                  <Plus className="size-3.5" aria-hidden="true" /> Add
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Trip time and distance are derived from stop coordinates at 30 km/h plus 2 minutes per stop.</p>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(scheduleEditor)}
        onClose={() => setScheduleEditor(null)}
        title={scheduleEditor?.id ? 'Edit schedule' : 'Add schedule'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setScheduleEditor(null)}>Cancel</Button>
            <Button size="sm" type="submit" form="schedule-form">Save schedule</Button>
          </>
        }
      >
        {scheduleEditor && (
          <form id="schedule-form" onSubmit={saveSchedule} className="grid gap-3 sm:grid-cols-2">
            <Field label="Route">
              <Select value={scheduleEditor.form.routeId} onChange={(event) => setScheduleEditor({ ...scheduleEditor, form: { ...scheduleEditor.form, routeId: event.target.value } })}>
                {db.routes.map((route) => (
                  <option key={route.id} value={route.id}>{route.code} · {route.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Assigned bus">
              <Select
                value={scheduleEditor.form.busId}
                onChange={(event) => {
                  const bus = getVehicle(db, event.target.value)
                  setScheduleEditor({
                    ...scheduleEditor,
                    form: {
                      ...scheduleEditor.form,
                      busId: event.target.value,
                      availableSeats: Math.min(Number(scheduleEditor.form.availableSeats), Number(bus?.capacity ?? 0)),
                    },
                  })
                }}
              >
                {db.vehicles
                  .filter((vehicle) => vehicle.kind === 'bus')
                  .map((bus) => (
                    <option key={bus.id} value={bus.id}>{bus.registration} · {bus.capacity} seats</option>
                  ))}
              </Select>
            </Field>
            <Field label="Departure time">
              <Input type="time" value={scheduleEditor.form.departureTime} onChange={(event) => setScheduleEditor({ ...scheduleEditor, form: { ...scheduleEditor.form, departureTime: event.target.value } })} required />
            </Field>
            <Field label="Full-route fare (₹)">
              <Input type="number" min="1" value={scheduleEditor.form.fare} onChange={(event) => setScheduleEditor({ ...scheduleEditor, form: { ...scheduleEditor.form, fare: Number(event.target.value) } })} />
            </Field>
            <Field label="Available seats">
              <Input type="number" min="0" max={getVehicle(db, scheduleEditor.form.busId)?.capacity ?? 0} value={scheduleEditor.form.availableSeats} onChange={(event) => setScheduleEditor({ ...scheduleEditor, form: { ...scheduleEditor.form, availableSeats: Number(event.target.value) } })} />
            </Field>
            <Field label="Service status">
              <Select value={scheduleEditor.form.status} onChange={(event) => setScheduleEditor({ ...scheduleEditor, form: { ...scheduleEditor.form, status: event.target.value } })}>
                <option value="running">Running</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>
            <Field label="Operating days" className="sm:col-span-2">
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                  const active = scheduleEditor.form.days.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setScheduleEditor({
                          ...scheduleEditor,
                          form: {
                            ...scheduleEditor.form,
                            days: active
                              ? scheduleEditor.form.days.filter((item) => item !== day)
                              : [...scheduleEditor.form.days, day],
                          },
                        })
                      }
                      className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${active ? 'bg-pine-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </Field>
            <Field label="Note / cancellation reason" className="sm:col-span-2">
              <Textarea value={scheduleEditor.form.note} onChange={(event) => setScheduleEditor({ ...scheduleEditor, form: { ...scheduleEditor.form, note: event.target.value } })} placeholder="Optional — shown to students for cancellations" />
            </Field>
            <div className="sm:col-span-2">
              <Badge tone="neutral">
                Capacity rule: available seats cannot exceed the {getVehicle(db, scheduleEditor.form.busId)?.capacity ?? 0}-seat bus.
              </Badge>
            </div>
          </form>
        )}
      </Modal>
    </PortalPage>
  )
}
