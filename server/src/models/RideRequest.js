import mongoose from 'mongoose';

const rideRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true
  },
  originStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
  },
  destinationStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format']
  },
  seats: {
    type: Number,
    required: true,
    min: 1
  },
  fareEstimate: {
    type: Number,
    required: true,
    min: 0
  },
  distanceKm: {
    type: Number,
    default: 0
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'in_progress', 'completed', 'refunded'],
    default: 'pending'
  },
  poolingGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoolingGroup'
  },
  note: String,
  rejectionReason: String,
  decidedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  commission: {
    platformPercent: { type: Number, default: 3 },
    platformAmount: { type: Number, default: 0 },
    providerAmount: { type: Number, default: 0 }
  },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date
  },
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

rideRequestSchema.index({ student: 1 });
rideRequestSchema.index({ provider: 1 });
rideRequestSchema.index({ vehicle: 1 });
rideRequestSchema.index({ status: 1 });
rideRequestSchema.index({ date: 1 });
rideRequestSchema.index({ poolingGroup: 1 });
rideRequestSchema.index({ createdAt: -1 });

export default mongoose.model('RideRequest', rideRequestSchema);