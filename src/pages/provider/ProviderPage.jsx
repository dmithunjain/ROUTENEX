import { useState } from 'react'
import {
  Bus,
  Check,
  Clock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Power,
  ShieldAlert,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'

import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import PortalPage from '@/components/ui/PortalPage'
import StatCard from '@/components/ui/StatCard'
import StatusPill from '@/components/ui/StatusPill'
import { useAppData } from '@/context/AppDataContext'
import { useCurrentProvider } from '@/hooks/useCurrentUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getProviderStats } from '@/services/analyticsService'
import {
  formatClock,
  getRemainingEvSeats,
  getStop,
  getStudent,
  toMinutes,
} from '@/services/transportService'

const KIND_LABEL = {
  bus: 'Bus',
  'ev-auto': 'EV auto',
  'ev-two-wheeler': 'EV two-wheeler',
}

const emptyVehicle = {
  kind: 'ev-auto',
  registration: '',
  model: '',
  capacity: 4,
  available: true,
  batteryPercent: 80,
  rangeKm: 50,
  farePerKm: 10,
  locationStopId: 's4',
}

export default function ProviderPage() {
  const {
    db,
    updateProvider,
    selectProvider,
    addProvider,
    addVehicle,
    updateVehicle,
    updateRideRequest,
    updatePoolingGroup,
  } = useAppData()
  const provider = useCurrentProvider()
  useDocumentTitle('Provider workspace')

  const [notice, setNotice] = useState('')
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const [editingVehicleId, setEditingVehicleId] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState(null)
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinForm, setJoinForm] = useState({
    name: '',
    contact: '',
    phone: '',
    serviceAreas: ['v3'],
  })

  if (!provider) {
    return (
      <PortalPage>
        <EmptyState title="No provider profile" description="Add a transport provider in the admin portal first." />
      </PortalPage>
    )
  }

  const vehicles = db.vehicles.filter((vehicle) => vehicle.providerId === provider.id)
  const requests = db.rideRequests
    .filter((request) => request.providerId === provider.id)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  const pending = requests.filter((request) => request.status === 'pending')
  const history = requests.filter((request) => request.status !== 'pending')
  const stats = getProviderStats(db, provider.id)

  const openNewVehicle = () => {
    const defaultStop = db.stops.find((stop) => stop.villageId === provider.serviceAreas?.[0])?.id ?? 's4'
    setEditingVehicleId(null)
    setVehicleForm({ ...emptyVehicle, locationStopId: defaultStop })
    setVehicleOpen(true)
  }

  const openEditVehicle = (vehicle) => {
    setEditingVehicleId(vehicle.id)
    setVehicleForm({
      kind: vehicle.kind,
      registration: vehicle.registration,
      model: vehicle.model,
      capacity: vehicle.capacity,
      available: vehicle.available !== false,
      batteryPercent: vehicle.batteryPercent ?? 80,
      rangeKm: vehicle.rangeKm ?? 50,
      farePerKm: vehicle.farePerKm ?? 10,
      locationStopId: vehicle.locationStopId ?? 's4',
    })
    setVehicleOpen(true)
  }

  const saveVehicle = (event) => {
    event.preventDefault()
    const kind = vehicleForm.kind
    const maxCapacity = kind === 'bus' ? 60 : kind === 'ev-two-wheeler' ? 1 : 6
    if (!vehicleForm.registration.trim() || !vehicleForm.model.trim()) return
    const duplicate = db.vehicles.some(
      (vehicle) =>
        vehicle.id !== editingVehicleId &&
        vehicle.registration.trim().toLowerCase() === vehicleForm.registration.trim().toLowerCase(),
    )
    if (duplicate) {
      setNotice('A vehicle with that registration already exists in the shared data.')
      return
    }
    const payload = {
      kind,
      registration: vehicleForm.registration.trim(),
      model: vehicleForm.model.trim(),
      capacity: Math.min(maxCapacity, Math.max(1, Number(vehicleForm.capacity) || 1)),
      available: Boolean(vehicleForm.available),
      providerId: provider.id,
      ...(kind === 'bus'
        ? {}
        : {
            batteryPercent: Math.min(100, Math.max(0, Number(vehicleForm.batteryPercent) || 0)),
            rangeKm: Math.max(1, Number(vehicleForm.rangeKm) || 1),
            farePerKm: Math.max(1, Number(vehicleForm.farePerKm) || 1),
            locationStopId: vehicleForm.locationStopId,
          }),
    }
    if (editingVehicleId) updateVehicle(editingVehicleId, payload)
    else addVehicle(payload)
    setVehicleOpen(false)
    setNotice(editingVehicleId ? 'Vehicle updated. Student results use this immediately.' : 'Vehicle registered under this provider.')
  }

  const acceptRequest = (request) => {
    if (!provider.verified) {
      setNotice('This provider is not verified yet. Ask an administrator to verify it before accepting rides.')
      return
    }
    if (!provider.available) {
      setNotice('Set the provider availability to available before accepting requests.')
      return
    }
    const vehicle = db.vehicles.find((item) => item.id === request.vehicleId)
    if (!vehicle || vehicle.available === false) {
      setNotice('That vehicle is currently unavailable. Mark it available or reject the request.')
      return
    }
    const remaining = getRemainingEvSeats(db, vehicle, request.date)
    if (Number(request.seats) > remaining) {
      setNotice(`Capacity check failed: ${remaining} legal seat(s) remain on this vehicle for ${request.date}.`)
      return
    }
    updateRideRequest(request.id, { status: 'accepted', decidedAt: new Date().toISOString(), reason: '' })
    if (request.poolingGroupId) {
      updatePoolingGroup(request.poolingGroupId, { status: 'confirmed' })
    }
    setNotice('Ride accepted. The student now sees confirmed pickup details and your contact number.')
  }

  const rejectRequest = (request) => {
    updateRideRequest(request.id, {
      status: 'rejected',
      decidedAt: new Date().toISOString(),
      reason: 'Declined by provider',
    })
    if (request.poolingGroupId) {
      updatePoolingGroup(request.poolingGroupId, {
        status: 'proposed',
        vehicleRequestId: null,
      })
    }
    setNotice('Request rejected. The student can choose another provider.')
  }

  const completeRequest = (request) => {
    updateRideRequest(request.id, { status: 'completed' })
    setNotice('Ride marked completed in the shared ride history.')
  }

  const toggleVehicle = (vehicle) => {
    updateVehicle(vehicle.id, { available: vehicle.available === false })
  }

  const saveProfile = (event) => {
    event.preventDefault()
    if (!profileForm.name.trim()) return
    updateProvider(provider.id, {
      name: profileForm.name,
      contact: profileForm.contact,
      phone: profileForm.phone,
      serviceAreas: profileForm.serviceAreas,
    })
    setProfileOpen(false)
    setNotice('Provider profile updated. Service areas control which pickups can match your vehicles.')
  }

  const joinNetwork = (event) => {
    event.preventDefault()
    if (!joinForm.name.trim() || !joinForm.serviceAreas.length) return
    const record = addProvider({
      name: joinForm.name.trim(),
      type: 'ev',
      contact: joinForm.contact,
      phone: joinForm.phone,
      verified: false,
      available: true,
      serviceAreas: joinForm.serviceAreas,
    })
    selectProvider(record.id)
    setJoinOpen(false)
    setJoinForm({ name: '', contact: '', phone: '', serviceAreas: ['v3'] })
    setNotice('Provider registered. It stays hidden from student EV search until an administrator verifies it.')
  }

  return (
    <PortalPage>
      <PageHeader
        title="Transport provider workspace"
        description="Manage your registered vehicles, availability and incoming EV ride requests. Only verified, available vehicles appear to students."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label="Demo provider profile"
              value={provider.id}
              onChange={(event) => selectProvider(event.target.value)}
              className="w-52"
            >
              {db.providers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.type === 'ev' ? '· EV' : '· Bus'}
                </option>
              ))}
            </Select>
            <Button size="sm" variant="secondary" onClick={() => setJoinOpen(true)}>
              <Plus className="size-3.5" aria-hidden="true" /> Register provider
            </Button>
          </div>
        }
      />

      {!provider.verified && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-semibold">Awaiting admin verification.</strong> Your vehicles and requests are visible here,
            but students cannot find this provider in EV search until an administrator verifies it.
          </p>
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-xs font-medium text-pine-900">{notice}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vehicles" value={vehicles.length} icon={Bus} />
        <StatCard label="Available" value={vehicles.filter((vehicle) => vehicle.available).length} icon={Zap} tone="bg-amber-100 text-amber-800" />
        <StatCard label="Pending requests" value={pending.length} icon={Clock} tone="bg-amber-100 text-amber-800" />
        <StatCard label="Rides accepted" value={stats.accepted} icon={Check} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-semibold text-slate-900">{provider.name}</h2>
                <Badge tone={provider.verified ? 'pine' : 'amber'}>
                  {provider.verified ? (
                    <>
                      <ShieldCheck className="size-3" aria-hidden="true" /> Verified
                    </>
                  ) : (
                    'Unverified'
                  )}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {provider.type === 'ev' ? 'Community EV provider' : 'Bus operator'} · {provider.contact || 'No contact person'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateProvider(provider.id, { available: !provider.available })}
              aria-label={provider.available ? 'Set provider unavailable' : 'Set provider available'}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                provider.available
                  ? 'bg-pine-100 text-pine-800 hover:bg-pine-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Power className="size-3.5" aria-hidden="true" />
              {provider.available ? 'Accepting rides' : 'Offline'}
            </button>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="size-3.5 text-pine-700" aria-hidden="true" />
              {provider.phone || 'No phone'}
            </div>
            <div>
              <dt className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">Service areas</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {(provider.serviceAreas ?? []).map((villageId) => (
                  <span key={villageId} className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {db.villages.find((village) => village.id === villageId)?.name ?? villageId}
                  </span>
                ))}
                {!provider.serviceAreas?.length && <span className="text-xs text-slate-400">Not configured</span>}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setProfileForm({
                  name: provider.name,
                  contact: provider.contact,
                  phone: provider.phone,
                  serviceAreas: provider.serviceAreas ?? [],
                })
                setProfileOpen(true)
              }}
            >
              <Pencil className="size-3.5" aria-hidden="true" /> Edit profile
            </Button>
            <Button size="sm" onClick={openNewVehicle}>
              <Plus className="size-3.5" aria-hidden="true" /> Add vehicle
            </Button>
          </div>

          <p className="mt-4 rounded-xl bg-sand-100/70 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            Student search checks: provider verified, provider available, vehicle available, service-area coverage, vehicle range
            and remaining legal seats. Toggling availability updates results immediately.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-slate-900">Registered vehicles</h2>
            <span className="text-[11px] text-slate-500">{vehicles.length} vehicle(s)</span>
          </div>

          {vehicles.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="No vehicles yet"
              description="Register an EV auto or EV two-wheeler with its legal passenger capacity to start receiving ride requests."
              action={
                <Button size="sm" className="mt-4" onClick={openNewVehicle}>
                  Register vehicle
                </Button>
              }
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {KIND_LABEL[vehicle.kind] ?? vehicle.kind} · {vehicle.registration}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {vehicle.model} · {vehicle.capacity} legal seat{vehicle.capacity > 1 ? 's' : ''}
                        {vehicle.kind !== 'bus' && ` · ${vehicle.batteryPercent}% battery · ${vehicle.rangeKm} km range`}
                      </p>
                      {vehicle.kind !== 'bus' && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="size-3" aria-hidden="true" />
                          {getStop(db, vehicle.locationStopId)?.name ?? 'Pickup not set'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={vehicle.available ? 'available' : 'inactive'} />
                      <button
                        type="button"
                        onClick={() => toggleVehicle(vehicle)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {vehicle.available ? 'Set offline' : 'Set available'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditVehicle(vehicle)}
                        aria-label={`Edit ${vehicle.registration}`}
                        className="grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-slate-900">Incoming ride requests</h2>
          <Badge tone="amber">Only accepted rides are confirmed</Badge>
        </div>

        {pending.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No pending requests"
            description="New direct or pooled EV requests for your provider will appear here. Keep your availability and legal capacity up to date."
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((request) => {
              const vehicle = db.vehicles.find((item) => item.id === request.vehicleId)
              const student = getStudent(db, request.studentId)
              const remaining = vehicle ? getRemainingEvSeats(db, vehicle, request.date) : 0
              return (
                <li key={request.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {student?.name ?? 'Student'} · {request.seats} seat{request.seats > 1 ? 's' : ''}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {getStop(db, request.originStopId)?.name} → {getStop(db, request.destinationStopId)?.name} ·{' '}
                        {formatClock(toMinutes(request.pickupTime))} · {request.date}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {vehicle ? `${KIND_LABEL[vehicle.kind]} ${vehicle.registration} · ${vehicle.capacity} legal seats · ${remaining} remaining` : 'Vehicle removed'} · ₹{request.fareEstimate} estimate
                      </p>
                      {request.poolingGroupId && <Badge tone="blue" className="mt-1.5">Shared pooling request</Badge>}
                      {request.note && <p className="mt-1 text-[11px] text-slate-500">Note: {request.note}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptRequest(request)}>
                        <Check className="size-3.5" aria-hidden="true" /> Accept
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => rejectRequest(request)}>
                        <X className="size-3.5" aria-hidden="true" /> Reject
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-slate-900">Ride history</h2>
          <span className="text-[11px] text-slate-500">Shared with the student dashboard</span>
        </div>
        {history.length === 0 ? (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">No decided requests yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Student</th>
                  <th className="py-2">Journey</th>
                  <th className="py-2">Pickup</th>
                  <th className="py-2">Vehicle</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((request) => {
                  const vehicle = db.vehicles.find((item) => item.id === request.vehicleId)
                  const student = getStudent(db, request.studentId)
                  return (
                    <tr key={request.id}>
                      <td className="py-2.5 text-xs text-slate-800">{student?.name ?? 'Student'}</td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {getStop(db, request.originStopId)?.name} → {getStop(db, request.destinationStopId)?.name}
                        <p className="text-[10px] text-slate-400">{request.date} · {request.pickupTime}</p>
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">{request.seats} seat{request.seats > 1 ? 's' : ''}</td>
                      <td className="py-2.5 text-xs text-slate-600">{vehicle?.registration ?? 'Removed'} · ₹{request.fareEstimate}</td>
                      <td className="py-2.5">
                        <StatusPill status={request.status} />
                        {request.reason && <p className="text-[10px] text-slate-400">{request.reason}</p>}
                      </td>
                      <td className="py-2.5 text-right">
                        {request.status === 'accepted' ? (
                          <Button size="sm" variant="secondary" onClick={() => completeRequest(request)}>
                            Mark complete
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
        )}
      </section>

      <Modal
        open={vehicleOpen}
        onClose={() => setVehicleOpen(false)}
        title={editingVehicleId ? 'Update vehicle' : 'Register a community vehicle'}
        description="Registration details and legal capacity are used across EV matching and planning."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setVehicleOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit" form="vehicle-form">Save vehicle</Button>
          </>
        }
      >
        <form id="vehicle-form" onSubmit={saveVehicle} className="grid gap-3 sm:grid-cols-2">
          <Field label="Vehicle kind">
            <Select
              value={vehicleForm.kind}
              onChange={(event) => {
                const kind = event.target.value
                setVehicleForm({
                  ...vehicleForm,
                  kind,
                  capacity: kind === 'ev-two-wheeler' ? 1 : vehicleForm.capacity,
                })
              }}
            >
              <option value="ev-auto">EV auto</option>
              <option value="ev-two-wheeler">EV two-wheeler</option>
              <option value="bus">Bus</option>
            </Select>
          </Field>
          <Field label="Registration number">
            <Input value={vehicleForm.registration} onChange={(event) => setVehicleForm({ ...vehicleForm, registration: event.target.value })} placeholder="TN-21-EV-0000" required />
          </Field>
          <Field label="Model">
            <Input value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="Mahindra Treo" required />
          </Field>
          <Field label="Legal passenger capacity" hint={vehicleForm.kind === 'ev-two-wheeler' ? 'Two-wheelers are limited to the rider plus one pillion — 1 student seat.' : 'Use the capacity on the registration certificate.'}>
            <Input
              type="number"
              min="1"
              max={vehicleForm.kind === 'bus' ? 60 : vehicleForm.kind === 'ev-two-wheeler' ? 1 : 6}
              value={vehicleForm.capacity}
              disabled={vehicleForm.kind === 'ev-two-wheeler'}
              onChange={(event) => setVehicleForm({ ...vehicleForm, capacity: Number(event.target.value) })}
            />
          </Field>
          {vehicleForm.kind !== 'bus' && (
            <>
              <Field label="Battery (%)">
                <Input type="number" min="0" max="100" value={vehicleForm.batteryPercent} onChange={(event) => setVehicleForm({ ...vehicleForm, batteryPercent: Number(event.target.value) })} />
              </Field>
              <Field label="Range (km)">
                <Input type="number" min="1" value={vehicleForm.rangeKm} onChange={(event) => setVehicleForm({ ...vehicleForm, rangeKm: Number(event.target.value) })} />
              </Field>
              <Field label="Pickup / base stop">
                <Select value={vehicleForm.locationStopId} onChange={(event) => setVehicleForm({ ...vehicleForm, locationStopId: event.target.value })}>
                  {db.stops.map((stop) => (
                    <option key={stop.id} value={stop.id}>{stop.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Fare per km (₹, estimate)">
                <Input type="number" min="1" value={vehicleForm.farePerKm} onChange={(event) => setVehicleForm({ ...vehicleForm, farePerKm: Number(event.target.value) })} />
              </Field>
            </>
          )}
          <Field label="Availability" className="sm:col-span-2">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={vehicleForm.available}
                onChange={(event) => setVehicleForm({ ...vehicleForm, available: event.target.checked })}
                className="size-4 rounded border-slate-300 text-pine-600"
              />
              Vehicle is available for student matching
            </label>
          </Field>
        </form>
      </Modal>

      <Modal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Provider profile"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit" form="provider-form">Save profile</Button>
          </>
        }
      >
        {profileForm && (
          <form id="provider-form" onSubmit={saveProfile} className="grid gap-3">
            <Field label="Provider name">
              <Input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact person">
                <Input value={profileForm.contact} onChange={(event) => setProfileForm({ ...profileForm, contact: event.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
              </Field>
            </div>
            <Field label="Service areas" hint="Vehicles only match pickups in these villages.">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 p-3">
                {db.villages.map((village) => (
                  <label key={village.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={profileForm.serviceAreas.includes(village.id)}
                      onChange={(event) =>
                        setProfileForm({
                          ...profileForm,
                          serviceAreas: event.target.checked
                            ? [...profileForm.serviceAreas, village.id]
                            : profileForm.serviceAreas.filter((id) => id !== village.id),
                        })
                      }
                      className="size-3.5 rounded border-slate-300 text-pine-600"
                    />
                    {village.name}
                  </label>
                ))}
              </div>
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Register a community EV provider"
        description="New providers start unverified and stay hidden from student search until an admin verifies them."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit" form="join-form">Register provider</Button>
          </>
        }
      >
        <form id="join-form" onSubmit={joinNetwork} className="grid gap-3">
          <Field label="Provider / community name">
            <Input value={joinForm.name} onChange={(event) => setJoinForm({ ...joinForm, name: event.target.value })} placeholder="Village EV Collective" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Contact person">
              <Input value={joinForm.contact} onChange={(event) => setJoinForm({ ...joinForm, contact: event.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={joinForm.phone} onChange={(event) => setJoinForm({ ...joinForm, phone: event.target.value })} />
            </Field>
          </div>
          <Field label="Service areas">
            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 p-3">
              {db.villages.map((village) => (
                <label key={village.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={joinForm.serviceAreas.includes(village.id)}
                    onChange={(event) =>
                      setJoinForm({
                        ...joinForm,
                        serviceAreas: event.target.checked
                          ? [...joinForm.serviceAreas, village.id]
                          : joinForm.serviceAreas.filter((id) => id !== village.id),
                      })
                    }
                    className="size-3.5 rounded border-slate-300 text-pine-600"
                  />
                  {village.name}
                </label>
              ))}
            </div>
          </Field>
        </form>
      </Modal>
    </PortalPage>
  )
}
