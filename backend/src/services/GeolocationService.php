<?php
/**
 * GeolocationService
 * 
 * Handles geocoding, distance calculations, and location-based matching.
 */

namespace App\Services;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Config.php';

use \Xordon\Database;

class GeolocationService
{
    private const EARTH_RADIUS_KM = 6371;
    
    /**
     * Geocode an address using configured provider (Google, OpenStreetMap, etc.)
     */
    public static function geocode(string $address): ?array
    {
        $provider = \Config::get('GEOCODING_PROVIDER', 'openstreetmap');
        
        switch ($provider) {
            case 'google':
                return self::geocodeGoogle($address);
            case 'openstreetmap':
            default:
                return self::geocodeOpenStreetMap($address);
        }
    }

    /**
     * Geocode using OpenStreetMap Nominatim (free, no API key required)
     */
    private static function geocodeOpenStreetMap(string $address): ?array
    {
        $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query([
            'q' => $address,
            'format' => 'json',
            'limit' => 1,
            'addressdetails' => 1
        ]);

        $context = stream_context_create([
            'http' => [
                'header' => "User-Agent: Xordon-LeadMarketplace/1.0\r\n",
                'timeout' => 5
            ]
        ]);

        $response = @file_get_contents($url, false, $context);
        if (!$response) {
            return null;
        }

        $data = json_decode($response, true);
        if (empty($data)) {
            return null;
        }

        $result = $data[0];
        return [
            'latitude' => (float)$result['lat'],
            'longitude' => (float)$result['lon'],
            'formatted_address' => $result['display_name'] ?? $address,
            'city' => $result['address']['city'] ?? $result['address']['town'] ?? $result['address']['village'] ?? null,
            'region' => $result['address']['state'] ?? $result['address']['county'] ?? null,
            'country' => $result['address']['country'] ?? null,
            'postal_code' => $result['address']['postcode'] ?? null,
            'source' => 'openstreetmap'
        ];
    }

    /**
     * Geocode using Google Maps API
     */
    private static function geocodeGoogle(string $address): ?array
    {
        $apiKey = \Config::get('GOOGLE_MAPS_API_KEY');
        if (!$apiKey) {
            return self::geocodeOpenStreetMap($address); // Fallback
        }

        $url = 'https://maps.googleapis.com/maps/api/geocode/json?' . http_build_query([
            'address' => $address,
            'key' => $apiKey
        ]);

        $response = @file_get_contents($url);
        if (!$response) {
            return null;
        }

        $data = json_decode($response, true);
        if ($data['status'] !== 'OK' || empty($data['results'])) {
            return null;
        }

        $result = $data['results'][0];
        $location = $result['geometry']['location'];
        
        $components = [];
        foreach ($result['address_components'] as $comp) {
            $type = $comp['types'][0] ?? '';
            $components[$type] = $comp['long_name'];
        }

        return [
            'latitude' => (float)$location['lat'],
            'longitude' => (float)$location['lng'],
            'formatted_address' => $result['formatted_address'],
            'city' => $components['locality'] ?? $components['administrative_area_level_2'] ?? null,
            'region' => $components['administrative_area_level_1'] ?? null,
            'country' => $components['country'] ?? null,
            'postal_code' => $components['postal_code'] ?? null,
            'source' => 'google'
        ];
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    public static function calculateDistance(
        float $lat1, float $lon1,
        float $lat2, float $lon2
    ): float {
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLon = deg2rad($lon2 - $lon1);

        $a = sin($deltaLat / 2) ** 2 +
             cos($lat1Rad) * cos($lat2Rad) * sin($deltaLon / 2) ** 2;
        
        $c = 2 * asin(sqrt($a));

        return self::EARTH_RADIUS_KM * $c;
    }

    /**
     * Check if a point is within a radius of another point
     */
    public static function isWithinRadius(
        float $centerLat, float $centerLon,
        float $pointLat, float $pointLon,
        float $radiusKm
    ): bool {
        $distance = self::calculateDistance($centerLat, $centerLon, $pointLat, $pointLon);
        return $distance <= $radiusKm;
    }

    /**
     * Check if a point is within a polygon
     * Uses ray casting algorithm
     */
    public static function isPointInPolygon(float $lat, float $lon, array $polygon): bool
    {
        $n = count($polygon);
        if ($n < 3) return false;

        $inside = false;
        $j = $n - 1;

        for ($i = 0; $i < $n; $i++) {
            $xi = $polygon[$i]['lng'] ?? $polygon[$i]['longitude'] ?? $polygon[$i][1];
            $yi = $polygon[$i]['lat'] ?? $polygon[$i]['latitude'] ?? $polygon[$i][0];
            $xj = $polygon[$j]['lng'] ?? $polygon[$j]['longitude'] ?? $polygon[$j][1];
            $yj = $polygon[$j]['lat'] ?? $polygon[$j]['latitude'] ?? $polygon[$j][0];

            if ((($yi > $lat) !== ($yj > $lat)) &&
                ($lon < ($xj - $xi) * ($lat - $yi) / ($yj - $yi) + $xi)) {
                $inside = !$inside;
            }
            $j = $i;
        }

        return $inside;
    }

    /**
     * Find providers within distance of a lead location
     */
    public static function findNearbyProviders(
        int $workspaceId,
        float $leadLat,
        float $leadLon,
        ?int $serviceId = null,
        float $maxDistanceKm = 50.0
    ): array {
        $pdo = Database::conn();

        // Get all active providers with service areas
        $sql = '
            SELECT DISTINCT
                sp.id as pro_id,
                sp.company_id,
                sp.business_name,
                sp.avg_rating,
                sa.latitude,
                sa.longitude,
                sa.radius_km,
                sa.area_type,
                sa.polygon_geojson,
                sa.postal_code as sa_postal_code
            FROM service_pros sp
            JOIN service_areas sa ON sp.company_id = sa.company_id AND sa.workspace_id = sp.workspace_id
        ';
        
        $params = [$workspaceId];
        
        if ($serviceId) {
            $sql .= ' JOIN service_pro_offerings spo ON sp.company_id = spo.company_id AND spo.workspace_id = sp.workspace_id AND spo.service_id = ?';
            $params[] = $serviceId;
        }
        
        $sql .= ' WHERE sp.workspace_id = ? AND sp.status = ?';
        $params[] = $workspaceId;
        $params[] = 'active';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $providers = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $nearbyProviders = [];
        $seenCompanies = [];

        foreach ($providers as $provider) {
            // Skip if we already matched this company
            if (isset($seenCompanies[$provider['company_id']])) {
                continue;
            }

            $isNearby = false;
            $distance = null;

            switch ($provider['area_type']) {
                case 'radius':
                    if ($provider['latitude'] && $provider['longitude']) {
                        $distance = self::calculateDistance(
                            (float)$provider['latitude'],
                            (float)$provider['longitude'],
                            $leadLat,
                            $leadLon
                        );
                        $radius = (float)($provider['radius_km'] ?: 25);
                        $isNearby = $distance <= $radius && $distance <= $maxDistanceKm;
                    }
                    break;

                case 'polygon':
                    if ($provider['polygon_geojson']) {
                        $polygon = json_decode($provider['polygon_geojson'], true);
                        if ($polygon) {
                            $isNearby = self::isPointInPolygon($leadLat, $leadLon, $polygon);
                            // Calculate approximate distance to polygon center for sorting
                            if ($isNearby) {
                                $center = self::getPolygonCenter($polygon);
                                $distance = self::calculateDistance(
                                    $center['lat'], $center['lon'],
                                    $leadLat, $leadLon
                                );
                            }
                        }
                    }
                    break;

                case 'postal':
                case 'city':
                case 'region':
                    // These require separate matching logic
                    // For now, skip distance-based filtering
                    $isNearby = true;
                    $distance = null;
                    break;
            }

            if ($isNearby) {
                $nearbyProviders[] = [
                    'pro_id' => $provider['pro_id'],
                    'company_id' => $provider['company_id'],
                    'business_name' => $provider['business_name'],
                    'avg_rating' => (float)$provider['avg_rating'],
                    'distance_km' => $distance !== null ? round($distance, 2) : null,
                    'area_type' => $provider['area_type']
                ];
                $seenCompanies[$provider['company_id']] = true;
            }
        }

        // Sort by distance (closest first), then by rating
        usort($nearbyProviders, function($a, $b) {
            if ($a['distance_km'] !== null && $b['distance_km'] !== null) {
                $distDiff = $a['distance_km'] - $b['distance_km'];
                if (abs($distDiff) > 0.1) return $distDiff <=> 0;
            }
            return $b['avg_rating'] <=> $a['avg_rating'];
        });

        return $nearbyProviders;
    }

    /**
     * Get center point of a polygon
     */
    private static function getPolygonCenter(array $polygon): array
    {
        $latSum = 0;
        $lonSum = 0;
        $count = count($polygon);

        foreach ($polygon as $point) {
            $latSum += $point['lat'] ?? $point['latitude'] ?? $point[0];
            $lonSum += $point['lng'] ?? $point['longitude'] ?? $point[1];
        }

        return [
            'lat' => $latSum / $count,
            'lon' => $lonSum / $count
        ];
    }

    /**
     * Geocode a lead request and update the database
     */
    public static function geocodeLeadRequest(int $leadRequestId, int $workspaceId): ?array
    {
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT * FROM lead_requests WHERE id = ? AND workspace_id = ?');
        $stmt->execute([$leadRequestId, $workspaceId]);
        $lead = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$lead) {
            return null;
        }

        // Already geocoded?
        if ($lead['latitude'] && $lead['longitude']) {
            return [
                'latitude' => (float)$lead['latitude'],
                'longitude' => (float)$lead['longitude'],
                'already_geocoded' => true
            ];
        }

        // Build address string
        $addressParts = array_filter([
            $lead['address_line1'],
            $lead['city'],
            $lead['region'],
            $lead['postal_code'],
            $lead['country']
        ]);

        if (empty($addressParts)) {
            return null;
        }

        $address = implode(', ', $addressParts);
        $result = self::geocode($address);

        if ($result) {
            $stmt = $pdo->prepare('
                UPDATE lead_requests SET
                    latitude = ?,
                    longitude = ?,
                    geocoded_at = NOW(),
                    geocode_source = ?
                WHERE id = ?
            ');
            $stmt->execute([
                $result['latitude'],
                $result['longitude'],
                $result['source'],
                $leadRequestId
            ]);
        }

        return $result;
    }

    /**
     * Batch geocode service areas for a provider
     */
    public static function geocodeServiceAreas(int $companyId, int $workspaceId): int
    {
        $pdo = Database::conn();
        $updated = 0;

        $stmt = $pdo->prepare('
            SELECT * FROM service_areas 
            WHERE company_id = ? AND workspace_id = ? 
              AND (latitude IS NULL OR longitude IS NULL)
              AND area_type IN (?, ?)
        ');
        $stmt->execute([$companyId, $workspaceId, 'radius', 'city']);
        $areas = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($areas as $area) {
            $addressParts = array_filter([
                $area['city'],
                $area['region'],
                $area['postal_code'],
                $area['country']
            ]);

            if (empty($addressParts)) continue;

            $result = self::geocode(implode(', ', $addressParts));
            
            if ($result) {
                $stmt = $pdo->prepare('
                    UPDATE service_areas SET
                        latitude = ?,
                        longitude = ?,
                        center_latitude = ?,
                        center_longitude = ?,
                        geocoded_at = NOW()
                    WHERE id = ?
                ');
                $stmt->execute([
                    $result['latitude'],
                    $result['longitude'],
                    $result['latitude'],
                    $result['longitude'],
                    $area['id']
                ]);
                $updated++;
            }

            // Rate limiting for free APIs
            usleep(100000); // 100ms delay
        }

        return $updated;
    }
}
