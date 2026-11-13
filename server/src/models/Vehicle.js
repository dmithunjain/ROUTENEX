import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true
  },
  kind: {
    type: String,
    enum: ['bus', 'ev-auto', 'ev-two-wheeler'],
    required: true
  },
  registration: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  available: {
    type: Boolean,
    default: true
  },
  batteryPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  rangeKm: {
    type: Number,
    min: 1,
    default: 50
  },
  farePerKm: {
    type: Number,
    min: 1,
    default: 10
  },
  locationStop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop'
  },
  features: {
    ac: { type: Boolean, default: false },
    gps: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    chargingPort: { type: Boolean, default: false }
  },
  documents: [{
    type: {
      type: String,
      enum: ['registration_certificate', 'insurance', 'fitness_certificate', 'permit', 'pollution_certificate'],
      required: true
    },
    name: String,
    url: String,
    expiryDate: Date,
    isVerified: { type: Boolean, default: false }
  }],
  lastMaintenance: Date,
  nextMaintenanceDue: Date,
  stats: {
    totalTrips: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
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

vehicleSchema.index({ provider: 1 });
vehicleSchema.index({ kind: 1 });
vehicleSchema.index({ registration: 1 });
vehicleSchema.index({ available: 1 });
vehicleSchema.index({ locationStop: 1 });

export default mongoose.model('Vehicle', vehicleSchema);