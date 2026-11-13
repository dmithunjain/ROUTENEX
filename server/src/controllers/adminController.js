import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Village from '../models/Village.js';
import Stop from '../models/Stop.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';
import Vehicle from '../models/Vehicle.js';
import RideRequest from '../models/RideRequest.js';
import TravelRequest from '../models/TravelRequest.js';
import PoolingGroup from '../models/PoolingGroup.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { getAdminStats, getDemandByVillage, getRideStatusCounts, getRouteCapacity, getFinancialSummary, getDailyEarnings, getSystemHealth as getSystemHealthService } from '../services/analyticsService.js';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/errorHandler.js';
import { formatResponse, paginate } from '../utils/helpers.js';
import { createNotification } from '../services/notificationService.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const stats = await getAdminStats();
  const demandByVillage = await getDemandByVillage();
  const rideStatus = await getRideStatusCounts();
  const routeCapacity = await getRouteCapacity();
  
  res.json(formatResponse(true, {
    stats,
    demandByVillage,
    rideStatus,
    routeCapacity
  }));
});

export const getStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, villageId, isActive } = req.query;
  const query = { role: 'student' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const { skip, limit: l } = paginate(page, limit);
  
  const [students, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    User.countDocuments(query)
  ]);
  
  const studentsWithProfiles = await Promise.all(students.map(async (student) => {
    const profile = await StudentProfile.findOne({ user: student._id })
      .populate('village')
      .populate('homeStop');
    return { ...student.toObject(), profile };
  }));
  
  res.json(formatResponse(true, studentsWithProfiles, '', { page: parseInt(page), limit: l, total, pages: Math.ceil(total / l) }));
});

export const toggleStudentStatus = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new NotFoundError('Student not found');
  
  student.isActive = !student.isActive;
  await student.save();
  
  await AuditLog.create({
    admin: req.user._id,
    action: student.isActive ? 'activate_student' : 'deactivate_student',
    targetType: 'User',
    targetId: student._id,
    details: { name: student.name, email: student.email }
  });
  
  res.json(formatResponse(true, student, `Student ${student.isActive ? 'activated' : 'deactivated'}`));
});

export const getProviders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, verified, isActive } = req.query;
  const query = { role: 'provider' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const { skip, limit: l } = paginate(page, limit);
  
  const [providers, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
    User.countDocuments(query)
  ]);
  
  const providersWithProfiles = await Promise.all(providers.map(async (provider) => {
    const profile = await ProviderProfile.findOne({ user: provider._id })
      .populate('serviceAreas', 'name');
    const vehicles = await Vehicle.find({ provider: provider._id });
    return { ...provider.toObject(), profile, vehicleCount: vehicles.length };
  }));
  
  if (verified !== undefined) {
    const filtered = providersWithProfiles.filter(p => p.profile?.verified === (verified === 'true'));
    res.json(formatResponse(true, filtered, '', { page: 1, limit: filtered.length, total: filtered.length, pages: 1 }));
    return;
  }
  
  res.json(formatResponse(true, providersWithProfiles, '', { page: parseInt(page), limit: l, total, pages: Math.ceil(total / l) }));
});

export const verifyProvider = asyncHandler(async (req, res) => {
  const provider = await User.findOne({ _id: req.params.id, role: 'provider' });
  if (!provider) throw new NotFoundError('Provider not found');
  
  const profile = await ProviderProfile.findOneAndUpdate(
    { user: provider._id },
    { verified: true },
    { new: true }
  );
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'verify_provider',
    targetType: 'User',
    targetId: provider._id,
    details: { name: provider.name, email: provider.email }
  });
  
  await createNotification({
    userId: provider._id,
    type: 'provider_verified',
    title: 'Account Verified',
    message: 'Your provider account has been verified. You can now accept ride requests.',
    data: { profileId: profile._id }
  });
  
  res.json(formatResponse(true, profile, 'Provider verified'));
});

export const toggleProviderStatus = asyncHandler(async (req, res) => {
  const provider = await User.findOne({ _id: req.params.id, role: 'provider' });
  if (!provider) throw new NotFoundError('Provider not found');
  
  provider.isActive = !provider.isActive;
  await provider.save();
  
  await AuditLog.create({
    admin: req.user._id,
    action: provider.isActive ? 'activate_provider' : 'deactivate_provider',
    targetType: 'User',
    targetId: provider._id,
    details: { name: provider.name, email: provider.email }
  });
  
  res.json(formatResponse(true, provider, `Provider ${provider.isActive ? 'activated' : 'deactivated'}`));
});

export const getVillages = asyncHandler(async (req, res) => {
  const villages = await Village.find().sort({ name: 1 });
  res.json(formatResponse(true, villages));
});

export const createVillage = asyncHandler(async (req, res) => {
  const { name, block, district, coordinates } = req.body;
  
  const existing = await Village.findOne({ name: name.trim() });
  if (existing) throw new BadRequestError('Village with this name already exists');
  
  const village = await Village.create({
    name: name.trim(),
    block,
    district,
    coordinates: coordinates || { type: 'Point', coordinates: [79.8, 12.6] }
  });
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'create_village',
    targetType: 'Village',
    targetId: village._id,
    details: { name }
  });
  
  res.status(201).json(formatResponse(true, village, 'Village created'));
});

export const updateVillage = asyncHandler(async (req, res) => {
  const village = await Village.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!village) throw new NotFoundError('Village not found');
  
  res.json(formatResponse(true, village, 'Village updated'));
});

export const deleteVillage = asyncHandler(async (req, res) => {
  const village = await Village.findById(req.params.id);
  if (!village) throw new NotFoundError('Village not found');
  
  const stops = await Stop.countDocuments({ village: village._id });
  if (stops > 0) throw new BadRequestError(`Cannot delete: ${stops} stop(s) exist in this village`);
  
  await village.deleteOne();
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'delete_village',
    targetType: 'Village',
    targetId: req.params.id,
    details: { name: village.name }
  });
  
  res.json(formatResponse(true, null, 'Village deleted'));
});

export const getStops = asyncHandler(async (req, res) => {
  const { villageId } = req.query;
  const query = {};
  if (villageId) query.village = villageId;
  
  const stops = await Stop.find(query)
    .populate('village', 'name')
    .sort({ name: 1 });
  
  res.json(formatResponse(true, stops));
});

export const createStop = asyncHandler(async (req, res) => {
  const { name, villageId, coordinates, isCollege, collegeName, facilities } = req.body;
  
  const village = await Village.findById(villageId);
  if (!village) throw new NotFoundError('Village not found');
  
  const stop = await Stop.create({
    name: name.trim(),
    village: villageId,
    coordinates: coordinates || { type: 'Point', coordinates: [79.8, 12.6] },
    isCollege: isCollege || false,
    collegeName,
    facilities
  });
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'create_stop',
    targetType: 'Stop',
    targetId: stop._id,
    details: { name, village: village.name }
  });
  
  res.status(201).json(formatResponse(true, stop, 'Stop created'));
});

export const updateStop = asyncHandler(async (req, res) => {
  const stop = await Stop.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('village', 'name');
  if (!stop) throw new NotFoundError('Stop not found');
  
  res.json(formatResponse(true, stop, 'Stop updated'));
});

export const deleteStop = asyncHandler(async (req, res) => {
  const stop = await Stop.findById(req.params.id);
  if (!stop) throw new NotFoundError('Stop not found');
  
  const routes = await Route.countDocuments({
    $or: [{ stops: stop._id }, { collegeStop: stop._id }]
  });
  if (routes > 0) throw new BadRequestError(`Cannot delete: ${routes} route(s) reference this stop`);
  
  await stop.deleteOne();
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'delete_stop',
    targetType: 'Stop',
    targetId: req.params.id,
    details: { name: stop.name }
  });
  
  res.json(formatResponse(true, null, 'Stop deleted'));
});

export const getRoutes = asyncHandler(async (req, res) => {
  const routes = await Route.find()
    .populate('stops', 'name')
    .populate('collegeStop', 'name')
    .populate('bus')
    .sort({ code: 1 });
  
  res.json(formatResponse(true, routes));
});

export const createRoute = asyncHandler(async (req, res) => {
  const { code, name, stops, collegeStop, busId, distanceKm, estimatedDuration, isActive } = req.body;
  
  const existing = await Route.findOne({ code: code.trim().toUpperCase() });
  if (existing) throw new BadRequestError('Route with this code already exists');
  
  const route = await Route.create({
    code: code.trim().toUpperCase(),
    name: name.trim(),
    stops,
    collegeStop,
    bus: busId,
    distanceKm,
    estimatedDuration,
    isActive: isActive !== false
  });
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'create_route',
    targetType: 'Route',
    targetId: route._id,
    details: { code: route.code, name: route.name }
  });
  
  res.status(201).json(formatResponse(true, route, 'Route created'));
});

export const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('stops', 'name')
    .populate('collegeStop', 'name')
    .populate('bus');
  if (!route) throw new NotFoundError('Route not found');
  
  res.json(formatResponse(true, route, 'Route updated'));
});

export const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw new NotFoundError('Route not found');
  
  const schedules = await Schedule.countDocuments({ route: route._id });
  if (schedules > 0) throw new BadRequestError(`Cannot delete: ${schedules} schedule(s) exist for this route`);
  
  await route.deleteOne();
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'delete_route',
    targetType: 'Route',
    targetId: req.params.id,
    details: { code: route.code, name: route.name }
  });
  
  res.json(formatResponse(true, null, 'Route deleted'));
});

export const getSchedules = asyncHandler(async (req, res) => {
  const { routeId, status, date } = req.query;
  const query = {};
  if (routeId) query.route = routeId;
  if (status) query.status = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  }
  
  const schedules = await Schedule.find(query)
    .populate('route', 'code name')
    .populate('bus', 'registration capacity')
    .sort({ date: -1, departureTime: 1 });
  
  res.json(formatResponse(true, schedules));
});

export const createSchedule = asyncHandler(async (req, res) => {
  const { routeId, busId, date, departureTime, arrivalTime, availableSeats } = req.body;
  
  const route = await Route.findById(routeId);
  if (!route) throw new NotFoundError('Route not found');
  
  const bus = await Vehicle.findById(busId);
  if (!bus) throw new NotFoundError('Bus not found');
  if (bus.kind !== 'bus') throw new BadRequestError('Only buses can be scheduled');
  
  const schedule = await Schedule.create({
    route: routeId,
    bus: busId,
    date: new Date(date),
    departureTime,
    arrivalTime,
    availableSeats: availableSeats || bus.capacity,
    status: 'scheduled'
  });
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'create_schedule',
    targetType: 'Schedule',
    targetId: schedule._id,
    details: { route: route.code, date, departureTime }
  });
  
  res.status(201).json(formatResponse(true, schedule, 'Schedule created'));
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('route', 'code name')
    .populate('bus', 'registration capacity');
  if (!schedule) throw new NotFoundError('Schedule not found');
  
  res.json(formatResponse(true, schedule, 'Schedule updated'));
});

export const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw new NotFoundError('Schedule not found');
  
  await schedule.deleteOne();
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'delete_schedule',
    targetType: 'Schedule',
    targetId: req.params.id
  });
  
  res.json(formatResponse(true, null, 'Schedule deleted'));
});

export const getAllRideRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, providerId, studentId } = req.query;
  const query = {};
  if (status) query.status = status;
  if (providerId) query.provider = providerId;
  if (studentId) query.student = studentId;
  
  const { skip, limit: l } = paginate(page, limit);
  
  const [rides, total] = await Promise.all([
    RideRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('student', 'name email')
      .populate('provider', 'name')
      .populate('vehicle')
      .populate('originStop')
      .populate('destinationStop'),
    RideRequest.countDocuments(query)
  ]);
  
  res.json(formatResponse(true, rides, '', { page: parseInt(page), limit: l, total, pages: Math.ceil(total / l) }));
});

export const getFinancials = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const summary = await getFinancialSummary(startDate, endDate);
  const dailyEarnings = await getDailyEarnings(30);
  
  res.json(formatResponse(true, {
    summary,
    dailyEarnings
  }));
});

export const getSystemHealth = asyncHandler(async (req, res) => {
  const health = await getSystemHealthService();
  res.json(formatResponse(true, health));
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, adminId, targetType } = req.query;
  const query = {};
  if (action) query.action = action;
  if (adminId) query.admin = adminId;
  if (targetType) query.targetType = targetType;
  
  const { skip, limit: l } = paginate(page, limit);
  
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('admin', 'name email'),
    AuditLog.countDocuments(query)
  ]);
  
  res.json(formatResponse(true, logs, '', { page: parseInt(page), limit: l, total, pages: Math.ceil(total / l) }));
});

export const sendNotification = asyncHandler(async (req, res) => {
  const { userId, role, type, title, message, data } = req.body;
  
  if (!userId && !role) throw new BadRequestError('User ID or role required');
  
  if (userId) {
    await createNotification({ userId, type, title, message, data });
  } else {
    const users = await User.find({ role, isActive: true }).select('_id');
    for (const user of users) {
      await createNotification({ userId: user._id, type, title, message, data });
    }
  }
  
  await AuditLog.create({
    admin: req.user._id,
    action: 'send_notification',
    targetType: 'Notification',
    details: { type, title, userId, role }
  });
  
  res.json(formatResponse(true, null, 'Notification sent'));
});