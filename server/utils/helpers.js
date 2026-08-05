/**
 * Shared helper utilities for Evora server
 */

// Generate a 6-digit OTP string
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Parse event end time from an event document, returns a Date object
const parseEventEndTime = (event) => {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) return null;

    if (event.endTime && typeof event.endTime === 'string' && event.endTime.trim()) {
        const timeParts = String(event.endTime).match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const ampm = timeParts[3];
            if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            const endDt = new Date(eventDate);
            endDt.setHours(hours, minutes, 0, 0);
            return endDt;
        }
    }

    // Default: end of event day
    const endDt = new Date(eventDate);
    endDt.setHours(23, 59, 59, 999);
    return endDt;
};

module.exports = { generateOTP, parseEventEndTime };
