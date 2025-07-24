// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

router.post('/submit', async (req, res) => {
    const { feedbackText, rating, name, email, contactNumber } = req.body;

    try {
        const newFeedback = new Feedback({
            feedbackText,
            rating,
            name,
            email,
            contactNumber
        });

        await newFeedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
