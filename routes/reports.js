const express = require('express');
const router = express.Router();
const Report = require('../models/Reports'); // Adjust path if needed

// GET all reports, newest first
router.get('/all', async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        console.error('❌ Error fetching reports:', error);
        res.status(500).json({ message: 'Failed to fetch reports' });
    }
});

module.exports = router;
