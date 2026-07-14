# System Design — Healthcare Appointment & Follow-up Manager

---

## Overview

The Healthcare Appointment & Follow-up Manager is a production-ready multi-tenant SaaS platform built on Next.js 16 App Router, MongoDB Atlas, and Groq AI. It serves three distinct user roles—patients, doctors, and admins—through dedicated portal experiences while sharing a single backend API layer and database.

---

## 1. Double-Booking Prevention

Preventing concurrent users from booking the same slot is one of the most critical challenges in appointment systems.

### Slot Hold Mechanism (5-Minute TTL)

When a patient selects a time slot, the system immediately creates a **slot hold record** in MongoDB with a 5-minute TTL (time-to-live) index. The key insight is using MongoDB's `findOneAndUpdate` with `upsert: true` and a conditional filter:

```javascript
await Slot.findOneAndUpdate(
  {
    doctorId, date, startTime,
    isBooked: false,
    $or: [{ heldBy: null }, { heldUntil: { $lt: new Date() } }]
  },
  { $set: { heldBy: userId, heldUntil: fiveMinutesFromNow } },
  { upsert: true, new: true }
)
```

This atomic operation ensures **only one request can succeed**. If a second concurrent request arrives for the same slot, it finds `heldBy` already set and fails with a `11000 duplicate key error` (caught and returned as a 409 Conflict). MongoDB guarantees the atomicity of this operation through its document-level locking.

### Appointment-Level Uniqueness Index

A compound unique index on `{ doctorId, date, startTime }` with a partial filter expression (`status IN ['confirmed', 'pending']`) provides a second layer of protection at the database level:

```javascript
AppointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['confirmed', 'pending'] } } }
)
```

Even if two requests somehow pass the slot hold check simultaneously, only one can successfully write the appointment — the other receives a duplicate key error, which is caught and returned as a user-friendly message.

### Slot Expiry

MongoDB's TTL index (`expireAfterSeconds: 0` on `heldUntil`) automatically deletes slot hold records whose `heldUntil` timestamp has passed. This means a patient who abandons the booking flow frees the slot automatically within minutes.

---

## 2. Doctor Leave Conflict Handling

When an admin marks a doctor as being on leave for one or more dates, the system must:

1. Detect all confirmed appointments for those dates
2. Cancel them atomically
3. Notify affected patients and the doctor via email

### Implementation

```javascript
// In PUT /api/doctors/[id]
const addedLeaveDays = newLeaveDays.filter(d => !existingLeaveDays.includes(d));

const conflicting = await Appointment.find({
  doctorId: id,
  date: { $in: addedLeaveDays },
  status: { $in: ['confirmed', 'pending'] }
}).populate('patientId');

for (const appt of conflicting) {
  appt.status = 'cancelled';
  appt.cancellationReason = 'Doctor is on scheduled leave';
  await appt.save();
  sendCancellationNotification({ ...appt, reason: '...' }).catch(console.error);
}
```

Email notifications are fire-and-forget (non-blocking) to avoid slowing down the API response. Failed notifications are queued in the `Notification` collection for retry.

### Google Calendar Events

If the affected appointments had associated Google Calendar events (`patientCalendarEventId`, `doctorCalendarEventId`), those would also be deleted via the Calendar API during conflict resolution (requires OAuth tokens to be stored).

---

## 3. Slot Hold Mechanism — Race Condition Analysis

Consider two patients (A and B) attempting to book the same slot at the exact same millisecond:

| Time | Patient A | Patient B |
|------|-----------|-----------|
| t=0 | GET /slots → slot shows available | GET /slots → slot shows available |
| t=1 | POST /slots/hold → MongoDB findOneAndUpdate | POST /slots/hold → MongoDB findOneAndUpdate |
| t=2 | ✅ Wins the atomic write, gets hold | ❌ Fails with 11000, gets 409 Conflict |
| t=3 | Patient A books within 5 min | Patient B sees "slot not available" |
| t=8 min | Patient A abandons → TTL deletes hold | Slot becomes available again |

The MongoDB operation is linearized at the database engine level, so even under high concurrency, only one writer can win.

---

## 4. Notification Failure Handling

Email delivery is inherently unreliable (SMTP timeouts, rate limits, spam filters). The system handles this with a persistence + retry pattern:

### Notification Queue (MongoDB)

Before attempting to send any email, a `Notification` document is created with `status: 'pending'`. After the email attempt:
- **Success** → status updated to `'sent'`
- **Failure** → status stays `'failed'`, `retryCount` incremented

### Retry Background Job (node-cron)

A cron job runs every 5 minutes to retry failed notifications:

```javascript
cron.schedule('*/5 * * * *', async () => {
  const failed = await Notification.find({
    status: 'failed',
    retryCount: { $lt: 3 },
  }).limit(20);

  for (const notif of failed) {
    // Re-attempt email send
    // On success: status = 'sent', sentAt = now
    // On failure: retryCount++, if >= 3 then status = 'permanently_failed'
  }
});
```

After 3 failed retries, the notification is marked `permanently_failed` for admin audit. This prevents infinite retry loops while still attempting reasonable recovery.

### Non-Blocking Pattern

All email sends are fire-and-forget from the API routes (`sendEmail(...).catch(console.error)`). The booking API returns a success response immediately without waiting for email delivery. This ensures the user experience is never degraded by email infrastructure issues.

---

## 5. AI (LLM) Failure Handling

Groq API calls can fail due to rate limits, model unavailability, or malformed responses. The system uses a graceful degradation pattern:

### Pre-Visit Summary
- Generated **asynchronously** after booking (non-blocking)
- If Groq fails: appointment is saved with `preVisitSummary.failed = true`
- Doctor sees "AI analysis failed — consult patient directly" message
- Patient sees "AI analysis unavailable" with raw symptoms still visible

### Post-Visit Summary
- Generated **synchronously** (awaited) when doctor submits notes
- If Groq fails: clinical notes are saved, summary = null
- Patient sees raw clinical notes with a "Retry AI Summary" button
- Doctor can trigger regeneration from the appointment detail page

### JSON Parsing Safety
```javascript
const cleaned = content
  .replace(/^```json?\n?/, '')
  .replace(/\n?```$/, '')
  .trim();
const parsed = JSON.parse(cleaned); // Wrapped in try/catch
```

All Groq response parsing is wrapped in try/catch. If the LLM returns malformed JSON, the function returns `null` and the system degrades gracefully.

---

## 6. Architecture Decisions

### Why Next.js App Router (Full-Stack)?
- Single codebase reduces operational complexity
- Server Components eliminate unnecessary client-side data fetching
- Route Handlers provide clean REST API endpoints
- Instrumentation hooks enable background job initialization

### Why MongoDB?
- Flexible schema accommodates evolving AI output structures
- TTL indexes natively handle slot expiry
- Atomic `findOneAndUpdate` is perfect for slot holds
- Atlas provides managed scaling for healthcare workloads

### Why Better Auth?
- Built-in session management with secure HTTP-only cookies
- Easy role extension via `additionalFields`
- MongoDB adapter for seamless integration

### Why Groq (not OpenAI)?
- Significantly faster inference (optimized hardware)
- `openai/gpt-oss-120b` provides quality output for medical summarization
- Compatible API format eases potential provider switching

---
