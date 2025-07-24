const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // adjust path if needed

// Replace with your MongoDB URI
const MONGO_URI = 'mongodb+srv://23011867:iamthebest@mernapp.t9bho.mongodb.net/FixMyRP?retryWrites=true&w=majority&appName=MERNApp'; // from your .env file

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function createAdmin() {
    const hashedPassword = await bcrypt.hash('Admin456!', 10); // your known password

    const newAdmin = new Admin({
        name: 'Shi Qi',
        email: 'admin2@example.com',
        password: hashedPassword,
        contactNumber: '+65 9000 1234',
        role: 'admin',
    });

    try {
        await newAdmin.save();
        console.log('✅ Admin user created successfully!');
    } catch (err) {
        console.error('❌ Failed to create admin:', err.message);
    } finally {
        mongoose.disconnect();
    }
}

createAdmin();
