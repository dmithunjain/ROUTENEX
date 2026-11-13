import { useState } from 'react'
import { BatteryCharging, Bus, MapPin, Pencil, Plus, Trash2, Zap } from 'lucide-react'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Field, Input, Select } from '@/components/ui/Field'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatCard from '@/components/ui/StatCard'
import StatusPill from '@/components/ui/StatusPill'
import { useAppData } from '@/context/AppDataContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminTabs } from '@/routes/portalTabs'
import { ROUTES } from '@/routes/paths'
import { getProvider, getRemainingEvSeats, getStop, todayISO } from '@/services/transportService'

const KIND_LABEL = {
  bus: 'Bus',
  'ev-auto': 'EV auto',
  'ev-two-wheeler': 'EV two-wheeler',
}

const emptyVehicle = {
  kind: 'bus',
  providerId: '',
  registration: '',
  model: '',
  capacity: 40,
  available: true,
  batteryPercent: 80,
  rangeKm: 50,
  farePerKm: 10,
  locationStopId: '',
}

export default function AdminVehiclesPage() {
  const { db, addVehicle, updateVehicle, deleteVehicle } = useAppData()
  useDocumentTitle('Admin · vehicles')

  const [editor, setEditor] = useState(null)
  const [filter, setFilter] = useState('all')
  const [notice, setNotice] = useState('')

  const vehicles = db.vehicles.filter((vehicle) => {
    if (filter === 'bus') return vehicle.kind === 'bus'
    if (filter === 'ev') return vehicle.kind?.startsWith('ev-')
    if (filter === 'unavailable') return vehicle.available === false
    return true
  })

  const openVehicle = (vehicle) => {
    setEditor(
      vehicle
        ? {
            id: vehicle.id,
            form: {
              kind: vehicle.kind,
              providerId: vehicle.providerId,
              registration: vehicle.registration,
              model: vehicle.model,
              capacity: vehicle.capacity,
              available: vehicle.available !== false,
              batteryPercent: vehicle.batteryPercent ?? 80,
              rangeKm: vehicle.rangeKm ?? 50,
              farePerKm: vehicle.farePerKm ?? 10,
              locationStopId: vehicle.locationStopId ?? db.stops[0]?.id ?? '',
            },
          }
        : {
            id: null,
            form: {
              ...emptyVehicle,
              providerId: db.providers[0]?.id ?? '',
              locationStopId: db.stops[0]?.id ?? '',
            },
          },
    )
  }

  const saveVehicle = (event) => {
    event.preventDefault()
    const form = editor.form
    if (!form.registration.trim() || !form.model.trim() || !form.providerId) {
      setNotice('Provider, registration and model are required.')
      return
    }
    const duplicate = db.vehicles.some(
      (vehicle) =>
        vehicle.id !== editor.id &&
        vehicle.registration.trim().toLowerCase() === form.registration.trim().toLowerCase(),
    )
    if (duplicate) {
      setNotice('A vehicle with that registration already exists.')
      return
    }
    const maxCapacity = form.kind === 'bus' ? 60 : form.kind === 'ev-two-wheeler' ? 1 : 6
    const capacity = Math.min(maxCapacity, Math.max(1, Number(form.capacity) || 1))

    if (form.kind === 'bus') {
      const usedSeats = Math.max(
        0,
        ...db.schedules
          .filter((schedule) => schedule.busId === editor.id)
          .map((schedule) => Number(schedule.availableSeats || 0)),
      )
      if (capacity < usedSeats) {
        setNotice(
          `Capacity cannot be below ${usedSeats}: existing schedules already list that many available seats.`,
        )
        return
      }
    }

    const payload = {
      kind: form.kind,
      providerId: form.providerId,
      registration: form.registration.trim(),
      model: form.model.trim(),
      capacity,
      available: Boolean(form.available),
      ...(form.kind === 'bus'
        ? {}
        : {
            batteryPercent: Math.min(100, Math.max(0, Number(form.batteryPercent) || 0)),
            rangeKm: Math.max(1, Number(form.rangeKm) || 1),
            farePerKm: Math.max(1, Number(form.farePerKm) || 1),
            locationStopId: form.locationStopId,
          }),
    }
    if (editor.id) updateVehicle(editor.id, payload)
    else addVehicle(payload)
    setNotice(
      editor.id
        ? 'Vehicle updated. EV capacity, range and availability are used by the planner immediately.'
        : 'Vehicle registered in the shared fleet.',
    )
    setEditor(null)
  }

  const removeVehicle = (vehicle) => {
    const schedules = db.schedules.filter((schedule) => schedule.busId === vehicle.id)
    const rides = db.rideRequests.filter((request) => request.vehicleId === vehicle.id)
    if (schedules.length || rides.length) {
      setNotice(
        `Cannot delete ${vehicle.registration}: ${schedules.length} schedule(s) and ${rides.length} ride request(s) reference it. Remove those first.`,
      )
      return
    }
    if (!window.confirm(`Delete vehicle ${vehicle.registration}?`)) return
    deleteVehicle(vehicle.id)
    setNotice('Vehicle removed from the shared fleet.')
  }

  return (
    <PortalPage>
      <PageHeader
        title="Vehicles"
        description="The shared fleet contains buses, EV autos and EV two-wheelers. Legal capacity, availability, battery, range and base stop feed directly into journey planning and EV matching."
        tabs={adminTabs(ROUTES.adminVehicles)}
        actions={
          <Button size="sm" onClick={() => openVehicle(null)}>
            <Plus className="size-3.5" aria-hidden="true" /> Add vehicle
          </Button>
        }
      />

      {notice && (
        <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-xs font-medium text-pine-900">
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fleet size"
          value={db.vehicles.length}
          hint="Buses and EVs"
          icon={Bus}
        />
        <StatCard
          label="Buses"
          value={db.vehicles.filter((vehicle) => vehicle.kind === 'bus').length}
          hint="Assigned to schedules"
          icon={Bus}
        />
        <StatCard
          label="EV vehicles"
          value={db.vehicles.filter((vehicle) => vehicle.kind?.startsWith('ev-')).length}
          hint="Auto and two-wheeler"
          icon={Zap}
          tone="bg-amber-100 text-amber-800"
        />
        <StatCard
          label="Unavailable"
          value={db.vehicles.filter((vehicle) => vehicle.available === false).length}
          hint="Excluded from planning"
          icon={BatteryCharging}
          tone="bg-red-100 text-red-700"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All vehicles' },
          { id: 'bus', label: 'Buses' },
          { id: 'ev', label: 'EVs' },
          { id: 'unavailable', label: 'Unavailable' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === item.id
                ? 'bg-pine-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sand-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="No vehicles in this view"
          description="Change the filter or register a vehicle for a provider."
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead className="text-left text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Vehicle</th>
                  <th className="py-2">Provider</th>
                  <th className="py-2">Kind</th>
                  <th className="py-2">Capacity</th>
                  <th className="py-2">EV details</th>
                  <th className="py-2">Usage</th>
                  <th className="py-2">Availability</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((vehicle) => {
                  const provider = getProvider(db, vehicle.providerId)
                  const schedules = db.schedules.filter(
                    (schedule) => schedule.busId === vehicle.id,
                  )
                  const requests = db.rideRequests.filter(
                    (request) => request.vehicleId === vehicle.id,
                  )
                  const remaining =
                    vehicle.kind?.startsWith('ev-') && getRemainingEvSeats
                      ? getRemainingEvSeats(db, vehicle, todayISO())
                      : null
                  return (
                    <tr key={vehicle.id} className="align-top">
                      <td className="py-2.5">
                        <p className="text-xs font-semibold text-slate-800">{vehicle.registration}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{vehicle.model}</p>
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {provider?.name ?? 'Provider removed'}
                        <p className="text-[10px] text-slate-400">
                          {provider?.verified ? 'Verified' : 'Unverified'}
                        </p>
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {vehicle.kind?.startsWith('ev-') ? (
                            <Zap className="size-3" aria-hidden="true" />
                          ) : (
                            <Bus className="size-3" aria-hidden="true" />
                          )}
                          {KIND_LABEL[vehicle.kind] ?? vehicle.kind}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {vehicle.capacity} seat{vehicle.capacity > 1 ? 's' : ''}
                        {remaining !== null && (
                          <p className="text-[10px] text-slate-400">{remaining} free today</p>
                        )}
                      </td>
                      <td className="py-2.5 text-[11px] text-slate-600">
                        {vehicle.kind?.startsWith('ev-') ? (
                          <>
                            {vehicle.batteryPercent}% · {vehicle.rangeKm} km
                            <p className="inline-flex items-center gap-1 text-slate-500">
                              <MapPin className="size-3" aria-hidden="true" />
                              {getStop(db, vehicle.locationStopId)?.name ?? 'No base stop'}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-[11px] text-slate-600">
                        {vehicle.kind === 'bus'
                          ? `${schedules.length} schedule(s)`
                          : `${requests.length} request(s)`}
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateVehicle(vehicle.id, { available: vehicle.available === false })
                          }
                          aria-label={`Toggle availability for ${vehicle.registration}`}
                        >
                          <StatusPill status={vehicle.available ? 'available' : 'inactive'} />
                        </button>
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openVehicle(vehicle)}
                            aria-label={`Edit ${vehicle.registration}`}
                            className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeVehicle(vehicle)}
                            aria-label={`Delete ${vehicle.registration}`}
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

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-sand-100/60 px-4 py-3 text-[11px] text-slate-600">
        <Badge tone="neutral">EV two-wheeler = 1 student seat</Badge>
        <Badge tone="neutral">EV auto capacity from registration</Badge>
        <Badge tone="neutral">Bus seats cannot exceed capacity</Badge>
        <Badge tone="neutral">Accepted EV seats are deducted per day</Badge>
      </div>

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.id ? 'Edit vehicle' : 'Register vehicle'}
        size="lg"
        description="Capacity must reflect the registered legal passenger capacity."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" form="vehicle-admin-form">
              Save vehicle
            </Button>
          </>
        }
      >
        {editor && (
          <form
            id="vehicle-admin-form"
            onSubmit={saveVehicle}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Field label="Vehicle kind">
              <Select
                value={editor.form.kind}
                onChange={(event) => {
                  const kind = event.target.value
                  setEditor({
                    ...editor,
                    form: {
                      ...editor.form,
                      kind,
                      capacity:
                        kind === 'ev-two-wheeler'
                          ? 1
                          : kind === 'bus'
                            ? 40
                            : Math.min(6, Number(editor.form.capacity) || 4),
                    },
                  })
                }}
              >
                <option value="bus">Bus</option>
                <option value="ev-auto">EV auto</option>
                <option value="ev-two-wheeler">EV two-wheeler</option>
              </Select>
            </Field>
            <Field label="Provider">
              <Select
                value={editor.form.providerId}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    form: { ...editor.form, providerId: event.target.value },
                  })
                }
              >
                {db.providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} ({provider.type === 'ev' ? 'EV' : 'Bus'})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Registration">
              <Input
                value={editor.form.registration}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    form: { ...editor.form, registration: event.target.value },
                  })
                }
                placeholder="TN-21-EV-0000"
                required
              />
            </Field>
            <Field label="Model">
              <Input
                value={editor.form.model}
                onChange={(event) =>
                  setEditor({ ...editor, form: { ...editor.form, model: event.target.value } })
                }
                required
              />
            </Field>
            <Field
              label="Legal passenger capacity"
              hint={
                editor.form.kind === 'ev-two-wheeler'
                  ? 'A two-wheeler carries the rider plus one pillion: 1 student seat.'
                  : 'Use the capacity on the registration certificate.'
              }
            >
              <Input
                type="number"
                min="1"
                max={editor.form.kind === 'bus' ? 60 : editor.form.kind === 'ev-two-wheeler' ? 1 : 6}
                value={editor.form.capacity}
                disabled={editor.form.kind === 'ev-two-wheeler'}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    form: { ...editor.form, capacity: Number(event.target.value) },
                  })
                }
                required
              />
            </Field>
            <Field label="Availability">
              <label className="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={editor.form.available}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      form: { ...editor.form, available: event.target.checked },
                    })
                  }
                  className="size-4 rounded border-slate-300 text-pine-600"
                />
                Available for student matching
              </label>
            </Field>
            {editor.form.kind !== 'bus' && (
              <>
                <Field label="Battery (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editor.form.batteryPercent}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        form: { ...editor.form, batteryPercent: Number(event.target.value) },
                      })
                    }
                  />
                </Field>
                <Field label="Range (km)">
                  <Input
                    type="number"
                    min="1"
                    value={editor.form.rangeKm}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        form: { ...editor.form, rangeKm: Number(event.target.value) },
                      })
                    }
                  />
                </Field>
                <Field label="Base / pickup stop">
                  <Select
                    value={editor.form.locationStopId}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        form: { ...editor.form, locationStopId: event.target.value },
                      })
                    }
                  >
                    {db.stops.map((stop) => (
                      <option key={stop.id} value={stop.id}>
                        {stop.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Fare per km (₹, estimate)">
                  <Input
                    type="number"
                    min="1"
                    value={editor.form.farePerKm}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        form: { ...editor.form, farePerKm: Number(event.target.value) },
                      })
                    }
                  />
                </Field>
              </>
            )}
          </form>
        )}
      </Modal>
    </PortalPage>
  )
}
