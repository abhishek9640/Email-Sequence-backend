const express = require('express');
const router = express.Router();
const Email = require('../models/email.model');
const { scheduleEmail } = require('../services/agenda');

// POST - Schedule a new email
router.post('/schedule', async (req, res) => {
  try {
    const { recipient, subject, body, delay } = req.body;
    
    // Validate required fields
    if (!recipient || !subject || !body || !delay) {
      return res.status(400).json({ 
        message: 'Missing required fields: recipient, subject, body, delay' 
      });
    }
    
    // Calculate scheduled time
    const scheduledFor = new Date(Date.now() + delay * 1000);
    
    // Create new email record
    const email = new Email({
      recipient,
      subject,
      body,
      scheduledFor
    });
    
    // Save to database
    await email.save();
    
    // Schedule email with Agenda.js
    await scheduleEmail(recipient, subject, body, delay);
    
    return res.status(201).json({
      message: 'Email scheduled successfully',
      email
    });
  } catch (error) {
    console.error('Error scheduling email:', error);
    return res.status(500).json({ 
      message: 'Failed to schedule email',
      error: error.message 
    });
  }
});

// GET - Retrieve all scheduled emails
router.get('/', async (req, res) => {
  try {
    const emails = await Email.find().sort({ scheduledFor: 1 });
    return res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch emails',
      error: error.message 
    });
  }
});

// GET - Retrieve a specific email by ID
router.get('/:id', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);
    
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    return res.status(200).json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch email',
      error: error.message 
    });
  }
});

module.exports = router; 