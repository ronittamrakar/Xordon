<?php

class PaymentService {
    
    /**
     * Create a Payment Intent (Stripe) or equivalent
     * Returns client_secret for frontend
     */
    public static function createPaymentIntent(int $workspaceId, float $amount, string $currency = 'USD', array $metadata = []): array {
        // In a real implementation, you would:
        // 1. Get Stripe keys from payment_settings using $workspaceId
        // 2. Initialize Stripe\StripeClient
        // 3. Call $stripe->paymentIntents->create(...)
        
        // For Review purposes, we return a Mock/Simulated Intent
        // This allows the frontend to proceed as if it got a real Stripe key
        
        return [
            'id' => 'pi_mock_' . bin2hex(random_bytes(10)),
            'client_secret' => 'pi_mock_secret_' . bin2hex(random_bytes(10)),
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'requires_payment_method',
            'mock' => true
        ];
    }

    /**
     * Verify a Payment Intent status
     */
    public static function verifyPaymentIntent(int $workspaceId, string $paymentIntentId): array {
        // In real implementation:
        // $stripe->paymentIntents->retrieve($paymentIntentId)
        
        if (strpos($paymentIntentId, 'pi_mock_') === 0) {
            return [
                'status' => 'succeeded',
                'amount_received' => 1000, // Should store/retrieve actual amount in real DB or Stripe
                'currency' => 'usd',
                'mock' => true
            ];
        }
        
        throw new Exception('Invalid payment intent');
    }

    /**
     * Record a successful payment in the database
     */
    public static function recordPayment(int $workspaceId, array $data): int {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            INSERT INTO payments (
                user_id, appointment_id, contact_id, amount, currency, 
                payment_method, status, transaction_id, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        
        $stmt->execute([
            $workspaceId,
            $data['appointment_id'] ?? null,
            $data['contact_id'] ?? null,
            $data['amount'],
            $data['currency'],
            $data['payment_method'] ?? 'card',
            'completed',
            $data['transaction_id']
        ]);
        
        return $pdo->lastInsertId();
    }
}
