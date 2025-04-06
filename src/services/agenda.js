const Agenda = require('agenda');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Agenda
const mongoConnectionString = process.env.MONGODB_URI;
const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
  processEvery: '10 seconds',
});

// Nodemailer Transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Define Job
agenda.define('send-email', async (job) => {
  const { recipient, subject, body, from } = job.attrs.data;

  console.log('📩 Executing job: send-email');
  console.log('Job data:', job.attrs.data);

  try {
    const mailOptions = {
      from: from || process.env.EMAIL_USER,
      to: recipient,
      subject,
      html: body,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(' Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error(' Error sending email:', error);
    throw error;
  }
});

// Event Logging
agenda.on('start', (job) => console.log(` Job starting: ${job.attrs.name}`));
agenda.on('complete', (job) => console.log(` Job complete: ${job.attrs.name}`));
agenda.on('fail', (err, job) => console.log(` Job failed: ${job.attrs.name}`, err));

// Start Agenda
const start = async () => {
  await agenda.start();
  console.log('Agenda started...');
  return agenda;
};

// Schedule Single Email
const scheduleEmail = async (recipient, subject, body, delay) => {
  const when = new Date(Date.now() + delay * 1000); // delay in ms
  await agenda.schedule(when, 'send-email', {
    recipient,
    subject,
    body,
    scheduledAt: new Date(),
  });

  console.log(`📨 Email scheduled to ${recipient} in ${delay} seconds`);
};

// Process Sequence of Emails
const processSequence = async (sequence, leadEmail) => {
  let currentDelay = 0;

  for (const node of sequence.nodes) {
    if (node.type === 'delayNode') {
      currentDelay += node.data.delaySeconds;
      console.log(` Added delay: ${node.data.delaySeconds}s (Total: ${currentDelay}s)`);
    } else if (node.type === 'emailNode') {
      await scheduleEmail(
        leadEmail,
        node.data.subject,
        node.data.body,
        currentDelay
      );
      console.log(`📧 Scheduled email to ${leadEmail} after ${currentDelay}s`);
    }
  }

  return true;
};

module.exports = {
  agenda,
  start,
  scheduleEmail,
  processSequence,
};
