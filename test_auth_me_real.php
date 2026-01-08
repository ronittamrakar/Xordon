<?php
$token = 'f27689c84a8560424b53767bd105a6c29567f4b8de7aa4cf';
$ch = curl_init('http://localhost:8000/auth/me');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $token"]);
$response = curl_exec($ch);
echo $response;
