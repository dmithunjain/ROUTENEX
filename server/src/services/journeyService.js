import Village from '../models/Village.js';
import Stop from '../models/Stop.js';
import Vehicle from '../models/Vehicle.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';
import { calculateDistance, formatTime, parseTime, isScheduleOnDate, paginate } from '../utils/helpers.js';

const WALK_SPEED_KMH = 4.5;
const BUS_SPEED_KMH = 30;
const EV_SPEED_KMH = 26;
const EV_PICKUP_RADIUS_KM = 3;
const WALK_ACCESS_KM = 2.5;

export const findEvOptions = async (params) => {
  const { originStopId, destinationStopId, afterMinutes, seats = 1, kind, date } = params;
  
  const origin = await Stop.findById(originStopId);
  const destination = await Stop.findById(destinationStopId);
  
  if (!origin || !destination) return [];
  
  const query = {
    kind: { $in: ['ev-auto', 'ev-two-wheeler'] },
    available: true
  };
  
  if (kind) query.kind = kind;
  if (seats > 1) query.capacity = { $gte: seats };
  if (kind === 'ev-two-wheeler') query.capacity = 1;
  
  const vehicles = await Vehicle.find(query)
    .populate({
      path: 'provider',
      match: { verified: true, available: true, type: 'ev' },
      select: 'name phone verified available serviceAreas type'
    })
    .populate('locationStop');
  
  const options = [];
  
  for (const vehicle of vehicles) {
    if (!vehicle.provider || !vehicle.provider.verified || !vehicle.provider.available) continue;
    if (!vehicle.locationStop) continue;
    
    const pickupVillage = vehicle.locationStop.village;
    const inServiceArea = !vehicle.provider.serviceAreas.length || 
      vehicle.provider.serviceAreas.some(id => id.toString() === pickupVillage.toString());
    
    if (!inServiceArea) continue;
    
    const distanceToPickup = calculateDistance(
      origin.coordinates[1], origin.coordinates[0],
      vehicle.locationStop.coordinates[1], vehicle.locationStop.coordinates[0]
    );
    
    if (distanceToPickup > EV_PICKUP_RADIUS_KM) continue;
    
    const tripKm = calculateDistance(
      vehicle.locationStop.coordinates[1], vehicle.locationStop.coordinates[0],
      destination.coordinates[1], destination.coordinates[0]
    );
    
    if (tripKm > vehicle.rangeKm) continue;
    
    const bookedSeats = await RideRequest.countDocuments({
      vehicle: vehicle._id,
      date: date || new Date(),
      status: 'accepted'
    });
    
    const remainingSeats = vehicle.capacity - bookedSeats;
    if (remainingSeats < seats) continue;
    
    const pickupWait = 8;
    const tripMinutes = Math.max(4, Math.round((tripKm / EV_SPEED_KMH) * 60));
    const walkMinutes = Math.max(1, Math.round((distanceToPickup / WALK_SPEED_KMH) * 60));
    const totalMinutes = walkMinutes + pickupWait + tripMinutes;
    const departMin = afterMinutes + walkMinutes;
    const arriveMin = departMin + pickupWait + tripMinutes;
    
    const estimatedFare = Math.max(
      vehicle.kind === 'ev-two-wheeler' ? 20 : 25,
      Math.round(tripKm * vehicle.farePerKm)
    );
    
    options.push({
      vehicle: {
        _id: vehicle._id,
        kind: vehicle.kind,
        registration: vehicle.registration,
        model: vehicle.model,
        capacity: vehicle.capacity,
        batteryPercent: vehicle.batteryPercent,
        rangeKm: vehicle.rangeKm
      },
      provider: {
        _id: vehicle.provider._id,
        name: vehicle.provider.name,
        phone: vehicle.provider.phone
      },
      pickupStop: vehicle.locationStop,
      distanceToPickupKm: Math.round(distanceToPickup * 10) / 10,
      tripKm: Math.round(tripKm * 10) / 10,
      remainingSeats,
      segments: [{
        mode: vehicle.kind,
        fromStopId: vehicle.locationStop._id,
        toStopId: destination._id,
        fromName: vehicle.locationStop.name,
        toName: destination.name,
        departMin,
        arriveMin,
        durationMin: tripMinutes,
        distanceKm: Math.round(tripKm * 10) / 10,
        detail: `${vehicle.provider.name} · ${vehicle.model}`,
        fare: estimatedFare,
        seats,
        providerId: vehicle.provider._id,
        providerName: vehicle.provider.name,
        providerPhone: vehicle.provider.phone,
        vehicleId: vehicle._id,
        pickupWait
      }],
      walkMinutes,
      totalMinutes,
      estimatedFare
    });
  }
  
  return options.sort((a, b) => a.distanceToPickupKm - b.distanceToPickupKm);
};

export const findBusLegs = async (params) => {
  const { originStopId, destinationStopId, date, afterMinutes, seats = 1 } = params;
  
  const schedules = await Schedule.find({
    status: 'running',
    availableSeats: { $gte: seats }
  })
    .populate({
      path: 'route',
      match: { isActive: true },
      populate: {
        path: 'stops',
        select: 'name coordinates village isCollege'
      }
    })
    .populate({
      path: 'bus',
      match: { available: true, kind: 'bus' }
    })
    .populate({
      path: 'route',
      populate: {
        path: 'provider',
        select: 'name'
      }
    });
  
  const legs = [];
  
  for (const schedule of schedules) {
    if (!schedule.route || !schedule.bus) continue;
    if (!isScheduleOnDate(schedule, date)) continue;
    
    const route = schedule.route;
    const originIndex = route.stops.findIndex(s => s._id.toString() === originStopId);
    const destinationIndex = route.stops.findIndex(s => s._id.toString() === destinationStopId);
    
    if (originIndex < 0 || destinationIndex < 0 || originIndex >= destinationIndex) continue;
    
    const startMin = parseTime(schedule.departureTime);
    const boardMin = startMin;
    
    if (boardMin < afterMinutes - 5) continue;
    
    const arriveMin = startMin + Math.round(
      route.stops.slice(originIndex, destinationIndex)
        .reduce((sum, stop, idx) => {
          if (idx === route.stops.length - 1) return sum;
          const nextStop = route.stops[originIndex + idx + 1];
          const dist = calculateDistance(
            stop.coordinates[1], stop.coordinates[0],
            nextStop.coordinates[1], nextStop.coordinates[0]
          );
          return sum + Math.max(3, Math.round((dist / BUS_SPEED_KMH) * 60)) + 2;
        }, 0)
    );
    
    const segmentKm = calculateDistance(
      route.stops[originIndex].coordinates[1], route.stops[originIndex].coordinates[0],
      route.stops[destinationIndex].coordinates[1], route.stops[destinationIndex].coordinates[0]
    );
    
    const fare = Math.max(5, Math.round((schedule.fare * segmentKm) / (route.distance || 1)));
    
    legs.push({
      schedule: {
        _id: schedule._id,
        departureTime: schedule.departureTime,
        availableSeats: schedule.availableSeats,
        fare: schedule.fare,
        note: schedule.note
      },
      route: {
        _id: route._id,
        code: route.code,
        name: route.name,
        color: route.color
      },
      bus: {
        _id: schedule.bus._id,
        registration: schedule.bus.registration,
        capacity: schedule.bus.capacity
      },
      provider: route.provider,
      boardMin,
      arriveMin,
      fromStop: route.stops[originIndex],
      toStop: route.stops[destinationIndex],
      fare,
      seatsLeft: schedule.availableSeats,
      segments: [{
        mode: 'bus',
        fromStopId: route.stops[originIndex]._id,
        toStopId: route.stops[destinationIndex]._id,
        fromName: route.stops[originIndex].name,
        toName: route.stops[destinationIndex].name,
        departMin: boardMin,
        arriveMin,
        durationMin: arriveMin - boardMin,
        detail: `${route.code} · ${route.name}`,
        subdetail: `${schedule.bus.registration} · ${schedule.departureTime} service`,
        fare,
        seatsLeft: schedule.availableSeats,
        routeId: route._id,
        scheduleId: schedule._id,
        providerName: route.provider?.name
      }]
    });
  }
  
  return legs.sort((a, b) => a.boardMin - b.boardMin);
};

export const planJourneys = async (params) => {
  const { originStopId, destinationStopId, date, afterTime, seats = 1, preference = 'recommended' } = params;
  const afterMinutes = parseTime(afterTime);
  const dateObj = date ? new Date(date) : new Date();
  
  const possibilities = [];
  
  const origin = await Stop.findById(originStopId);
  const destination = await Stop.findById(destinationStopId);
  
  if (!origin || !destination) return { options: [], afterMinutes };
  
  const walkKm = calculateDistance(
    origin.coordinates[1], origin.coordinates[0],
    destination.coordinates[1], destination.coordinates[0]
  );
  
  if (walkKm <= 3) {
    const walkMinutes = Math.max(1, Math.round((walkKm / WALK_SPEED_KMH) * 60));
    possibilities.push({
      kind: 'walk',
      segments: [{
        mode: 'walk',
        fromStopId: origin._id,
        toStopId: destination._id,
        fromName: origin.name,
        toName: destination.name,
        departMin: afterMinutes,
        arriveMin: afterMinutes + walkMinutes,
        durationMin: walkMinutes,
        distanceKm: Math.round(walkKm * 10) / 10,
        detail: `${Math.round(walkKm * 10) / 10} km walk`,
        fare: 0
      }],
      departMin: afterMinutes,
      arriveMin: afterMinutes + walkMinutes,
      waitMin: 0,
      durationMin: walkMinutes,
      totalMinutes: walkMinutes,
      fare: 0,
      transfers: 0,
      modes: ['walk'],
      seats
    });
  }
  
  const directBus = await findBusLegs({ originStopId, destinationStopId, date: dateObj, afterMinutes, seats });
  directBus.forEach(leg => {
    possibilities.push({
      kind: 'bus',
      ...leg,
      segments: leg.segments,
      departMin: leg.boardMin,
      arriveMin: leg.arriveMin,
      waitMin: Math.max(0, leg.boardMin - afterMinutes),
      durationMin: leg.arriveMin - leg.boardMin,
      totalMinutes: leg.arriveMin - afterMinutes,
      fare: leg.fare,
      transfers: 0,
      modes: ['bus'],
      seats
    });
  });
  
  const directEv = await findEvOptions({ originStopId, destinationStopId, afterMinutes, seats, date: dateObj });
  directEv.forEach(option => {
    possibilities.push({
      kind: 'ev',
      ...option,
      segments: option.segments,
      departMin: option.segments[0].departMin - option.walkMinutes,
      arriveMin: option.segments[0].arriveMin,
      waitMin: option.walkMinutes,
      durationMin: option.totalMinutes,
      totalMinutes: option.totalMinutes,
      fare: option.estimatedFare,
      transfers: 0,
      modes: [option.vehicle.kind],
      seats
    });
  });
  
  for (const schedule of await Schedule.find({ status: 'running' }).populate('route').populate('bus')) {
    if (!schedule.route || !schedule.bus || !isScheduleOnDate(schedule, dateObj)) continue;
    if (schedule.availableSeats < seats) continue;
    
    const route = schedule.route;
    const originIndex = route.stops.findIndex(s => s._id.toString() === originStopId);
    const destinationIndex = route.stops.findIndex(s => s._id.toString() === destinationStopId);
    
    if (originIndex < 0 || destinationIndex < 0 || originIndex >= destinationIndex) continue;
    
    const startMin = parseTime(schedule.departureTime);
    const boardMin = startMin;
    
    if (boardMin < afterMinutes - 5) continue;
    
    for (let index = originIndex + 1; index < destinationIndex; index++) {
      const transferStop = route.stops[index];
      const transferArrive = boardMin + Math.round(
        route.stops.slice(originIndex, index)
          .reduce((sum, stop, idx) => {
            if (idx === route.stops.length - 1) return sum;
            const nextStop = route.stops[originIndex + idx + 1];
            const dist = calculateDistance(
              stop.coordinates[1], stop.coordinates[0],
              nextStop.coordinates[1], nextStop.coordinates[0]
            );
            return sum + Math.max(3, Math.round((dist / BUS_SPEED_KMH) * 60)) + 2;
          }, 0)
      );
      
      const busSegment = {
        mode: 'bus',
        fromStopId: origin._id,
        toStopId: transferStop._id,
        fromName: origin.name,
        toName: transferStop.name,
        departMin: boardMin,
        arriveMin: transferArrive,
        durationMin: transferArrive - boardMin,
        detail: `${route.code} · ${route.name}`,
        subdetail: `${schedule.bus.registration} · ${schedule.departureTime} service`,
        fare: Math.max(5, Math.round((schedule.fare * calculateDistance(
          origin.coordinates[1], origin.coordinates[0],
          transferStop.coordinates[1], transferStop.coordinates[0]
        )) / (route.distance || 1))),
        seatsLeft: schedule.availableSeats,
        routeId: route._id,
        scheduleId: schedule._id,
        providerName: route.provider?.name
      };
      
      const evOptions = await findEvOptions({
        originStopId: transferStop._id,
        destinationStopId,
        afterMinutes: transferArrive + 5,
        seats,
        date: dateObj
      }).slice(0, 2);
      
      for (const ev of evOptions) {
        const segments = [busSegment, ...ev.segments];
        if (segments[segments.length - 1].arriveMin <= transferArrive) continue;
        
        possibilities.push({
          kind: 'multimodal',
          segments,
          departMin: boardMin,
          arriveMin: segments[segments.length - 1].arriveMin,
          waitMin: Math.max(0, boardMin - afterMinutes),
          durationMin: segments[segments.length - 1].arriveMin - boardMin,
          totalMinutes: segments[segments.length - 1].arriveMin - afterMinutes,
          fare: busSegment.fare + ev.estimatedFare,
          transfers: 1,
          modes: ['bus', ev.vehicle.kind],
          seats
        });
      }
    }
  }
  
  const unique = new Map();
  for (const option of possibilities) {
    if (!Number.isFinite(option.arriveMin)) continue;
    const key = option.segments.map(s => `${s.mode}:${s.fromStopId}-${s.toStopId}:${s.departMin}`).join('|');
    const existing = unique.get(key);
    if (!existing || existing.fare > option.fare) unique.set(key, option);
  }
  
  const options = [...unique.values()];
  
  if (options.length) {
    const cheapest = options.reduce((best, o) => o.fare < best.fare ? o : best);
    const fastest = options.reduce((best, o) => o.arriveMin < best.arriveMin ? o : best);
    const scored = [...options].sort((a, b) => 
      a.arriveMin + a.fare * 0.35 + a.transfers * 6 - (b.arriveMin + b.fare * 0.35 + b.transfers * 6)
    );
    
    options.forEach(option => {
      option.badges = [];
      if (option === cheapest) option.badges.push('Cheapest');
      if (option === fastest) option.badges.push('Fastest');
      if (option === scored[0]) option.badges.push('Recommended');
    });
  }
  
  const sorters = {
    cheapest: (a, b) => a.fare - b.fare || a.arriveMin - b.arriveMin,
    fastest: (a, b) => a.arriveMin - b.arriveMin || a.fare - b.fare,
    fewest: (a, b) => a.transfers - b.transfers || a.arriveMin - b.arriveMin,
    recommended: (a, b) => 
      a.arriveMin + a.fare * 0.35 + a.transfers * 6 - (b.arriveMin + b.fare * 0.35 + b.transfers * 6)
  };
  
  options.sort(sorters[preference] || sorters.recommended);
  
  return {
    options: options.slice(0, 12),
    afterMinutes,
    origin: origin.name,
    destination: destination.name
  };
};

export const getNearbyStops = async (coordinates, radiusKm = WALK_ACCESS_KM) => {
  return await Stop.find({
    coordinates: {
      $near: {
        $geometry: { type: 'Point', coordinates: coordinates },
        $maxDistance: radiusKm * 1000
      }
    },
    isActive: true
  }).select('name coordinates village isCollege');
};

export const getRouteStats = async (routeId) => {
  const route = await Route.findById(routeId).populate('stops');
  if (!route) return null;
  
  const routeStops = route.stops;
  let totalKm = 0;
  let totalMinutes = 0;
  
  for (let i = 0; i < routeStops.length - 1; i++) {
    const distance = calculateDistance(
      routeStops[i].coordinates[1], routeStops[i].coordinates[0],
      routeStops[i + 1].coordinates[1], routeStops[i + 1].coordinates[0]
    );
    const minutes = Math.max(3, Math.round((distance / BUS_SPEED_KMH) * 60)) + 2;
    totalKm += distance;
    totalMinutes += minutes;
  }
  
  return { totalKm: Math.round(totalKm * 10) / 10, totalMinutes, stops: routeStops.length };
};

export const estimateEvRide = async (vehicleId, originStopId, destinationStopId, seats = 1) => {
  const vehicle = await Vehicle.findById(vehicleId).populate('provider').populate('locationStop');
  if (!vehicle) return null;
  
  const origin = await Stop.findById(originStopId);
  const destination = await Stop.findById(destinationStopId);
  const pickup = vehicle.locationStop;
  
  if (!pickup || !origin || !destination) return null;
  
  const tripKm = calculateDistance(
    pickup.coordinates[1], pickup.coordinates[0],
    destination.coordinates[1], destination.coordinates[0]
  );
  
  const pickupWalkKm = calculateDistance(
    origin.coordinates[1], origin.coordinates[0],
    pickup.coordinates[1], pickup.coordinates[0]
  );
  
  return {
    tripKm: Math.round(tripKm * 10) / 10,
    pickupWalkKm: Math.round(pickupWalkKm * 10) / 10,
    durationMin: Math.max(4, Math.round((tripKm / EV_SPEED_KMH) * 60)) + 8,
    fare: Math.max(
      vehicle.kind === 'ev-two-wheeler' ? 20 : 25,
      Math.round(tripKm * vehicle.farePerKm)
    ),
    seats,
    vehicle: {
      _id: vehicle._id,
      kind: vehicle.kind,
      registration: vehicle.registration,
      model: vehicle.model,
      capacity: vehicle.capacity
    },
    provider: vehicle.provider
  };
};

export const getRemainingEvSeats = async (vehicle, date) => {
  if (!vehicle || vehicle.kind === 'bus') return vehicle?.capacity || 0;
  
  const rideRequests = await RideRequest.find({
    vehicle: vehicle._id,
    date: {
      $gte: new Date(date).setHours(0,0,0,0),
      $lt: new Date(date).setHours(23,59,59,999)
    },
    status: { $in: ['pending', 'accepted'] }
  });
  
  const bookedSeats = rideRequests.reduce((sum, r) => sum + r.seats, 0);
  return Math.max(0, vehicle.capacity - bookedSeats);
};