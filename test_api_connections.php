<?php
$token = "7271a4cf2dda5e9e528f6103c4fcc614387e2db9462b7086";
$ch = curl_init("http://localhost:8001/connections"); // Backend is on port 8001
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Authorization: Bearer $token",
    "Content-Type: application/json"
));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";
echo $response;
echo "\n";
