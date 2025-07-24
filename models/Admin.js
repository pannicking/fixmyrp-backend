const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'admin' },
    contactNumber: String
});

module.exports = mongoose.model('Admin', adminSchema);
