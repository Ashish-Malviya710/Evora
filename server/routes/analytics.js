const express = require('express');
const router = express.Router();
const { getAdminAnalytics, getOrganizerAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
router.get('/organizer', protect, authorize('organizer'), getOrganizerAnalytics);

module.exports = router;
