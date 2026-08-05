const express = require('express');
const router = express.Router();
const {
    bookEvent, confirmBooking, getMyBookings, cancelBooking,
    sendBookingOTP, uploadPaymentScreenshot, approveBooking,
    rejectBooking, verifyTicket, getTicket, getOrganizerBookings
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/send-otp', protect, sendBookingOTP);
router.post('/', protect, bookEvent);
router.get('/my', protect, getMyBookings);
router.get('/organizer', protect, authorize('organizer'), getOrganizerBookings);
router.get('/ticket/:id', protect, getTicket);

// Payment screenshot
router.post('/:id/screenshot', protect, upload.single('screenshot'), uploadPaymentScreenshot);

// Admin & Organizer actions
router.put('/:id/confirm', protect, authorize('organizer', 'admin'), confirmBooking);
router.put('/:id/approve', protect, authorize('organizer', 'admin'), approveBooking);
router.put('/:id/reject', protect, authorize('organizer', 'admin'), rejectBooking);

// QR check-in
router.post('/verify-ticket', protect, authorize('organizer', 'admin'), verifyTicket);

router.delete('/:id', protect, cancelBooking);

module.exports = router;
