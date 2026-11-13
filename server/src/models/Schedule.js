import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  departureTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format']
  },
  days: [{
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }],
  fare: {
    type: Number,
    required: true,
    min: 1
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['running', 'cancelled', 'delayed', 'completed'],
    default: 'running'
  },
  note: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

scheduleSchema.index({ route: 1 });
scheduleSchema.index({ bus: 1 });
scheduleSchema.index({ status: 1 });
scheduleSchema.index({ departureTime: 1 });
scheduleSchema.index({ days: 1 });
scheduleSchema.index({ route: 1, departureTime: 1, days: 1 });

export default mongoose.model('Schedule', scheduleSchema);