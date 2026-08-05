const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const Notification = require('../models/Notification');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');
const { uploadToCloudinary } = require('../utils/cloudinary');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { generateOTP } = require('../utils/helpers');

const generateTicketId = () => {
    const id = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
    return `EVT-${id}`;
};

exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });

        try {
            await sendOTPEmail(req.user.email, otp, 'event_booking');
        } catch (emailErr) {
            console.warn('Booking OTP email sending warning (OTP created in DB):', emailErr.message);
        }

        console.log(`[BOOKING OTP] Email: ${req.user.email} | OTP: ${otp}`);
        res.json({ message: 'OTP sent successfully to email' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;
        if (!eventId) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        if (!otp) {
            return res.status(400).json({ message: 'OTP is required to confirm booking' });
        }

        // Verify OTP explicitly before proceeding
        const validOTP = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!validOTP && otp !== '123456') { // Accept valid OTP or test OTP 123456
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available for this event' });

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled' && existingBooking.status !== 'rejected') {
            return res.status(400).json({ message: 'You have already booked this event' });
        }

        if (validOTP) {
            try { await OTP.deleteOne({ _id: validOTP._id }); } catch {}
        }

        const isPaid = event.ticketPrice > 0;

        if (isPaid) {
            // Paid Event: Create pending booking requiring payment screenshot upload
            const booking = await Booking.create({
                userId: req.user.id,
                eventId,
                status: 'pending',
                paymentStatus: 'not_paid',
                amount: event.ticketPrice
            });

            return res.status(201).json({
                message: 'Booking initiated. Please upload your payment screenshot to complete booking.',
                booking,
                requiresPayment: true
            });
        }

        // Free Event: Auto-approve & issue QR Ticket immediately
        const ticketId = generateTicketId();
        const seatNumber = `S${event.totalSeats - event.availableSeats + 1}`;

        const qrData = JSON.stringify({
            ticketId,
            eventId: event._id,
            userId: req.user.id,
            eventName: event.title,
            userName: req.user?.name || 'Attendee',
            seatNumber
        });

        const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'approved',
            paymentStatus: 'paid',
            amount: 0,
            ticketId,
            seatNumber,
            qrCode
        });

        event.availableSeats = Math.max(0, event.availableSeats - 1);
        await event.save();

        res.status(201).json({ message: 'Booking confirmed & QR Ticket generated!', booking, requiresPayment: false });
    } catch (error) {
        console.error('bookEvent error:', error);
        res.status(500).json({ message: 'Booking process error', error: error.message });
    }
};

// Upload payment screenshot & submit for Organizer / Admin approval
exports.uploadPaymentScreenshot = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No screenshot file uploaded' });

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const event = await Event.findById(booking.eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.availableSeats <= 0 && booking.status !== 'approved') {
            return res.status(400).json({ message: 'No seats available for this event' });
        }

        const result = await uploadToCloudinary(req.file.buffer, 'evora/payments', req.file.mimetype);
        booking.paymentScreenshot = result.secure_url;
        booking.paymentStatus = 'pending';
        booking.status = 'pending';

        await booking.save();

        res.json({
            message: 'Payment screenshot submitted! Your booking is pending verification. Organizer or Admin will approve your ticket shortly.',
            booking,
            screenshot: result.secure_url
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
};

// Admin: approve booking + generate QR ticket
exports.approveBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'approved' || booking.status === 'confirmed') {
            return res.status(400).json({ message: 'Booking already approved' });
        }

        const event = await Event.findById(booking.eventId._id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to approve bookings for this event' });
        }

        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available' });
        }

        // Generate unique ticket ID and QR code
        const ticketId = generateTicketId();
        const seatNumber = `S${event.totalSeats - event.availableSeats + 1}`;
        const targetUserId = booking.userId?._id || booking.userId;
        const targetUserName = booking.userId?.name || 'Attendee';
        const targetUserEmail = booking.userId?.email;

        const qrData = JSON.stringify({
            ticketId,
            bookingId: booking._id,
            eventId: event._id,
            userId: targetUserId,
            eventName: event.title,
            userName: targetUserName,
            seatNumber
        });

        const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

        booking.status = 'approved';
        booking.paymentStatus = 'paid';
        booking.ticketId = ticketId;
        booking.qrCode = qrCode;
        booking.seatNumber = seatNumber;
        await booking.save();

        event.availableSeats = Math.max(0, event.availableSeats - 1);
        await event.save();

        // Send email notification if user email exists
        if (targetUserEmail) {
            try {
                await sendBookingEmail(targetUserEmail, targetUserName, event.title);
            } catch (emailErr) {
                console.warn('Booking approval email warning:', emailErr.message);
            }
        }

        // Create notification
        try {
            await Notification.create({
                userId: targetUserId,
                type: 'booking_approved',
                title: 'Booking Approved!',
                message: `Your booking for "${event.title}" has been approved. Your ticket ID is ${ticketId}.`,
                link: `/dashboard`
            });
        } catch (notifErr) {
            console.warn('Notification creation warning:', notifErr.message);
        }

        res.json({ message: 'Booking approved, QR ticket generated', booking });
    } catch (error) {
        console.error('approveBooking error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Admin & Organizer: reject booking
exports.rejectBooking = async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = 'rejected';
        booking.rejectionReason = reason || 'Payment not verified';
        await booking.save();

        const targetUserId = booking.userId?._id || booking.userId;
        if (targetUserId) {
            try {
                await Notification.create({
                    userId: targetUserId,
                    type: 'booking_rejected',
                    title: 'Booking Rejected',
                    message: `Your booking for "${booking.eventId?.title || 'Event'}" was rejected. Reason: ${booking.rejectionReason}`,
                    link: `/dashboard`
                });
            } catch (notifErr) {}
        }

        res.json({ message: 'Booking rejected', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Legacy confirm (kept for backward compat)
exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed' || booking.status === 'approved') {
            return res.status(400).json({ message: 'Booking is already confirmed' });
        }

        const event = await Event.findById(booking.eventId._id);
        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        // Generate ticket if not already generated
        if (!booking.ticketId) {
            const ticketId = generateTicketId();
            const seatNumber = `S${event.totalSeats - event.availableSeats + 1}`;
            const qrData = JSON.stringify({
                ticketId, bookingId: booking._id, eventId: event._id,
                userId: booking.userId._id, eventName: event.title,
                userName: booking.userId.name, seatNumber
            });
            booking.ticketId = ticketId;
            booking.qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
            booking.seatNumber = seatNumber;
        }

        booking.status = 'approved';
        if (paymentStatus) booking.paymentStatus = paymentStatus;
        await booking.save();

        event.availableSeats -= 1;
        await event.save();

        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// QR Check-in verification
exports.verifyTicket = async (req, res) => {
    try {
        const { ticketId } = req.body;
        const booking = await Booking.findOne({ ticketId })
            .populate('userId', 'name email')
            .populate('eventId', 'title date location')
            .lean();

        if (!booking) {
            return res.status(404).json({ status: 'invalid', message: 'Invalid ticket' });
        }

        if (booking.checkedIn) {
            return res.status(400).json({
                status: 'already_checked_in',
                message: `Already checked in at ${new Date(booking.checkedInAt).toLocaleString()}`,
                booking
            });
        }

        if (booking.status !== 'approved' && booking.status !== 'confirmed') {
            return res.status(400).json({ status: 'invalid', message: 'Ticket not approved' });
        }

        booking.checkedIn = true;
        booking.checkedInAt = new Date();
        await booking.save();

        res.json({ status: 'valid', message: 'Check-in successful!', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get ticket for user display
exports.getTicket = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('eventId')
            .lean();

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate({ path: 'eventId', populate: { path: 'createdBy', select: 'name email' } }).populate('userId', 'name email').sort({ createdAt: -1 }).lean()
            : await Booking.find({ userId: req.user.id }).populate({ path: 'eventId', populate: { path: 'createdBy', select: 'name email' } }).sort({ createdAt: -1 }).lean();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get bookings for organizer's events
exports.getOrganizerBookings = async (req, res) => {
    try {
        const events = await Event.find({ createdBy: req.user.id }).select('_id');
        const eventIds = events.map(e => e._id);
        const bookings = await Booking.find({ eventId: { $in: eventIds } })
            .populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 }).lean();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        let isAuthorized = booking.userId.toString() === req.user.id || req.user.role === 'admin';
        if (!isAuthorized && req.user.role === 'organizer') {
            const event = await Event.findById(booking.eventId);
            if (event && event.createdBy.toString() === req.user.id) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasApproved = booking.status === 'confirmed' || booking.status === 'approved';

        booking.status = 'cancelled';
        await booking.save();

        // Only restore the seat if it was actually confirmed/approved and deducted
        if (wasApproved) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
