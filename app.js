// Combined backend app.js (handles both user and admin sides)
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// === Models ===
const User = require('./models/User');

const reportSchema = new mongoose.Schema({
    category: String,
    description: String,
    location: String,
    date: String,
    time: String,
    photoUrl: String,
    name: String,
    userEmail: String,
    messages: [{ text: String, sender: String, time: String }],
    statusHistory: [
        {
            status: { type: String, default: 'Pending' },
            updatedAt: { type: Date, default: Date.now },
        }
    ]
});
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

const notificationSchema = new mongoose.Schema({
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    title: String,
    details: String,
    time: String,
    status: String,
    category: String,
    recipient: String,
    email: String,
}, { timestamps: true });
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// === Routes ===
const authRoutes = require('./routes/authRoutes');
const feedbackRoutes = require('./routes/feedback');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// === Health check ===
app.get('/', (req, res) => res.send('✅ Server is working'));

// === Submit Report ===
app.post('/api/report', async (req, res) => {
    try {
        const { location, description, date, time, photoUrl, name, category, userEmail } = req.body;

        if (!photoUrl || photoUrl.length > 1000000) {
            return res.status(400).json({ error: "Photo is too large or missing." });
        }

        const newReport = new Report({ category, location, description, date, time, photoUrl, name, userEmail });
        await newReport.save();

        const timeStr = `${date}, ${time}`;

        await Notification.insertMany([
            {
                reportId: newReport._id,
                title: 'Report Submitted',
                category,
                details: `Description: ${description}`,
                time: timeStr,
                status: 'success',
                recipient: 'user',
                email: userEmail,
            },
            {
                reportId: newReport._id,
                title: ' Report Submitted',
                category,
                details: `New report by ${name}`,
                time: timeStr,
                status: 'info',
                recipient: 'admin',
                email: 'admin@rp.edu.sg',
            }
        ]);

        res.status(200).json({ message: 'Report and notifications submitted successfully' });
    } catch (err) {
        console.error('Error submitting report:', err);
        res.status(500).json({ error: err.message });
    }
});

// === Edit Report ===
app.put('/api/report/:id/edit', async (req, res) => {
    try {
        const updatedReport = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Report updated successfully', updatedReport });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update report' });
    }
});

// === Admin: update status ===
app.put('/api/reports/:id', async (req, res) => {
    try {
        const { status, updatedAt } = req.body;
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ error: "Report not found." });

        const lastStatus = report.statusHistory.at(-1)?.status;
        if (lastStatus === status) return res.status(400).json({ error: "Status already updated to this status." });
        if (lastStatus === "Resolved") return res.status(400).json({ error: "Report has already been resolved." });

        report.statusHistory.push({ status, updatedAt: updatedAt || new Date() });
        await report.save();

        await new Notification({
            reportId: report._id,
            title: "Report status updated",
            details: `Status changed to "${status}"`,
            time: new Date().toLocaleString(),
            status: "info",
        }).save();

        res.status(200).json({ message: "Status updated successfully." });
    } catch (err) {
        res.status(500).json({ error: "Internal server error." });
    }
});

// === Admin: send message ===
app.patch('/api/reports/:id/message', async (req, res) => {
    try {
        const { message } = req.body;
        const rpt = await Report.findById(req.params.id);
        if (!rpt) return res.status(404).json({ error: 'Report not found' });

        rpt.messages = rpt.messages || [];
        rpt.messages.push({ text: message, sender: 'admin', time: new Date().toLocaleString() });
        await rpt.save();

        const timeStr = new Date().toLocaleString();
        await Notification.insertMany([
            {
                reportId: rpt._id,
                title: 'Message from Admin',
                details: message,
                time: timeStr,
                status: 'info',
                recipient: 'user',
                email: rpt.userEmail
            },
            {
                reportId: rpt._id,
                title: 'Message from Admin',
                details: message,
                time: timeStr,
                status: 'info',
                recipient: 'admin',
                email: 'admin@rp.edu.sg'
            }
        ]);




        res.json({ message: 'Message stored and notifications sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === Admin: Update Name ===
app.put('/api/admin/:email/name', async (req, res) => {
    console.log('🛠️ Updating admin name for email:', req.params.email);
    try {
        const result = await Admin.findOneAndUpdate(
            { email: req.params.email },
            { name: req.body.name }
        );
        if (!result) return res.status(404).json({ error: 'Admin not found' });
        res.status(200).json({ message: 'Admin name updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// === Admin: Update Contact Number ===
app.put('/api/admin/:email/contact', async (req, res) => {
    try {
        await Admin.findOneAndUpdate({ email: req.params.email }, { contactNumber: req.body.contactNumber });
        res.status(200).json({ message: 'Admin contact updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === Admin: Update Email ===
app.put('/api/admin/:email/email', async (req, res) => {
    try {
        await Admin.findOneAndUpdate({ email: req.params.email }, { email: req.body.newEmail });
        res.status(200).json({ message: 'Admin email updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === Admin: Update Password ===
app.put('/api/admin/:email/password', async (req, res) => {
    try {
        const hashed = await bcrypt.hash(req.body.newPassword, 10);
        await Admin.findOneAndUpdate({ email: req.params.email }, { password: hashed });
        res.status(200).json({ message: 'Admin password updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === Get All Feedbacks ===
app.get('/api/feedback', async (req, res) => {
    try {
        const Feedback = require('./models/Feedback');
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.status(200).json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch feedbacks' });
    }
});



// List all reports
app.get('/api/reports', async (req, res) => {
    try {
        const all = await Report.find().sort({ createdAt: -1 });
        res.json(all);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// backend app.js
app.get('/api/reports/:id', async (req, res) => {
    try {
        const rpt = await Report.findById(req.params.id);
        if (!rpt) return res.status(404).json({ error: "Report not found" });
        res.json(rpt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === Notifications ===
app.get('/api/notifications', async (req, res) => {
    const { email, recipient } = req.query;
    const filter = {};
    if (email) filter.email = email;
    if (recipient) filter.recipient = recipient;

    try {
        const notes = await Notification.find(filter).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/notifications', async (req, res) => {
    try {
        const notif = new Notification(req.body);
        await notif.save();
        res.json(notif);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE notifications
app.delete('/api/notifications', async (req, res) => {
    try {
        await Notification.deleteMany({});
        res.status(200).json({ message: 'All notifications cleared' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});


// === Delete Report ===
app.delete('/api/report/:id', async (req, res) => {
    try {
        await Report.findByIdAndDelete(req.params.id);
        await Notification.deleteOne({ reportId: req.params.id });
        res.status(200).json({ message: 'Report and notification deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

// === User Profile ===
app.put('/api/user/:email/name', async (req, res) => {
    try {
        await User.findOneAndUpdate({ email: req.params.email }, { name: req.body.name });
        await Report.updateMany({ userEmail: req.params.email }, { $set: { name: req.body.name } });
        res.status(200).json({ message: 'Name updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user/:email/contact', async (req, res) => {
    try {
        await User.findOneAndUpdate({ email: req.params.email }, { contactNumber: req.body.contactNumber });
        res.status(200).json({ message: 'Contact updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user/:email/email', async (req, res) => {
    try {
        await User.findOneAndUpdate({ email: req.params.email }, { email: req.body.newEmail });
        res.status(200).json({ message: 'Email updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user/:email/password', async (req, res) => {
    try {
        const hashed = await bcrypt.hash(req.body.newPassword, 10);
        await User.findOneAndUpdate({ email: req.params.email }, { password: hashed });
        res.status(200).json({ message: 'Password updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === Start Server ===
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
