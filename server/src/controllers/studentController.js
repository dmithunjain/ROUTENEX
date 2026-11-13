import StudentProfile from '../models/StudentProfile.js';
import TravelRequest from '../models/TravelRequest.js';
import RideRequest from '../models/RideRequest.js';
import PoolingGroup from '../models/PoolingGroup.js';
import SavedJourney from '../models/SavedJourney.js';
import Village from '../models/Village.js';
import Stop from '../models/Stop.js';
import { planJourneys, findEvOptions, getNearbyStops, estimateEvRide } from '../services/journeyService.js';
import { findMatchesForRequest, matchesForStudent, createPoolingGroup, evOptionsForGroup, getStudentGroups, cancelGroup, requestSharedEV } from '../services/poolingService.js';
import { createOrder, verifyPayment as verifyPaymentService, getStudentPayments } from '../services/paymentService.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler.js';
import { formatResponse, paginate } from '../utils/helpers.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const student = await StudentProfile.findOne({ user: req.user._id })
    .populate('village')
    .populate('homeStop');
  
  if (!student) {
    throw new NotFoundError('Student profile not found');
  }
  
  const [
    myRequests,
    myRides,
    saved,
    poolingMatches,
    notifications
  ] = await Promise.all([
    TravelRequest.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(10),
    RideRequest.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(10),
    SavedJourney.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5),
    matchesForStudent(req.user._id),
    req.user.role === 'student' ? req.user.notifications?.slice(0, 5) || [] : []
  ]);
  
  const matchCount = poolingMatches.reduce((total, item) => total + item.matches.length, 0);
  const pendingRides = myRides.filter(r => r.status === 'pending').length;
  
  res.json(formatResponse(true, {
    profile: student,
    stats: {
      openTravelRequests: myRequests.filter(r => r.status === 'open').length,
      poolingMatches: matchCount,
      savedJourneys: saved.length,
      pendingRides
    },
    recentRequests: myRequests,
    recentRides: myRides,
    savedJourneys: saved,
    poolingMatches,
    notifications
  }));
});

export const searchJourneys = asyncHandler(async (req, res) => {
  const { originStopId, destinationStopId, date, afterTime, seats = 1, preference = 'recommended' } = req.query;
  
  if (!originStopId || !destinationStopId) {
    throw new BadRequestError('Origin and destination stops are required');
  }
  
  const result = await planJourneys({
    originStopId,
    destinationStopId,
    date: date || new Date().toISOString().split('T')[0],
    afterTime: afterTime || '08:00',
    seats: parseInt(seats),
    preference
  });
  
  res.json(formatResponse(true, result));
});

export const searchEVs = asyncHandler(async (req, res) => {
  const { originStopId, destinationStopId, date, afterTime, seats = 1, kind } = req.query;
  
  if (!originStopId || !destinationStopId) {
    throw new BadRequestError('Origin and destination stops are required');
  }
  
  const options = await findEvOptions({
    originStopId,
    destinationStopId,
    afterMinutes: parseTime(afterTime || '08:00'),
    seats: parseInt(seats),
    kind,
    date: date || new Date().toISOString().split('T')[0]
  });
  
  res.json(formatResponse(true, options));
});

export const requestEV = asyncHandler(async (req, res) => {
  const { vehicleId, originStopId, destinationStopId, date, pickupTime, seats = 1, note, poolingGroupId } = req.body;
  
  const vehicle = await Vehicle.findById(vehicleId).populate('provider');
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  
  const estimate = await estimateEvRide(vehicleId, originStopId, destinationStopId, seats);
  if (!estimate) throw new BadRequestError('Cannot estimate ride');
  
  const rideRequest = await RideRequest.create({
    student: req.user._id,
    vehicle: vehicleId,
    provider: vehicle.provider._id,
    originStop: originStopId,
    destinationStop: destinationStopId,
    date: date || new Date().toISOString().split('T')[0],
    pickupTime,
    seats: parseInt(seats),
    fareEstimate: estimate.fare,
    status: 'pending',
    poolingGroup: poolingGroupId || null,
    note: note || `EV request from ${originStopId}`,
    commission: {
      platformPercent: 3,
      platformAmount: Math.round(estimate.fare * 3 / 100),
      providerAmount: estimate.fare - Math.round(estimate.fare * 3 / 100)
    }
  });
  
  res.status(201).json(formatResponse(true, rideRequest, 'EV request sent. Awaiting provider acceptance.'));
});

export const getMyRides = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { student: req.user._id };
  if (status) query.status = status;
  
  const { skip, limit: l } = paginate(page, limit);
  
  const [rides, total] = await Promise.all([
    RideRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('vehicle')
      .populate('provider', 'name phone')
      .populate('originStop')
      .populate('destinationStop'),
    RideRequest.countDocuments(query)
  ]);
  
  res.json(formatResponse(true, rides, '', { page: parseInt(page), limit: l, total, pages: Math.ceil(total / l) }));
});

export const cancelRide = asyncHandler(async (req, res) => {
  const ride = await RideRequest.findOne({ _id: req.params.id, student: req.user._id });
  if (!ride) throw new NotFoundError('Ride request not found');
  
  if (!['pending', 'accepted'].includes(ride.status)) {
    throw new BadRequestError('Cannot cancel this ride');
  }
  
  ride.status = 'cancelled';
  ride.cancelledAt = new Date();
  ride.cancelledBy = req.user._id;
  ride.cancellationReason = req.body.reason || 'Cancelled by student';
  await ride.save();
  
  if (ride.poolingGroup) {
    await PoolingGroup.findByIdAndUpdate(ride.poolingGroup, { status: 'proposed', vehicleRequestId: null });
  }
  
  res.json(formatResponse(true, ride, 'Ride cancelled'));
});

export const createTravelRequest = asyncHandler(async (req, res) => {
  const { originStopId, destinationStopId, date, departAfter, seats = 1, note } = req.body;
  
  if (originStopId === destinationStopId) {
    throw new BadRequestError('Origin and destination must be different');
  }
  
  const request = await TravelRequest.create({
    student: req.user._id,
    originStop: originStopId,
    destinationStop: destinationStopId,
    date: date || new Date().toISOString().split('T')[0],
    departAfter: departAfter || '08:00',
    seats: parseInt(seats),
    note,
    status: 'open'
  });
  
  res.status(201).json(formatResponse(true, request, 'Travel request created'));
});

export const getMyTravelRequests = asyncHandler(async (req, res) => {
  const requests = await TravelRequest.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate('originStop')
    .populate('destinationStop')
    .populate('poolingGroup');
  
  res.json(formatResponse(true, requests));
});

export const updateTravelRequest = asyncHandler(async (req, res) => {
  const request = await TravelRequest.findOne({ _id: req.params.id, student: req.user._id });
  if (!request) throw new NotFoundError('Travel request not found');
  
  if (req.body.status) request.status = req.body.status;
  if (req.body.note !== undefined) request.note = req.body.note;
  await request.save();
  
  res.json(formatResponse(true, request, 'Travel request updated'));
});

export const getPoolingMatches = asyncHandler(async (req, res) => {
  const matches = await matchesForStudent(req.user._id);
  res.json(formatResponse(true, matches));
});

export const createPoolingGroupFromMatches = asyncHandler(async (req, res) => {
  const { requestId, matchIds } = req.body;
  
  const request = await TravelRequest.findOne({ _id: requestId, student: req.user._id, status: 'open' });
  if (!request) throw new NotFoundError('Travel request not found');
  
  const allMatches = await findMatchesForRequest(request);
  const selectedMatches = allMatches.filter(m => matchIds.includes(m.request._id.toString()));
  
  if (!selectedMatches.length) throw new BadRequestError('No valid matches selected');
  
  const group = await createPoolingGroup(request, selectedMatches, req.user._id);
  
  res.status(201).json(formatResponse(true, group, `Pool created with ${selectedMatches.length} matches`));
});

export const getMyPoolingGroups = asyncHandler(async (req, res) => {
  const groups = await getStudentGroups(req.user._id);
  res.json(formatResponse(true, groups));
});

export const requestSharedEVForGroup = asyncHandler(async (req, res) => {
  const { groupId, vehicleId } = req.body;
  
  const rideRequest = await requestSharedEV(groupId, vehicleId, req.user._id);
  
  res.status(201).json(formatResponse(true, rideRequest, 'Shared EV request sent'));
});

export const cancelPoolingGroup = asyncHandler(async (req, res) => {
  const group = await cancelGroup(req.params.id, req.user._id);
  res.json(formatResponse(true, group, 'Pooling group cancelled'));
});

export const saveJourney = asyncHandler(async (req, res) => {
  const { label, originStopId, destinationStopId, date, modes, totalFare, durationMinutes, transfers, segments } = req.body;
  
  const journey = await SavedJourney.create({
    student: req.user._id,
    label,
    originStop: originStopId,
    destinationStop: destinationStopId,
    date,
    modes,
    totalFare,
    durationMinutes,
    transfers,
    segments
  });
  
  res.status(201).json(formatResponse(true, journey, 'Journey saved'));
});

export const getSavedJourneys = asyncHandler(async (req, res) => {
  const journeys = await SavedJourney.find({ student: req.user._id })
    .sort({ createdAt: -1 });
  
  res.json(formatResponse(true, journeys));
});

export const deleteSavedJourney = asyncHandler(async (req, res) => {
  const journey = await SavedJourney.findOneAndDelete({ _id: req.params.id, student: req.user._id });
  if (!journey) throw new NotFoundError('Saved journey not found');
  
  res.json(formatResponse(true, null, 'Journey deleted'));
});

export const getVillages = asyncHandler(async (req, res) => {
  const villages = await Village.find({ isActive: true }).select('name block district');
  res.json(formatResponse(true, villages));
});

export const getStops = asyncHandler(async (req, res) => {
  const { villageId, isCollege } = req.query;
  const query = { isActive: true };
  if (villageId) query.village = villageId;
  if (isCollege !== undefined) query.isCollege = isCollege === 'true';
  
  const stops = await Stop.find(query)
    .populate('village', 'name')
    .select('name village coordinates isCollege collegeName');
  
  res.json(formatResponse(true, stops));
});

export const getNearbyStopsForLocation = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 2.5 } = req.query;
  
  if (!lat || !lng) throw new BadRequestError('Latitude and longitude required');
  
  const stops = await getNearbyStops([parseFloat(lng), parseFloat(lat)], parseFloat(radius));
  res.json(formatResponse(true, stops));
});

export const initiatePayment = asyncHandler(async (req, res) => {
  const { rideRequestId } = req.body;
  
  const rideRequest = await RideRequest.findOne({ _id: rideRequestId, student: req.user._id });
  if (!rideRequest) throw new NotFoundError('Ride request not found');
  
  if (rideRequest.status !== 'accepted') {
    throw new BadRequestError('Ride must be accepted before payment');
  }
  
  const { order, payment } = await createOrder(rideRequest);
  
  res.json(formatResponse(true, {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    paymentId: payment._id
  }));
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, orderId, signature, rideRequestId } = req.body;
  
  const payment = await verifyPaymentService(paymentId, orderId, signature, rideRequestId);
  
  res.json(formatResponse(true, payment, 'Payment verified successfully'));
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const result = await getStudentPayments(req.user._id, { page, limit, status });
  
  res.json(formatResponse(true, result.payments, '', result.pagination));
});

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}