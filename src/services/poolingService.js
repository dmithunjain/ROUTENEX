import {
  findEvOptions,
  getRemainingEvSeats,
  getStop,
  getStudent,
  haversineKm,
  toMinutes,
} from '@/services/transportService'

export const POOL_TIME_WINDOW_MIN = 45
export const POOL_RADIUS_KM = 2.5

/**
 * Find compatible open requests using nearby origins, similar destinations
 * and a departure-time window. No transport is confirmed here.
 */
export function findMatchesForRequest(db, request) {
  if (!request) return []
  const origin = getStop(db, request.originStopId)
  const destination = getStop(db, request.destinationStopId)
  if (!origin || !destination) return []

  const candidates = db.travelRequests
    .filter(
      (candidate) =>
        candidate.id !== request.id &&
        candidate.status === 'open' &&
        candidate.date === request.date &&
        candidate.studentId !== request.studentId,
    )
    .map((candidate) => {
      const candidateOrigin = getStop(db, candidate.originStopId)
      const candidateDestination = getStop(db, candidate.destinationStopId)
      if (!candidateOrigin || !candidateDestination) return null

      const originDistance = haversineKm(origin, candidateOrigin)
      const destinationDistance = haversineKm(destination, candidateDestination)
      const timeDiff = Math.abs(toMinutes(candidate.departAfter) - toMinutes(request.departAfter))

      if (originDistance > POOL_RADIUS_KM) return null
      if (destinationDistance > POOL_RADIUS_KM) return null
      if (timeDiff > POOL_TIME_WINDOW_MIN) return null

      const pickup =
        originDistance <= haversineKm(candidateOrigin, destination) ? origin : candidateOrigin
      const score = Math.round(
        100 - timeDiff * 0.9 - originDistance * 9 - destinationDistance * 11,
      )

      return {
        request: candidate,
        student: getStudent(db, candidate.studentId),
        origin: candidateOrigin,
        destination: candidateDestination,
        originDistanceKm: Math.round(originDistance * 10) / 10,
        destinationDistanceKm: Math.round(destinationDistance * 10) / 10,
        timeDiffMin: timeDiff,
        suggestedPickup: pickup,
        score,
      }
    })
    .filter(Boolean)

  return candidates.sort((a, b) => b.score - a.score)
}

export function matchesForStudent(db, studentId) {
  const requests = db.travelRequests.filter(
    (request) => request.studentId === studentId && request.status === 'open',
  )
  return requests.map((request) => ({
    request,
    matches: findMatchesForRequest(db, request),
  }))
}

/** Build a proposed group from the current request plus selected matches. */
export function buildPoolingGroup(db, request, matches) {
  const requests = [request, ...matches.map((match) => match.request)]
  const studentIds = [...new Set(requests.map((item) => item.studentId))]
  const seats = requests.reduce((total, item) => total + Number(item.seats || 1), 0)
  const pickup = matches[0]?.suggestedPickup ?? getStop(db, request.originStopId)
  return {
    originStopId: pickup?.id ?? request.originStopId,
    destinationStopId: request.destinationStopId,
    date: request.date,
    departAfter: request.departAfter,
    memberRequestIds: requests.map((item) => item.id),
    memberStudentIds: studentIds,
    seats,
    status: 'proposed',
    note: 'Proposed group — vehicle request requires provider acceptance.',
    vehicleRequestId: null,
  }
}

/** Capacity-aware EV options for a proposed group. */
export function evOptionsForGroup(db, group) {
  if (!group) return []
  const destination = group.destinationStopId
  return findEvOptions(db, {
    originStopId: group.originStopId,
    destinationStopId: destination,
    afterMinutes: toMinutes(group.departAfter),
    seats: Number(group.seats || 1),
  }).filter((option) => option.remainingSeats >= group.seats)
}

export function groupMembers(db, group) {
  return (group.memberStudentIds ?? []).map((studentId) => getStudent(db, studentId)).filter(Boolean)
}

export function filledSeats(db, vehicleId, date) {
  return db.rideRequests
    .filter(
      (request) =>
        request.vehicleId === vehicleId &&
        request.date === date &&
        request.status === 'accepted',
    )
    .reduce((total, request) => total + Number(request.seats || 0), 0)
}

export { getRemainingEvSeats }
