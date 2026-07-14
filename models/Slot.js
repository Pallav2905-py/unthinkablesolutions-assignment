import mongoose from 'mongoose';

// Slot hold mechanism — TTL index expires held slots automatically
const SlotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  heldUntil: { type: Date, default: null }, // TTL expires hold after 5 min
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
});

// TTL index — MongoDB auto-deletes held-but-unbooked slots after 5 minutes
SlotSchema.index({ heldUntil: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { isBooked: false } });
SlotSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.models.Slot || mongoose.model('Slot', SlotSchema);
