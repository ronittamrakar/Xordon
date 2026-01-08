<?php
/**
 * Automation Trigger Helper
 * Call this function whenever an event happens that should trigger automations
 */

require_once __DIR__ . "/services/FixedAutomationProcessor.php";

function triggerAutomations($channel, $triggerType, $contactId, $triggerData = []) {
    return FixedAutomationProcessor::processTrigger($channel, $triggerType, $contactId, $triggerData);
}

// Specific trigger functions for common events
function triggerCallDisposition($contactId, $dispositionId, $dispositionName) {
    $triggerData = [
        'disposition_id' => $dispositionId,
        'disposition' => $dispositionName,
        'contact_id' => $contactId
    ];
    
    // Map dispositions to trigger types
    $triggerMap = [
        'interested' => 'disposition_interested',
        'not_interested' => 'disposition_not_interested',
        'callback' => 'disposition_callback',
        'voicemail' => 'disposition_voicemail',
        'busy' => 'disposition_busy',
        'appointment' => 'disposition_appointment',
        'sale' => 'disposition_sale',
        'dnc' => 'disposition_dnc'
    ];
    
    $triggerType = $triggerMap[$dispositionName] ?? 'disposition_custom';
    
    return triggerAutomations('call', $triggerType, $contactId, $triggerData);
}

function triggerEmailEvent($contactId, $eventType, $emailData = []) {
    $triggerData = array_merge([
        'contact_id' => $contactId,
        'event_type' => $eventType
    ], $emailData);
    
    return triggerAutomations('email', $eventType, $contactId, $triggerData);
}

function triggerSMSEvent($contactId, $eventType, $smsData = []) {
    $triggerData = array_merge([
        'contact_id' => $contactId,
        'event_type' => $eventType
    ], $smsData);
    
    return triggerAutomations('sms', $eventType, $contactId, $triggerData);
}

function triggerFormEvent($contactId, $eventType, $formData = []) {
    $triggerData = array_merge([
        'contact_id' => $contactId,
        'event_type' => $eventType
    ], $formData);
    
    return triggerAutomations('form', $eventType, $contactId, $triggerData);
}
?>