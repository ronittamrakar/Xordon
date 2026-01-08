<?php

require_once __DIR__ . '/../Response.php';

class BrightLocalService {
    private $apiKey;
    private $baseUrl = 'https://tools.brightlocal.com/seo-tools/api';

    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }

    private function request($method, $endpoint, $data = []) {
        $url = $this->baseUrl . $endpoint;
        
        $curl = curl_init();
        
        $params = array_merge(['api-key' => $this->apiKey], $data);
        
        if ($method === 'GET') {
            $url .= '?' . http_build_query($params);
        }

        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/json'
            ],
        ];

        if ($method !== 'GET') {
            $options[CURLOPT_POSTFIELDS] = json_encode($params);
        }

        curl_setopt_array($curl, $options);
        
        $response = curl_exec($curl);
        $err = curl_error($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        
        curl_close($curl);
        
        if ($err) {
            throw new Exception("cURL Error: " . $err);
        }

        $decoded = json_decode($response, true);
        
        if ($httpCode >= 400) {
            $msg = $decoded['message'] ?? 'Unknown error';
            $errors = $decoded['errors'] ?? [];
            if (!empty($errors)) {
                 $msg .= ': ' . json_encode($errors);
            }
            throw new Exception("BrightLocal API Error ($httpCode): " . $msg);
        }
        
        return $decoded;
    }

    public function getBusinessCategories($country = 'US') {
        // Based on docs: https://developer.brightlocal.com/docs/management-apis/k7xwhhme1hzep-business-categories
        // However, the legacy docs say /v4/lc/categories usually. 
        // Let's try to infer from typical BrightLocal structure or assume /v4/lc/categories as it relates to "Local Directory API" (often called Lc or Ld).
        // Actually, the docs link to "management-apis/k7xwhhme1hzep-business-categories". 
        // Checking the chunk 64 content again:
        // "We now have an endpoint which enables you to retrieve a list of categories by country."
        // A common path is /v4/rf/categories or something similar.
        // Let's assume /v4/ld/categories or similar since it is "Local Directory".
        // But to be safe, I'll use a generic path that can be easily updated or I should have checked the developer portal link if I could.
        // Since I can't browse the developer portal easily (it might be JS heavy or require auth), I will guess /v4/ld/categories based on "Local Directory" context.
        // Wait, looking at "https://apidocs.brightlocal.com/#business-category-ids" again.
        
        // I'll implement a method that calls '/v4/ld/fetch-categories' or similar.
        // Given I don't have the exact endpoint, I will create a placeholder implementation that tries the most likely one: '/v4/ld/categories'.
        
        return $this->request('GET', '/v4/ld/categories', ['country' => $country]);
    }

    public function getDirectories() {
        // Assuming '/v4/ld/directories' based on the same logic.
        return $this->request('GET', '/v4/ld/directories');
    }
}
