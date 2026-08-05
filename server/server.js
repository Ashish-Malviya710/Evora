const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const reviewRoutes = require('./routes/reviews');
const geminiRoutes = require('./routes/gemini');

const { initSocket } = require('./utils/socket');
const { startScheduler } = require('./utils/scheduler');
const upload = require('./middleware/upload');
const { uploadToCloudinary } = require('./utils/cloudinary');
const { protect } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '10mb' }));

// Optimize API response speed headers
app.use((req, res, next) => {
    res.setHeader('X-Response-Time-Optimized', 'true');
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/gemini', geminiRoutes);

// Generic image upload endpoint (for profile pictures, event images, etc.)
app.post('/api/upload', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const folder = req.body.folder || 'evora/general';
        const result = await uploadToCloudinary(req.file.buffer, folder, req.file.mimetype);
        res.json({ url: result.secure_url });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// Database Connection with Connection Pooling for faster query response times
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/evora';
mongoose.connect(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
  .then(() => {
      console.log('MongoDB Connected (Optimized Pool)');
      startScheduler();
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
