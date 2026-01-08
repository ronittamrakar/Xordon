<?php
/**
 * Customer Stripe Service
 * Handles Stripe interactions for customer subscriptions
 */

require_once __DIR__ . '/../Database.php';

class CustomerStripeService {
    
    /**
     * Get Stripe Secret Key for a workspace
     */
    public static function getApiKey(int $workspaceId): ?string {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT credentials_encrypted FROM integrations WHERE workspace_id = ? AND provider = 'stripe' AND status = 'connected'");
        $stmt->execute([$workspaceId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row && $row['credentials_encrypted']) {
            $key = getenv('APP_KEY') ?: 'default-encryption-key-change-me';
            $data = base64_decode($row['credentials_encrypted']);
            $iv = substr($data, 0, 16);
            $encrypted = substr($data, 16);
            $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
            $credentials = json_decode($decrypted, true);
            return $credentials['stripe_user_id'] ?? $credentials['access_token'] ?? null;
        }
        
        return getenv('STRIPE_SECRET_KEY') ?: null;
    }

    /**
     * Create or Get Stripe Customer
     */
    public static function getOrCreateCustomer(int $workspaceId, array $contact): string {
        $apiKey = self::getApiKey($workspaceId);
        if (!$apiKey) {
            throw new Exception("Stripe not connected for this workspace");
        }

        // 1. Check if contact already has stripe_customer_id in our DB? 
        // Logic should be in Controller usually, but if we pass it here:
        if (!empty($contact['stripe_customer_id'])) {
            return $contact['stripe_customer_id'];
        }

        $db = Database::conn();
        
        // 2. Search Stripe for existing customer by email
        $ch = curl_init('https://api.stripe.com/v1/customers?email=' . urlencode($contact['email']) . '&limit=1');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERPWD => $apiKey . ':',
        ]);
        $response = json_decode(curl_exec($ch), true);
        curl_close($ch);

        if (!empty($response['data'][0]['id'])) {
            $customerId = $response['data'][0]['id'];
        } else {
            // 3. Create new customer
            $ch = curl_init('https://api.stripe.com/v1/customers');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_USERPWD => $apiKey . ':',
                CURLOPT_POSTFIELDS => http_build_query([
                    'email' => $contact['email'],
                    'name' => $contact['first_name'] . ' ' . $contact['last_name'],
                    'metadata' => [
                        'contact_id' => $contact['id'],
                        'workspace_id' => $workspaceId
                    ]
                ]),
            ]);
            $newCustomer = json_decode(curl_exec($ch), true);
            curl_close($ch);
            
            if (isset($newCustomer['error'])) {
                throw new Exception("Stripe Error: " . $newCustomer['error']['message']);
            }
            $customerId = $newCustomer['id'];
        }

        // Update Contact with Stripe ID
        /* 
           Ideally checking if column exists first or handling it. 
           Assuming contacts table might not have stripe_customer_id column yet based on previous checks.
           But Subscriptions table has it. We'll return it and let Controller allow saving it to subscription.
           (Ideally we should save it to Contact too)
        */
        
        return $customerId;
    }

    /**
     * Create Subscription
     */
    public static function createSubscription(int $workspaceId, string $customerId, array $planData, int $startTs): array {
        $apiKey = self::getApiKey($workspaceId);
        if (!$apiKey) throw new Exception("Stripe not connected");

        // Create Price Object (or find existing)
        // For simplicity, we'll create a new Price for each subscription to ensure it matches exactly
        // Alternatively we could create a Product/Price in Stripe and reuse it.
        // Let's create a price inline if possible? No, need Price ID.

        // 1. Create Product (if not exists matching our product_id?) 
        // Simplest: Create ephemeral Price for the product name
        
        // Create/Get Product
        // We'll just define the product data inline in the price creation if possible, 
        // but Stripe requires Price to be attached to a Product.
        
        // Let's create a product first
        $ch = curl_init('https://api.stripe.com/v1/products');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $apiKey . ':',
            CURLOPT_POSTFIELDS => http_build_query([
                'name' => $planData['name'],
                'metadata' => ['product_id' => $planData['id']]
            ]),
        ]);
        $stripeProduct = json_decode(curl_exec($ch), true);
        curl_close($ch);
        $stripeProductId = $stripeProduct['id'];

        // 2. Create Price
        $priceData = [
            'unit_amount' => (int)($planData['price'] * 100),
            'currency' => strtolower($planData['currency']),
            'recurring' => [
                'interval' => $planData['interval'],
                'interval_count' => $planData['interval_count']
            ],
            'product' => $stripeProductId,
        ];

        $ch = curl_init('https://api.stripe.com/v1/prices');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $apiKey . ':',
            CURLOPT_POSTFIELDS => http_build_query($priceData),
        ]);
        $stripePrice = json_decode(curl_exec($ch), true);
        curl_close($ch);
        $stripePriceId = $stripePrice['id'];

        // 3. Create Subscription
        $subParams = [
            'customer' => $customerId,
            'items' => [
                ['price' => $stripePriceId]
            ],
            'trial_expiry' => $planData['trial_end_date'] ? strtotime($planData['trial_end_date']) : null, // Timestamp
            'metadata' => [
                'workspace_id' => $workspaceId,
                'local_subscription_id' => $planData['local_sub_id'] ?? null
            ]
        ];
        
        if (!empty($planData['setup_fee']) && $planData['setup_fee'] > 0) {
            $subParams['add_invoice_items'] = [
                [
                    'price_data' => [
                        'currency' => strtolower($planData['currency']),
                        'product' => $stripeProductId,
                        'unit_amount' => (int)($planData['setup_fee'] * 100),
                    ],
                ]
            ];
        }

        // If start date is in future?
        if ($startTs > time() + 60) {
            $subParams['trial_end'] = $startTs; // Or trial_end used for start delay
        }

        /* 
           Note: If trial_days > 0, we set trial_end.
           If backdating, Stripe doesn't support it easily on creation without backdate_start_date (complicated).
           Assuming standard flow.
        */

        $ch = curl_init('https://api.stripe.com/v1/subscriptions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $apiKey . ':',
            CURLOPT_POSTFIELDS => http_build_query($subParams),
        ]);
        $subscription = json_decode(curl_exec($ch), true);
        curl_close($ch);

        if (isset($subscription['error'])) {
            throw new Exception("Stripe Error: " . $subscription['error']['message']);
        }

        return $subscription;
    }

    /**
     * Cancel Subscription
     */
    public static function cancelSubscription(int $workspaceId, string $stripeSubscriptionId, bool $atPeriodEnd = true): bool {
        $apiKey = self::getApiKey($workspaceId);
        if (!$apiKey) return false;

        $ch = curl_init('https://api.stripe.com/v1/subscriptions/' . $stripeSubscriptionId);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'DELETE', // Delete cancels immediately unless params
            CURLOPT_USERPWD => $apiKey . ':',
        ]);
        
        if ($atPeriodEnd) {
             // For update to cancel_at_period_end, we use POST not DELETE usually, 
             // but DELETE on subscription object cancels it. 
             // To set cancel_at_period_end, use Update Subscription
             
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['cancel_at_period_end' => 'true']));
        }

        $result = json_decode(curl_exec($ch), true);
        curl_close($ch);

        return !isset($result['error']);
    }

    /**
     * Pause Subscription
     */
    public static function pauseSubscription(int $workspaceId, string $stripeSubscriptionId): bool {
        $apiKey = self::getApiKey($workspaceId);
        if (!$apiKey) return false;

        $ch = curl_init('https://api.stripe.com/v1/subscriptions/' . $stripeSubscriptionId);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $apiKey . ':',
            CURLOPT_POSTFIELDS => http_build_query([
                'pause_collection' => [
                    'behavior' => 'void'
                ]
            ]),
        ]);

        $result = json_decode(curl_exec($ch), true);
        curl_close($ch);

        return !isset($result['error']);
    }

    /**
     * Resume Subscription
     */
    public static function resumeSubscription(int $workspaceId, string $stripeSubscriptionId): bool {
        $apiKey = self::getApiKey($workspaceId);
        if (!$apiKey) return false;

        $ch = curl_init('https://api.stripe.com/v1/subscriptions/' . $stripeSubscriptionId);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_USERPWD => $apiKey . ':',
            CURLOPT_POSTFIELDS => http_build_query([
                'pause_collection' => '' 
            ]),
        ]);

        $result = json_decode(curl_exec($ch), true);
        curl_close($ch);

        return !isset($result['error']);
    }
}
