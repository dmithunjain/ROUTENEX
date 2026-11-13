import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  college: {
    type: String,
    trim: true,
    default: 'Govt. Arts & Science College, Uthiramerur'
  },
  village: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  },
  homeStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop'
  },
  departurePreference: {
    type: String,
    default: '08:00',
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format']
  },
  budget: {
    type: Number,
    default: 50,
    min: 0
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    preferredVehicleTypes: [{
      type: String,
      enum: ['bus', 'ev-auto', 'ev-two-wheeler']
    }],
    maxWalkDistance: {
      type: Number,
      default: 2.5
    }
  },
  stats: {
    totalJourneys: { type: Number, default: 0 },
    totalPoolingMatches: { type: Number, default: 0 },
    totalEVRequests: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 }
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

studentProfileSchema.index({ user: 1 });
studentProfileSchema.index({ village: 1 });
studentProfileSchema.index({ college: 1 });

export default mongoose.model('StudentProfile', studentProfileSchema);