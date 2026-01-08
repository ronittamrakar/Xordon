<?php
$token = 'f27689c84a8560424b53767bd105a6c29567f4b8de7aa4cf';
$ch = curl_init('http://localhost:8000/connections');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token",
    "X-Workspace-Id: 1"
]);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP Code: $http_code\n";
echo "Response: $response\n";
