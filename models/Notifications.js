const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['info', 'warning', 'success'],
        default: 'info'
    },
    userEmail: {  // <-- this is important for filtering by user
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
