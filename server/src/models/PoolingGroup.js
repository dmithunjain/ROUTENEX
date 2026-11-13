import mongoose from 'mongoose';

const poolingGroupSchema = new mongoose.Schema({
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
  departAfter: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format']
  },
  seats: {
    type: Number,
    required: true,
    min: 1
  },
  memberStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  memberRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TravelRequest'
  }],
  status: {
    type: String,
    enum: ['proposed', 'vehicle_requested', 'confirmed', 'cancelled', 'completed'],
    default: 'proposed'
  },
  vehicleRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RideRequest'
  },
  suggestedPickupStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop'
  },
  note: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

poolingGroupSchema.index({ status: 1 });
poolingGroupSchema.index({ date: 1 });
poolingGroupSchema.index({ memberStudents: 1 });
poolingGroupSchema.index({ originStop: 1, destinationStop: 1, date: 1 });
poolingGroupSchema.index({ vehicleRequest: 1 });

export default mongoose.model('PoolingGroup', poolingGroupSchema);