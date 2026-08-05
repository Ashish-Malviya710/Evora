const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory user cache to avoid repeated DB hits for the same user within a short window
const userCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCachedUser = (userId) => {
    const entry = userCache.get(userId);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return entry.user;
    }
    userCache.delete(userId);
    return null;
};

const setCachedUser = (userId, user) => {
    userCache.set(userId, { user, timestamp: Date.now() });
    // Prevent unbounded cache growth
    if (userCache.size > 500) {
        const oldest = userCache.keys().next().value;
        userCache.delete(oldest);
    }
};

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Use JWT payload directly for fast path — avoids DB query on every request
            req.user = {
                id: decoded.id,
                _id: decoded.id,
                name: decoded.name,
                email: decoded.email,
                role: decoded.role
            };
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Full user fetch middleware — use only on routes that need complete user data (profile, wishlist)
const protectWithFullUser = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check cache first
            let user = getCachedUser(decoded.id);
            if (!user) {
                user = await User.findById(decoded.id).select('-password').lean();
                if (user) setCachedUser(decoded.id, user);
            }

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            req.user = { ...user, id: user._id.toString() };
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

// Flexible RBAC middleware — accepts any number of allowed roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Required role: ${roles.join(' or ')}` });
        }
        next();
    };
};

const optionalAuth = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Use JWT payload directly for optional auth too
            req.user = {
                id: decoded.id,
                _id: decoded.id,
                name: decoded.name,
                email: decoded.email,
                role: decoded.role
            };
        } catch (error) {}
    }
    next();
};

module.exports = { protect, protectWithFullUser, admin, authorize, optionalAuth };
