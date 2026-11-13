import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  village: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: true
  },
  coordinates: {
    type: [Number],
    required: true,
    index: '2dsphere'
  },
  isCollege: {
    type: Boolean,
    default: false
  },
  collegeName: String,
  address: String,
  landmarks: [String],
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

stopSchema.index({ village: 1 });
stopSchema.index({ isCollege: 1 });
stopSchema.index({ coordinates: '2dsphere' });
stopSchema.index({ name: 1, village: 1 }, { unique: true });

export default mongoose.model('Stop', stopSchema);