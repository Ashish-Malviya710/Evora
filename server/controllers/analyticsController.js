const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');

exports.getAdminAnalytics = async (req, res) => {
    try {
        // Run all independent count queries in parallel
        const [totalUsers, totalOrganizers, totalEvents, activeEvents, totalBookings, revenueData, monthlyRevenue, bookingStatus, categoryDistribution] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'organizer' }),
            Event.countDocuments(),
            Event.countDocuments({ status: 'published', date: { $gte: new Date() } }),
            Booking.countDocuments(),
            Booking.aggregate([
                { $match: { status: { $in: ['approved', 'confirmed'] }, paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Booking.aggregate([
                { $match: { status: { $in: ['approved', 'confirmed'] }, paymentStatus: 'paid' } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $limit: 12 }
            ]),
            Booking.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Event.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        const revenue = revenueData[0]?.total || 0;

        res.json({
            totalUsers, totalOrganizers, totalEvents, activeEvents,
            totalBookings, revenue, monthlyRevenue, bookingStatus, categoryDistribution
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getOrganizerAnalytics = async (req, res) => {
    try {
        const myEvents = await Event.find({ createdBy: req.user.id }).select('_id title status date ticketPrice availableSeats totalSeats').lean();
        const eventIds = myEvents.map(e => e._id);
        const now = new Date();

        const totalEvents = myEvents.length;
        const activeEvents = myEvents.filter(e => e.status === 'published' && e.date >= now).length;
        const upcomingEvents = myEvents.filter(e => e.date >= now).length;

        // Use aggregation for bookings stats instead of fetching all into memory
        const [statsResult, recentBookings] = await Promise.all([
            Booking.aggregate([
                { $match: { eventId: { $in: eventIds } } },
                {
                    $group: {
                        _id: null,
                        totalBookings: { $sum: 1 },
                        approvedCount: {
                            $sum: { $cond: [{ $in: ['$status', ['approved', 'confirmed']] }, 1, 0] }
                        },
                        revenue: {
                            $sum: {
                                $cond: [{ $in: ['$status', ['approved', 'confirmed']] }, '$amount', 0]
                            }
                        },
                        attendance: {
                            $sum: { $cond: ['$checkedIn', 1, 0] }
                        }
                    }
                }
            ]),
            Booking.find({ eventId: { $in: eventIds } })
                .populate('userId', 'name email').populate('eventId', 'title')
                .sort({ createdAt: -1 }).limit(10).lean()
        ]);

        const stats = statsResult[0] || { totalBookings: 0, revenue: 0, attendance: 0 };

        res.json({
            totalEvents, activeEvents, upcomingEvents,
            totalBookings: stats.totalBookings,
            revenue: stats.revenue,
            attendance: stats.attendance,
            recentBookings
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
