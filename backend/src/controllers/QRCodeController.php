<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Permissions.php';

class QrCodeController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    public static function list() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $type = $_GET['type'] ?? null;
            $search = $_GET['search'] ?? null;

            $sql = "SELECT * FROM qr_codes WHERE workspace_id = ?";
            $params = [$workspaceId];

            if ($type) {
                $sql .= " AND type = ?";
                $params[] = $type;
            }

            if ($search) {
                $sql .= " AND name LIKE ?";
                $params[] = "%$search%";
            }

            $sql .= " ORDER BY created_at DESC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $codes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode style JSON
            foreach ($codes as &$code) {
                $code['style'] = json_decode($code['style'], true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $code['style'] = null; // Handle invalid JSON
                }
            }

            return Response::json(['data' => $codes]);
        } catch (Exception $e) {
            return Response::error('Failed to list QR codes: ' . $e->getMessage());
        }
    }

    public static function create() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['type']) || empty($data['name'])) {
                return Response::error('Type and name are required', 400);
            }

            $db = Database::conn();
            $url = $data['url'] ?? '';

            // Resolve URL based on type and entity/data
            if (!empty($data['entity_id'])) {
                $entityId = $data['entity_id'];
                $entityType = $data['entity_type'] ?? $data['type'];

                if ($entityType === 'booking_page') {
                    $stmt = $db->prepare("SELECT slug FROM booking_pages WHERE id = ?");
                    $stmt->execute([$entityId]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($row) $url = "https://xordon.com/public/book/" . $row['slug'];
                } elseif ($entityType === 'website') {
                    $stmt = $db->prepare("SELECT slug, published_url FROM websites WHERE id = ?");
                    $stmt->execute([$entityId]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($row) $url = $row['published_url'] ?: "https://xordon.com/sites/" . $row['slug'];
                } elseif ($entityType === 'form') {
                    // webforms_forms or forms
                    $stmt = $db->prepare("SELECT id FROM webforms_forms WHERE id = ?");
                    $stmt->execute([$entityId]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($row) $url = "https://xordon.com/forms/" . $row['id'];
                } elseif ($entityType === 'payment_link') {
                    $stmt = $db->prepare("SELECT slug FROM payment_links WHERE id = ?");
                    $stmt->execute([$entityId]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($row) $url = "https://xordon.com/pay/" . $row['slug'];
                } elseif ($entityType === 'review_widget' || $entityType === 'review_request') {
                    $stmt = $db->prepare("SELECT id FROM review_widgets WHERE id = ?");
                    $stmt->execute([$entityId]);
                    $row = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($row) $url = "https://xordon.com/reviews/widget/" . $row['id'];
                }
            } elseif (!empty($data['data'])) {
                // Generate content for special types
                $d = $data['data'];
                if ($data['type'] === 'contact_card') {
                    $vcard = "BEGIN:VCARD\nVERSION:3.0\n";
                    $vcard .= "N:" . ($d['last_name'] ?? '') . ";" . ($d['first_name'] ?? '') . ";;;\n";
                    $vcard .= "FN:" . trim(($d['first_name'] ?? '') . ' ' . ($d['last_name'] ?? '')) . "\n";
                    if (!empty($d['organization'])) $vcard .= "ORG:" . $d['organization'] . "\n";
                    if (!empty($d['phone'])) $vcard .= "TEL;TYPE=CELL:" . $d['phone'] . "\n";
                    if (!empty($d['email'])) $vcard .= "EMAIL:" . $d['email'] . "\n";
                    if (!empty($d['url'])) $vcard .= "URL:" . $d['url'] . "\n";
                    $vcard .= "END:VCARD";
                    $url = $vcard;
                } elseif ($data['type'] === 'wifi') {
                    $ssid = $d['ssid'] ?? '';
                    $pass = $d['password'] ?? '';
                    $auth = $d['encryption'] ?? 'WPA';
                    $url = "WIFI:S:$ssid;T:$auth;P:$pass;;";
                } elseif ($data['type'] === 'sms') {
                    $phone = $d['phone_number'] ?? '';
                    $body = $d['body'] ?? '';
                    $url = "SMSTO:$phone:$body";
                } elseif ($data['type'] === 'phone') {
                    $phone = $d['phone_number'] ?? '';
                    $url = "tel:$phone";
                } elseif ($data['type'] === 'email') {
                    $email = $d['email'] ?? '';
                    $subject = $d['subject'] ?? '';
                    $url = "mailto:$email?subject=" . urlencode($subject);
                }
            }

            // Fallback
            if (empty($url) && $data['type'] === 'custom_url') {
                 // Already handled by input but strictly check
                 $url = $data['url'] ?? '';
            }
            if (empty($url)) {
                $url = 'https://xordon.com'; // Default safe fallback
            }

            // Mock Image/SVG URLs (in production, generate these)
            $imageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($url);
            $svgUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=svg&data=" . urlencode($url);

            $stmt = $db->prepare("
                INSERT INTO qr_codes (workspace_id, type, name, url, style, entity_id, entity_type, image_url, svg_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");

            $styleJson = json_encode($data['style'] ?? []);
            
            $stmt->execute([
                $workspaceId,
                $data['type'],
                $data['name'],
                $url,
                $styleJson,
                $data['entity_id'] ?? null,
                $data['entity_type'] ?? null,
                $imageUrl,
                $svgUrl
            ]);

            $id = $db->lastInsertId();
            
            // Fetch created
            $stmt = $db->prepare("SELECT * FROM qr_codes WHERE id = ?");
            $stmt->execute([$id]);
            $newItem = $stmt->fetch(PDO::FETCH_ASSOC);
             if ($newItem) {
                $newItem['style'] = json_decode($newItem['style'], true);
            }

            return Response::json($newItem);
        } catch (Exception $e) {
            return Response::error('Failed to create QR code: ' . $e->getMessage());
        }
    }

    public static function get($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $stmt = $db->prepare("SELECT * FROM qr_codes WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$item) return Response::error('QR Code not found', 404);

            $item['style'] = json_decode($item['style'], true);
            return Response::json($item);
        } catch (Exception $e) {
            return Response::error('Failed to fetch QR code: ' . $e->getMessage());
        }
    }

    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $db = Database::conn();

            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM qr_codes WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) return Response::error('QR Code not found', 404);

            $updates = [];
            $params = [];

            if (isset($data['name'])) {
                $updates[] = "name = ?";
                $params[] = $data['name'];
            }
            if (isset($data['style'])) {
                $updates[] = "style = ?";
                $params[] = json_encode($data['style']);
            }

            if (empty($updates)) return Response::json(['message' => 'No changes']);

            $updates[] = "updated_at = NOW()";
            $sql = "UPDATE qr_codes SET " . implode(', ', $updates) . " WHERE id = ?";
            $params[] = $id;

            $db->prepare($sql)->execute($params);

            return self::get($id);
        } catch (Exception $e) {
            return Response::error('Failed to update QR code: ' . $e->getMessage());
        }
    }

    public static function delete($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $stmt = $db->prepare("DELETE FROM qr_codes WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) return Response::error('QR Code not found', 404);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete QR code: ' . $e->getMessage());
        }
    }

    public static function getAnalytics($id) {
        $workspaceId = self::getWorkspaceId();
        // Mock Analytics
        return Response::json([
            'qr_code_id' => $id,
            'total_scans' => rand(10, 500),
            'unique_scans' => rand(5, 400),
            'scans_by_date' => [],
            'scans_by_device' => [],
            'scans_by_location' => []
        ]);
    }
    
    public static function getOverviewAnalytics() {
        $workspaceId = self::getWorkspaceId();
        // Mock Overview
         return Response::json([
            'total_qr_codes' => rand(5, 20),
            'total_scans' => rand(100, 5000),
            'scans_by_type' => [],
            'top_performing' => [],
            'scans_trend' => []
        ]);
    }
    
    // Quick Generate (No DB)
    public static function quickGenerate() {
         $data = json_decode(file_get_contents('php://input'), true) ?? [];
         $content = $data['content'] ?? '';
         if (!$content) return Response::error('Content required', 400);

         return Response::json([
             'image_data' => "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($content),
             'format' => 'png'
         ]);
    }
}
