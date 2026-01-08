# SignalWire Setup Guide

This guide will help you configure SignalWire for phone number provisioning and calling features.

## Why SignalWire?

SignalWire is a modern, developer-friendly alternative to Twilio with:
- **Better pricing** - More competitive rates
- **Superior quality** - Built on modern infrastructure
- **Easy migration** - Compatible with Twilio API
- **Advanced features** - Video, messaging, and more

## Quick Setup (5 minutes)

### Step 1: Create a SignalWire Account

1. Go to [SignalWire.com](https://signalwire.com/signup)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your Credentials

1. **Login** to your SignalWire dashboard
2. Navigate to **"API"** section in the left sidebar
3. You'll see three important values:

   - **Project ID** - A UUID like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
   - **Space URL** - Your subdomain like `yourspace.signalwire.com`
   - **API Token** - Starts with `PT` like `PT1234567890abcdefghijklmnopqrstuvwxyz`

### Step 3: Configure Your Application

1. Open `backend/.env` file
2. Find the SignalWire section (around line 46)
3. Replace the empty values with your credentials:

```env
# SignalWire Configuration
SIGNALWIRE_PROJECT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
SIGNALWIRE_SPACE_URL=yourspace.signalwire.com
SIGNALWIRE_API_TOKEN=PT1234567890abcdefghijklmnopqrstuvwxyz
SIGNALWIRE_DEFAULT_SENDER=+1234567890
```

**Important:** 
- Do NOT use the placeholder values (`your_project_id`, etc.)
- Copy your ACTUAL credentials from the SignalWire dashboard
- The Space URL should NOT include `https://`

### Step 4: Test Your Configuration

1. **Restart your backend server** (if running)
2. Navigate to **Phone Numbers** in your application
3. Click **"Purchase Number"**
4. Try searching for available numbers

If configured correctly, you should see available phone numbers!

## Troubleshooting

### Error: "SignalWire not configured"

**Problem:** Your credentials are empty or still using placeholder values.

**Solution:**
1. Check your `.env` file
2. Make sure you've replaced ALL placeholder values with real credentials
3. Restart your backend server

### Error: "Failed to search numbers" (400 Bad Request)

**Problem:** Your credentials are incorrect or invalid.

**Solution:**
1. Double-check you copied the credentials correctly
2. Make sure there are no extra spaces
3. Verify your account is active on SignalWire
4. Try regenerating your API token in the SignalWire dashboard

### Error: "Invalid Space URL"

**Problem:** Space URL format is incorrect.

**Solution:**
- ✅ Correct: `yourspace.signalwire.com`
- ❌ Wrong: `https://yourspace.signalwire.com`
- ❌ Wrong: `yourspace.signalwire.com/`

### Numbers not showing up?

**Possible causes:**
1. **Area code doesn't exist** - Try a different area code (e.g., 212 for NYC)
2. **Country code issue** - Make sure you selected the right country
3. **No numbers available** - Try a different area code or country

## Alternative: Using Twilio

If you prefer Twilio over SignalWire:

1. Get credentials from [Twilio Console](https://www.twilio.com/console)
2. Update your `.env`:

```env
# Leave SignalWire empty
SIGNALWIRE_PROJECT_ID=
SIGNALWIRE_SPACE_URL=
SIGNALWIRE_API_TOKEN=

# Add Twilio credentials
TWILIO_ACCOUNT_SID=AC1234567890abcdefghijklmnopqrstuvwx
TWILIO_AUTH_TOKEN=1234567890abcdefghijklmnopqrstuvwx
```

The system will automatically use Twilio if SignalWire is not configured.

## Need Help?

- **SignalWire Docs:** https://docs.signalwire.com
- **SignalWire Support:** https://signalwire.com/support
- **Community Slack:** https://signalwire.community

## Pricing

SignalWire offers competitive pricing:
- **Phone numbers:** ~$1/month
- **Inbound calls:** $0.0085/min
- **Outbound calls:** $0.0125/min
- **SMS:** $0.0079/message

Check current pricing: https://signalwire.com/pricing

---

**Pro Tip:** SignalWire offers $5 free credit for new accounts - perfect for testing!
