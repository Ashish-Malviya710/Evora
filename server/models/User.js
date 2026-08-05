const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
    address: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    organizerStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    notificationPrefs: {
        email: { type: Boolean, default: true },
        bookingUpdates: { type: Boolean, default: true },
        eventReminders: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
