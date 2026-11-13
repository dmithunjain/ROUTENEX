import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderProfile',
    required: true
  },
  stops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: true
  }],
  fare: {
    type: Number,
    required: true,
    min: 1
  },
  color: {
    type: String,
    default: '#157456'
  },
  distance: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: String,
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

routeSchema.index({ provider: 1 });
routeSchema.index({ code: 1 });
routeSchema.index({ isActive: 1 });
routeSchema.index({ stops: 1 });

export default mongoose.model('Route', routeSchema);