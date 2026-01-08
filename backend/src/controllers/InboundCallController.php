<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Logger.php';

class InboundCallController {

    public static function handleInboundCall(): void {
        Logger::info("Inbound call webhook received", $_POST);

        $from = $_POST['From'] ?? '';
        $to = $_POST['To'] ?? '';
        $callSid = $_POST['CallSid'] ?? '';
        $direction = $_POST['Direction'] ?? 'inbound';
        $callStatus = $_POST['CallStatus'] ?? 'ringing';

        $pdo = Database::conn();
        
        // Find the phone number configuration in our DB
        $stmt = $pdo->prepare("SELECT * FROM phone_numbers WHERE phone_number = ? AND status = 'active'");
        $stmt->execute([$to]);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$config) {
            Logger::warning("Inbound call to unknown number: $to");
            header('Content-Type: text/xml');
            echo '<?xml version="1.0" encoding="UTF-8"?><Response><Say>The number you have dialed is not in service.</Say><Hangup/></Response>';
            return;
        }

        // Log the call start
        try {
            $stmt = $pdo->prepare("
                INSERT INTO phone_call_logs 
                (phone_number_id, user_id, from_number, to_number, direction, status, call_sid, tracking_campaign, started_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $config['id'],
                $config['user_id'], // Map to owner
                $from,
                $to,
                'inbound',
                $callStatus,
                $callSid,
                $config['tracking_campaign']
            ]);
        } catch (Exception $e) {
            Logger::error("Failed to log inbound call: " . $e->getMessage());
        }

        header('Content-Type: text/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<Response>';

        switch ($config['destination_type']) {
            case 'forward':
                self::generateForwardXml($config, $from);
                break;
            case 'voice_bot':
                self::generateVoiceBotXml($config);
                break;
            case 'application':
                self::generateSipXml($config);
                break;
            case 'ivr_flow':
                if (!empty($config['call_flow_id'])) {
                    echo \Xordon\Services\IVREngineService::execute($config['call_flow_id']);
                    exit;
                }
                self::generateVoicemailXml($config);
                break;
            default:
                self::generateVoicemailXml($config);
                break;
        }

        echo '</Response>';
    }

    private static function generateForwardXml($config, $originalCallerId) {
        if (empty($config['forwarding_number'])) {
            // Fallback to voicemail if no forwarding number configured
            self::generateVoicemailXml($config);
            return;
        }

        // Whisper logic
        $recordAttr = $config['call_recording'] ? 'record="true" recordingStatusCallback="/api/webhooks/recording-complete"' : '';
        $callerId = $config['pass_call_id'] ? $originalCallerId : $config['phone_number'];
        
        echo '<Dial timeout="20" callerId="' . htmlspecialchars($callerId) . '" ' . $recordAttr . ' action="/api/webhooks/call-status">';
        
        if (!empty($config['whisper_message'])) {
            $whisperUrl = '/api/webhooks/whisper?msg=' . urlencode($config['whisper_message']);
            echo '<Number url="' . htmlspecialchars($whisperUrl) . '">' . htmlspecialchars($config['forwarding_number']) . '</Number>';
        } else {
            echo '<Number>' . htmlspecialchars($config['forwarding_number']) . '</Number>';
        }
        
        echo '</Dial>';
        
        // Fallback to voicemail if no answer/busy/failed
        self::generateVoicemailXml($config);
    }

    private static function generateVoiceBotXml($config) {
        $agentId = $config['ai_agent_id'] ?? null;
        $greeting = $config['ai_greeting'] ?? 'Hello, I am your AI assistant. How can I help you today?';
        $callSid = $_POST['CallSid'] ?? '';

        if (!$agentId) {
            self::generateVoicemailXml($config);
            return;
        }

        $callbackUrl = "/api/phone/ai-callback?agentId=$agentId";
        echo '<Gather input="speech" action="' . $callbackUrl . '" timeout="3">';
        echo '<Say>' . htmlspecialchars($greeting) . '</Say>';
        echo '</Gather>';
        echo '<Redirect>' . $callbackUrl . '?status=no-input</Redirect>';
    }

    private static function generateSipXml($config) {
        $recordAttr = $config['call_recording'] ? 'record="true"' : '';
        echo '<Dial timeout="30" ' . $recordAttr . '>';
        echo '<Client>user_' . $config['user_id'] . '</Client>'; 
        echo '</Dial>';
        // Fallback
        self::generateVoicemailXml($config);
    }

    private static function generateVoicemailXml($config = null) {
        $greeting = ($config && !empty($config['voicemail_greeting'])) ? $config['voicemail_greeting'] : 'Please leave a message after the beep.';
        echo '<Say>' . htmlspecialchars($greeting) . '</Say>';
        echo '<Record maxLength="120" transcribe="true" transcribeCallback="/api/webhooks/voicemail-transcription" action="/api/webhooks/recording-complete" />';
    }
    
    public static function handleWhisper(): void {
        $msg = $_GET['msg'] ?? 'Incoming call';
        header('Content-Type: text/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<Response><Say>' . htmlspecialchars($msg) . '</Say></Response>';
    }

    public static function handleCallStatus(): void {
        $callSid = $_POST['CallSid'] ?? '';
        $callStatus = $_POST['CallStatus'] ?? '';
        $duration = $_POST['CallDuration'] ?? 0;
        $recordingUrl = $_POST['RecordingUrl'] ?? null;

        if (!$callSid) return;

        $pdo = Database::conn();
        try {
            $sql = "UPDATE phone_call_logs SET status = ?, duration_seconds = ?, ended_at = NOW()";
            $params = [$callStatus, $duration];

            if ($recordingUrl) {
                $sql .= ", recording_url = ?";
                $params[] = $recordingUrl;
            }

            $sql .= " WHERE call_sid = ?";
            $params[] = $callSid;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            Logger::info("Updated call status: $callSid -> $callStatus");
        } catch (Exception $e) {
            Logger::error("Failed to update call status: " . $e->getMessage());
        }
    }

    public static function handleRecordingComplete(): void {
        $callSid = $_POST['CallSid'] ?? '';
        $recordingUrl = $_POST['RecordingUrl'] ?? '';
        $duration = $_POST['RecordingDuration'] ?? 0;
        $recordingSid = $_POST['RecordingSid'] ?? '';

        if (!$callSid) return;

        $pdo = Database::conn();
        try {
            $stmt = $pdo->prepare("
                UPDATE phone_call_logs 
                SET recording_url = ?, recording_duration = ?, recording_sid = ? 
                WHERE call_sid = ?
            ");
            $stmt->execute([$recordingUrl, $duration, $recordingSid, $callSid]);
            Logger::info("Updated recording for call: $callSid");
        } catch (Exception $e) {
            Logger::error("Failed to update recording: " . $e->getMessage());
        }
    }

    public static function handleVoicemailTranscription(): void {
        $to = $_POST['To'] ?? '';
        $from = $_POST['From'] ?? '';
        $recordingUrl = $_POST['RecordingUrl'] ?? '';
        $text = $_POST['TranscriptionText'] ?? '';
        $duration = $_POST['RecordingDuration'] ?? 0;

        $pdo = Database::conn();

        $stmt = $pdo->prepare("SELECT id, workspace_id, user_id FROM phone_numbers WHERE phone_number = ?");
        $stmt->execute([$to]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($number) {
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO voicemails 
                    (phone_number_id, workspace_id, user_id, from_number, audio_url, transcription, duration_seconds, status, received_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'new', NOW())
                ");
                $stmt->execute([
                    $number['id'],
                    $number['workspace_id'],
                    $number['user_id'],
                    $from,
                    $recordingUrl,
                    $text,
                    $duration
                ]);
                Logger::info("Voicemail saved for {$number['phone_number']}");
            } catch (Exception $e) {
                Logger::error("Failed to save voicemail: " . $e->getMessage());
            }
        }
    }
}
