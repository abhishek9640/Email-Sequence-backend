const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { start } = require('./services/agenda'); 
const authRoutes = require('./routes/auth.routes');
const emailRoutes = require('./routes/email.routes');
const sequenceRoutes = require('./routes/sequence.routes');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB and Start Agenda
connectDB()
  .then(async () => {
    await start(); // Correct call
    console.log(' Agenda scheduler started');
  })
  .catch((err) => {
    console.error(' Failed to connect DB:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/sequences', sequenceRoutes);

app.get('/', (req, res) => {
  res.send('<h1>Server is running...</h1>');
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);

  // Self-Ping for Render
  setInterval(() => {
    axios
    //   .get('https://email-sequence-backend-64ae.onrender.com/')
      .get('http://localhost:5000/')
      .then(() => console.log(' Self-ping successful'))
      .catch((err) => console.log(' Self-ping failed:', err.message));
  }, 5 * 60 * 1000); // Every 5 minutes
});
