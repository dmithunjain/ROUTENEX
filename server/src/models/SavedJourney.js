import mongoose from 'mongoose';

const savedJourneySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
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
  modes: [{
    type: String,
    enum: ['walk', 'bus', 'ev-auto', 'ev-two-wheeler']
  }],
  totalFare: {
    type: Number,
    default: 0
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  transfers: {
    type: Number,
    default: 0
  },
  segments: [{
    mode: {
      type: String,
      enum: ['walk', 'bus', 'ev-auto', 'ev-two-wheeler'],
      required: true
    },
    fromStop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop'
    },
    toStop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop'
    },
    fromName: String,
    toName: String,
    departTime: String,
    arriveTime: String,
    durationMinutes: Number,
    distanceKm: Number,
    detail: String,
    fare: Number,
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule'
    }
  }],
  isSample: {
    type: Boolean,
    default: false
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

savedJourneySchema.index({ student: 1 });
savedJourneySchema.index({ student: 1, createdAt: -1 });
savedJourneySchema.index({ originStop: 1, destinationStop: 1 });

export default mongoose.model('SavedJourney', savedJourneySchema);