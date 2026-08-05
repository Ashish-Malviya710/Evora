const express = require('express');
const router = express.Router();
const {
    getEvents, getAllEvents, getEventById, createEvent,
    updateEvent, deleteEvent, getMyEvents, updateEventStatus
} = require('../controllers/eventController');
const { protect, admin, authorize } = require('../middleware/auth');

// Public
router.get('/', getEvents);
router.get('/:id', getEventById);

// Organizer + Admin
router.get('/dashboard/my', protect, authorize('organizer', 'admin'), getMyEvents);
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.patch('/:id/status', protect, authorize('organizer', 'admin'), updateEventStatus);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

// Admin only
router.get('/admin/all', protect, authorize('admin'), getAllEvents);

module.exports = router;
