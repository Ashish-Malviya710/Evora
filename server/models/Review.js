const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true },
    isModerated: { type: Boolean, default: true }
}, { timestamps: true });

// One review per user per event
reviewSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
