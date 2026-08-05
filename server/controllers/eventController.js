const Event = require('../models/Event');
const { parseEventEndTime } = require('../utils/helpers');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

exports.getEvents = async (req, res) => {
    try {
        const filters = { status: 'published' };
        if (req.query.category) filters.category = req.query.category;
        if (req.query.search) filters.title = { $regex: req.query.search, $options: 'i' };

        const allEvents = await Event.find(filters).populate('createdBy', 'name email').sort({ date: 1 }).lean();

        // Filter out events that completed more than 2 hours ago
        const now = new Date();
        const events = allEvents.filter(event => {
            const eventEndTime = parseEventEndTime(event);
            if (!eventEndTime) return true; // If date is invalid, keep the event
            return now.getTime() < eventEndTime.getTime() + TWO_HOURS_MS;
        });

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Admin: get ALL events regardless of status
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).lean();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name email').lean();
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const {
            title, subtitle, description, date, startTime, endTime,
            registrationStart, registrationEnd, location, venue,
            category, eventType, tags, totalSeats, ticketType, ticketPrice, upiId,
            maxTicketsPerUser, image, banner, thumbnail, gallery,
            organizer, highlights, faqs, status
        } = req.body;

        const event = await Event.create({
            title,
            subtitle: subtitle || '',
            description,
            date,
            startTime: startTime || '',
            endTime: endTime || '',
            registrationStart,
            registrationEnd,
            location,
            venue: venue || {},
            category,
            eventType: eventType || 'in-person',
            tags: tags || [],
            totalSeats,
            availableSeats: totalSeats,
            ticketType: ticketPrice > 0 ? 'paid' : 'free',
            ticketPrice: ticketPrice || 0,
            upiId: upiId || '',
            maxTicketsPerUser: maxTicketsPerUser || 1,
            image: image || banner || '',
            banner: banner || image || '',
            thumbnail: thumbnail || '',
            gallery: gallery || [],
            organizer: organizer || {},
            highlights: highlights || [],
            faqs: faqs || [],
            status: status || 'published',
            createdBy: req.user.id
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Organizers can only update their own events
        if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Organizer: get my events
exports.getMyEvents = async (req, res) => {
    try {
        const events = await Event.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).lean();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Update event status (publish, cancel, postpone)
exports.updateEventStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['draft', 'published', 'cancelled', 'postponed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (req.user.role === 'organizer' && event.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        event.status = status;
        await event.save();
        res.json({ message: `Event ${status}`, event });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
