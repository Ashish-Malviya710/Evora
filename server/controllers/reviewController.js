const Review = require('../models/Review');
const Booking = require('../models/Booking');

exports.createReview = async (req, res) => {
    try {
        const { eventId, rating, review } = req.body;

        // Check if user attended (has approved/confirmed booking + event date passed)
        const booking = await Booking.findOne({
            userId: req.user.id,
            eventId,
            status: { $in: ['approved', 'confirmed'] }
        }).populate('eventId');

        if (!booking) {
            return res.status(403).json({ message: 'You can only review events you attended' });
        }

        if (new Date(booking.eventId.date) > new Date()) {
            return res.status(403).json({ message: 'You can only review after the event has ended' });
        }

        // Check for existing review
        const existing = await Review.findOne({ userId: req.user.id, eventId });
        if (existing) {
            return res.status(400).json({ message: 'You already reviewed this event' });
        }

        const newReview = await Review.create({
            userId: req.user.id,
            eventId,
            rating,
            review
        });

        res.status(201).json(newReview);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ eventId: req.params.eventId, isModerated: true })
            .populate('userId', 'name profilePicture').sort({ createdAt: -1 }).lean();

        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        res.json({ reviews, avgRating: parseFloat(avgRating), totalReviews: reviews.length });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Admin: get all reviews for moderation
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'name email').populate('eventId', 'title')
            .sort({ createdAt: -1 }).lean();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Admin: toggle moderation
exports.moderateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        review.isModerated = !review.isModerated;
        await review.save();

        res.json({ message: `Review ${review.isModerated ? 'approved' : 'hidden'}`, review });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
