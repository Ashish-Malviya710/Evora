const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    registrationStart: { type: Date },
    registrationEnd: { type: Date },
    location: { type: String, required: true },
    venue: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      pincode: { type: String, default: '' },
      lat: { type: Number },
      lng: { type: Number }
    },
    category: { type: String, required: true },
    eventType: { type: String, default: 'in-person' },
    tags: [{ type: String }],
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    ticketType: { type: String, enum: ['free', 'paid'], default: 'free' },
    ticketPrice: { type: Number, required: true, default: 0 },
    upiId: { type: String, default: '' },
    maxTicketsPerUser: { type: Number, default: 1 },
    image: { type: String },
    banner: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    gallery: [{ type: String }],
    organizer: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      website: { type: String, default: '' },
      socialLinks: {
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' }
      }
    },
    highlights: [{ type: String }],
    faqs: [{
      question: { type: String },
      answer: { type: String }
    }],
    status: { type: String, enum: ['draft', 'published', 'cancelled', 'postponed'], default: 'published' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Event", eventSchema);
