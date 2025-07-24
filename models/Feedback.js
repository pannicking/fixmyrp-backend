const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    feedbackText: { type: String, required: true },
    rating: { type: Number, required: true },
    name: { type: String },
    email: { type: String },
    contactNumber: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
