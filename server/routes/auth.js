const express = require('express');
const router = express.Router();
const {
    register, login, verifyOTP, getProfile, updateProfile,
    changePassword, toggleWishlist, getWishlist, getUsers, updateOrganizerStatus,
    forgotPassword, verifyResetOTP, resetPassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Profile
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Wishlist
router.post('/wishlist/:eventId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

// Admin user management
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/organizer-status', protect, authorize('admin'), updateOrganizerStatus);

module.exports = router;
