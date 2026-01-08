<?php
/**
 * Campaign Routes Module
 * Handles all campaign-related endpoints: email, SMS, call campaigns
 * 
 * Required: $path, $method
 */

use Xordon\RBACMiddleware;
use Xordon\OwnershipCheck;

/**
 * Match Campaign routes and enforce RBAC
 * @return bool True if route matched
 */
function matchCampaignRoutes(string $path, string $method): bool {
    
    // ===========================================
    // EMAIL CAMPAIGNS
    // ===========================================
    if ($path === '/campaigns' && $method === 'GET') {
        RBACMiddleware::require('campaigns.view');
        return CampaignsController::list();
    }
    if ($path === '/campaigns' && $method === 'POST') {
        RBACMiddleware::require('campaigns.create');
        return CampaignsController::create();
    }
    if (preg_match('#^/campaigns/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            RBACMiddleware::require('campaigns.view');
            OwnershipCheck::requireOwnership('campaigns', $id);
            return CampaignsController::show($id);
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('campaigns.edit');
            OwnershipCheck::requireOwnership('campaigns', $id);
            return CampaignsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('campaigns.delete');
            OwnershipCheck::requireOwnership('campaigns', $id);
            return CampaignsController::delete($id);
        }
    }
    
    // Campaign actions
    if (preg_match('#^/campaigns/(\d+)/send$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('campaigns.send');
        OwnershipCheck::requireOwnership('campaigns', (int)$m[1]);
        return CampaignsController::send((int)$m[1]);
    }
    if (preg_match('#^/campaigns/(\d+)/schedule$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('campaigns.send');
        OwnershipCheck::requireOwnership('campaigns', (int)$m[1]);
        return CampaignsController::schedule((int)$m[1]);
    }
    if (preg_match('#^/campaigns/(\d+)/pause$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('campaigns.edit');
        return CampaignsController::pause((int)$m[1]);
    }
    if (preg_match('#^/campaigns/(\d+)/resume$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('campaigns.edit');
        return CampaignsController::resume((int)$m[1]);
    }
    if (preg_match('#^/campaigns/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('campaigns.create');
        return CampaignsController::duplicate((int)$m[1]);
    }
    
    // Campaign analytics
    if (preg_match('#^/campaigns/(\d+)/analytics$#', $path, $m) && $method === 'GET') {
        RBACMiddleware::require('campaigns.analytics');
        return CampaignsController::analytics((int)$m[1]);
    }
    if (preg_match('#^/campaigns/(\d+)/recipients$#', $path, $m) && $method === 'GET') {
        RBACMiddleware::require('campaigns.view');
        return CampaignsController::recipients((int)$m[1]);
    }
    
    // ===========================================
    // EMAIL CAMPAIGNS (v2/specific)
    // ===========================================
    if ($path === '/email-campaigns' && $method === 'GET') {
        RBACMiddleware::require('campaigns.view');
        return EmailCampaignsController::list();
    }
    if ($path === '/email-campaigns' && $method === 'POST') {
        RBACMiddleware::require('campaigns.create');
        return EmailCampaignsController::create();
    }
    if (preg_match('#^/email-campaigns/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') {
            OwnershipCheck::requireOwnership('email_campaigns', $id);
            return EmailCampaignsController::show($id);
        }
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('campaigns.edit');
            OwnershipCheck::requireOwnership('email_campaigns', $id);
            return EmailCampaignsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('campaigns.delete');
            return EmailCampaignsController::delete($id);
        }
    }
    
    // ===========================================
    // SMS CAMPAIGNS
    // ===========================================
    if ($path === '/sms-campaigns' && $method === 'GET') {
        RBACMiddleware::require('campaigns.view');
        return SMSCampaignsController::list();
    }
    if ($path === '/sms-campaigns' && $method === 'POST') {
        RBACMiddleware::require('campaigns.create');
        return SMSCampaignsController::create();
    }
    if (preg_match('#^/sms-campaigns/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return SMSCampaignsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('campaigns.edit');
            return SMSCampaignsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('campaigns.delete');
            return SMSCampaignsController::delete($id);
        }
    }
    if (preg_match('#^/sms-campaigns/(\d+)/send$#', $path, $m) && $method === 'POST') {
        RBACMiddleware::require('campaigns.send');
        return SMSCampaignsController::send((int)$m[1]);
    }
    
    // ===========================================
    // CALL CAMPAIGNS
    // ===========================================
    if ($path === '/call-campaigns' && $method === 'GET') {
        RBACMiddleware::require('campaigns.view');
        return CallCampaignsController::list();
    }
    if ($path === '/call-campaigns' && $method === 'POST') {
        RBACMiddleware::require('campaigns.create');
        return CallCampaignsController::create();
    }
    if (preg_match('#^/call-campaigns/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return CallCampaignsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('campaigns.edit');
            return CallCampaignsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('campaigns.delete');
            return CallCampaignsController::delete($id);
        }
    }
    
    // ===========================================
    // TEMPLATES
    // ===========================================
    if ($path === '/templates' && $method === 'GET') {
        return TemplatesController::list();
    }
    if ($path === '/templates' && $method === 'POST') {
        RBACMiddleware::require('campaigns.create');
        return TemplatesController::create();
    }
    if (preg_match('#^/templates/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return TemplatesController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') return TemplatesController::update($id);
        if ($method === 'DELETE') return TemplatesController::delete($id);
    }
    if ($path === '/templates/categories' && $method === 'GET') {
        return TemplatesController::categories();
    }
    
    // ===========================================
    // SENDING ACCOUNTS
    // ===========================================
    if ($path === '/sending-accounts' && $method === 'GET') {
        return SendingAccountsController::list();
    }
    if ($path === '/sending-accounts' && $method === 'POST') {
        RBACMiddleware::require('settings.integrations');
        return SendingAccountsController::create();
    }
    if (preg_match('#^/sending-accounts/(\d+)$#', $path, $m)) {
        $id = (int)$m[1];
        if ($method === 'GET') return SendingAccountsController::show($id);
        if ($method === 'PUT' || $method === 'PATCH') {
            RBACMiddleware::require('settings.integrations');
            return SendingAccountsController::update($id);
        }
        if ($method === 'DELETE') {
            RBACMiddleware::require('settings.integrations');
            return SendingAccountsController::delete($id);
        }
    }
    if (preg_match('#^/sending-accounts/(\d+)/test$#', $path, $m) && $method === 'POST') {
        return SendingAccountsController::test((int)$m[1]);
    }
    
    return false; // No route matched
}

// Auto-execute for campaign paths
$campaignPrefixes = ['/campaigns', '/email-campaigns', '/sms-campaigns', '/call-campaigns', '/templates', '/sending-accounts'];
if (isset($path) && isset($method)) {
    foreach ($campaignPrefixes as $prefix) {
        if (strpos($path, $prefix) === 0) {
            if (matchCampaignRoutes($path, $method)) {
                return;
            }
            break;
        }
    }
}
