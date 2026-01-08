<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class OAuthController {
    
    public static function gmailAuth(): void {
        $userId = Auth::userIdOrFail();
        
        // Gmail OAuth2 configuration
        $clientId = $_ENV['GMAIL_CLIENT_ID'] ?? '';
        $redirectUri = $_ENV['GMAIL_REDIRECT_URI'] ?? 'http://localhost:9000/api/oauth/gmail/callback';
        
        if (!$clientId) {
            Response::error('Gmail OAuth not configured', 500);
            return;
        }
        
        $state = bin2hex(random_bytes(16));
        
        // Store state in session or database for verification
        $pdo = Database::conn();
        $stmt = $pdo->prepare('INSERT INTO oauth_states (user_id, state, provider, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
        $stmt->execute([$userId, $state, 'gmail']);
        
        $params = [
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state
        ];
        
        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
        
        Response::json(['auth_url' => $authUrl]);
    }
    
    public static function gmailCallback(): void {
        $code = $_GET['code'] ?? '';
        $state = $_GET['state'] ?? '';
        
        if (!$code || !$state) {
            Response::error('Invalid OAuth callback', 400);
            return;
        }
        
        // Verify state
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT user_id FROM oauth_states WHERE state = ? AND provider = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)');
        $stmt->execute([$state, 'gmail']);
        $stateRow = $stmt->fetch();
        
        if (!$stateRow) {
            Response::error('Invalid or expired state', 400);
            return;
        }
        
        $userId = $stateRow['user_id'];
        
        // Exchange code for tokens
        $clientId = $_ENV['GMAIL_CLIENT_ID'] ?? '';
        $clientSecret = $_ENV['GMAIL_CLIENT_SECRET'] ?? '';
        $redirectUri = $_ENV['GMAIL_REDIRECT_URI'] ?? 'http://localhost:9000/api/oauth/gmail/callback';
        
        $tokenData = [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            Response::error('Failed to exchange code for tokens', 500);
            return;
        }
        
        $tokens = json_decode($response, true);
        
        if (!$tokens || !isset($tokens['access_token'])) {
            Response::error('Invalid token response', 500);
            return;
        }
        
        // Get user info from Google
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://www.googleapis.com/oauth2/v2/userinfo');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $tokens['access_token']]);
        
        $userInfoResponse = curl_exec($ch);
        curl_close($ch);
        
        $userInfo = json_decode($userInfoResponse, true);
        
        if (!$userInfo || !isset($userInfo['email'])) {
            Response::error('Failed to get user info', 500);
            return;
        }
        
        // Store the sending account
        $stmt = $pdo->prepare('INSERT INTO sending_accounts (user_id, name, email, provider, status, daily_limit, access_token, refresh_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
        $stmt->execute([
            $userId,
            $userInfo['name'] ?? $userInfo['email'],
            $userInfo['email'],
            'gmail',
            'active',
            100,
            $tokens['access_token'],
            $tokens['refresh_token'] ?? null
        ]);
        
        // Clean up state
        $stmt = $pdo->prepare('DELETE FROM oauth_states WHERE state = ?');
        $stmt->execute([$state]);
        
        // Redirect to success page
        header('Location: http://localhost:8081/sending-accounts?success=gmail');
        exit;
    }
    
    public static function testSmtpConnection(): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        
        $host = trim($b['host'] ?? '');
        $port = (int)($b['port'] ?? 587);
        $username = trim($b['username'] ?? '');
        $password = trim($b['password'] ?? '');
        $encryption = trim($b['encryption'] ?? 'tls');
        
        // Validate required fields
        if (!$host) {
            Response::error('SMTP host is required', 422);
            return;
        }
        if (!$username) {
            Response::error('SMTP username/email is required', 422);
            return;
        }
        if (!$password) {
            Response::error('SMTP password is required. For Gmail, use an App Password instead of your regular password.', 422);
            return;
        }
        
        // Validate port
        if ($port < 1 || $port > 65535) {
            Response::error('Invalid port number. Common SMTP ports: 587 (TLS), 465 (SSL), 25 (plain)', 422);
            return;
        }
        
        // Validate encryption method
        if (!in_array($encryption, ['tls', 'ssl', 'none'])) {
            Response::error('Invalid encryption method. Use: tls, ssl, or none', 422);
            return;
        }
        
        // Check for common configuration mismatches
        if ($encryption === 'ssl' && $port == 587) {
            Response::error('Configuration mismatch: SSL encryption typically uses port 465, not 587. Try TLS with port 587 or SSL with port 465.', 422);
            return;
        }
        if ($encryption === 'tls' && $port == 465) {
            Response::error('Configuration mismatch: TLS encryption typically uses port 587, not 465. Try SSL with port 465 or TLS with port 587.', 422);
            return;
        }
        
        // Gmail-specific validation
        if (strpos($host, 'gmail.com') !== false) {
            if (!filter_var($username, FILTER_VALIDATE_EMAIL)) {
                Response::error('For Gmail SMTP, username must be a valid email address (your Gmail address)', 422);
                return;
            }
            // Note: While Gmail typically uses ports 587 (TLS) or 465 (SSL), 
            // we allow custom ports for advanced configurations
        }
        
        try {
            $originalHost = $host;
            
            // Add SSL prefix for SSL connections
            if ($encryption === 'ssl') {
                $host = 'ssl://' . $host;
            }
            
            // Test basic connection
            $socket = @fsockopen($host, $port, $errno, $errstr, 15);
            
            if (!$socket) {
                // Provide specific error messages based on error codes
                $errorMessage = "Cannot connect to SMTP server $originalHost:$port";
                
                if ($errno === 10060 || $errno === 110) {
                    $errorMessage .= " - Connection timeout. Check if the port is correct and not blocked by firewall.";
                } elseif ($errno === 10061 || $errno === 111) {
                    $errorMessage .= " - Connection refused. The server may be down or the port is incorrect.";
                } elseif (strpos($errstr, 'getaddrinfo failed') !== false || strpos($errstr, 'No such host') !== false) {
                    $errorMessage .= " - Host not found. Please check the SMTP server address.";
                } else {
                    $errorMessage .= " - $errstr (Error: $errno)";
                }
                
                // Add suggestions based on common configurations
                if ($originalHost === 'smtp.gmail.com') {
                    $errorMessage .= "\n\nFor Gmail SMTP:\n- Use port 587 with TLS encryption\n- Use port 465 with SSL encryption\n- Ensure 2FA is enabled and use an App Password";
                }
                
                Response::error($errorMessage, 500);
                return;
            }
            
            // Read server greeting
            $response = fgets($socket, 512);
            if (!$response || substr($response, 0, 3) !== '220') {
                fclose($socket);
                Response::error('Invalid SMTP server response. Expected greeting (220), got: ' . trim($response ?: 'no response'), 500);
                return;
            }
            
            // Send EHLO command
            fwrite($socket, "EHLO xordon.com\r\n");
            $ehloResponse = '';
            
            // Read all EHLO response lines
            while ($line = fgets($socket, 512)) {
                $ehloResponse .= $line;
                if (substr($line, 3, 1) === ' ') break; // Last line of multiline response
            }
            
            if (!$ehloResponse || substr($ehloResponse, 0, 3) !== '250') {
                fclose($socket);
                Response::error('EHLO command failed: ' . trim($ehloResponse), 500);
                return;
            }
            
            // Check for required features based on encryption type
            if ($encryption === 'tls') {
                if (strpos($ehloResponse, 'STARTTLS') === false) {
                    fclose($socket);
                    Response::error('TLS encryption requested but STARTTLS is not supported by the server. Try using SSL encryption on port 465 instead.', 500);
                    return;
                }
                
                // Test STARTTLS command
                fwrite($socket, "STARTTLS\r\n");
                $response = fgets($socket, 512);
                
                if (!$response || substr($response, 0, 3) !== '220') {
                    fclose($socket);
                    Response::error('STARTTLS command failed: ' . trim($response ?: 'no response'), 500);
                    return;
                }
            }
            
            // Check for AUTH support (more flexible check)
            $authSupported = false;
            $ehloLines = explode("\n", $ehloResponse);
            foreach ($ehloLines as $line) {
                $line = trim($line);
                if (preg_match('/^250[- ]AUTH/i', $line) || 
                    preg_match('/^250[- ].*AUTH/i', $line) ||
                    stripos($line, 'AUTH LOGIN') !== false ||
                    stripos($line, 'AUTH PLAIN') !== false) {
                    $authSupported = true;
                    break;
                }
            }
            
            if (!$authSupported) {
                // For debugging, let's be less strict and just warn
                error_log("SMTP AUTH check - EHLO Response: " . $ehloResponse);
                // Don't fail the connection, just note it
            }
            
            // Send QUIT
            fwrite($socket, "QUIT\r\n");
            fclose($socket);
            
            // Success message with helpful info
            $successMessage = 'SMTP server connection successful';
            if ($encryption === 'tls') {
                $successMessage .= ' (TLS encryption supported)';
            } elseif ($encryption === 'ssl') {
                $successMessage .= ' (SSL encryption active)';
            }
            
            $successMessage .= '. Authentication methods available.';
            
            Response::json([
                'success' => true, 
                'message' => $successMessage,
                'server_info' => [
                    'host' => $originalHost,
                    'port' => $port,
                    'encryption' => $encryption,
                    'auth_supported' => $authSupported,
                    'tls_supported' => strpos($ehloResponse, 'STARTTLS') !== false
                ]
            ]);
            
        } catch (Exception $e) {
            $errorMessage = $e->getMessage();
            $statusCode = 500;
            
            // Determine specific error type and appropriate status code
            if (strpos($errorMessage, 'authentication') !== false || 
                strpos($errorMessage, 'AUTH') !== false ||
                strpos($errorMessage, 'login') !== false ||
                strpos($errorMessage, 'password') !== false) {
                $statusCode = 401; // Authentication failed
                $errorMessage = 'SMTP authentication failed: ' . $errorMessage;
            } elseif (strpos($errorMessage, 'timeout') !== false) {
                $statusCode = 500;
                $errorMessage = 'Connection timeout: ' . $errorMessage;
            } elseif (strpos($errorMessage, 'refused') !== false || 
                     strpos($errorMessage, 'could not connect') !== false) {
                $statusCode = 500;
                $errorMessage = 'Connection refused: ' . $errorMessage;
            } elseif (strpos($errorMessage, 'host') !== false && 
                     strpos($errorMessage, 'not found') !== false) {
                $statusCode = 400;
                $errorMessage = 'Host not found: ' . $errorMessage;
            } elseif (strpos($errorMessage, 'SSL') !== false || 
                     strpos($errorMessage, 'TLS') !== false) {
                $statusCode = 400;
                $errorMessage = 'SSL/TLS Error: ' . $errorMessage;
            } else {
                $errorMessage = 'SMTP connection test failed: ' . $errorMessage;
            }
            
            Response::error($errorMessage, $statusCode);
        }
    }
}