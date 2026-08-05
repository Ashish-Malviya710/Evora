const express = require('express');
const router = express.Router();
const {
    generateDescription, generateHighlights, generateTags,
    chatAssistant, recommendEvents, aiSearchEvents, summarizeReviews
} = require('../controllers/geminiController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/generate-description', protect, generateDescription);
router.post('/generate-highlights', protect, generateHighlights);
router.post('/generate-tags', protect, generateTags);
router.post('/chat', chatAssistant);
router.get('/recommendations', optionalAuth, recommendEvents);
router.post('/search', aiSearchEvents);
router.get('/reviews/summary/:eventId', summarizeReviews);

module.exports = router;
