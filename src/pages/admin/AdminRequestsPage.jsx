import { useState } from 'react'
import {
  CalendarDays,
  Check,
  Clock,
  MapPin,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'

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
  formatClock,
  getProvider,
  getRemainingEvSeats,
  getStop,
  getStudent,
  getVehicle,
  toMinutes,
} from '@/services/transportService'

const RIDE_FILTERS = ['all', 'pending', 'accepted', 'rejected', 'completed', 'cancelled']

export default function AdminRequestsPage() {
  const { db, updateRideRequest, updateTravelRequest, updatePoolingGroup } = useAppData()
  useDocumentTitle('Admin · ride requests')

  const [tab, setTab] = useState('rides')
  const [rideFilter, setRideFilter] = useState('all')
  const [notice, setNotice] = useState('')

  const rides = [...db.rideRequests]
    .filter((request) => rideFilter === 'all' || request.status === rideFilter)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  const travelRequests = [...db.travelRequests].sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  )

  const decideRide = (request, status) => {
    if (status === 'accepted') {
      const vehicle = getVehicle(db, request.vehicleId)
      if (!vehicle) {
        setNotice('Cannot accept: the requested vehicle no longer exists.')
        return
      }
      const provider = getProvider(db, request.providerId)
      if (!provider?.verified || !provider?.available) {
        setNotice(
          'Cannot accept: the provider must be verified and available. Update the provider first.',
        )
        return
      }
      if (vehicle.available === false) {
        setNotice('Cannot accept: the vehicle is marked unavailable.')
        return
      }
      const remaining = getRemainingEvSeats(db, vehicle, request.date)
      if (Number(request.seats) > remaining) {
        setNotice(
          `Capacity rule: only ${remaining} legal seat(s) remain on ${vehicle.registration} for ${request.date}.`,
        )
        return
      }
    }

    updateRideRequest(request.id, {
      status,
      decidedAt: new Date().toISOString(),
      reason: status === 'rejected' ? 'Rejected by administrator' : '',
    })

    if (request.poolingGroupId) {
      if (status === 'accepted') {
        updatePoolingGroup(request.poolingGroupId, { status: 'confirmed' })
      } else if (status === 'rejected' || status === 'cancelled') {
        updatePoolingGroup(request.poolingGroupId, {
          status: 'proposed',
          vehicleRequestId: null,
        })
      }
    }

    setNotice(
      status === 'accepted'
        ? 'Ride accepted. The student sees confirmed details and the pooling group is confirmed.'
        : status === 'rejected'
          ? 'Ride rejected. The linked pooling group returns to proposed so another vehicle can be requested.'
          : 'Ride status updated in the shared data store.',
    )
  }

  const setTravelStatus = (request, status) => {
    updateTravelRequest(request.id, { status })
    setNotice('Travel request status updated. Pooling matching uses open requests only.')
  }

  return (
    <PortalPage>
      <PageHeader
        title="Ride & travel requests"
        description="Review EV ride requests and student pooling requests. Accepting or rejecting a ride updates the student dashboard and any linked pooling group immediately."
        tabs={adminTabs(ROUTES.adminRequests)}
        actions={<Badge tone="neutral">Shared live view</Badge>}
      />

      {notice && (
        <div className="rounded-xl border border-pine-200 bg-pine-50 px-4 py-3 text-xs font-medium text-pine-900">
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending EV rides"
          value={db.rideRequests.filter((request) => request.status === 'pending').length}
          hint="Awaiting provider or admin action"
          icon={Clock}
          tone="bg-amber-100 text-amber-800"
        />
        <StatCard
          label="Accepted rides"
          value={db.rideRequests.filter((request) => request.status === 'accepted').length}
          hint="Seats deducted per day"
          icon={Check}
        />
        <StatCard
          label="Open travel requests"
          value={db.travelRequests.filter((request) => request.status === 'open').length}
          hint="Eligible for pooling"
          icon={Users}
          tone="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Pooling groups"
          value={db.poolingGroups.length}
          hint={`${db.poolingGroups.filter((group) => group.status === 'vehicle_requested').length} awaiting vehicle`}
          icon={CalendarDays}
          tone="bg-amber-100 text-amber-800"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'rides', label: `EV ride requests (${db.rideRequests.length})` },
          { id: 'travel', label: `Travel / pooling (${db.travelRequests.length})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === item.id
                ? 'bg-pine-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sand-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'rides' && (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {RIDE_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setRideFilter(status)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize transition ${
                  rideFilter === status
                    ? 'bg-pine-100 text-pine-900'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {rides.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No ride requests in this view"
              description="Change the status filter. New EV requests arrive from the student EV network and the journey planner."
            />
          ) : (
            <div className="grid gap-3">
              {rides.map((request) => {
                const vehicle = getVehicle(db, request.vehicleId)
                const provider = getProvider(db, request.providerId)
                const student = getStudent(db, request.studentId)
                const remaining = vehicle ? getRemainingEvSeats(db, vehicle, request.date) : 0
                const group = db.poolingGroups.find((item) => item.id === request.poolingGroupId)
                return (
                  <article
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {student?.name ?? 'Student'} · {request.seats} seat
                            {request.seats > 1 ? 's' : ''}
                          </p>
                          <StatusPill status={request.status} />
                          {request.poolingGroupId && (
                            <Badge tone="neutral">Pooling group</Badge>
                          )}
                        </div>
                        <p className="mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden="true" />
                            {getStop(db, request.originStopId)?.name} →{' '}
                            {getStop(db, request.destinationStopId)?.name}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" aria-hidden="true" />
                            {formatClock(toMinutes(request.pickupTime))} · {request.date}
                          </span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {provider?.name ?? 'Provider removed'} ({provider?.verified ? 'verified' : 'unverified'}
                          {provider?.available ? '' : ', unavailable'}) · {vehicle?.registration ?? 'vehicle removed'}{' '}
                          · {remaining} of {vehicle?.capacity ?? 0} legal seats free
                        </p>
                        {group && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Linked pooling group · {group.seats} seat(s) · {group.status} ·{' '}
                            {getStop(db, group.originStopId)?.name} →{' '}
                            {getStop(db, group.destinationStopId)?.name}
                          </p>
                        )}
                        {request.reason && (
                          <p className="mt-1 text-[11px] text-amber-700">{request.reason}</p>
                        )}
                        <p className="mt-1 text-[10px] text-slate-400">
                          ₹{request.fareEstimate} sample fare estimate
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => decideRide(request, 'accepted')}>
                              <Check className="size-3.5" aria-hidden="true" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => decideRide(request, 'rejected')}
                            >
                              <X className="size-3.5" aria-hidden="true" /> Reject
                            </Button>
                          </>
                        )}
                        {request.status === 'accepted' && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => decideRide(request, 'completed')}
                            >
                              <Check className="size-3.5" aria-hidden="true" /> Mark completed
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => decideRide(request, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {['rejected', 'cancelled', 'completed'].includes(request.status) && (
                          <span className="text-[11px] text-slate-400">
                            Final state — visible in ride history
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'travel' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Student travel requests
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Pooled and cancelled requests stop appearing in new matches.
              </p>
            </div>
            <Badge tone="neutral">45 min · 2.5 km rule</Badge>
          </div>

          {travelRequests.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={Users}
              title="No travel requests"
              description="Students create these from Smart Pooling."
            />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="text-left text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="py-2">Student</th>
                    <th className="py-2">Journey</th>
                    <th className="py-2">Window</th>
                    <th className="py-2">Seats</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {travelRequests.map((request) => (
                    <tr key={request.id} className="align-top">
                      <td className="py-2.5 text-xs text-slate-800">
                        {getStudent(db, request.studentId)?.name ?? 'Student'}
                        <p className="text-[10px] text-slate-400">
                          {getStudent(db, request.studentId)?.college?.split(',')[0]}
                        </p>
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {getStop(db, request.originStopId)?.name} →{' '}
                        {getStop(db, request.destinationStopId)?.name}
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">
                        {request.date}
                        <p className="text-[10px] text-slate-400">after {request.departAfter}</p>
                      </td>
                      <td className="py-2.5 text-xs text-slate-600">{request.seats}</td>
                      <td className="py-2.5">
                        <StatusPill status={request.status} />
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1.5">
                          {request.status !== 'open' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setTravelStatus(request, 'open')}
                            >
                              Reopen
                            </Button>
                          )}
                          {request.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setTravelStatus(request, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-sand-100/60 px-4 py-3 text-[11px] text-slate-600">
        <ShieldCheck className="size-4 text-pine-700" aria-hidden="true" />
        Accepting a ride requires a verified, available provider, an available vehicle and enough
        remaining legal seats. Admin decisions write to the same records the student and provider
        portals read.
      </div>
    </PortalPage>
  )
}
