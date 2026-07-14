'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Brain, Loader2, Star, DollarSign, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays, startOfToday, isBefore, isToday } from 'date-fns';

function StepIndicator({ current, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
              background: i < current ? '#16a34a' : i === current ? 'linear-gradient(135deg,#16a34a,#059669)' : 'white',
              color: i <= current ? 'white' : '#9ca3af',
              border: i < current ? 'none' : i === current ? 'none' : '2px solid #e5e7eb',
              boxShadow: i === current ? '0 4px 16px rgba(22,163,74,0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {i < current ? <CheckCircle size={20} /> : i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: i === current ? 700 : 500, color: i === current ? '#16a34a' : '#9ca3af', whiteSpace: 'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#16a34a' : '#e5e7eb', margin: '0 8px', marginBottom: 24, transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId;

  const [step, setStep] = useState(0);
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotId, setSlotId] = useState(null);
  const [holdExpiry, setHoldExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [symptoms, setSymptoms] = useState({ text: '', urgency: 'Medium', duration: '', additionalNotes: '' });
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [calendarStart, setCalendarStart] = useState(0);

  const steps = ['Select Date', 'Choose Slot', 'Symptoms', 'Confirm'];

  // Load doctor info
  useEffect(() => {
    fetch(`/api/doctors/${doctorId}`)
      .then(r => r.json())
      .then(d => setDoctor(d.doctor));
  }, [doctorId]);

  // Load slots when date selected
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    fetch(`/api/slots/available?doctorId=${doctorId}&date=${dateStr}`)
      .then(r => r.json())
      .then(d => { setSlots(d.slots || []); setSlotsLoading(false); })
      .catch(() => setSlotsLoading(false));
  }, [selectedDate, doctorId]);

  // Countdown timer for slot hold
  useEffect(() => {
    if (!holdExpiry) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(holdExpiry) - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) { toast.error('Slot hold expired! Please reselect.'); setStep(1); setSelectedSlot(null); setSlotId(null); }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiry]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setStep(1);
  };

  const handleSlotSelect = async (slot) => {
    if (!slot.available) return;
    setLoading(true);

    try {
      const res = await fetch('/api/slots/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, date: format(selectedDate, 'yyyy-MM-dd'), startTime: slot.startTime, endTime: slot.endTime }),
      });
      const data = await res.json();

      if (!res.ok) { toast.error(data.error || 'Could not hold slot'); return; }

      setSelectedSlot(slot);
      setSlotId(data.slotId);
      setHoldExpiry(data.heldUntil);
      setTimeLeft(300);
      setStep(2);
      toast.success('Slot held for 5 minutes!');
    } catch {
      toast.error('Failed to hold slot');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!symptoms.text.trim()) { toast.error('Please describe your symptoms'); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          slotId,
          symptoms,
        }),
      });
      const data = await res.json();

      if (!res.ok) { toast.error(data.error || 'Booking failed'); return; }

      setStep(3);
      toast.success('Appointment booked successfully! 🎉');
    } catch {
      toast.error('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = startOfToday();
  const calendarDays = Array.from({ length: 14 }, (_, i) => addDays(today, i + calendarStart));

  if (!doctor) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280' }}>Loading doctor details...</p>
      </div>
    </div>
  );

  const doctorName = doctor.userId?.name || 'Doctor';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      {/* Back button */}
      <button onClick={() => step > 0 && step < 3 ? setStep(step - 1) : router.push('/patient/doctors')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 600, fontSize: 14, marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> {step > 0 && step < 3 ? 'Back' : 'All Doctors'}
      </button>

      {/* Doctor header */}
      <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e5e7eb', marginBottom: 32, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 24, flexShrink: 0 }}>
          {doctorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#111827', marginBottom: 6 }}>Dr. {doctorName}</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 999 }}>{doctor.specialisation}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280' }}><Star size={13} fill="#fbbf24" color="#fbbf24" /> {doctor.rating?.toFixed(1) || '—'} ({doctor.totalReviews || 0})</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280' }}><Clock size={13} /> {doctor.experience || 0}yr exp</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280' }}><DollarSign size={13} /> ₹{doctor.consultationFee || 500} / visit</span>
          </div>
        </div>
        {holdExpiry && step === 2 && (
          <div style={{ background: timeLeft < 60 ? '#fee2e2' : '#fef3c7', border: `1px solid ${timeLeft < 60 ? '#fecaca' : '#fde68a'}`, borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: timeLeft < 60 ? '#dc2626' : '#92400e' }}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 12, color: timeLeft < 60 ? '#dc2626' : '#92400e', fontWeight: 600 }}>slot hold expires</div>
          </div>
        )}
      </div>

      <StepIndicator current={step} steps={steps} />

      {/* Step 0: Date selection */}
      {step === 0 && (
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Select Appointment Date</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Choose a date from the next 14 days</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setCalendarStart(Math.max(0, calendarStart - 7))} disabled={calendarStart === 0}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e7eb', background: 'white', cursor: calendarStart === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: calendarStart === 0 ? '#d1d5db' : '#374151' }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
              {format(calendarDays[0], 'MMM d')} – {format(calendarDays[calendarDays.length - 1], 'MMM d, yyyy')}
            </span>
            <button onClick={() => setCalendarStart(calendarStart + 7)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#9ca3af', padding: '8px 0' }}>{d}</div>
            ))}
            {calendarDays.map((date, i) => {
              const dayName = format(date, 'EEEE');
              const isAvail = doctor.workingHours?.some(w => w.day === dayName && w.isAvailable);
              const isLeave = doctor.leaveDays?.includes(format(date, 'yyyy-MM-dd'));
              const isPast = isBefore(date, today);
              const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const disabled = !isAvail || isLeave || isPast;

              return (
                <button key={i} onClick={() => !disabled && handleDateSelect(date)} disabled={disabled}
                  style={{
                    padding: '12px 4px', borderRadius: 12, border: isSelected ? '2px solid #16a34a' : '1.5px solid transparent',
                    background: isSelected ? 'linear-gradient(135deg,#16a34a,#059669)' : disabled ? '#f9fafb' : 'white',
                    color: isSelected ? 'white' : disabled ? '#d1d5db' : '#111827',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    boxShadow: isSelected ? '0 4px 16px rgba(22,163,74,0.3)' : disabled ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { if (!disabled && !isSelected) { e.currentTarget.style.borderColor = '#86efac'; e.currentTarget.style.background = '#f0fdf4'; } }}
                  onMouseLeave={(e) => { if (!disabled && !isSelected) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'white'; } }}
                >
                  <div style={{ fontSize: 16, fontWeight: isSelected ? 800 : 600 }}>{format(date, 'd')}</div>
                  <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{isLeave ? 'Leave' : !isAvail ? 'Off' : isPast ? 'Past' : format(date, 'MMM')}</div>
                  {isToday(date) && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'white' : '#16a34a', margin: '4px auto 0' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Slot selection */}
      {step === 1 && selectedDate && (
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Choose a Time Slot</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>
            Available slots for <strong>{format(selectedDate, 'EEEE, MMMM d')}</strong>
          </p>

          {slotsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '40px 0', justifyContent: 'center' }}>
              <Loader2 size={24} color="#16a34a" style={{ animation: 'spin 0.7s linear infinite' }} />
              <span style={{ color: '#6b7280' }}>Loading available slots...</span>
            </div>
          ) : slots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Calendar size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ color: '#6b7280' }}>No slots available for this date.</p>
              <button onClick={() => setStep(0)} className="btn btn-secondary" style={{ marginTop: 16 }}>Choose Another Date</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
                {slots.map((slot, i) => (
                  <button key={i} onClick={() => handleSlotSelect(slot)} disabled={!slot.available || loading}
                    className={slot.available ? 'slot-available' : 'slot-booked'}
                    style={{ opacity: loading ? 0.7 : 1 }}>
                    {slot.startTime}
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{slot.available ? 'Available' : 'Booked'}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f0fdf4', border: '1.5px solid #86efac' }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f3f4f6', border: '1.5px solid #e5e7eb' }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Booked</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Symptoms form */}
      {step === 2 && (
        <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, background: '#ede9fe', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={22} color="#7c3aed" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Describe Your Symptoms</h2>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Our AI will generate a pre-visit summary to help Dr. {doctorName} prepare for your visit.</p>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Symptoms & Chief Complaint *</label>
            <textarea value={symptoms.text} onChange={(e) => setSymptoms({ ...symptoms, text: e.target.value })}
              placeholder="Describe your main symptoms in detail. E.g., 'I have been experiencing severe headaches for 3 days, mostly in the morning. The pain is on the right side and is throbbing. I also feel nauseous...'"
              rows={5}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s', lineHeight: 1.6 }}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <label className="label">Self-Assessed Urgency</label>
              <select value={symptoms.urgency} onChange={(e) => setSymptoms({ ...symptoms, urgency: e.target.value })} className="input">
                <option value="Low">🟢 Low — Not urgent</option>
                <option value="Medium">🟡 Medium — Needs attention</option>
                <option value="High">🔴 High — Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Duration</label>
              <input type="text" placeholder="e.g., 3 days, 1 week" value={symptoms.duration}
                onChange={(e) => setSymptoms({ ...symptoms, duration: e.target.value })} className="input" />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label className="label">Additional Notes <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={symptoms.additionalNotes} onChange={(e) => setSymptoms({ ...symptoms, additionalNotes: e.target.value })}
              placeholder="Any medications you're currently taking, allergies, or other relevant information..."
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 12, padding: 16, marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Brain size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginBottom: 4 }}>AI-Powered Pre-Visit Analysis</p>
              <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                Your symptoms will be analysed by Groq AI to generate an urgency level, chief complaint, and suggested questions for your doctor — helping them prepare for your visit.
              </p>
            </div>
          </div>

          <button onClick={handleBook} disabled={loading || !symptoms.text.trim()}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: !symptoms.text.trim() ? '#d1d5db' : 'linear-gradient(135deg,#16a34a,#059669)',
              color: 'white', fontWeight: 700, fontSize: 16, border: 'none',
              cursor: !symptoms.text.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: symptoms.text.trim() ? '0 4px 20px rgba(22,163,74,0.3)' : 'none',
            }}>
            {loading ? <><Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite' }} /> Booking your appointment...</> : <>Confirm Booking <ArrowRight size={20} /></>}
          </button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '60px 32px', background: 'white', borderRadius: 20, border: '1px solid #e5e7eb' }}>
          <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#16a34a,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(22,163,74,0.3)', animation: 'scaleIn 0.5s ease' }}>
            <CheckCircle size={40} color="white" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: '#111827', marginBottom: 12 }}>
            Appointment Confirmed! 🎉
          </h2>
          <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 8 }}>
            Your appointment with <strong>Dr. {doctorName}</strong> is booked for
          </p>
          <p style={{ color: '#16a34a', fontSize: 20, fontWeight: 800, marginBottom: 32 }}>
            {selectedDate && format(selectedDate, 'EEEE, MMMM d')} at {selectedSlot?.startTime}
          </p>

          <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 20, marginBottom: 32, textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
              <Brain size={18} color="#7c3aed" />
              <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>AI Analysis in Progress</span>
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
              Our AI is analysing your symptoms to prepare a pre-visit summary for Dr. {doctorName}. You'll be able to view it in your appointment details.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/patient/appointments')} className="btn btn-primary btn-lg">
              View My Appointments
            </button>
            <button onClick={() => router.push('/patient/doctors')} className="btn btn-secondary btn-lg">
              Book Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
