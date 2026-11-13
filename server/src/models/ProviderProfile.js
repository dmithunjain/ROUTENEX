import mongoose from 'mongoose';

const providerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['bus', 'ev'],
    required: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  serviceAreas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  }],
  verified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resubmission_required'],
    default: 'pending'
  },
  verificationNotes: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  available: {
    type: Boolean,
    default: true
  },
  documents: [{
    type: {
      type: String,
      enum: ['driving_license', 'vehicle_registration', 'insurance', 'id_proof', 'address_proof', 'other'],
      required: true
    },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    rejectedReason: String
  }],
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String,
    upiId: String,
    isVerified: { type: Boolean, default: false }
  },
  operatingHours: {
    start: { type: String, default: '06:00' },
    end: { type: String, default: '22:00' }
  },
  estimatedFarePerKm: {
    type: Number,
    default: 10
  },
  stats: {
    totalVehicles: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    netEarnings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
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

providerProfileSchema.index({ user: 1 });
providerProfileSchema.index({ verified: 1 });
providerProfileSchema.index({ available: 1 });
providerProfileSchema.index({ serviceAreas: 1 });
providerProfileSchema.index({ 'address.coordinates': '2dsphere' });

export default mongoose.model('ProviderProfile', providerProfileSchema);