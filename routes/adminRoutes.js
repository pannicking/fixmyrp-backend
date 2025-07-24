const express = require('express');
const bcrypt  = require('bcryptjs');
const Admin   = require('../models/Admin');

const router = express.Router();

// — LOGIN —
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin)
            return res.status(404).json({ message: 'Admin not found' });
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid credentials' });
        res.json({
            name:          admin.name,
            email:         admin.email,
            contactNumber: admin.contactNumber,
            role:          admin.role
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// — UPDATE NAME —
router.put('/:email/name', async (req, res) => {
    try {
        await Admin.findOneAndUpdate(
            { email: req.params.email },
            { name: req.body.name }
        );
        res.json({ message: 'Admin name updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// — UPDATE CONTACT NUMBER —
router.put('/:email/contact', async (req, res) => {
    try {
        await Admin.findOneAndUpdate(
            { email: req.params.email },
            { contactNumber: req.body.contactNumber }
        );
        res.json({ message: 'Admin contact updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// — UPDATE EMAIL (you may need to re-authenticate or handle duplicates) —
router.put('/:email/email', async (req, res) => {
    try {
        await Admin.findOneAndUpdate(
            { email: req.params.email },
            { email: req.body.newEmail }
        );
        res.json({ message: 'Admin email updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// — UPDATE PASSWORD —
router.put('/:email/password', async (req, res) => {
    try {
        const hashed = await bcrypt.hash(req.body.newPassword, 10);
        await Admin.findOneAndUpdate(
            { email: req.params.email },
            { password: hashed }
        );
        res.json({ message: 'Admin password updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
