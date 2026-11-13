import { getRoute, getStop, getVehicle, getVillage } from '@/services/transportService'

export function getAdminStats(db) {
  const buses = db.vehicles.filter((vehicle) => vehicle.kind === 'bus')
  const evs = db.vehicles.filter((vehicle) => vehicle.kind?.startsWith('ev-'))
  return {
    students: db.students.length,
    providers: db.providers.length,
    verifiedProviders: db.providers.filter((provider) => provider.verified).length,
    buses: buses.length,
    evs: evs.length,
    availableEvs: evs.filter((vehicle) => vehicle.available).length,
    routes: db.routes.length,
    schedules: db.schedules.length,
    cancelled: db.schedules.filter((schedule) => schedule.status === 'cancelled').length,
    pendingRides: db.rideRequests.filter((request) => request.status === 'pending').length,
    activePools: db.poolingGroups.filter((group) => group.status === 'proposed').length,
    openTravelRequests: db.travelRequests.filter((request) => request.status === 'open').length,
  }
}

export function getDemandByVillage(db) {
  const counts = new Map()
  db.travelRequests.forEach((request) => {
    const stop = getStop(db, request.originStopId)
    const village = getVillage(db, stop?.villageId)
    const key = village?.name ?? 'Unknown'
    counts.set(key, (counts.get(key) ?? 0) + Number(request.seats || 1))
  })
  return [...counts.entries()]
    .map(([village, requests]) => ({ village, requests }))
    .sort((a, b) => b.requests - a.requests)
}

export function getRouteCapacity(db) {
  return db.routes.map((route) => {
    const schedules = db.schedules.filter(
      (schedule) => schedule.routeId === route.id && schedule.status === 'running',
    )
    const seats = schedules.reduce((total, schedule) => {
      const bus = getVehicle(db, schedule.busId)
      return total + Number(bus?.capacity ?? schedule.availableSeats ?? 0)
    }, 0)
    const available = schedules.reduce(
      (total, schedule) => total + Number(schedule.availableSeats || 0),
      0,
    )
    return { route: `${route.code} · ${route.name}`, seats, available }
  })
}

export function getRideStatusCounts(db) {
  const counts = { pending: 0, accepted: 0, rejected: 0, completed: 0, cancelled: 0 }
  db.rideRequests.forEach((request) => {
    if (counts[request.status] !== undefined) counts[request.status] += 1
  })
  return Object.entries(counts).map(([status, value]) => ({ status, value }))
}

export function getProviderStats(db, providerId) {
  const vehicles = db.vehicles.filter((vehicle) => vehicle.providerId === providerId)
  const requests = db.rideRequests.filter((request) => request.providerId === providerId)
  return {
    vehicles: vehicles.length,
    available: vehicles.filter((vehicle) => vehicle.available).length,
    pending: requests.filter((request) => request.status === 'pending').length,
    accepted: requests.filter((request) => request.status === 'accepted').length,
  }
}

export function getRouteLabel(db, routeId) {
  const route = getRoute(db, routeId)
  return route ? `${route.code} · ${route.name}` : 'Route removed'
}
