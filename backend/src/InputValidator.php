<?php

class InputValidator {
    
    public static function sanitizeString(string $input, int $maxLength = 255): string {
        return trim(substr(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'), 0, $maxLength));
    }
    
    public static function sanitizeEmail(string $email): string {
        $email = trim(strtolower($email));
        return filter_var($email, FILTER_SANITIZE_EMAIL);
    }
    
    public static function sanitizeInt($input): ?int {
        if (is_numeric($input)) {
            return (int)$input;
        }
        return null;
    }
    
    public static function sanitizeFloat($input): ?float {
        if (is_numeric($input)) {
            return (float)$input;
        }
        return null;
    }
    
    public static function sanitizePhone(string $phone): string {
        // Remove all non-digit characters except + for international numbers
        $phone = preg_replace('/[^\d+]/', '', $phone);
        
        // Validate phone number format
        if (preg_match('/^\+?\d{10,15}$/', $phone)) {
            return $phone;
        }
        
        return '';
    }
    
    public static function sanitizeHtml(string $html, bool $allowBasicHtml = false): string {
        if ($allowBasicHtml) {
            // Allow basic HTML tags like p, br, strong, em, ul, ol, li
            $allowedTags = '<p><br><strong><em><ul><ol><li>';
            return strip_tags($html, $allowedTags);
        }
        
        return htmlspecialchars($html, ENT_QUOTES, 'UTF-8');
    }
    
    public static function validateEmail(string $email): array {
        $email = self::sanitizeEmail($email);
        
        $errors = [];
        
        if (empty($email)) {
            $errors[] = 'Email is required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Invalid email format';
        } elseif (strlen($email) > 255) {
            $errors[] = 'Email is too long';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $email
        ];
    }
    
    public static function validatePassword(string $password): array {
        $errors = [];
        
        if (empty($password)) {
            $errors[] = 'Password is required';
        } else {
            if (strlen($password) < 8) {
                $errors[] = 'Password must be at least 8 characters long';
            }
            
            if (!preg_match('/[A-Z]/', $password)) {
                $errors[] = 'Password must contain at least one uppercase letter';
            }
            
            if (!preg_match('/[a-z]/', $password)) {
                $errors[] = 'Password must contain at least one lowercase letter';
            }
            
            if (!preg_match('/[0-9]/', $password)) {
                $errors[] = 'Password must contain at least one number';
            }
            
            if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
                $errors[] = 'Password must contain at least one special character';
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    public static function validateName(string $name, string $fieldName = 'Name'): array {
        $name = self::sanitizeString($name, 100);
        $errors = [];
        
        if (empty($name)) {
            $errors[] = $fieldName . ' is required';
        } elseif (strlen($name) < 2) {
            $errors[] = $fieldName . ' must be at least 2 characters long';
        } elseif (!preg_match('/^[a-zA-Z\s\-\'\.]+$/', $name)) {
            $errors[] = $fieldName . ' can only contain letters, spaces, hyphens, apostrophes, and periods';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $name
        ];
    }
    
    public static function validatePhone(string $phone): array {
        $phone = self::sanitizePhone($phone);
        $errors = [];
        
        if (empty($phone)) {
            $errors[] = 'Phone number is required';
        } elseif (!preg_match('/^\+?\d{10,15}$/', $phone)) {
            $errors[] = 'Invalid phone number format';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $phone
        ];
    }
    
    public static function validateUrl(string $url): array {
        $url = trim($url);
        $errors = [];
        
        if (empty($url)) {
            $errors[] = 'URL is required';
        } elseif (!filter_var($url, FILTER_VALIDATE_URL)) {
            $errors[] = 'Invalid URL format';
        } elseif (strlen($url) > 2048) {
            $errors[] = 'URL is too long';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => htmlspecialchars($url, ENT_QUOTES, 'UTF-8')
        ];
    }
    
    public static function validateNumber($input, string $fieldName, float $min = null, float $max = null): array {
        $number = self::sanitizeFloat($input);
        $errors = [];
        
        if ($number === null) {
            $errors[] = $fieldName . ' must be a valid number';
        } else {
            if ($min !== null && $number < $min) {
                $errors[] = $fieldName . ' must be at least ' . $min;
            }
            
            if ($max !== null && $number > $max) {
                $errors[] = $fieldName . ' must be at most ' . $max;
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $number
        ];
    }
    
    public static function validateDate(string $date, string $format = 'Y-m-d'): array {
        $errors = [];
        
        if (empty($date)) {
            $errors[] = 'Date is required';
        } else {
            $d = DateTime::createFromFormat($format, $date);
            if (!$d || $d->format($format) !== $date) {
                $errors[] = 'Invalid date format';
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $date
        ];
    }
    
    public static function validateText(string $text, string $fieldName, int $minLength = 1, int $maxLength = 1000): array {
        $text = self::sanitizeString($text, $maxLength);
        $errors = [];
        
        if (strlen($text) < $minLength) {
            $errors[] = $fieldName . ' must be at least ' . $minLength . ' characters long';
        }
        
        if (strlen($text) > $maxLength) {
            $errors[] = $fieldName . ' must not exceed ' . $maxLength . ' characters';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $text
        ];
    }
    
    public static function validateSelect($value, array $allowedValues, string $fieldName): array {
        $errors = [];
        
        if (!in_array($value, $allowedValues, true)) {
            $errors[] = 'Invalid ' . $fieldName . ' selected';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => htmlspecialchars($value, ENT_QUOTES, 'UTF-8')
        ];
    }
    
    public static function validateArray(array $array, callable $itemValidator, string $fieldName): array {
        $errors = [];
        $sanitized = [];
        
        foreach ($array as $index => $item) {
            $result = $itemValidator($item);
            if (!$result['valid']) {
                foreach ($result['errors'] as $error) {
                    $errors[] = $fieldName . ' item ' . ($index + 1) . ': ' . $error;
                }
            } else {
                $sanitized[] = $result['sanitized'] ?? $item;
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $sanitized
        ];
    }
    
    public static function sanitizeSqlInput(string $input): string {
        // Additional SQL injection protection
        $dangerousPatterns = [
            '/\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION ALL)\b/i',
            '/[\'";\\\\]/',
            '/--/',
            '/\/\*/',
            '/\*\//'
        ];
        
        foreach ($dangerousPatterns as $pattern) {
            $input = preg_replace($pattern, '', $input);
        }
        
        return trim($input);
    }
    
    public static function validateFile(array $file, array $allowedTypes = [], int $maxSize = 5242880): array {
        $errors = [];
        
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            $errors[] = 'Invalid file upload';
            return ['valid' => false, 'errors' => $errors];
        }
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'File upload error: ' . $file['error'];
            return ['valid' => false, 'errors' => $errors];
        }
        
        if ($file['size'] > $maxSize) {
            $errors[] = 'File size exceeds maximum allowed size';
        }
        
        if (!empty($allowedTypes)) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $allowedTypes)) {
                $errors[] = 'File type not allowed';
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $file
        ];
    }
    
    public static function validateCsrfToken(string $token, string $sessionToken): array {
        $errors = [];
        
        if (empty($token)) {
            $errors[] = 'CSRF token is required';
        } elseif (!hash_equals($sessionToken, $token)) {
            $errors[] = 'Invalid CSRF token';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    /**
     * Validate and sanitize file uploads with enhanced security
     */
    public static function validateSecureFileUpload(array $file, array $allowedTypes = [], int $maxSize = 5242880): array {
        $errors = [];
        
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            $errors[] = 'Invalid file upload';
            return ['valid' => false, 'errors' => $errors];
        }
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'File upload error: ' . $file['error'];
            return ['valid' => false, 'errors' => $errors];
        }
        
        if ($file['size'] > $maxSize) {
            $errors[] = 'File size exceeds maximum allowed size (' . ($maxSize / 1024 / 1024) . 'MB)';
        }
        
        // Enhanced MIME type validation
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        // Check file signature (magic bytes) for additional security
        $fileContent = file_get_contents($file['tmp_name'], false, null, 0, 1024);
        $fileSignature = bin2hex(substr($fileContent, 0, 4));
        
        // Validate against known safe file signatures
        $safeSignatures = [
            'image/jpeg' => ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'],
            'image/png' => ['89504e47'],
            'image/gif' => ['47494638'],
            'application/pdf' => ['25504446'],
            'text/plain' => ['efbbbf', ''] // UTF-8 BOM or no BOM
        ];
        
        if (!empty($allowedTypes)) {
            if (!in_array($mimeType, $allowedTypes)) {
                $errors[] = 'File type not allowed. Allowed types: ' . implode(', ', $allowedTypes);
            }
            
            // Additional signature validation
            if (isset($safeSignatures[$mimeType])) {
                $isValidSignature = false;
                foreach ($safeSignatures[$mimeType] as $signature) {
                    if (empty($signature) || strpos($fileSignature, $signature) === 0) {
                        $isValidSignature = true;
                        break;
                    }
                }
                if (!$isValidSignature) {
                    $errors[] = 'File signature validation failed';
                }
            }
        }
        
        // Scan for potential malicious content
        if (self::containsMaliciousContent($fileContent)) {
            $errors[] = 'File contains potentially malicious content';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => [
                'name' => self::sanitizeFilename($file['name']),
                'type' => $mimeType,
                'size' => $file['size'],
                'tmp_name' => $file['tmp_name']
            ]
        ];
    }
    
    /**
     * Check file content for malicious patterns
     */
    private static function containsMaliciousContent(string $content): bool {
        $maliciousPatterns = [
            '/<\?php/i',
            '/<script/i',
            '/javascript:/i',
            '/vbscript:/i',
            '/onload\s*=/i',
            '/onerror\s*=/i',
            '/eval\s*\(/i',
            '/base64_decode/i',
            '/system\s*\(/i',
            '/exec\s*\(/i',
            '/shell_exec/i'
        ];
        
        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Sanitize filename to prevent directory traversal and other attacks
     */
    public static function sanitizeFilename(string $filename): string {
        // Remove directory traversal attempts
        $filename = str_replace(['../', '..\\', '../', '..\\'], '', $filename);
        
        // Remove null bytes
        $filename = str_replace("\0", '', $filename);
        
        // Remove control characters
        $filename = preg_replace('/[\x00-\x1f\x7f]/', '', $filename);
        
        // Remove dangerous characters
        $filename = preg_replace('/[<>:"/\\|?*]/', '', $filename);
        
        // Limit length
        $filename = substr($filename, 0, 255);
        
        // Ensure we have a safe filename
        if (empty($filename) || $filename === '.' || $filename === '..') {
            $filename = 'unnamed_file';
        }
        
        return $filename;
    }
    
    /**
     * Validate SQL input to prevent injection attacks
     */
    public static function validateSqlInput(string $input): array {
        $errors = [];
        
        // Check for SQL injection patterns
        $dangerousPatterns = [
            '/\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION ALL|INFORMATION_SCHEMA|SCHEMA_NAME)\b/i',
            '/[\'";\\\\]/', // Quotes and backslashes
            '/--/', // SQL comments
            '/\/\*/', // Block comments start
            '/\*\//', // Block comments end
            '/\b(OR|AND)\s+[\'"]?\d+[\'"]?\s*=\s*[\'"]?\d+[\'"]?\b/i', // OR 1=1 type attacks
            '/\b(OR|AND)\s+[\'"]?[\'"]\s*=\s*[\'"]?[\'"]\b/i' // OR ''='' type attacks
        ];
        
        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                $errors[] = 'Input contains potentially dangerous SQL patterns';
                break;
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => self::sanitizeSqlInput($input)
        ];
    }
    
    /**
     * Enhanced XSS prevention
     */
    public static function preventXSS(string $input, bool $allowBasicHtml = false): string {
        if ($allowBasicHtml) {
            // Allow only safe HTML tags
            $allowedTags = '<p><br><strong><em><u><ul><ol><li><h1><h2><h3><h4><h5><h6><a><img>';
            $allowedAttributes = 'href,src,alt,title,class,id';
            
            // Remove dangerous attributes
            $input = preg_replace('/on\w+\s*=\s*["\'][^"\']*["\']/i', '', $input);
            $input = preg_replace('/javascript\s*:/i', '', $input);
            $input = preg_replace('/vbscript\s*:/i', '', $input);
            
            return strip_tags($input, $allowedTags);
        }
        
        // Full HTML encoding
        return htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    
    public static function sanitizeJsonInput(string $json): array {
        $errors = [];
        $data = null;
        
        if (empty($json)) {
            $errors[] = 'JSON input is required';
        } else {
            $data = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                $errors[] = 'Invalid JSON format: ' . json_last_error_msg();
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'sanitized' => $data
        ];
    }
}
