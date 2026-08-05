const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    // Auth middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.id;
                socket.userRole = decoded.role;
            } catch (err) {
                // Allow anonymous connections for public seat updates
            }
        }
        next();
    });

    io.on('connection', (socket) => {
        // Join user-specific room for notifications
        if (socket.userId) {
            socket.join(`user_${socket.userId}`);
        }

        // Join role-based rooms
        if (socket.userRole === 'admin') socket.join('admin_room');
        if (socket.userRole === 'organizer') socket.join(`organizer_${socket.userId}`);

        // Join event room for live seat updates
        socket.on('join_event', (eventId) => {
            socket.join(`event_${eventId}`);
        });

        socket.on('leave_event', (eventId) => {
            socket.leave(`event_${eventId}`);
        });

        socket.on('disconnect', () => {});
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};

// Helper to emit events
const emitSeatUpdate = (eventId, availableSeats, totalSeats) => {
    if (io) io.to(`event_${eventId}`).emit('seatUpdate', { eventId, availableSeats, totalSeats });
};

const emitNotification = (userId, notification) => {
    if (io) io.to(`user_${userId}`).emit('notification', notification);
};

const emitDashboardUpdate = (type, data) => {
    if (io) {
        if (type === 'admin') io.to('admin_room').emit('dashboardUpdate', data);
        else io.to(`organizer_${data.organizerId}`).emit('dashboardUpdate', data);
    }
};

const emitBookingUpdate = (eventId, data) => {
    if (io) io.to(`event_${eventId}`).emit('bookingUpdate', data);
};

module.exports = {
    initSocket, getIO, emitSeatUpdate,
    emitNotification, emitDashboardUpdate, emitBookingUpdate
};
