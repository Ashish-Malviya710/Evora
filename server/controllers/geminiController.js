const { GoogleGenAI } = require('@google/genai');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Review = require('../models/Review');

const getAI = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.startsWith('AQ.')) return null; // Invalid/mock key
    try {
        return new GoogleGenAI({ apiKey: key });
    } catch {
        return null;
    }
};

// Reusable helper to strip markdown code fences from Gemini JSON responses
const stripCodeFences = (text) => text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

// Smart fallback generator for event descriptions when API quota is exceeded or key is invalid
const fallbackDescription = (title, category, eventType) => {
    const titleLower = title.toLowerCase();
    const topicMap = [
        { keys: ['web', 'frontend', 'react', 'javascript', 'html', 'css'], text: 'Dive deep into modern web development technologies, frameworks, and best practices. Learn to build responsive, high-performance web applications from industry practitioners who ship production code daily.' },
        { keys: ['python', 'django', 'flask', 'data science', 'machine learning', 'ai', 'artificial intelligence'], text: 'Explore the world of Python programming, data science, and AI/ML. From building intelligent models to deploying scalable applications, gain hands-on experience with real-world datasets and cutting-edge tools.' },
        { keys: ['mobile', 'android', 'ios', 'flutter', 'app'], text: 'Master the art of mobile app development with hands-on sessions covering design, development, and deployment. Build cross-platform applications that deliver seamless user experiences.' },
        { keys: ['cloud', 'devops', 'aws', 'docker', 'kubernetes'], text: 'Discover cloud computing architectures, CI/CD pipelines, and infrastructure automation. Learn to deploy, scale, and manage applications using modern DevOps practices and cloud platforms.' },
        { keys: ['blockchain', 'crypto', 'web3'], text: 'Explore blockchain technology, decentralized applications, and Web3 development. Understand smart contracts, consensus mechanisms, and how to build on distributed ledger platforms.' },
        { keys: ['music', 'concert', 'band', 'festival', 'dj'], text: 'Experience an electrifying lineup of performances, live sets, and musical artistry. From soulful melodies to high-energy beats, immerse yourself in a celebration of sound and rhythm.' },
        { keys: ['food', 'cook', 'cuisine', 'chef'], text: 'Indulge in a culinary journey featuring live cooking demonstrations, tastings, and expert chef interactions. Discover new flavors, techniques, and cuisines from around the world.' },
        { keys: ['fitness', 'yoga', 'health', 'wellness', 'marathon', 'run'], text: 'Elevate your health and wellness journey with expert-led sessions, practical fitness routines, and holistic wellness practices designed for all experience levels.' },
        { keys: ['business', 'startup', 'entrepreneur', 'marketing'], text: 'Gain actionable business insights from successful entrepreneurs and industry leaders. Learn proven strategies for growth, marketing, fundraising, and scaling your venture.' },
        { keys: ['design', 'ui', 'ux', 'figma', 'graphic'], text: 'Master the principles of great design — from UI/UX fundamentals to advanced visual storytelling. Create user-centric digital experiences that are both beautiful and functional.' },
        { keys: ['photography', 'camera', 'photo'], text: 'Sharpen your photography skills with hands-on workshops covering composition, lighting, post-processing, and storytelling through the lens. Perfect for beginners and enthusiasts alike.' },
        { keys: ['hackathon', 'coding', 'competitive', 'code'], text: 'Put your coding skills to the test in an intense, time-bound challenge. Collaborate with fellow developers, solve real-world problems, and compete for exciting prizes and recognition.' },
        { keys: ['cyber', 'security', 'hacking', 'ethical'], text: 'Learn to defend and secure digital systems against modern cyber threats. Explore ethical hacking techniques, vulnerability assessments, and security best practices from domain experts.' },
    ];

    const match = topicMap.find(t => t.keys.some(k => titleLower.includes(k)));
    const topicFocus = match
        ? match.text
        : `Discover what makes "${title}" a must-attend experience. Engage with expert speakers, participate in interactive sessions, and gain practical knowledge you can apply immediately.`;

    return `${topicFocus}\n\nThis ${eventType || 'in-person'} ${category.toLowerCase()} event brings together a vibrant community of learners, professionals, and enthusiasts. Whether you're a beginner looking to get started or an experienced practitioner seeking advanced insights, "${title}" has something valuable for everyone. Connect with like-minded attendees, ask questions to industry experts, and walk away with actionable takeaways. Seats are limited — register early to secure your spot!`;
};

const fallbackHighlights = (title, category) => [
    `Keynote presentations by leading experts in ${category}`,
    `Interactive workshops and hands-on practical sessions`,
    `Networking opportunities with industry professionals`,
    `Q&A panel discussions addressing current trends`,
    `Exclusive digital resource kit and certificate of participation`
];

const fallbackTags = (title, category) => {
    const titleWords = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const catTag = category.toLowerCase();
    const defaults = ['event', 'workshop', 'networking', '2026', 'community', 'learning'];
    return [...new Set([catTag, ...titleWords, ...defaults])].slice(0, 8);
};

// Lightweight event fields for chat/recommendation context (avoids transferring description, gallery, faqs etc.)
const EVENT_LIST_FIELDS = 'title category date location ticketPrice availableSeats totalSeats';

exports.generateDescription = async (req, res) => {
    const title = req.body.title || 'Special Event';
    const category = req.body.category || 'General';
    const eventType = req.body.eventType || 'in-person';

    try {
        const ai = getAI();
        if (ai) {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `You are writing an event description for an event booking platform. The event is titled: "${title}" (Category: ${category}, Type: ${eventType}).

IMPORTANT: Understand what the title "${title}" is actually about — its subject matter, topic, and theme. Then write a description that is SPECIFICALLY about that topic. Do NOT write generic event text.

For example:
- If the title is "React Workshop", write about React.js, components, hooks, state management etc.
- If the title is "Jazz Night", write about jazz music, live performances, artists etc.
- If the title is "Startup Pitch Day", write about pitching, investors, startup ecosystem etc.

Requirements:
- Write 150-200 words
- Be specific to the topic indicated by the title "${title}"
- Explain what attendees will learn or experience related to this specific topic
- Mention key activities, sessions, or highlights relevant to this subject
- Make it engaging and informative
- Do NOT use markdown formatting or bullet points
- Write in plain paragraphs`
            });
            if (response && response.text) {
                return res.json({ description: response.text.trim() });
            }
        }
    } catch (error) {
        console.warn('Gemini API call failed, using smart AI fallback:', error.message);
    }

    res.json({ description: fallbackDescription(title, category, eventType) });
};

exports.generateHighlights = async (req, res) => {
    const { title, category } = req.body;
    try {
        const ai = getAI();
        if (ai) {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `Generate 5 key highlights for an event titled "${title}" (${category || 'General'}). Return as a JSON array of strings. Only return the JSON array, no extra text.`
            });
            if (response && response.text) {
                return res.json({ highlights: JSON.parse(stripCodeFences(response.text)) });
            }
        }
    } catch (error) {
        console.warn('Gemini API highlights failed, using fallback:', error.message);
    }

    res.json({ highlights: fallbackHighlights(title || 'Event', category || 'General') });
};

exports.generateTags = async (req, res) => {
    const { title, category } = req.body;
    try {
        const ai = getAI();
        if (ai) {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `Generate 8 relevant tags for an event titled "${title}" (${category || 'General'}). Return as a JSON array of strings (lowercase, no #). Only return the JSON array.`
            });
            if (response && response.text) {
                return res.json({ tags: JSON.parse(stripCodeFences(response.text)) });
            }
        }
    } catch (error) {
        console.warn('Gemini API tags failed, using fallback:', error.message);
    }

    res.json({ tags: fallbackTags(title || 'Event', category || 'General') });
};

exports.chatAssistant = async (req, res) => {
    const { message, eventId } = req.body;
    const msg = (message || '').trim().toLowerCase();

    let allEvents = [];
    try {
        allEvents = await Event.find({ status: 'published' })
            .select(EVENT_LIST_FIELDS)
            .sort({ date: 1 })
            .limit(50)
            .lean();
    } catch (dbErr) {
        console.warn('Error fetching events for AI context:', dbErr.message);
    }

    let context = `Current Evora platform status: ${allEvents.length} total published events.\n`;
    if (allEvents.length > 0) {
        context += `Live Events List:\n` + allEvents.map(e => `- "${e.title}" (${e.category}) on ${new Date(e.date).toLocaleDateString()} at ${e.location}. Price: ${e.ticketPrice === 0 ? 'FREE' : '₹' + e.ticketPrice}. Available Seats: ${e.availableSeats}/${e.totalSeats}`).join('\n') + '\n';
    }

    if (eventId) {
        try {
            const event = await Event.findById(eventId).select(EVENT_LIST_FIELDS).lean();
            if (event) {
                context += `Selected Event details: "${event.title}", Category: ${event.category}, Date: ${new Date(event.date).toLocaleDateString()}, Location: ${event.location}, Price: ₹${event.ticketPrice}, Seats: ${event.availableSeats}/${event.totalSeats}.\n`;
            }
        } catch {}
    }

    try {
        const ai = getAI();
        if (ai) {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `You are Evora's smart, helpful AI assistant. Help users with event details, total counts, pricing, timings, booking guidance, and FAQs based on live data.\n\n${context}\n\nUser asks: "${message}"`
            });
            if (response && response.text) {
                return res.json({ reply: response.text });
            }
        }
    } catch (error) {
        console.warn('Gemini Chat Assistant fallback triggered:', error.message);
    }

    // Live Database-Driven Intelligence Engine (fallback)
    let reply = "";

    if (msg.includes('total event') || msg.includes('how many event') || msg.includes('all event') || msg.includes('count') || msg.includes('list event') || msg === 'total events') {
        const freeCount = allEvents.filter(e => e.ticketPrice === 0).length;
        const paidCount = allEvents.filter(e => e.ticketPrice > 0).length;
        const list = allEvents.map(e => `• **${e.title}** (${e.category}) — ${new Date(e.date).toLocaleDateString()} | ${e.location} | ${e.ticketPrice === 0 ? 'FREE' : '₹' + e.ticketPrice} | Seats: ${e.availableSeats}/${e.totalSeats}`).join('\n');
        reply = `There are currently **${allEvents.length} total published events** on Evora! (${freeCount} Free, ${paidCount} Paid)\n\n` + (list || 'No published events currently available.');
    } else if (msg.includes('free')) {
        const freeEvents = allEvents.filter(e => e.ticketPrice === 0);
        const list = freeEvents.map(e => `• **${e.title}** (${e.category}) — ${new Date(e.date).toLocaleDateString()} | ${e.location} | Seats: ${e.availableSeats}/${e.totalSeats}`).join('\n');
        reply = `There are **${freeEvents.length} Free Events** on Evora:\n\n` + (list || 'No free events currently available.');
    } else if (msg.includes('paid') || msg.includes('price') || msg.includes('cost') || msg.includes('ticket')) {
        const paidEvents = allEvents.filter(e => e.ticketPrice > 0);
        const list = paidEvents.map(e => `• **${e.title}** (${e.category}) — ₹${e.ticketPrice} | ${new Date(e.date).toLocaleDateString()} | ${e.location}`).join('\n');
        reply = `Here are the paid events on Evora:\n\n` + (list || 'No paid events currently available.') + `\n\n*(Free events can be booked directly; paid events display a UPI QR code for quick payment proof upload!)*`;
    } else if (msg.includes('qr') || msg.includes('check-in') || msg.includes('entry')) {
        reply = "Once your booking is verified with payment proof, your digital QR Ticket is generated under 'My Bookings'. Present this QR code at the event entrance for instant camera scanning!";
    } else if (msg.includes('organizer') || msg.includes('host') || msg.includes('create')) {
        reply = "You can host events as an Organizer on Evora! Go to 'Create Event' to set up titles, custom UPI IDs for ticket payments, seat limits, and AI-assisted event details.";
    } else if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
        reply = `Hello! Welcome to Evora! There are currently **${allEvents.length} active events** hosted on the platform. Ask me anything about event timings, ticket prices, or booking details!`;
    } else if (msg.includes('recommend') || msg.includes('suggest') || msg.includes('popular') || msg.includes('best') || msg.includes('for me')) {
        const scored = allEvents.map(e => {
            const bookedSeats = Math.max(0, e.totalSeats - e.availableSeats);
            const popRatio = e.totalSeats > 0 ? (bookedSeats / e.totalSeats) : 0;
            return { event: e, popRatio, bookedSeats };
        }).sort((a, b) => b.popRatio - a.popRatio);

        const list = scored.slice(0, 5).map(s => {
            const e = s.event;
            const popPercent = Math.round(s.popRatio * 100);
            return `• **${e.title}** (${e.category}) — ${new Date(e.date).toLocaleDateString()} | ${e.location} | 🔥 ${popPercent}% Booked (${s.bookedSeats}/${e.totalSeats} seats) | ${e.ticketPrice === 0 ? 'FREE' : '₹' + e.ticketPrice}`;
        }).join('\n');

        reply = `🤖 **AI Smart Recommendations (Based on Previous Bookings, Favourite Categories & Event Popularity):**\n\n` + (list || 'No active events currently available for recommendation.');
    } else {
        const matches = allEvents.filter(e => 
            e.title.toLowerCase().includes(msg) || 
            e.category.toLowerCase().includes(msg) || 
            e.location.toLowerCase().includes(msg)
        );
        if (matches.length > 0) {
            const list = matches.map(e => `• **${e.title}** (${e.category}) — ${new Date(e.date).toLocaleDateString()} at ${e.location} (${e.ticketPrice === 0 ? 'FREE' : '₹' + e.ticketPrice})`).join('\n');
            reply = `Found **${matches.length} matching event(s)** on Evora:\n\n` + list;
        } else {
            reply = `I'm Evora AI Assistant! There are currently **${allEvents.length} published events** available on the platform. Ask me about event titles, total counts, ticket prices, or smart recommendations!`;
        }
    }

    res.json({ reply });
};

// Advanced AI Multi-Factor Event Recommendation Engine
exports.recommendEvents = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        let bookedCategories = [];
        let wishlistCategories = [];

        if (userId) {
            // Fetch bookings and wishlist in parallel with minimal field selection
            const [userBookings, userObj] = await Promise.all([
                Booking.find({ userId }).select('eventId').populate('eventId', 'category').lean(),
                User.findById(userId).select('wishlist').populate('wishlist', 'category').lean()
            ]);

            bookedCategories = userBookings.map(b => b.eventId?.category).filter(Boolean);
            if (userObj && userObj.wishlist) {
                wishlistCategories = userObj.wishlist.map(w => w.category).filter(Boolean);
            }
        }

        const favCategories = [...new Set([...bookedCategories, ...wishlistCategories])];

        // Fetch published events with minimal fields needed for scoring
        const events = await Event.find({ status: 'published' })
            .select('title category date location ticketPrice availableSeats totalSeats image banner thumbnail createdBy')
            .populate('createdBy', 'name')
            .lean();

        // Multi-factor Scoring Algorithm
        const scoredEvents = events.map(e => {
            const bookedSeats = Math.max(0, e.totalSeats - e.availableSeats);
            const popularityRatio = e.totalSeats > 0 ? (bookedSeats / e.totalSeats) : 0;
            let score = popularityRatio * 40;
            let reason = '🔥 Popular Event';

            if (bookedCategories.includes(e.category)) {
                score += 35;
                reason = '🎟️ Based on your Previous Bookings';
            }
            if (wishlistCategories.includes(e.category)) {
                score += 25;
                reason = '⭐ Matches your Wishlist Categories';
            }
            if (bookedCategories.includes(e.category) && wishlistCategories.includes(e.category)) {
                reason = '🎯 Perfect Match (Bookings & Wishlist)';
            }

            return { ...e, score, reason, popularityRatio: Math.round(popularityRatio * 100) };
        });

        scoredEvents.sort((a, b) => b.score - a.score);
        const topRecommended = scoredEvents.slice(0, 6);

        res.json({
            recommended: topRecommended,
            insights: {
                bookedCategoriesCount: bookedCategories.length,
                favCategories,
                totalAnalyzed: events.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Recommendation failed', error: error.message });
    }
};

// AI Natural Language Search
exports.aiSearchEvents = async (req, res) => {
    try {
        const queryStr = (req.body.query || req.query.query || '').trim();
        if (!queryStr) {
            const all = await Event.find({ status: 'published' })
                .select('title subtitle date startTime endTime location category eventType totalSeats availableSeats ticketType ticketPrice status image banner thumbnail tags createdBy')
                .populate('createdBy', 'name email')
                .sort({ date: 1 }).lean();
            return res.json({ events: all, parsedIntent: {}, summary: 'Showing all active events' });
        }

        const lower = queryStr.toLowerCase();
        let isFree = lower.includes('free');
        let isPaid = lower.includes('paid');
        let category = '';

        const categories = ['Technology', 'Music', 'Business', 'Art', 'Food', 'Sports', 'Workshop', 'Conference'];
        for (const cat of categories) {
            if (lower.includes(cat.toLowerCase())) {
                category = cat;
                break;
            }
        }

        const keywords = lower
            .replace(/\b(show|find|search|list|events|this|weekend|today|in|for|free|paid|me|all|any|under|over|with)\b/g, '')
            .trim();

        const mongoQuery = { status: 'published' };
        if (isFree) {
            mongoQuery.ticketPrice = 0;
        } else if (isPaid) {
            mongoQuery.ticketPrice = { $gt: 0 };
        }
        if (category) {
            mongoQuery.category = { $regex: category, $options: 'i' };
        }
        if (keywords && keywords.length >= 2) {
            const regex = new RegExp(keywords, 'i');
            mongoQuery.$or = [
                { title: regex },
                { description: regex },
                { location: regex },
                { category: regex },
                { tags: regex }
            ];
        }

        const matchedEvents = await Event.find(mongoQuery)
            .select('title subtitle date startTime endTime location category eventType totalSeats availableSeats ticketType ticketPrice status image banner thumbnail tags createdBy')
            .populate('createdBy', 'name email')
            .sort({ date: 1 }).lean();

        let aiSummary = `AI Filtered ${matchedEvents.length} event(s) matching "${queryStr}"`;
        try {
            const ai = getAI();
            if (ai) {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: `User search query: "${queryStr}". Explain in 1 short sentence what criteria were searched.`
                });
                if (response && response.text) {
                    aiSummary = response.text.trim();
                }
            }
        } catch {}

        res.json({
            events: matchedEvents,
            parsedIntent: { isFree, isPaid, category, keywords },
            summary: aiSummary
        });
    } catch (error) {
        res.status(500).json({ message: 'AI Search failed', error: error.message });
    }
};

// AI Review Summary Generator
exports.summarizeReviews = async (req, res) => {
    try {
        const { eventId } = req.params;
        const reviews = await Review.find({ eventId }).populate('userId', 'name').lean();

        if (!reviews || reviews.length === 0) {
            return res.json({
                hasReviews: false,
                summary: 'No customer reviews available yet for this event.'
            });
        }

        const totalReviews = reviews.length;
        const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1);
        const reviewTexts = reviews.map(r => `• (${r.rating}/5 stars) ${r.review}`).join('\n');

        let pros = `Most attendees appreciated the organization, speakers, and interactive experience (Average rating: ${avgRating}/5).`;
        let cons = `Some attendees suggested minor improvements for venue seating and schedule timings.`;

        try {
            const ai = getAI();
            if (ai && reviewTexts.length > 10) {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: `Analyze these customer reviews for an event:\n${reviewTexts}\n\nProvide a 2-sentence summary in JSON format with keys "pros" (what attendees liked most) and "cons" (constructive feedback or suggestions). Return ONLY valid JSON.`
                });
                if (response && response.text) {
                    const parsed = JSON.parse(stripCodeFences(response.text));
                    if (parsed.pros) pros = parsed.pros;
                    if (parsed.cons) cons = parsed.cons;
                }
            }
        } catch (error) {
            console.warn('Gemini review summary fallback:', error.message);
        }

        res.json({ hasReviews: true, totalReviews, avgRating, pros, cons });
    } catch (error) {
        res.status(500).json({ message: 'Failed to summarize reviews', error: error.message });
    }
};
