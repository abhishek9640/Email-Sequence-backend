const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');  
const agenda = require('./services/agenda');
const authRoutes = require('./routes/auth.routes');
const connectDB = require('./config/db'); 

// Import routes
const emailRoutes = require('./routes/email.routes');
const sequenceRoutes = require('./routes/sequence.routes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB().then(() => {
    // Start Agenda after MongoDB connection
    agenda.start();
    console.log('Agenda scheduler started');
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// API Routes
app.use('/api/emails', emailRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
    res.send('<h1>Server is running...</h1>');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // **Self-Pinging Mechanism**
    setInterval(() => {
        axios.get(`https://email-sequence-backend-64ae.onrender.com/`) 
            .then(() => console.log("Self-ping successful"))
            .catch(err => console.log("Self-ping failed:", err.message));
    }, 300000); // Ping every 5 minutes (300,000 ms)
});

module.exports = app;
