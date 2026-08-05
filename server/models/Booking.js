const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending', 'approved', 'rejected'], default: 'pending' },
    paymentStatus: { type: String, enum: ['paid', 'not_paid', 'pending'], default: 'not_paid' },
    amount: { type: Number, required: true },
    paymentScreenshot: { type: String, default: '' },
    ticketId: { type: String, unique: true, sparse: true },
    qrCode: { type: String, default: '' },
    seatNumber: { type: String, default: '' },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    bookedAt: { type: Date, default: Date.now }
}, { timestamps: true });

bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1 });
bookingSchema.index({ userId: 1, eventId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
