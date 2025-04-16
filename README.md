# Twilio Token Server for Auto Dialer

This is a Node.js server that generates Twilio capability tokens for browser-based calling applications. It's designed to be deployed on Render.

## Features

- Generates Twilio Client capability tokens
- Handles TwiML responses for outbound and inbound calls
- Automatically creates/updates a TwiML Application on startup
- Configured for easy deployment to Render

## Prerequisites

- [Twilio Account](https://www.twilio.com/try-twilio)
- [Render Account](https://render.com/)
- A Twilio phone number

## Local Development

1. Clone this repository
2. Create a `.env` file based on `.env.example`
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Deployment to Render

### 1. Create Environment Group

In your Render dashboard, create a new "Environment Group" named `twilio` with the following variables:

- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number (in E.164 format, e.g., +1234567890)
- `TWILIO_APP_SID`: (Optional) If you already have a TwiML App, provide its SID

### 2. Deploy to Render

1. Push this repository to GitHub
2. In your Render dashboard, create a new "Web Service"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` configuration
5. Click "Apply"
6. Once deployed, go to the "Environment" tab and set `SERVER_URL` to your Render service URL (e.g., `https://lmd-server.onrender.com`)

### 3. Verify Deployment

- Visit your Render service URL to see "Twilio Token Server is running"
- Check the Render logs to ensure the TwiML App was created/updated successfully

## API Endpoints

### GET /

Returns a simple message indicating the server is running.

### POST /token

Generates a Twilio capability token.

**Request Body:**
```json
{
  "accountSid": "your_twilio_account_sid",
  "identity": "optional_client_identity"
}
```

**Response:**
```json
{
  "token": "your_capability_token"
}
```

### POST /voice

Handles TwiML responses for voice calls.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| TWILIO_ACCOUNT_SID | Your Twilio Account SID | Yes |
| TWILIO_AUTH_TOKEN | Your Twilio Auth Token | Yes |
| TWILIO_PHONE_NUMBER | Your Twilio phone number | Yes |
| TWILIO_APP_SID | Your TwiML App SID | No |
| SERVER_URL | The public URL of this server | No |
| PORT | The port to run the server on | No |