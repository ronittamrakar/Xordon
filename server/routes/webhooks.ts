import express from 'express';
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';

const router = express.Router();

/**
 * Webhook handler for inbound calls
 * This endpoint receives calls from Twilio/SignalWire and handles routing
 */
router.post('/inbound-call', async (req, res) => {
    try {
        const {
            From: fromNumber,
            To: toNumber,
            CallSid: callSid,
            CallStatus: callStatus,
            Direction: direction
        } = req.body;

        console.log('[Webhook] Inbound call received:', {
            from: fromNumber,
            to: toNumber,
            callSid,
            status: callStatus
        });

        // Find the phone number configuration
        const phoneNumber = await req.db.query(
            `SELECT * FROM phone_numbers WHERE phone_number = $1 AND status = 'active'`,
            [toNumber]
        );

        if (!phoneNumber.rows[0]) {
            console.error('[Webhook] Phone number not found:', toNumber);
            return res.status(404).send('Number not configured');
        }

        const config = phoneNumber.rows[0];
        const twiml = new VoiceResponse();

        // Log the call
        await req.db.query(
            `INSERT INTO call_logs 
       (phone_number_id, from_number, to_number, direction, status, call_sid, tracking_campaign, started_at, workspace_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)`,
            [
                config.id,
                fromNumber,
                toNumber,
                'inbound',
                callStatus,
                callSid,
                config.tracking_campaign,
                config.workspace_id
            ]
        );

        // Handle based on destination type
        switch (config.destination_type) {
            case 'forward':
                handleForwarding(twiml, config, fromNumber);
                break;

            case 'voice_bot':
                handleVoiceBot(twiml, config);
                break;

            case 'application':
                handleSIPApplication(twiml, config);
                break;

            default:
                // Default to voicemail if no config
                twiml.say('Thank you for calling. Please leave a message after the beep.');
                twiml.record({
                    transcribe: true,
                    transcribeCallback: `/api/webhooks/voicemail-transcription`,
                    maxLength: 120,
                    finishOnKey: '#'
                });
                break;
        }

        res.type('text/xml');
        res.send(twiml.toString());

    } catch (error) {
        console.error('[Webhook] Error handling inbound call:', error);

        // Fallback TwiML
        const twiml = new VoiceResponse();
        twiml.say('We are experiencing technical difficulties. Please try again later.');
        twiml.hangup();

        res.type('text/xml');
        res.send(twiml.toString());
    }
});

/**
 * Handle call forwarding with whisper and recording
 */
function handleForwarding(twiml: VoiceResponse, config: any, fromNumber: string) {
    if (!config.forwarding_number) {
        twiml.say('This number is not configured for forwarding.');
        twiml.hangup();
        return;
    }

    // Play whisper message to agent before connecting
    if (config.whisper_message) {
        twiml.say({
            voice: 'alice',
            language: 'en-US'
        }, config.whisper_message);
    }

    // Dial the forwarding number
    const dial = twiml.dial({
        callerId: config.pass_call_id ? fromNumber : config.phone_number,
        record: config.call_recording ? 'record-from-answer' : undefined,
        recordingStatusCallback: config.call_recording ? '/api/webhooks/recording-complete' : undefined,
        timeout: 30,
        action: '/api/webhooks/call-status'
    });

    dial.number(config.forwarding_number);
}

/**
 * Handle AI voice bot routing
 */
function handleVoiceBot(twiml: VoiceResponse, config: any) {
    // Route to AI voice assistant
    twiml.say('Connecting you to our AI assistant.');

    // Connect to WebSocket for real-time AI processing
    twiml.connect().stream({
        url: `wss://${process.env.APP_DOMAIN}/api/voice-ai/stream`,
        track: 'both_tracks'
    });
}

/**
 * Handle SIP application routing (softphone)
 */
function handleSIPApplication(twiml: VoiceResponse, config: any) {
    // Route to SIP endpoint for softphone
    const dial = twiml.dial({
        timeout: 30,
        record: config.call_recording ? 'record-from-answer' : undefined
    });

    // Use SignalWire/Twilio Client
    dial.client(`user_${config.workspace_id}`);
}

/**
 * Webhook for call status updates
 */
router.post('/call-status', async (req, res) => {
    const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;

    try {
        await req.db.query(
            `UPDATE call_logs 
       SET status = $1, duration_seconds = $2, recording_url = $3, ended_at = NOW()
       WHERE call_sid = $4`,
            [CallStatus, CallDuration || 0, RecordingUrl, CallSid]
        );

        console.log('[Webhook] Call status updated:', CallSid, CallStatus);
    } catch (error) {
        console.error('[Webhook] Error updating call status:', error);
    }

    res.sendStatus(200);
});

/**
 * Webhook for recording completion
 */
router.post('/recording-complete', async (req, res) => {
    const { CallSid, RecordingUrl, RecordingDuration, RecordingSid } = req.body;

    try {
        await req.db.query(
            `UPDATE call_logs 
       SET recording_url = $1, recording_duration = $2, recording_sid = $3
       WHERE call_sid = $4`,
            [RecordingUrl, RecordingDuration, RecordingSid, CallSid]
        );

        console.log('[Webhook] Recording saved:', CallSid, RecordingUrl);
    } catch (error) {
        console.error('[Webhook] Error saving recording:', error);
    }

    res.sendStatus(200);
});

/**
 * Webhook for voicemail transcription
 */
router.post('/voicemail-transcription', async (req, res) => {
    const {
        CallSid,
        RecordingUrl,
        RecordingDuration,
        TranscriptionText,
        From: fromNumber,
        To: toNumber
    } = req.body;

    try {
        // Find phone number
        const phoneNumber = await req.db.query(
            `SELECT id, workspace_id FROM phone_numbers WHERE phone_number = $1`,
            [toNumber]
        );

        if (phoneNumber.rows[0]) {
            // Save voicemail
            await req.db.query(
                `INSERT INTO voicemails 
         (phone_number_id, workspace_id, from_number, audio_url, transcription, duration_seconds, status, received_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'new', NOW())`,
                [
                    phoneNumber.rows[0].id,
                    phoneNumber.rows[0].workspace_id,
                    fromNumber,
                    RecordingUrl,
                    TranscriptionText,
                    RecordingDuration
                ]
            );

            console.log('[Webhook] Voicemail saved with transcription');
        }
    } catch (error) {
        console.error('[Webhook] Error saving voicemail:', error);
    }

    res.sendStatus(200);
});

/**
 * Test endpoint to verify webhook configuration
 */
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Webhook endpoint is active',
        endpoints: {
            inboundCall: '/api/webhooks/inbound-call',
            callStatus: '/api/webhooks/call-status',
            recordingComplete: '/api/webhooks/recording-complete',
            voicemailTranscription: '/api/webhooks/voicemail-transcription'
        }
    });
});

export default router;
