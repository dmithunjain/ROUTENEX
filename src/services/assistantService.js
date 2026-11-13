import { formatClock, getActiveCancellations, getStop, getStudent, haversineKm, planJourneys, toMinutes } from '@/services/transportService'
import { findMatchesForRequest } from '@/services/poolingService'

function findMentionedStops(db, query) {
  const text = query.toLowerCase()
  const mentions = []
  for (const stop of db.stops) {
    const name = stop.name.toLowerCase()
    if (text.includes(name)) {
      mentions.push({ index: text.indexOf(name), stop })
      continue
    }
    const village = db.villages.find((item) => item.id === stop.villageId)
    if (village && text.includes(village.name.toLowerCase())) {
      if (!mentions.some((mention) => mention.villageMatch === village.id)) {
        mentions.push({ index: text.indexOf(village.name.toLowerCase()), stop, villageMatch: village.id })
      }
    }
  }
  return mentions.sort((a, b) => a.index - b.index)
}

function parsePreferredTime(query) {
  const match = query.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const suffix = match[3].toLowerCase()
  if (suffix === 'pm' && hours < 12) hours += 12
  if (suffix === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function describeOption(option) {
  const first = option.segments[0]
  const last = option.segments[option.segments.length - 1]
  return `${option.label} · depart ${formatClock(first.departMin)}, arrive ${formatClock(last.arriveMin)} · ₹${option.fare} estimated · ${option.transfers} transfer${option.transfers === 1 ? '' : 's'}`
}

/**
 * Rule-based travel assistant. Every recommendation is computed from the shared
 * ROUTENEX sample database — it cannot invent routes, providers or availability.
 */
export function answerTravelQuery(db, rawQuery, context = {}) {
  const query = (rawQuery || '').trim()
  const lower = query.toLowerCase()
  const student = context.studentId ? getStudent(db, context.studentId) : null
  const date = context.date || new Date().toISOString().slice(0, 10)
  const help = {
    text:
      'I can explain journeys using the current ROUTENEX data. Try “How do I get from Thandalam to College at 8 am?”, “Which buses are cancelled?”, “Find an EV near Kattupakkam” or “Who can I pool with?”.',
    kind: 'help',
  }

  if (!query) return help

  if (/^(hi|hello|hey|help|what can you do)/i.test(lower)) return help

  if (/cancel|disrupt|breakdown|not running/.test(lower)) {
    const cancellations = getActiveCancellations(db, date)
    if (!cancellations.length) {
      return {
        text: 'There are no cancelled services recorded for today in the shared schedule data. Sample data only — confirm with the operator before travelling.',
        kind: 'cancellations',
        cancellations: [],
      }
    }
    return {
      text: `${cancellations.length} service${cancellations.length > 1 ? 's are' : ' is'} marked cancelled today: ${cancellations
        .map((item) => `${item.route?.code} at ${item.departureTime} (${item.note || 'no reason recorded'})`)
        .join('; ')}. The journey planner automatically excludes these schedules.`,
      kind: 'cancellations',
      cancellations,
    }
  }

  if (/pool|share|together|match/.test(lower)) {
    if (!student) return { ...help, text: 'Choose a student profile first so I can check compatible travel requests.' }
    const requests = db.travelRequests.filter(
      (request) => request.studentId === student.id && request.status === 'open' && request.date === date,
    )
    if (!requests.length) {
      return {
        ...help,
        text: 'You have no open travel request for today. Create one in Smart Pooling and I can look for compatible students.',
      }
    }
    const results = requests.map((request) => ({
      request,
      matches: findMatchesForRequest(db, request),
    }))
    const matchCount = results.reduce((total, result) => total + result.matches.length, 0)
    if (!matchCount) {
      return {
        ...help,
        text: 'No compatible students were found within 2.5 km and 45 minutes of your request. Try a slightly wider departure window in the pooling screen.',
      }
    }
    return {
      text: `I found ${matchCount} compatible student request${matchCount > 1 ? 's' : ''} for your open journey. Pooling only proposes a group — no vehicle is confirmed until a provider accepts.`,
      kind: 'pooling',
      results,
    }
  }

  if (/\bev\b|electric|auto|two-wheeler|scooter|bike/.test(lower)) {
    const mentions = findMentionedStops(db, query)
    const origin = mentions[0]?.stop
    if (!origin) {
      return {
        ...help,
        text: 'Tell me your pickup village or stop, for example “Is an EV available near Thandalam?”.',
      }
    }
    const nearby = db.vehicles
      .filter((vehicle) => vehicle.kind?.startsWith('ev-'))
      .map((vehicle) => {
        const provider = db.providers.find((item) => item.id === vehicle.providerId)
        const pickup = getStop(db, vehicle.locationStopId)
        return { vehicle, provider, pickup, distanceKm: pickup ? haversineKm(origin, pickup) : 999 }
      })
      .filter(
        (item) =>
          item.provider?.verified &&
          item.provider?.available &&
          item.vehicle.available &&
          item.distanceKm <= 3,
      )
      .sort((a, b) => a.distanceKm - b.distanceKm)
    if (!nearby.length) {
      return {
        ...help,
        text: `No verified, available EV is recorded within 3 km of ${origin.name} right now. Availability is sample data, so please check with a local provider.`,
      }
    }
    return {
      text: `${nearby.length} verified EV option${nearby.length > 1 ? 's' : ''} within 3 km of ${origin.name}: ${nearby
        .map(
          (item) =>
            `${item.provider.name} ${item.vehicle.kind === 'ev-auto' ? 'EV auto' : 'EV two-wheeler'} at ${item.pickup.name} (${item.distanceKm.toFixed(1)} km away, ${item.vehicle.capacity} legal seat${item.vehicle.capacity > 1 ? 's' : ''})`,
        )
        .join('; ')}. Open EV rides to send a request and wait for provider acceptance.`,
      kind: 'ev',
      nearby,
    }
  }

  const mentions = findMentionedStops(db, query)
  let origin = mentions[0]?.stop
  let destination = mentions[1]?.stop

  if (student) {
    if (!origin && /home|village/.test(lower)) {
      origin = db.stops.find((stop) => stop.villageId === student.villageId)
    }
    if (!destination && /college|class|campus/.test(lower)) {
      destination = db.stops.find((stop) => stop.isCollege) ?? db.stops.find((stop) => stop.id === 's6')
    }
  }
  if (!destination && /college|class|campus/.test(lower)) {
    destination = db.stops.find((stop) => stop.isCollege)
  }

  if (!origin || !destination || origin.id === destination.id) {
    return {
      ...help,
      text:
        'I need a starting point and a destination that exist in ROUTENEX sample data. For example: “Plan Thandalam to College Gate at 8 am”.',
    }
  }

  const time = parsePreferredTime(query) || student?.departurePreference || '08:00'
  const preference = /cheap|budget|lowest fare/.test(lower)
    ? 'cheapest'
    : /fast|quick|earliest/.test(lower)
      ? 'fastest'
      : /fewest|transfer/.test(lower)
        ? 'fewest'
        : 'recommended'

  const { options, cancellations } = planJourneys(db, {
    originStopId: origin.id,
    destinationStopId: destination.id,
    date,
    afterTime: time,
    seats: 1,
    preference,
  })

  if (!options.length) {
    return {
      text: `No connected bus, EV or walking journey was found from ${origin.name} to ${destination.name} after ${formatClock(toMinutes(time))} in the current sample data. Try a later departure time, a different stop, or check the EV network for a direct ride.`,
      kind: 'empty',
    }
  }

  const best = options[0]
  const cancellationNote = cancellations.length
    ? ` ${cancellations.length} cancelled service${cancellations.length > 1 ? 's are' : ' is'} excluded from these results.`
    : ''
  return {
    text: `From ${origin.name} to ${destination.name} after ${formatClock(toMinutes(time))}, my top recommendation is ${describeOption(best)}. I found ${options.length} valid option${options.length > 1 ? 's' : ''}.${cancellationNote} All fares and times are sample estimates, not live availability.`,
    kind: 'plan',
    options,
    origin,
    destination,
    cancellations,
  }
}
