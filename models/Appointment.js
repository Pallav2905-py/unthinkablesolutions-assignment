import mongoose from 'mongoose';

const PrescriptionItemSchema = new mongoose.Schema({
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true }, // "Twice daily", "Every 8 hours"
  duration: { type: String, required: true },  // "7 days", "2 weeks"
  instructions: { type: String },
  reminderActive: { type: Boolean, default: true },
}, { _id: false });

const SymptomsSchema = new mongoose.Schema({
  text: { type: String, required: true },
  selfAssessedUrgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  duration: { type: String }, // "3 days", "1 week"
  additionalNotes: { type: String },
}, { _id: false });

const AISummarySchema = new mongoose.Schema({
  urgencyLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
  chiefComplaint: { type: String },
  suggestedQuestions: [{ type: String }],
  failed: { type: Boolean, default: false },
  generatedAt: { type: Date },
}, { _id: false });

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true }, // "2024-12-25"
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "09:30"
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'confirmed',
  },
  symptoms: SymptomsSchema,
  preVisitSummary: AISummarySchema,
  postVisitNotes: { type: String },
  postVisitSummary: { type: String },
  prescription: [PrescriptionItemSchema],
  // Google Calendar
  patientCalendarEventId: { type: String },
  doctorCalendarEventId: { type: String },
  // Notification flags
  reminderSent: { type: Boolean, default: false },
  confirmationSent: { type: Boolean, default: false },
  cancellationReason: { type: String },
  // Audit
  bookedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index for double-booking prevention
AppointmentSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['confirmed', 'pending'] } } });
AppointmentSchema.index({ patientId: 1, date: -1 });
AppointmentSchema.index({ doctorId: 1, date: -1 });

AppointmentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
