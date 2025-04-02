const Agenda = require('agenda');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Agenda with MongoDB connection
const mongoConnectionString = process.env.MONGODB_URI;
const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
  processEvery: '30 seconds'
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Define job for sending emails
agenda.define('send-email', async job => {
  const { recipient, subject, body, from } = job.attrs.data;
  
  try {
    // Send email using nodemailer
    const mailOptions = {
      from: from || process.env.EMAIL_USER,
      to: recipient,
      subject: subject,
      html: body
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
});

// Global error handling for jobs
agenda.on('error', (err) => {
  console.error('Agenda error:', err);
});

// Function to start the agenda
const start = async () => {
  await agenda.start();
  return agenda;
};

// Function to schedule an email
const scheduleEmail = async (recipient, subject, body, delay) => {
  try {
    // Schedule the job to run after the specified delay (in seconds)
    await agenda.schedule(`${delay} seconds`, 'send-email', {
      recipient,
      subject,
      body,
      scheduledAt: new Date()
    });
    
    console.log(`Email scheduled to be sent to ${recipient} in ${delay} seconds`);
    return true;
  } catch (error) {
    console.error('Error scheduling email:', error);
    throw error;
  }
};

// Function to process a sequence of emails
const processSequence = async (sequence, leadEmail) => {
  try {
    let currentDelay = 0;
    
    // Process each node in the sequence
    for (const node of sequence.nodes) {
      if (node.type === 'emailNode') {
        // Schedule email with accumulated delay
        await scheduleEmail(
          leadEmail,
          node.data.subject,
          node.data.body,
          currentDelay
        );
      } else if (node.type === 'delayNode') {
        // Add delay in seconds
        currentDelay += node.data.delaySeconds;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error processing sequence:', error);
    throw error;
  }
};

module.exports = {
  agenda,
  start,
  scheduleEmail,
  processSequence
}; 