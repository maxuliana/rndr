// server.js - Node.js server to generate Twilio capability tokens
// This server will handle token generation for Twilio Client

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global variable to store TwiML App SID
let twimlAppSid;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Routes
app.get('/', (req, res) => {
  res.send('Twilio Token Server is running');
});

// Generate capability token
app.post('/token', async (req, res) => {
  try {
    const { accountSid, authToken, phoneNumber, identity } = req.body;

    if (!accountSid || !authToken || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const client = twilio(accountSid, authToken);

    // Setup TwiML App on demand
    if (!twimlAppSid) {
      const voiceUrl = `${process.env.SERVER_URL || `http://localhost:${PORT}`}/voice`;
      const app = await client.applications.create({
        friendlyName: 'Auto Dialer TwiML App',
        voiceUrl,
        voiceMethod: 'POST'
      });
      twimlAppSid = app.sid;
      console.log(`Created TwiML App: ${twimlAppSid}`);
    }

    // Create capability token
    const capability = new twilio.jwt.ClientCapability({
      accountSid,
      authToken
    });

    capability.addScope(new twilio.jwt.ClientCapability.OutgoingClientScope({
      applicationSid: twimlAppSid
    }));

    capability.addScope(new twilio.jwt.ClientCapability.IncomingClientScope(
      identity || 'browser'
    ));

    const token = capability.toJwt();

    res.json({
      token,
      twimlAppSid,
      identity: identity || 'browser'
    });

  } catch (error) {
    console.error('Token generation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create a TwiML response for incoming browser calls
app.post('/voice', (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  console.log('--- /voice HIT ---');
  console.log('To:', req.body.To);
  console.log('From:', req.body.From);
  console.log('Request body:', req.body);
  
  if (req.body.To && req.body.To.match(/^\+\d+$/)) {
    // Outbound call to phone number
    const dial = response.dial({
      callerId: req.body.From || req.body.phoneNumber || process.env.TWILIO_PHONE_NUMBER,
      answerOnBridge: true,
      timeLimit: 14400
    });
    dial.number(req.body.To);
  } else {
    // Call intended for browser client
    response.say('Connecting you to browser client');
    const dial = response.dial({
      answerOnBridge: true
    });
    dial.client('browser');
  }

  res.type('text/xml');
  res.send(response.toString());
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Token endpoint: http://localhost:${PORT}/token`);
});
