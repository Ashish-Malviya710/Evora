const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 }).limit(50).lean();
        const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
