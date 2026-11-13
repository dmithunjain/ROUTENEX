import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Vehicle from '../models/Vehicle.js';
import Route from '../models/Route.js';
import Schedule from '../models/Schedule.js';
import TravelRequest from '../models/TravelRequest.js';
import RideRequest from '../models/RideRequest.js';
import PoolingGroup from '../models/PoolingGroup.js';
import Payment from '../models/Payment.js';
import Village from '../models/Village.js';
import Stop from '../models/Stop.js';

export const getAdminStats = async () => {
  const [
    students,
    providers,
    verifiedProviders,
    buses,
    evs,
    availableEvs,
    routes,
    schedules,
    cancelled,
    pendingRides,
    activePools,
    openTravelRequests
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'provider', isActive: true }),
    ProviderProfile.countDocuments({ verified: true }),
    Vehicle.countDocuments({ kind: 'bus' }),
    Vehicle.countDocuments({ kind: { $in: ['ev-auto', 'ev-two-wheeler'] } }),
    Vehicle.countDocuments({ kind: { $in: ['ev-auto', 'ev-two-wheeler'] }, available: true }),
    Route.countDocuments({ isActive: true }),
    Schedule.countDocuments(),
    Schedule.countDocuments({ status: 'cancelled' }),
    RideRequest.countDocuments({ status: 'pending' }),
    PoolingGroup.countDocuments({ status: 'proposed' }),
    TravelRequest.countDocuments({ status: 'open' })
  ]);
  
  return {
    students,
    providers,
    verifiedProviders,
    buses,
    evs,
    availableEvs,
    routes,
    schedules,
    cancelled,
    pendingRides,
    activePools,
    openTravelRequests
  };
};

export const getDemandByVillage = async () => {
  const requests = await TravelRequest.find({ status: 'open' })
    .populate({
      path: 'originStop',
      populate: { path: 'village', select: 'name' }
    });
  
  const counts = {};
  requests.forEach(request => {
    const village = request.originStop?.village?.name || 'Unknown';
    counts[village] = (counts[village] || 0) + (request.seats || 1);
  });
  
  return Object.entries(counts)
    .map(([village, requests]) => ({ village, requests }))
    .sort((a, b) => b.requests - a.requests);
};

export const getRideStatusCounts = async () => {
  const counts = await RideRequest.aggregate([
    { $group: { _id: '$status', value: { $sum: 1 } } }
  ]);
  
  const statusMap = { pending: 0, accepted: 0, rejected: 0, completed: 0, cancelled: 0 };
  counts.forEach(c => { if (statusMap[c._id] !== undefined) statusMap[c._id] = c.value; });
  
  return Object.entries(statusMap).map(([status, value]) => ({ status, value }));
};

export const getProviderStats = async (providerId) => {
  const [vehicles, available, pending, accepted] = await Promise.all([
    Vehicle.countDocuments({ provider: providerId }),
    Vehicle.countDocuments({ provider: providerId, available: true }),
    RideRequest.countDocuments({ provider: providerId, status: 'pending' }),
    RideRequest.countDocuments({ provider: providerId, status: 'accepted' })
  ]);
  
  return { vehicles, available, pending, accepted };
};

export const getRouteCapacity = async () => {
  const routes = await Route.find({ isActive: true });
  const result = [];
  
  for (const route of routes) {
    const schedules = await Schedule.find({ route: route._id, status: 'running' })
      .populate('bus');
    
    let seats = 0;
    let available = 0;
    
    for (const schedule of schedules) {
      if (schedule.bus) {
        seats += schedule.bus.capacity;
        available += schedule.availableSeats;
      }
    }
    
    result.push({
      route: `${route.code} · ${route.name}`,
      seats,
      available
    });
  }
  
  return result;
};

export const getRouteLabel = async (routeId) => {
  const route = await Route.findById(routeId).select('code name');
  return route ? `${route.code} · ${route.name}` : 'Route removed';
};

export const getFinancialSummary = async (startDate, endDate) => {
  const match = { status: 'completed' };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const payments = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBookingAmount: { $sum: '$amount' },
        totalCommission: { $sum: '$platformCommission' },
        totalProviderAmount: { $sum: '$providerAmount' },
        totalRefunds: { $sum: '$refundAmount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const pendingPayouts = await Payment.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$provider',
        pendingAmount: { $sum: '$providerAmount' }
      }
    }
  ]);
  
  return {
    summary: payments[0] || { totalBookingAmount: 0, totalCommission: 0, totalProviderAmount: 0, totalRefunds: 0, count: 0 },
    pendingPayouts: pendingPayouts.reduce((sum, p) => sum + p.pendingAmount, 0),
    providerCount: pendingPayouts.length
  };
};

export const getDailyEarnings = async (days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const earnings = await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        commission: { $sum: '$platformCommission' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return earnings;
};

export const getProviderEarnings = async (providerId, startDate, endDate) => {
  const match = { provider: providerId, status: 'completed' };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const earnings = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalBookingAmount: { $sum: '$amount' },
        totalCommission: { $sum: '$platformCommission' },
        totalProviderAmount: { $sum: '$providerAmount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return earnings[0] || { totalBookingAmount: 0, totalCommission: 0, totalProviderAmount: 0, count: 0 };
};

export const getSystemHealth = async () => {
  const [
    totalUsers,
    activeUsers,
    totalProviders,
    verifiedProviders,
    totalVehicles,
    availableVehicles,
    totalSchedules,
    runningSchedules,
    cancelledSchedules,
    pendingRides,
    totalPayments,
    completedPayments
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: true, lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    User.countDocuments({ role: 'provider', isActive: true }),
    ProviderProfile.countDocuments({ verified: true }),
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ available: true }),
    Schedule.countDocuments(),
    Schedule.countDocuments({ status: 'running' }),
    Schedule.countDocuments({ status: 'cancelled' }),
    RideRequest.countDocuments({ status: 'pending' }),
    Payment.countDocuments(),
    Payment.countDocuments({ status: 'completed' })
  ]);
  
  return {
    users: { total: totalUsers, active: activeUsers },
    providers: { total: totalProviders, verified: verifiedProviders },
    vehicles: { total: totalVehicles, available: availableVehicles },
    schedules: { total: totalSchedules, running: runningSchedules, cancelled: cancelledSchedules },
    rides: { pending: pendingRides },
    payments: { total: totalPayments, completed: completedPayments }
  };
};