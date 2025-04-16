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

// Function to create/update TwiML Application
async function setupTwimlApp() {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const voiceUrl = `${process.env.SERVER_URL || `http://localhost:${PORT}`}/voice`;
    
    // Check if we already have a TwiML App SID in .env
    if (process.env.TWILIO_APP_SID) {
      // Update existing app
      await client.applications(process.env.TWILIO_APP_SID)
        .update({ voiceUrl });
      twimlAppSid = process.env.TWILIO_APP_SID;
      console.log(`Updated existing TwiML App: ${twimlAppSid}`);
    } else {
      // Create new app
      const app = await client.applications.create({
        friendlyName: 'Auto Dialer TwiML App',
        voiceUrl,
        voiceMethod: 'POST'
      });
      twimlAppSid = app.sid;
      console.log(`Created new TwiML App: ${twimlAppSid}`);
    }
  } catch (error) {
    console.error('Error setting up TwiML App:', error);
    process.exit(1);
  }
}

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
    const { accountSid, identity } = req.body;
    
    if (!accountSid) {
      return res.status(400).json({ error: 'Account SID is required' });
    }
    
    // In production, validate that this is a legitimate accountSid
    // and this request is coming from an authorized client
    
    // Use environment variables for actual Twilio credentials
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioAppSid = twimlAppSid; // Use the auto-configured TwiML App SID
    
    // Create a capability token
    const capability = new twilio.jwt.ClientCapability({
      accountSid: twilioAccountSid,
      authToken: twilioAuthToken
    });
    
    // Allow outgoing calls to your TwiML application
    capability.addScope(new twilio.jwt.ClientCapability.OutgoingClientScope({
      applicationSid: twilioAppSid
    }));
    
    // Allow incoming calls to 'browser' client
    capability.addScope(new twilio.jwt.ClientCapability.IncomingClientScope(
      identity || 'browser'
    ));
    
    // Generate token with a TTL of 1 hour
    const token = capability.toJwt();
    
    res.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Create a TwiML response for incoming browser calls
app.post('/voice', (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  // Check if this is an outbound call from browser to a phone number
  if (req.body.To && req.body.To.match(/^\+\d+$/)) {
    // Outbound call to a regular phone number
    // We need to set a proper callerId (From) number that's verified with Twilio
    const dial = response.dial({
      callerId: req.body.From || process.env.TWILIO_PHONE_NUMBER,
      answerOnBridge: true,  // This ensures audio doesn't connect until the call is answered
      timeLimit: 14400       // 4 hours max call time
    });
    dial.number(req.body.To);
  } else {
    // Incoming call to browser client
    response.say('Connecting you to browser client');
    const dial = response.dial({
      answerOnBridge: true  // This ensures audio doesn't connect until the call is answered
    });
    dial.client('browser');
  }
  
  res.type('text/xml');
  res.send(response.toString());
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Token endpoint: http://localhost:${PORT}/token`);
  
  // Setup TwiML App on startup
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Token endpoint: http://localhost:${PORT}/token`);
});


// Instructions for setup:
// 1. Create a .env file with the following variables:
//    TWILIO_ACCOUNT_SID=your_account_sid
//    TWILIO_AUTH_TOKEN=your_auth_token
//    TWILIO_APP_SID=your_twiml_app_sid
//    TWILIO_PHONE_NUMBER=your_twilio_phone_number
//
// 2. Install dependencies:
//    npm install express cors twilio dotenv
//
// 3. Run the server:
//    node server.js
