import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import RideRequest from '../models/RideRequest.js';
import { calculateCommission, formatResponse } from '../utils/helpers.js';

let razorpay = null;

const getRazorpay = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

export const createOrder = async (rideRequest) => {
  const commission = calculateCommission(rideRequest.fareEstimate);
  const providerAmount = rideRequest.fareEstimate - commission;
  
  const rzp = getRazorpay();
  if (!rzp) {
    throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }
  
  const order = await rzp.orders.create({
    amount: rideRequest.fareEstimate * 100,
    currency: 'INR',
    receipt: `ride_${rideRequest._id}`,
    notes: {
      rideRequestId: rideRequest._id.toString(),
      studentId: rideRequest.student.toString(),
      providerId: rideRequest.provider.toString()
    }
  });
  
  const payment = await Payment.create({
    rideRequest: rideRequest._id,
    student: rideRequest.student,
    provider: rideRequest.provider,
    amount: rideRequest.fareEstimate,
    platformCommission: commission,
    providerAmount,
    commissionPercent: 3,
    razorpayOrderId: order.id,
    status: 'pending',
    paymentMethod: 'razorpay'
  });
  
  return { order, payment };
};

export const verifyPayment = async (paymentId, orderId, signature, rideRequestId) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  
  if (generatedSignature !== signature) {
    throw new Error('Invalid payment signature');
  }
  
  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  
  if (!payment) {
    throw new Error('Payment record not found');
  }
  
  if (payment.status === 'completed') {
    return payment;
  }
  
  payment.razorpayPaymentId = paymentId;
  payment.razorpaySignature = signature;
  payment.status = 'completed';
  payment.verifiedAt = new Date();
  payment.gatewayResponse = { paymentId, orderId, signature };
  await payment.save();
  
  const rideRequest = await RideRequest.findByIdAndUpdate(
    rideRequestId,
    { 
      status: 'accepted',
      payment: payment._id,
      commission: {
        platformPercent: 3,
        platformAmount: payment.platformCommission,
        providerAmount: payment.providerAmount
      }
    },
    { new: true }
  );
  
  return payment;
};

export const handlePaymentFailure = async (orderId, failureReason) => {
  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  
  if (!payment) return null;
  
  payment.status = 'failed';
  payment.failureReason = failureReason;
  await payment.save();
  
  return payment;
};

export const processRefund = async (paymentId, amount, reason) => {
  const payment = await Payment.findById(paymentId);
  
  if (!payment) {
    throw new Error('Payment not found');
  }
  
  if (payment.status !== 'completed') {
    throw new Error('Cannot refund incomplete payment');
  }
  
  if (amount > payment.amount) {
    throw new Error('Refund amount exceeds payment amount');
  }
  
  const rzp = getRazorpay();
  if (!rzp) {
    throw new Error('Razorpay not configured');
  }
  
  const refund = await rzp.payments.refund(payment.razorpayPaymentId, {
    amount: amount * 100,
    notes: { reason }
  });
  
  payment.status = 'refunded';
  payment.refundAmount = amount;
  payment.refundReason = reason;
  payment.refundedAt = new Date();
  payment.razorpayRefundId = refund.id;
  await payment.save();
  
  const rideRequest = await RideRequest.findByIdAndUpdate(
    payment.rideRequest,
    { status: 'refunded' },
    { new: true }
  );
  
  return payment;
};

export const getProviderEarnings = async (providerId, startDate, endDate) => {
  const match = { provider: providerId };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const earnings = await Payment.aggregate([
    { $match: match },
    { $match: { status: 'completed' } },
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

export const getStudentPayments = async (studentId, options = {}) => {
  const { page = 1, limit = 10, status } = options;
  const query = { student: studentId };
  
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('rideRequest')
      .populate('provider', 'name'),
    Payment.countDocuments(query)
  ]);
  
  return {
    payments,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};

export const getPaymentByOrderId = async (orderId) => {
  return await Payment.findOne({ razorpayOrderId: orderId })
    .populate('rideRequest')
    .populate('student', 'name email')
    .populate('provider', 'name');
};

export const getPaymentByRideRequest = async (rideRequestId) => {
  return await Payment.findOne({ rideRequest: rideRequestId })
    .populate('student', 'name email')
    .populate('provider', 'name');
};