const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    category: String,
    description: String,
    location: String,
    date: String,
    time: String,
    photoUrl: String,
    name: String,
    userEmail: String,
    statusHistory: [
        {
            status: { type: String, default: 'Pending' },
            updatedAt: { type: Date, default: Date.now },
        },
    ],
});

// ✅ Prevent OverwriteModelError
module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
