import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true
  },
  rideRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RideRequest'
  }],
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  totalBookingAmount: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'razorpay_route', 'manual'],
    default: 'bank_transfer'
  },
  razorpayPayoutId: String,
  razorpayPayoutStatus: String,
  initiatedAt: Date,
  processedAt: Date,
  completedAt: Date,
  failureReason: String,
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

payoutSchema.index({ provider: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ createdAt: -1 });
payoutSchema.index({ razorpayPayoutId: 1 });

export default mongoose.model('Payout', payoutSchema);