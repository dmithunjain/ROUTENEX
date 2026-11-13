import ProviderProfile from '../models/ProviderProfile.js';
import Vehicle from '../models/Vehicle.js';
import RideRequest from '../models/RideRequest.js';
import PoolingGroup from '../models/PoolingGroup.js'
import Stop from '../models/Stop.js';
import Village from '../models/Village.js';
import { getProviderStats, getProviderEarnings } from '../services/analyticsService.js';
import { getRemainingEvSeats } from '../services/journeyService.js';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler.js';
import { formatResponse, paginate } from '../utils/helpers.js';
import { notifyRideAccepted, notifyRideRejected } from '../services/notificationService.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id })
    .populate('serviceAreas', 'name');
  
  if (!provider) {
    throw new NotFoundError('Provider profile not found');
  }
  
  const vehicles = await Vehicle.find({ provider: provider._id });
  const stats = await getProviderStats(provider._id);
  
  const pendingRequests = await RideRequest.find({ provider: provider._id, status: 'pending' })
    .populate('student', 'name')
    .populate('vehicle')
    .populate('originStop')
    .populate('destinationStop')
    .sort({ createdAt: -1 });
  
  const earnings = await getProviderEarnings(provider._id);
  
  res.json(formatResponse(true, {
    profile: provider,
    vehicles,
    stats: {
      ...stats,
      ...earnings
    },
    pendingRequests
  }));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const { name, contact, phone, serviceAreas, operatingHours, estimatedFarePerKm } = req.body;
  
  if (name) provider.contact = name;
  if (contact) provider.contact = contact;
  if (phone) provider.phone = phone;
  if (serviceAreas) provider.serviceAreas = serviceAreas;
  if (operatingHours) provider.operatingHours = operatingHours;
  if (estimatedFarePerKm) provider.estimatedFarePerKm = estimatedFarePerKm;
  
  await provider.save();
  
  if (name || phone) {
    await User.findByIdAndUpdate(req.user._id, { name, phone });
  }
  
  res.json(formatResponse(true, provider, 'Profile updated'));
});

export const toggleAvailability = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  provider.available = !provider.available;
  await provider.save();
  
  res.json(formatResponse(true, { available: provider.available }, `Provider ${provider.available ? 'available' : 'unavailable'}`));
});

export const addVehicle = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const { kind, registration, model, capacity, batteryPercent, rangeKm, farePerKm, locationStopId, features } = req.body;
  
  const existing = await Vehicle.findOne({ registration: registration.toUpperCase() });
  if (existing) throw new BadRequestError('Vehicle with this registration already exists');
  
  const maxCapacity = kind === 'bus' ? 60 : kind === 'ev-two-wheeler' ? 1 : 6;
  if (capacity > maxCapacity) throw new BadRequestError(`Capacity exceeds maximum for ${kind}`);
  
  const vehicle = await Vehicle.create({
    provider: provider._id,
    kind,
    registration: registration.toUpperCase(),
    model,
    capacity: Math.min(maxCapacity, Math.max(1, capacity)),
    available: true,
    batteryPercent: kind !== 'bus' ? batteryPercent || 80 : undefined,
    rangeKm: kind !== 'bus' ? rangeKm || 50 : undefined,
    farePerKm: kind !== 'bus' ? farePerKm || 10 : undefined,
    locationStop: locationStopId,
    features
  });
  
  provider.stats.totalVehicles += 1;
  await provider.save();
  
  res.status(201).json(formatResponse(true, vehicle, 'Vehicle registered'));
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const vehicle = await Vehicle.findOne({ _id: req.params.id, provider: provider._id });
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  
  const { model, capacity, available, batteryPercent, rangeKm, farePerKm, locationStopId, features } = req.body;
  
  if (model) vehicle.model = model;
  if (capacity !== undefined) {
    const maxCapacity = vehicle.kind === 'bus' ? 60 : vehicle.kind === 'ev-two-wheeler' ? 1 : 6;
    vehicle.capacity = Math.min(maxCapacity, Math.max(1, capacity));
  }
  if (available !== undefined) vehicle.available = available;
  if (batteryPercent !== undefined) vehicle.batteryPercent = batteryPercent;
  if (rangeKm !== undefined) vehicle.rangeKm = rangeKm;
  if (farePerKm !== undefined) vehicle.farePerKm = farePerKm;
  if (locationStopId) vehicle.locationStop = locationStopId;
  if (features) vehicle.features = { ...vehicle.features, ...features };
  
  await vehicle.save();
  
  res.json(formatResponse(true, vehicle, 'Vehicle updated'));
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const vehicle = await Vehicle.findOne({ _id: req.params.id, provider: provider._id });
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  
  const schedules = await Schedule.countDocuments({ bus: vehicle._id });
  const rides = await RideRequest.countDocuments({ vehicle: vehicle._id });
  
  if (schedules > 0 || rides > 0) {
    throw new BadRequestError(`Cannot delete: ${schedules} schedule(s) and ${rides} ride(s) reference this vehicle`);
  }
  
  await vehicle.deleteOne();
  
  provider.stats.totalVehicles = Math.max(0, provider.stats.totalVehicles - 1);
  await provider.save();
  
  res.json(formatResponse(true, null, 'Vehicle deleted'));
});

export const toggleVehicleAvailability = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const vehicle = await Vehicle.findOne({ _id: req.params.id, provider: provider._id });
  if (!vehicle) throw new NotFoundError('Vehicle not found');
  
  vehicle.available = !vehicle.available;
  await vehicle.save();
  
  res.json(formatResponse(true, { available: vehicle.available }, `Vehicle ${vehicle.available ? 'available' : 'unavailable'}`));
});

export const getVehicles = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const vehicles = await Vehicle.find({ provider: provider._id });
  res.json(formatResponse(true, vehicles));
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  if (!provider.verified) {
    throw new ForbiddenError('Provider must be verified to accept rides');
  }
  
  const requests = await RideRequest.find({ provider: provider._id, status: 'pending' })
    .populate('student', 'name')
    .populate('vehicle')
    .populate('originStop')
    .populate('destinationStop')
    .populate('poolingGroup')
    .sort({ createdAt: -1 });
  
  const requestsWithRemaining = await Promise.all(requests.map(async (request) => {
    const vehicle = await Vehicle.findById(request.vehicle);
    const remaining = vehicle ? await getRemainingEvSeats(vehicle, request.date) : 0;
    return { ...request.toObject(), remainingSeats: remaining };
  }));
  
  res.json(formatResponse(true, requestsWithRemaining));
});

export const acceptRide = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  if (!provider.verified) throw new ForbiddenError('Provider not verified');
  if (!provider.available) throw new ForbiddenError('Provider not available');
  
  const request = await RideRequest.findOne({ _id: req.params.id, provider: provider._id, status: 'pending' })
    .populate('vehicle')
    .populate('student');
  
  if (!request) throw new NotFoundError('Ride request not found');
  
  if (request.vehicle.available === false) throw new BadRequestError('Vehicle unavailable');
  
  const remaining = await getRemainingEvSeats(request.vehicle, request.date);
  if (request.seats > remaining) {
    throw new BadRequestError(`Only ${remaining} seat(s) remaining`);
  }
  
  request.status = 'accepted';
  request.decidedAt = new Date();
  await request.save();
  
  if (request.poolingGroup) {
    await PoolingGroup.findByIdAndUpdate(request.poolingGroup, { status: 'confirmed' });
  }
  
  await notifyRideAccepted(request);
  
  res.json(formatResponse(true, request, 'Ride accepted'));
});

export const rejectRide = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const request = await RideRequest.findOne({ _id: req.params.id, provider: provider._id, status: 'pending' })
    .populate('student')
    .populate('poolingGroup');
  
  if (!request) throw new NotFoundError('Ride request not found');
  
  request.status = 'rejected';
  request.decidedAt = new Date();
  request.rejectionReason = req.body.reason || 'Declined by provider';
  await request.save();
  
  if (request.poolingGroup) {
    await PoolingGroup.findByIdAndUpdate(request.poolingGroup, {
      status: 'proposed',
      vehicleRequestId: null
    });
  }
  
  await notifyRideRejected(request, request.rejectionReason);
  
  res.json(formatResponse(true, request, 'Ride rejected'));
});

export const completeRide = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const request = await RideRequest.findOne({ _id: req.params.id, provider: provider._id, status: 'accepted' });
  if (!request) throw new NotFoundError('Ride request not found or not accepted');
  
  request.status = 'completed';
  request.completedAt = new Date();
  await request.save();
  
  provider.stats.totalRides += 1;
  provider.stats.totalEarnings += request.fareEstimate;
  provider.stats.netEarnings += request.commission?.providerAmount || (request.fareEstimate - request.commission?.platformAmount);
  await provider.save();
  
  res.json(formatResponse(true, request, 'Ride completed'));
});

export const getRideHistory = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const { page = 1, limit = 20, status } = req.query;
  const query = { provider: provider._id };
  if (status) query.status = status;
  
  const { skip, limit: l } = paginate(page, limit);
  
  const [rides, total] = await Promise.all([
    RideRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('student', 'name')
      .populate('vehicle')
      .populate('originStop')
      .populate('destinationStop'),
    RideRequest.countDocuments(query)
  ]);
  
  res.json(formatResponse(true, rides, '', { page: parseInt(page), limit: l, total, pages: Math.ceil(total / l) }));
});

export const getEarnings = asyncHandler(async (req, res) => {
  const provider = await ProviderProfile.findOne({ user: req.user._id });
  if (!provider) throw new NotFoundError('Provider profile not found');
  
  const { startDate, endDate } = req.query;
  const earnings = await getProviderEarnings(provider._id, startDate, endDate);
  
  const rideHistory = await RideRequest.find({ provider: provider._id, status: 'completed' })
    .select('fareEstimate commission createdAt')
    .sort({ createdAt: -1 })
    .limit(50);
  
  res.json(formatResponse(true, {
    summary: earnings,
    rideHistory
  }));
});