import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['booking_confirmation', 'cancellation', 'appointment_reminder', 'medication_reminder', 'leave_conflict'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'permanently_failed'],
    default: 'pending',
  },
  retryCount: { type: Number, default: 0 },
  payload: { type: mongoose.Schema.Types.Mixed }, // Data needed for retry
  scheduledAt: { type: Date, default: Date.now },
  sentAt: { type: Date },
  error: { type: String },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ status: 1, retryCount: 1, scheduledAt: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
