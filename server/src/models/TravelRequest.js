import mongoose from 'mongoose';

const travelRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  departAfter: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format']
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    default: 1
  },
  status: {
    type: String,
    enum: ['open', 'pooled', 'cancelled', 'completed'],
    default: 'open'
  },
  note: String,
  poolingGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoolingGroup'
  },
  matchedStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    matchScore: Number,
    matchedAt: { type: Date, default: Date.now }
  }],
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

travelRequestSchema.index({ student: 1 });
travelRequestSchema.index({ status: 1 });
travelRequestSchema.index({ date: 1 });
travelRequestSchema.index({ originStop: 1, destinationStop: 1, date: 1 });
travelRequestSchema.index({ poolingGroup: 1 });

export default mongoose.model('TravelRequest', travelRequestSchema);