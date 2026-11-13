import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'update', 'delete', 'verify', 'approve', 'reject',
      'suspend', 'activate', 'cancel', 'restore', 'login', 'logout',
      'password_change', 'role_change', 'config_change', 'payout_initiate',
      'payout_complete', 'refund_process', 'document_verify'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: ['User', 'StudentProfile', 'ProviderProfile', 'Vehicle', 'Route', 'Schedule', 'RideRequest', 'TravelRequest', 'PoolingGroup', 'Payment', 'Payout', 'Notification', 'SystemConfig']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  oldData: mongoose.Schema.Types.Mixed,
  newData: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

auditLogSchema.index({ admin: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);