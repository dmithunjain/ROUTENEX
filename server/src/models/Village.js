import mongoose from 'mongoose';

const villageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  block: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  coordinates: {
    type: [Number],
    index: '2dsphere'
  },
  isActive: {
    type: Boolean,
    default: true
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

villageSchema.index({ name: 1 });
villageSchema.index({ block: 1, district: 1 });
villageSchema.index({ coordinates: '2dsphere' });

export default mongoose.model('Village', villageSchema);