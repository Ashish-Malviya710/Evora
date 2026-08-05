const cron = require('node-cron');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const startScheduler = () => {
    // Run every 30 minutes to check for upcoming event reminders
    cron.schedule('*/30 * * * *', async () => {
        try {
            const now = new Date();
            const reminders = [
                { label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
                { label: '1 day', ms: 24 * 60 * 60 * 1000 },
                { label: '3 hours', ms: 3 * 60 * 60 * 1000 },
                { label: '30 minutes', ms: 30 * 60 * 1000 }
            ];

            for (const reminder of reminders) {
                const targetTime = new Date(now.getTime() + reminder.ms);
                const windowStart = new Date(targetTime.getTime() - 15 * 60 * 1000);
                const windowEnd = new Date(targetTime.getTime() + 15 * 60 * 1000);

                const events = await Event.find({
                    status: 'published',
                    date: { $gte: windowStart, $lte: windowEnd }
                }).select('_id title').lean();

                if (events.length === 0) continue;

                const eventIds = events.map(e => e._id);

                // Batch-fetch all approved bookings for these events at once
                const bookings = await Booking.find({
                    eventId: { $in: eventIds },
                    status: { $in: ['approved', 'confirmed'] }
                }).select('userId eventId').lean();

                if (bookings.length === 0) continue;

                // Build a map of eventId -> event title for quick lookup
                const eventTitleMap = {};
                for (const e of events) {
                    eventTitleMap[e._id.toString()] = e.title;
                }

                // Batch-check which reminders already exist
                const userIds = [...new Set(bookings.map(b => b.userId.toString()))];
                const existingNotifs = await Notification.find({
                    userId: { $in: userIds },
                    type: 'reminder',
                    message: { $regex: reminder.label }
                }).select('userId message').lean();

                // Build a set of "userId:eventTitle" for quick duplicate checking
                const existingSet = new Set();
                for (const n of existingNotifs) {
                    for (const e of events) {
                        if (n.message.includes(e.title)) {
                            existingSet.add(`${n.userId.toString()}:${e._id.toString()}`);
                        }
                    }
                }

                // Bulk-create only new notifications
                const newNotifications = [];
                for (const booking of bookings) {
                    const key = `${booking.userId.toString()}:${booking.eventId.toString()}`;
                    if (!existingSet.has(key)) {
                        const eventTitle = eventTitleMap[booking.eventId.toString()];
                        newNotifications.push({
                            userId: booking.userId,
                            type: 'reminder',
                            title: `Event Reminder - ${reminder.label}`,
                            message: `"${eventTitle}" starts in ${reminder.label}! Don't forget to attend.`,
                            link: `/events/${booking.eventId}`
                        });
                        existingSet.add(key); // Prevent duplicates within this batch
                    }
                }

                if (newNotifications.length > 0) {
                    await Notification.insertMany(newNotifications);
                }
            }
        } catch (error) {
            console.error('Scheduler error:', error.message);
        }
    });

    console.log('Event reminder scheduler started');
};

module.exports = { startScheduler };
