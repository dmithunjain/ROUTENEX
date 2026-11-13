import Notification from '../models/Notification.js';

export const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

export const createNotifications = async (notifications) => {
  try {
    const created = await Notification.insertMany(notifications);
    return created;
  } catch (error) {
    console.error('Create notifications error:', error);
    return [];
  }
};

export const notifyRideRequest = async (rideRequest) => {
  await createNotification({
    recipient: rideRequest.provider,
    sender: rideRequest.student,
    type: 'ride_request',
    title: 'New Ride Request',
    message: `You have a new ride request from ${rideRequest.student.name}`,
    data: {
      rideRequestId: rideRequest._id,
      origin: rideRequest.originStop,
      destination: rideRequest.destinationStop,
      pickupTime: rideRequest.pickupTime,
      seats: rideRequest.seats
    },
    relatedEntity: { type: 'RideRequest', id: rideRequest._id },
    priority: 'high'
  });
};

export const notifyRideAccepted = async (rideRequest) => {
  await createNotification({
    recipient: rideRequest.student,
    sender: rideRequest.provider,
    type: 'ride_accepted',
    title: 'Ride Request Accepted',
    message: `Your ride request has been accepted by ${rideRequest.provider.name}`,
    data: {
      rideRequestId: rideRequest._id,
      providerName: rideRequest.provider.name,
      providerPhone: rideRequest.provider.phone,
      pickupTime: rideRequest.pickupTime
    },
    relatedEntity: { type: 'RideRequest', id: rideRequest._id },
    priority: 'high'
  });
};

export const notifyRideRejected = async (rideRequest, reason) => {
  await createNotification({
    recipient: rideRequest.student,
    sender: rideRequest.provider,
    type: 'ride_rejected',
    title: 'Ride Request Rejected',
    message: `Your ride request was rejected: ${reason}`,
    data: {
      rideRequestId: rideRequest._id,
      rejectionReason: reason
    },
    relatedEntity: { type: 'RideRequest', id: rideRequest._id },
    priority: 'medium'
  });
};

export const notifyRideCancelled = async (rideRequest, cancelledBy, reason) => {
  const recipient = cancelledBy === 'student' ? rideRequest.provider : rideRequest.student;
  const sender = cancelledBy === 'student' ? rideRequest.student : rideRequest.provider;
  
  await createNotification({
    recipient,
    sender,
    type: 'ride_cancelled',
    title: 'Ride Cancelled',
    message: `The ride has been cancelled by ${sender.name}. Reason: ${reason}`,
    data: {
      rideRequestId: rideRequest._id,
      cancelledBy,
      cancellationReason: reason
    },
    relatedEntity: { type: 'RideRequest', id: rideRequest._id },
    priority: 'medium'
  });
};

export const notifyRideCompleted = async (rideRequest) => {
  await createNotification({
    recipient: rideRequest.provider,
    sender: rideRequest.student,
    type: 'ride_completed',
    title: 'Ride Completed',
    message: `Ride to ${rideRequest.destinationStop.name} has been completed`,
    data: {
      rideRequestId: rideRequest._id,
      fare: rideRequest.fareEstimate
    },
    relatedEntity: { type: 'RideRequest', id: rideRequest._id },
    priority: 'low'
  });
};

export const notifyProviderVerification = async (provider, admin) => {
  await createNotification({
    recipient: provider.user,
    sender: admin,
    type: 'provider_verification',
    title: 'Verification Status Update',
    message: `Your provider verification status has been updated`,
    data: {
      providerId: provider._id,
      status: provider.verificationStatus
    },
    relatedEntity: { type: 'ProviderProfile', id: provider._id },
    priority: 'high'
  });
};

export const notifyPoolingMatch = async (student, matches) => {
  await createNotification({
    recipient: student._id,
    type: 'pooling_match',
    title: 'New Pooling Matches Found',
    message: `Found ${matches.length} compatible students for your journey`,
    data: {
      matches: matches.map(m => ({
        studentId: m.student._id,
        studentName: m.student.name,
        matchScore: m.matchScore
      }))
    },
    relatedEntity: { type: 'TravelRequest', id: matches[0]?.request?._id },
    priority: 'medium'
  });
};

export const notifyPoolingGroupCreated = async (group, students) => {
  const notifications = students.map(student => ({
    recipient: student,
    type: 'pooling_group_created',
    title: 'Pooling Group Created',
    message: `A pooling group has been created for your journey to ${group.destinationStop.name}`,
    data: {
      groupId: group._id,
      origin: group.originStop,
      destination: group.destinationStop,
      departAfter: group.departAfter,
      seats: group.seats
    },
    relatedEntity: { type: 'PoolingGroup', id: group._id },
    priority: 'medium'
  }));
  
  await createNotifications(notifications);
};

export const notifyScheduleCancelled = async (schedule, students) => {
  const notifications = students.map(student => ({
    recipient: student,
    type: 'schedule_cancelled',
    title: 'Bus Service Cancelled',
    message: `Bus service ${schedule.route.code} at ${schedule.departureTime} has been cancelled. ${schedule.note || ''}`,
    data: {
      scheduleId: schedule._id,
      routeCode: schedule.route.code,
      departureTime: schedule.departureTime,
      note: schedule.note
    },
    relatedEntity: { type: 'Schedule', id: schedule._id },
    priority: 'high'
  }));
  
  await createNotifications(notifications);
};

export const notifyPaymentReceived = async (payment) => {
  await createNotification({
    recipient: payment.provider,
    type: 'payment_received',
    title: 'Payment Received',
    message: `Payment of ₹${payment.providerAmount} received for ride ${payment.rideRequest._id}`,
    data: {
      paymentId: payment._id,
      rideRequestId: payment.rideRequest,
      amount: payment.providerAmount,
      commission: payment.platformCommission
    },
    relatedEntity: { type: 'Payment', id: payment._id },
    priority: 'medium'
  });
};

export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};

export const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

export const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

export const getUserNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 20, isRead, type } = options;
  const query = { recipient: userId };
  
  if (isRead !== undefined) query.isRead = isRead;
  if (type) query.type = type;
  
  const skip = (page - 1) * limit;
  
  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email')
      .populate('relatedEntity.id'),
    Notification.countDocuments(query)
  ]);
  
  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};