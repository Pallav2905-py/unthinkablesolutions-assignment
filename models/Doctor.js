import mongoose from 'mongoose';

const WorkingHoursSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
  isAvailable: { type: Boolean, default: true },
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialisation: { type: String, required: true, trim: true },
  bio: { type: String, trim: true },
  experience: { type: Number, default: 0 }, // years
  qualifications: [{ type: String }],
  workingHours: [WorkingHoursSchema],
  slotDurationMinutes: { type: Number, default: 30 },
  leaveDays: [{ type: String }], // ISO date strings "2024-12-25"
  consultationFee: { type: Number, default: 500 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

DoctorSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

DoctorSchema.index({ specialisation: 'text', bio: 'text' });

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
