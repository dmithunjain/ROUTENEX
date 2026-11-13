import { format, parseISO } from 'date-fns'

export const WALK_SPEED_KMH = 4.5
export const BUS_SPEED_KMH = 30
export const EV_SPEED_KMH = 26
export const EV_PICKUP_RADIUS_KM = 3
export const WALK_ACCESS_KM = 2.5

export function round1(value) {
  return Math.round(value * 10) / 10
}

export function haversineKm(a, b) {
  if (!a || !b) return 0
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export function toMinutes(time) {
  if (typeof time !== 'string') return 0
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

export function formatClock(totalMinutes) {
  const dayMinutes = ((Math.round(totalMinutes) % 1440) + 1440) % 1440
  const hours = Math.floor(dayMinutes / 60)
  const minutes = dayMinutes % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function dayOfDate(dateISO) {
  try {
    return format(parseISO(dateISO), 'EEE')
  } catch {
    return 'Mon'
  }
}

export function getStop(db, id) {
  return db.stops.find((stop) => stop.id === id)
}

export function getVillage(db, id) {
  return db.villages.find((village) => village.id === id)
}

export function getProvider(db, id) {
  return db.providers.find((provider) => provider.id === id)
}

export function getVehicle(db, id) {
  return db.vehicles.find((vehicle) => vehicle.id === id)
}

export function getStudent(db, id) {
  return db.students.find((student) => student.id === id)
}

export function getRoute(db, id) {
  return db.routes.find((route) => route.id === id)
}

export function isScheduleOnDate(schedule, dateISO) {
  return Array.isArray(schedule.days) && schedule.days.includes(dayOfDate(dateISO))
}

export function getRouteStats(db, route) {
  const routeStops = route.stops.map((stopId) => getStop(db, stopId)).filter(Boolean)
  const legs = []
  let totalKm = 0
  let previousEnd = 0
  for (let index = 0; index < routeStops.length - 1; index += 1) {
    const distance = haversineKm(routeStops[index], routeStops[index + 1])
    const minutes = Math.max(3, Math.round((distance / BUS_SPEED_KMH) * 60)) + 2
    legs.push({
      fromStopId: routeStops[index].id,
      toStopId: routeStops[index + 1].id,
      distanceKm: distance,
      minutes,
      startOffset: previousEnd,
      endOffset: previousEnd + minutes,
    })
    totalKm += distance
    previousEnd += minutes
  }
  return { stops: routeStops, legs, totalKm, totalMinutes: previousEnd }
}

export function getBookedEvSeats(db, vehicleId, dateISO) {
  return db.rideRequests
    .filter(
      (request) =>
        request.vehicleId === vehicleId &&
        request.date === dateISO &&
        request.status === 'accepted',
    )
    .reduce((total, request) => total + Number(request.seats || 0), 0)
}

export function getRemainingEvSeats(db, vehicle, dateISO) {
  return Math.max(0, Number(vehicle.capacity || 0) - getBookedEvSeats(db, vehicle.id, dateISO))
}

export function getActiveCancellations(db, dateISO) {
  return db.schedules
    .filter((schedule) => schedule.status === 'cancelled' && isScheduleOnDate(schedule, dateISO))
    .map((schedule) => ({
      ...schedule,
      route: getRoute(db, schedule.routeId),
      bus: getVehicle(db, schedule.busId),
    }))
}

const BUS_COLOR = '#157456'

function makeWalkSegment(db, fromStop, toStop, startMin) {
  const distanceKm = haversineKm(fromStop, toStop)
  const minutes = Math.max(1, Math.round((distanceKm / WALK_SPEED_KMH) * 60))
  return {
    mode: 'walk',
    fromStopId: fromStop.id,
    toStopId: toStop.id,
    fromName: fromStop.name,
    toName: toStop.name,
    departMin: startMin,
    arriveMin: startMin + minutes,
    durationMin: minutes,
    distanceKm: round1(distanceKm),
    detail: `${round1(distanceKm)} km walk`,
    fare: 0,
  }
}

function makeEvSegments(db, vehicle, provider, pickupStop, originStop, destinationStop, startMin, seats) {
  const segments = []
  let clock = startMin
  const walkKm = haversineKm(originStop, pickupStop)
  if (walkKm > 0.15) {
    segments.push(makeWalkSegment(db, originStop, pickupStop, clock))
    clock += segments[segments.length - 1].durationMin
  }
  const pickupWait = 8
  const tripKm = haversineKm(pickupStop, destinationStop)
  const tripMinutes = Math.max(4, Math.round((tripKm / EV_SPEED_KMH) * 60))
  const estimatedFare = Math.max(
    vehicle.kind === 'ev-two-wheeler' ? 20 : 25,
    Math.round(tripKm * Number(vehicle.farePerKm || 10)),
  )
  segments.push({
    mode: vehicle.kind,
    fromStopId: pickupStop.id,
    toStopId: destinationStop.id,
    fromName: pickupStop.name,
    toName: destinationStop.name,
    departMin: clock + pickupWait,
    arriveMin: clock + pickupWait + tripMinutes,
    durationMin: tripMinutes,
    distanceKm: round1(tripKm),
    detail: `${provider.name} · ${vehicle.model}`,
    subdetail: `${vehicle.registration} · ${seats} seat${seats > 1 ? 's' : ''}`,
    fare: estimatedFare,
    seats,
    providerId: provider.id,
    providerName: provider.name,
    providerPhone: provider.phone,
    vehicleId: vehicle.id,
    vehicleLabel: `${vehicle.model} (${vehicle.registration})`,
    pickupWait,
    color: BUS_COLOR,
  })
  return segments
}

export function findEvOptions(
  db,
  { originStopId, destinationStopId, afterMinutes, seats = 1, kind },
) {
  const origin = getStop(db, originStopId)
  const destination = getStop(db, destinationStopId)
  if (!origin || !destination || origin.id === destination.id) return []

  const options = []
  for (const vehicle of db.vehicles) {
    if (!vehicle.kind?.startsWith('ev-')) continue
    if (kind && vehicle.kind !== kind) continue
    if (seats > Number(vehicle.capacity || 0)) continue
    if (vehicle.kind === 'ev-two-wheeler' && seats !== 1) continue

    const provider = getProvider(db, vehicle.providerId)
    if (!provider || provider.type !== 'ev' || !provider.verified || !provider.available) continue
    if (vehicle.available === false) continue

    const pickupStop = getStop(db, vehicle.locationStopId)
    if (!pickupStop) continue
    const pickupVillage = pickupStop.villageId
    const inServiceArea =
      !provider.serviceAreas?.length || provider.serviceAreas.includes(pickupVillage)
    if (!inServiceArea) continue

    const distanceToPickup = haversineKm(origin, pickupStop)
    if (distanceToPickup > EV_PICKUP_RADIUS_KM) continue

    const tripKm = haversineKm(pickupStop, destination)
    if (tripKm > Number(vehicle.rangeKm || 0)) continue

    const remainingSeats = getRemainingEvSeats(db, vehicle, db.__date ?? todayISO())
    if (remainingSeats < seats) continue

    const segments = makeEvSegments(
      db,
      vehicle,
      provider,
      pickupStop,
      origin,
      destination,
      afterMinutes,
      seats,
    )
    options.push({
      kind: 'ev',
      vehicle,
      provider,
      pickupStop,
      distanceToPickupKm: round1(distanceToPickup),
      tripKm: round1(tripKm),
      remainingSeats,
      segments,
    })
  }

  return options.sort((a, b) => a.distanceToPickupKm - b.distanceToPickupKm)
}

function findBusLegs(db, originStopId, destinationStopId, dateISO, afterMinutes, seats) {
  const legs = []
  for (const schedule of db.schedules) {
    if (schedule.status !== 'running') continue
    if (!isScheduleOnDate(schedule, dateISO)) continue
    if (Number(schedule.availableSeats || 0) < seats) continue

    const route = getRoute(db, schedule.routeId)
    if (!route) continue
    const stats = getRouteStats(db, route)
    const originIndex = route.stops.indexOf(originStopId)
    const destinationIndex = route.stops.indexOf(destinationStopId)
    if (originIndex < 0 || destinationIndex < 0 || originIndex >= destinationIndex) continue

    const bus = getVehicle(db, schedule.busId)
    if (!bus || bus.available === false) continue

    const startMin = toMinutes(schedule.departureTime)
    const boardMin = startMin + (stats.legs[originIndex]?.startOffset ?? 0)
    const arriveMin =
      startMin + (destinationIndex === 0 ? 0 : (stats.legs[destinationIndex - 1]?.endOffset ?? 0))
    if (boardMin < afterMinutes - 5) continue

    const segmentKm =
      haversineKm(getStop(db, originStopId), getStop(db, destinationStopId)) || 1
    const fullKm = stats.totalKm || 1
    const fare = Math.max(5, Math.round((Number(schedule.fare || route.fare || 10) * segmentKm) / fullKm))

    legs.push({
      schedule,
      route,
      bus,
      provider: getProvider(db, route.providerId),
      boardMin,
      arriveMin,
      fromStop: getStop(db, originStopId),
      toStop: getStop(db, destinationStopId),
      fare,
      seatsLeft: Number(schedule.availableSeats || 0),
      segments: [
        {
          mode: 'bus',
          fromStopId: originStopId,
          toStopId: destinationStopId,
          fromName: getStop(db, originStopId).name,
          toName: getStop(db, destinationStopId).name,
          departMin: boardMin,
          arriveMin,
          durationMin: arriveMin - boardMin,
          detail: `${route.code} · ${route.name}`,
          subdetail: `${bus.registration} · ${schedule.departureTime} service`,
          fare,
          seatsLeft: Number(schedule.availableSeats || 0),
          routeId: route.id,
          scheduleId: schedule.id,
          providerName: getProvider(db, route.providerId)?.name,
          color: route.color,
        },
      ],
    })
  }
  return legs.sort((a, b) => a.boardMin - b.boardMin)
}

function makeOption(segments, afterMinutes, extra = {}) {
  const rideSegments = segments.filter((segment) => segment.mode !== 'walk')
  const modes = [...new Set(segments.map((segment) => segment.mode))]
  const departMin = segments[0]?.departMin ?? afterMinutes
  const arriveMin = segments[segments.length - 1]?.arriveMin ?? afterMinutes
  const fare = segments.reduce((total, segment) => total + Number(segment.fare || 0), 0)
  const transfers = Math.max(0, rideSegments.length - 1)
  const label = modes
    .map((mode) =>
      mode === 'walk'
        ? 'Walk'
        : mode === 'bus'
          ? 'Bus'
          : mode === 'ev-auto'
            ? 'EV auto'
            : 'EV two-wheeler',
    )
    .join(' → ')
  const signature = segments
    .map((segment) => `${segment.mode}:${segment.fromStopId}-${segment.toStopId}:${segment.departMin}`)
    .join('|')
  return {
    id: `${extra.kind ?? 'journey'}-${signature}`,
    kind: extra.kind ?? (modes.includes('bus') && modes.includes('ev-auto') ? 'multimodal' : modes[0]),
    label,
    modes,
    segments,
    departMin,
    arriveMin,
    waitMin: Math.max(0, departMin - afterMinutes),
    durationMin: Math.max(1, arriveMin - departMin),
    totalMinutes: Math.max(1, arriveMin - afterMinutes),
    fare,
    transfers,
    signature,
    seats: extra.seats ?? 1,
    sample: true,
    ...extra,
  }
}

export function planJourneys(
  db,
  { originStopId, destinationStopId, date, afterTime, seats = 1, preference = 'recommended' },
) {
  const dateISO = date || todayISO()
  const afterMinutes = toMinutes(afterTime || '08:00')
  const scopedDb = { ...db, __date: dateISO }
  const possibilities = []

  if (!originStopId || !destinationStopId || originStopId === destinationStopId) {
    return { options: [], afterMinutes, cancellations: getActiveCancellations(db, dateISO) }
  }

  const origin = getStop(db, originStopId)
  const destination = getStop(db, destinationStopId)

  // Walking-only journey
  const walkKm = haversineKm(origin, destination)
  if (walkKm <= 3) {
    const walk = makeWalkSegment(db, origin, destination, afterMinutes)
    possibilities.push(makeOption([walk], afterMinutes, { kind: 'walk' }))
  }

  // Direct bus journeys
  const directBus = findBusLegs(db, originStopId, destinationStopId, dateISO, afterMinutes, seats)
  directBus.forEach((leg) => {
    possibilities.push(makeOption(leg.segments, afterMinutes, { kind: 'bus', seats }))
  })

  // Direct EV journeys
  const directEv = findEvOptions(scopedDb, {
    originStopId,
    destinationStopId,
    afterMinutes,
    seats,
  })
  directEv.forEach((option) => {
    possibilities.push(makeOption(option.segments, afterMinutes, { kind: 'ev', seats }))
  })

  // Bus → EV (disembark at an intermediate stop, EV completes the trip)
  for (const schedule of db.schedules) {
    if (schedule.status !== 'running' || !isScheduleOnDate(schedule, dateISO)) continue
    if (Number(schedule.availableSeats || 0) < seats) continue
    const route = getRoute(db, schedule.routeId)
    if (!route) continue
    const stats = getRouteStats(db, route)
    const originIndex = route.stops.indexOf(originStopId)
    const destinationIndex = route.stops.indexOf(destinationStopId)
    if (originIndex < 0 || destinationIndex < 0 || originIndex >= destinationIndex) continue

    const bus = getVehicle(db, schedule.busId)
    if (!bus || bus.available === false) continue
    const startMin = toMinutes(schedule.departureTime)
    const boardMin = startMin + (stats.legs[originIndex]?.startOffset ?? 0)
    if (boardMin < afterMinutes - 5) continue

    for (let index = originIndex + 1; index < destinationIndex; index += 1) {
      const transferStop = stats.stops[index]
      const transferArrive =
        startMin + (stats.legs[index - 1]?.endOffset ?? stats.legs[index]?.startOffset ?? 0)
      const busSegment = {
        mode: 'bus',
        fromStopId: originStopId,
        toStopId: transferStop.id,
        fromName: origin.name,
        toName: transferStop.name,
        departMin: boardMin,
        arriveMin: transferArrive,
        durationMin: transferArrive - boardMin,
        detail: `${route.code} · ${route.name}`,
        subdetail: `${bus.registration} · ${schedule.departureTime} service`,
        fare: Math.max(
          5,
          Math.round(
            (Number(schedule.fare || route.fare || 10) *
              haversineKm(origin, transferStop)) /
              (stats.totalKm || 1),
          ),
        ),
        seatsLeft: Number(schedule.availableSeats || 0),
        routeId: route.id,
        scheduleId: schedule.id,
        providerName: getProvider(db, route.providerId)?.name,
        color: route.color,
      }
      const evOptions = findEvOptions(scopedDb, {
        originStopId: transferStop.id,
        destinationStopId,
        afterMinutes: transferArrive + 5,
        seats,
      }).slice(0, 2)
      for (const ev of evOptions) {
        const segments = [busSegment, ...ev.segments]
        if (segments[segments.length - 1].arriveMin <= transferArrive) continue
        possibilities.push(makeOption(segments, afterMinutes, { kind: 'multimodal', seats }))
      }
    }
  }

  // EV → Bus (EV reaches a stop served by a bus towards the destination)
  for (const schedule of db.schedules) {
    if (schedule.status !== 'running' || !isScheduleOnDate(schedule, dateISO)) continue
    if (Number(schedule.availableSeats || 0) < seats) continue
    const route = getRoute(db, schedule.routeId)
    if (!route) continue
    const stats = getRouteStats(db, route)
    const destinationIndex = route.stops.indexOf(destinationStopId)
    if (destinationIndex <= 0) continue
    const bus = getVehicle(db, schedule.busId)
    if (!bus || bus.available === false) continue
    const startMin = toMinutes(schedule.departureTime)

    for (let index = 1; index <= destinationIndex; index += 1) {
      const transferStop = stats.stops[index]
      if (transferStop.id === originStopId || transferStop.id === destinationStopId) continue
      const evOptions = findEvOptions(scopedDb, {
        originStopId,
        destinationStopId: transferStop.id,
        afterMinutes,
        seats,
      }).slice(0, 2)
      for (const ev of evOptions) {
        const evArrive = ev.segments[ev.segments.length - 1].arriveMin
        const busDepart = startMin + (stats.legs[index]?.startOffset ?? 0)
        if (busDepart < evArrive + 8) continue
        const busSegment = {
          mode: 'bus',
          fromStopId: transferStop.id,
          toStopId: destinationStopId,
          fromName: transferStop.name,
          toName: destination.name,
          departMin: busDepart,
          arriveMin:
            startMin + (stats.legs[destinationIndex - 1]?.endOffset ?? 0),
          durationMin:
            (startMin + (stats.legs[destinationIndex - 1]?.endOffset ?? 0)) - busDepart,
          detail: `${route.code} · ${route.name}`,
          subdetail: `${bus.registration} · ${schedule.departureTime} service`,
          fare: Math.max(
            5,
            Math.round(
              (Number(schedule.fare || route.fare || 10) *
                haversineKm(transferStop, destination)) /
                (stats.totalKm || 1),
            ),
          ),
          seatsLeft: Number(schedule.availableSeats || 0),
          routeId: route.id,
          scheduleId: schedule.id,
          providerName: getProvider(db, route.providerId)?.name,
          color: route.color,
        }
        possibilities.push(
          makeOption([...ev.segments, busSegment], afterMinutes, {
            kind: 'multimodal',
            seats,
          }),
        )
      }
    }
  }

  // Bus → Bus with one transfer at a shared stop
  for (const first of directBus) {
    for (const schedule of db.schedules) {
      if (schedule.id === first.schedule.id) continue
      if (schedule.status !== 'running' || !isScheduleOnDate(schedule, dateISO)) continue
      if (Number(schedule.availableSeats || 0) < seats) continue
      const route = getRoute(db, schedule.routeId)
      if (!route) continue
      const stats = getRouteStats(db, route)
      const destinationIndex = route.stops.indexOf(destinationStopId)
      if (destinationIndex <= 0) continue
      for (let index = 1; index <= destinationIndex; index += 1) {
        const transferStop = stats.stops[index]
        if (!first.segments[0].toStopId) continue
        const firstRoute = getRoute(db, first.schedule.routeId)
        if (!firstRoute?.stops.includes(transferStop.id)) continue
        const firstStats = getRouteStats(db, firstRoute)
        const fromIndex = firstRoute.stops.indexOf(originStopId)
        const transferIndex = firstRoute.stops.indexOf(transferStop.id)
        const destIndex = firstRoute.stops.indexOf(destinationStopId)
        if (fromIndex < 0 || transferIndex <= fromIndex || transferIndex >= destIndex) continue

        const busArrive =
          toMinutes(first.schedule.departureTime) +
          (firstStats.legs[transferIndex - 1]?.endOffset ?? 0)
        const busDepart = toMinutes(schedule.departureTime) + (stats.legs[index]?.startOffset ?? 0)
        if (busDepart < busArrive + 10) continue
        const secondBus = getVehicle(db, schedule.busId)
        if (!secondBus || secondBus.available === false) continue

        const firstSeg = {
          ...first.segments[0],
          toStopId: transferStop.id,
          toName: transferStop.name,
          arriveMin: busArrive,
          durationMin: busArrive - first.segments[0].departMin,
          fare: Math.max(
            5,
            Math.round(
              (Number(first.schedule.fare || 10) * haversineKm(origin, transferStop)) /
                (firstStats.totalKm || 1),
            ),
          ),
        }
        const secondSeg = {
          mode: 'bus',
          fromStopId: transferStop.id,
          toStopId: destinationStopId,
          fromName: transferStop.name,
          toName: destination.name,
          departMin: busDepart,
          arriveMin: toMinutes(schedule.departureTime) + (stats.legs[destinationIndex - 1]?.endOffset ?? 0),
          durationMin:
            toMinutes(schedule.departureTime) +
            (stats.legs[destinationIndex - 1]?.endOffset ?? 0) -
            busDepart,
          detail: `${route.code} · ${route.name}`,
          subdetail: `${secondBus.registration} · ${schedule.departureTime} service`,
          fare: Math.max(
            5,
            Math.round(
              (Number(schedule.fare || 10) * haversineKm(transferStop, destination)) /
                (stats.totalKm || 1),
            ),
          ),
          seatsLeft: Number(schedule.availableSeats || 0),
          routeId: route.id,
          scheduleId: schedule.id,
          providerName: getProvider(db, route.providerId)?.name,
          color: route.color,
        }
        possibilities.push(
          makeOption([firstSeg, secondSeg], afterMinutes, { kind: 'multimodal', seats }),
        )
      }
    }
  }

  // Walk to a nearby stop → bus → walk to the destination
  const nearbyOrigins = db.stops.filter(
    (stop) => haversineKm(origin, stop) <= WALK_ACCESS_KM,
  )
  const nearbyDestinations = db.stops.filter(
    (stop) => haversineKm(stop, destination) <= WALK_ACCESS_KM,
  )
  for (const accessStop of nearbyOrigins) {
    for (const egressStop of nearbyDestinations) {
      if (accessStop.id === originStopId && egressStop.id === destinationStopId) continue
      const legs = findBusLegs(
        db,
        accessStop.id,
        egressStop.id,
        dateISO,
        afterMinutes + 2,
        seats,
      ).slice(0, 2)
      for (const leg of legs) {
        const segments = []
        if (accessStop.id !== originStopId) {
          segments.push(makeWalkSegment(db, origin, accessStop, afterMinutes))
        }
        segments.push(...leg.segments)
        if (egressStop.id !== destinationStopId) {
          const last = segments[segments.length - 1]
          segments.push(makeWalkSegment(db, egressStop, destination, last.arriveMin))
        }
        possibilities.push(makeOption(segments, afterMinutes, { kind: 'multimodal', seats }))
      }
    }
  }

  // De-duplicate by signature
  const unique = new Map()
  for (const option of possibilities) {
    if (!Number.isFinite(option.arriveMin) || option.sample === false) continue
    const key = option.signature
    const existing = unique.get(key)
    if (!existing || existing.fare > option.fare) unique.set(key, option)
  }
  const options = [...unique.values()]

  // Badges
  if (options.length) {
    const cheapest = options.reduce((best, option) => (option.fare < best.fare ? option : best))
    const fastest = options.reduce((best, option) => (option.arriveMin < best.arriveMin ? option : best))
    const scored = [...options].sort(
      (a, b) =>
        a.arriveMin + a.fare * 0.35 + a.transfers * 6 -
        (b.arriveMin + b.fare * 0.35 + b.transfers * 6),
    )
    options.forEach((option) => {
      option.badges = []
      if (option.id === cheapest.id) option.badges.push('Cheapest')
      if (option.id === fastest.id) option.badges.push('Fastest')
      if (option.id === scored[0].id) option.badges.push('Recommended')
    })
  }

  const sorters = {
    cheapest: (a, b) => a.fare - b.fare || a.arriveMin - b.arriveMin,
    fastest: (a, b) => a.arriveMin - b.arriveMin || a.fare - b.fare,
    fewest: (a, b) => a.transfers - b.transfers || a.arriveMin - b.arriveMin,
    recommended: (a, b) =>
      a.arriveMin + a.fare * 0.35 + a.transfers * 6 -
      (b.arriveMin + b.fare * 0.35 + b.transfers * 6),
  }
  options.sort(sorters[preference] ?? sorters.recommended)

  return {
    options: options.slice(0, 12),
    afterMinutes,
    cancellations: getActiveCancellations(db, dateISO),
  }
}

export function estimateEvRide(db, vehicleId, originStopId, destinationStopId, seats = 1) {
  const vehicle = getVehicle(db, vehicleId)
  if (!vehicle) return null
  const pickup = getStop(db, vehicle.locationStopId)
  const origin = getStop(db, originStopId)
  const destination = getStop(db, destinationStopId)
  if (!pickup || !origin || !destination) return null
  const tripKm = haversineKm(pickup, destination)
  return {
    tripKm: round1(tripKm),
    pickupWalkKm: round1(haversineKm(origin, pickup)),
    durationMin: Math.max(4, Math.round((tripKm / EV_SPEED_KMH) * 60)) + 8,
    fare: Math.max(
      vehicle.kind === 'ev-two-wheeler' ? 20 : 25,
      Math.round(tripKm * Number(vehicle.farePerKm || 10)),
    ),
    seats,
  }
}
