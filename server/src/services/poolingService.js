import TravelRequest from '../models/TravelRequest.js';
import PoolingGroup from '../models/PoolingGroup.js';
import RideRequest from '../models/RideRequest.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Stop from '../models/Stop.js';
import { findEvOptions } from './journeyService.js';
import { calculateDistance, parseTime } from '../utils/helpers.js';

const POOL_TIME_WINDOW_MIN = 45;
const POOL_RADIUS_KM = 2.5;

export const findMatchesForRequest = async (request) => {
  const origin = await Stop.findById(request.originStop);
  const destination = await Stop.findById(request.destinationStop);
  
  if (!origin || !destination) return [];
  
  const candidates = await TravelRequest.find({
    _id: { $ne: request._id },
    status: 'open',
    date: request.date,
    student: { $ne: request.student }
  })
    .populate({
      path: 'student',
      select: 'name email phone'
    })
    .populate('originStop')
    .populate('destinationStop');
  
  const matches = [];
  
  for (const candidate of candidates) {
    const candidateOrigin = candidate.originStop;
    const candidateDestination = candidate.destinationStop;
    
    if (!candidateOrigin || !candidateDestination) continue;
    
    const originDistance = calculateDistance(
      origin.coordinates[1], origin.coordinates[0],
      candidateOrigin.coordinates[1], candidateOrigin.coordinates[0]
    );
    
    const destinationDistance = calculateDistance(
      destination.coordinates[1], destination.coordinates[0],
      candidateDestination.coordinates[1], candidateDestination.coordinates[0]
    );
    
    const timeDiff = Math.abs(parseTime(candidate.departAfter) - parseTime(request.departAfter));
    
    if (originDistance > POOL_RADIUS_KM) continue;
    if (destinationDistance > POOL_RADIUS_KM) continue;
    if (timeDiff > POOL_TIME_WINDOW_MIN) continue;
    
    const pickup = originDistance <= calculateDistance(
      candidateOrigin.coordinates[1], candidateOrigin.coordinates[0],
      destination.coordinates[1], destination.coordinates[0]
    ) ? origin : candidateOrigin;
    
    const score = Math.round(100 - timeDiff * 0.9 - originDistance * 9 - destinationDistance * 11);
    
    matches.push({
      request: candidate,
      student: candidate.student,
      origin: candidateOrigin,
      destination: candidateDestination,
      originDistanceKm: Math.round(originDistance * 10) / 10,
      destinationDistanceKm: Math.round(destinationDistance * 10) / 10,
      timeDiffMin: timeDiff,
      suggestedPickup: pickup,
      score
    });
  }
  
  return matches.sort((a, b) => b.score - a.score);
};

export const matchesForStudent = async (studentId) => {
  const requests = await TravelRequest.find({
    student: studentId,
    status: 'open'
  });
  
  const results = [];
  for (const request of requests) {
    const matches = await findMatchesForRequest(request);
    results.push({ request, matches });
  }
  
  return results;
};

export const buildPoolingGroup = async (request, matches) => {
  const requests = [request, ...matches.map(m => m.request)];
  const studentIds = [...new Set(requests.map(r => r.student.toString()))];
  const seats = requests.reduce((total, r) => total + (r.seats || 1), 0);
  const pickup = matches[0]?.suggestedPickup || await Stop.findById(request.originStop);
  
  return {
    originStop: pickup?._id || request.originStop,
    destinationStop: request.destinationStop,
    date: request.date,
    departAfter: request.departAfter,
    memberRequestIds: requests.map(r => r._id),
    memberStudentIds: studentIds,
    seats,
    status: 'proposed',
    note: 'Proposed group — vehicle request requires provider acceptance.',
    vehicleRequestId: null,
    suggestedPickupStop: pickup?._id,
    createdBy: request.student
  };
};

export const evOptionsForGroup = async (group) => {
  return await findEvOptions({
    originStopId: group.originStop,
    destinationStopId: group.destinationStop,
    afterMinutes: parseTime(group.departAfter),
    seats: group.seats,
    date: group.date
  }).then(options => options.filter(option => option.remainingSeats >= group.seats));
};

export const groupMembers = async (group) => {
  return await User.find({ _id: { $in: group.memberStudentIds } })
    .select('name email phone');
};

export const createPoolingGroup = async (request, matches, studentId) => {
  const groupData = await buildPoolingGroup(request, matches);
  groupData.createdBy = studentId;
  
  const group = await PoolingGroup.create(groupData);
  
  await TravelRequest.updateMany(
    { _id: { $in: groupData.memberRequestIds } },
    { status: 'pooled', poolingGroup: group._id }
  );
  
  return group;
};

export const requestSharedEV = async (groupId, vehicleId, studentId) => {
  const group = await PoolingGroup.findById(groupId).populate('memberStudentIds');
  if (!group) throw new Error('Pooling group not found');
  
  const vehicle = await Vehicle.findById(vehicleId).populate('provider');
  if (!vehicle) throw new Error('Vehicle not found');
  
  const evOptions = await evOptionsForGroup(group);
  const option = evOptions.find(o => o.vehicle._id.toString() === vehicleId);
  if (!option) throw new Error('Vehicle not available for this group');
  
  const evSegment = option.segments[option.segments.length - 1];
  
  const rideRequest = await RideRequest.create({
    student: studentId,
    vehicle: vehicleId,
    provider: vehicle.provider._id,
    originStop: evSegment.fromStopId,
    destinationStop: evSegment.toStopId,
    date: group.date,
    pickupTime: formatTime(evSegment.departMin),
    seats: group.seats,
    fareEstimate: evSegment.fare,
    status: 'pending',
    poolingGroup: groupId,
    note: `Shared EV request for a pooling group of ${group.seats}`,
    commission: {
      platformPercent: 3,
      platformAmount: Math.round(evSegment.fare * 3 / 100),
      providerAmount: evSegment.fare - Math.round(evSegment.fare * 3 / 100)
    }
  });
  
  await PoolingGroup.findByIdAndUpdate(groupId, {
    status: 'vehicle_requested',
    vehicleRequestId: rideRequest._id,
    vehicleId,
    providerId: vehicle.provider._id
  });
  
  return rideRequest;
};

export const getGroupDetails = async (groupId) => {
  return await PoolingGroup.findById(groupId)
    .populate('originStop')
    .populate('destinationStop')
    .populate('suggestedPickupStop')
    .populate('memberStudents', 'name email phone')
    .populate('memberRequests')
    .populate('vehicleRequest')
    .populate('vehicleId')
    .populate('providerId');
};

export const getStudentGroups = async (studentId) => {
  return await PoolingGroup.find({ memberStudentIds: studentId })
    .populate('originStop')
    .populate('destinationStop')
    .populate('vehicleRequest')
    .populate('vehicleId')
    .populate('providerId')
    .sort({ createdAt: -1 });
};

export const cancelGroup = async (groupId, studentId) => {
  const group = await PoolingGroup.findById(groupId);
  if (!group) throw new Error('Group not found');
  
  if (!group.memberStudentIds.includes(studentId)) {
    throw new Error('Not a member of this group');
  }
  
  if (group.status === 'confirmed' || group.status === 'completed') {
    throw new Error('Cannot cancel confirmed or completed group');
  }
  
  await TravelRequest.updateMany(
    { _id: { $in: group.memberRequestIds } },
    { status: 'open', poolingGroup: null }
  );
  
  if (group.vehicleRequestId) {
    await RideRequest.findByIdAndUpdate(group.vehicleRequestId, {
      status: 'cancelled',
      cancellationReason: 'Pooling group cancelled by student'
    });
  }
  
  group.status = 'cancelled';
  await group.save();
  
  return group;
};

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}