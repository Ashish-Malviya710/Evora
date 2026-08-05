const express = require('express');
const router = express.Router();
const { createReview, getEventReviews, getAllReviews, moderateReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/event/:eventId', getEventReviews);
router.get('/admin/all', protect, authorize('admin'), getAllReviews);
router.put('/:id/moderate', protect, authorize('admin'), moderateReview);

module.exports = router;
