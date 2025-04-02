const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const agenda = require('./services/agenda');
const authRoutes = require('./routes/auth.routes');
const connectDB = require('./config/db'); // Import the DB connection

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

app.get("/" , (req ,res ) => 
    {
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
