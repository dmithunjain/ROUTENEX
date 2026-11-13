import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'ride_request',
      'ride_accepted',
      'ride_rejected',
      'ride_cancelled',
      'ride_started',
      'ride_completed',
      'payment_received',
      'payment_failed',
      'provider_verification',
      'provider_approved',
      'provider_rejected',
      'schedule_cancelled',
      'pooling_match',
      'pooling_group_created',
      'pooling_vehicle_requested',
      'system_announcement',
      'admin_action'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: mongoose.Schema.Types.Mixed,
  relatedEntity: {
    type: { type: String, enum: ['RideRequest', 'TravelRequest', 'PoolingGroup', 'ProviderProfile', 'Vehicle', 'Schedule', 'Payment', 'User'] },
    id: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });

export default mongoose.model('Notification', notificationSchema);