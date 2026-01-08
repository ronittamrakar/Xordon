<?php
/**
 * Ecommerce Controller
 * Handles all ecommerce-related API endpoints
 */

class EcommerceController {
    private $db;
    private $tenantId;

    public function __construct($db, $tenantId) {
        $this->db = $db;
        $this->tenantId = $tenantId;
    }

    // ==================== DASHBOARD ====================
    
    public function getDashboard() {
        try {
            // Get store count
            $storeStmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM ecommerce_stores 
                WHERE tenant_id = ? AND status = 'active'
            ");
            $storeStmt->execute([$this->tenantId]);
            $storeCount = $storeStmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Get revenue (30 days)
            $revenueStmt = $this->db->prepare("
                SELECT COALESCE(SUM(total), 0) as revenue 
                FROM orders 
                WHERE tenant_id = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND status = 'completed'
            ");
            $revenueStmt->execute([$this->tenantId]);
            $revenue = $revenueStmt->fetch(PDO::FETCH_ASSOC)['revenue'];

            // Get pending carts
            $cartsStmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM ecommerce_abandoned_carts 
                WHERE tenant_id = ? AND recovery_status = 'pending'
            ");
            $cartsStmt->execute([$this->tenantId]);
            $pendingCarts = $cartsStmt->fetch(PDO::FETCH_ASSOC)['count'];

            return [
                'store_count' => (int)$storeCount,
                'revenue_30d' => (float)$revenue,
                'pending_carts' => (int)$pendingCarts,
            ];
        } catch (Exception $e) {
            throw new Exception("Failed to get dashboard data: " . $e->getMessage());
        }
    }

    // ==================== STORES ====================
    
    public function getStores() {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM ecommerce_stores 
                WHERE tenant_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$this->tenantId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Failed to get stores: " . $e->getMessage());
        }
    }

    public function getStore($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM ecommerce_stores 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$id, $this->tenantId]);
            $store = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$store) {
                throw new Exception("Store not found");
            }
            
            return $store;
        } catch (Exception $e) {
            throw new Exception("Failed to get store: " . $e->getMessage());
        }
    }

    public function createStore($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ecommerce_stores (
                    tenant_id, platform, store_name, store_url, 
                    api_key, api_secret, status
                ) VALUES (?, ?, ?, ?, ?, ?, 'active')
            ");
            
            $stmt->execute([
                $this->tenantId,
                $data['platform'],
                $data['store_name'],
                $data['store_url'],
                $data['api_key'] ?? null,
                $data['api_secret'] ?? null
            ]);
            
            return ['id' => $this->db->lastInsertId(), 'message' => 'Store connected successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to create store: " . $e->getMessage());
        }
    }

    public function updateStore($id, $data) {
        try {
            $fields = [];
            $values = [];
            
            $allowedFields = ['platform', 'store_name', 'store_url', 'api_key', 'api_secret', 'status'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                throw new Exception("No valid fields to update");
            }
            
            $values[] = $id;
            $values[] = $this->tenantId;
            
            $sql = "UPDATE ecommerce_stores SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);
            
            return ['message' => 'Store updated successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to update store: " . $e->getMessage());
        }
    }

    public function deleteStore($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM ecommerce_stores WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$id, $this->tenantId]);
            return ['message' => 'Store deleted successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to delete store: " . $e->getMessage());
        }
    }

    public function syncStore($id) {
        try {
            // Update sync status
            $stmt = $this->db->prepare("
                UPDATE ecommerce_stores 
                SET sync_status = 'syncing', last_sync_at = NOW() 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$id, $this->tenantId]);
            
            // TODO: Implement actual sync logic with store platform
            
            // For now, just mark as synced
            $stmt = $this->db->prepare("
                UPDATE ecommerce_stores 
                SET sync_status = 'synced', last_sync_at = NOW() 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$id, $this->tenantId]);
            
            return ['message' => 'Sync started successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to sync store: " . $e->getMessage());
        }
    }

    // ==================== ABANDONED CARTS ====================
    
    public function getAbandonedCarts() {
        try {
            $stmt = $this->db->prepare("
                SELECT ac.*, s.store_name 
                FROM ecommerce_abandoned_carts ac
                LEFT JOIN ecommerce_stores s ON ac.store_id = s.id
                WHERE ac.tenant_id = ? 
                ORDER BY ac.abandoned_at DESC
            ");
            $stmt->execute([$this->tenantId]);
            $carts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Decode JSON items
            foreach ($carts as &$cart) {
                $cart['items'] = json_decode($cart['items'], true);
            }
            
            return $carts;
        } catch (Exception $e) {
            throw new Exception("Failed to get abandoned carts: " . $e->getMessage());
        }
    }

    public function recoverCart($id, $data) {
        try {
            $channel = $data['channel'] ?? 'email';
            $status = $channel === 'email' ? 'email_sent' : 'sms_sent';
            
            $stmt = $this->db->prepare("
                UPDATE ecommerce_abandoned_carts 
                SET recovery_status = ? 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$status, $id, $this->tenantId]);
            
            // TODO: Implement actual email/SMS sending logic
            
            return ['message' => "Recovery $channel sent successfully"];
        } catch (Exception $e) {
            throw new Exception("Failed to recover cart: " . $e->getMessage());
        }
    }

    // ==================== WAREHOUSES ====================
    
    public function getWarehouses() {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM ecommerce_warehouses 
                WHERE tenant_id = ? 
                ORDER BY name ASC
            ");
            $stmt->execute([$this->tenantId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Failed to get warehouses: " . $e->getMessage());
        }
    }

    public function createWarehouse($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ecommerce_warehouses (
                    tenant_id, name, location, address, is_active
                ) VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $this->tenantId,
                $data['name'],
                $data['location'] ?? null,
                $data['address'] ?? null,
                $data['is_active'] ?? true
            ]);
            
            return ['id' => $this->db->lastInsertId(), 'message' => 'Warehouse created successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to create warehouse: " . $e->getMessage());
        }
    }

    public function updateWarehouse($id, $data) {
        try {
            $fields = [];
            $values = [];
            
            $allowedFields = ['name', 'location', 'address', 'is_active'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                throw new Exception("No valid fields to update");
            }
            
            $values[] = $id;
            $values[] = $this->tenantId;
            
            $sql = "UPDATE ecommerce_warehouses SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);
            
            return ['message' => 'Warehouse updated successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to update warehouse: " . $e->getMessage());
        }
    }

    public function deleteWarehouse($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM ecommerce_warehouses WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$id, $this->tenantId]);
            return ['message' => 'Warehouse deleted successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to delete warehouse: " . $e->getMessage());
        }
    }

    // ==================== INVENTORY ====================
    
    public function getInventory() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    i.*,
                    p.name as product_name,
                    p.sku as product_sku,
                    w.name as warehouse_name
                FROM ecommerce_inventory i
                JOIN products p ON i.product_id = p.id
                JOIN ecommerce_warehouses w ON i.warehouse_id = w.id
                WHERE i.tenant_id = ?
                ORDER BY p.name ASC
            ");
            $stmt->execute([$this->tenantId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Failed to get inventory: " . $e->getMessage());
        }
    }

    public function getInventoryStats() {
        try {
            // Total items
            $totalStmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM ecommerce_inventory WHERE tenant_id = ?
            ");
            $totalStmt->execute([$this->tenantId]);
            $total = $totalStmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Out of stock
            $outStmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM ecommerce_inventory 
                WHERE tenant_id = ? AND quantity_available = 0
            ");
            $outStmt->execute([$this->tenantId]);
            $outOfStock = $outStmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Low stock
            $lowStmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM ecommerce_inventory 
                WHERE tenant_id = ? AND quantity_available > 0 AND quantity_available <= reorder_point
            ");
            $lowStmt->execute([$this->tenantId]);
            $lowStock = $lowStmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Total value (approximate)
            $valueStmt = $this->db->prepare("
                SELECT COALESCE(SUM(i.quantity_available * p.price), 0) as value
                FROM ecommerce_inventory i
                JOIN products p ON i.product_id = p.id
                WHERE i.tenant_id = ?
            ");
            $valueStmt->execute([$this->tenantId]);
            $totalValue = $valueStmt->fetch(PDO::FETCH_ASSOC)['value'];

            return [
                'total_items' => (int)$total,
                'out_of_stock' => (int)$outOfStock,
                'low_stock' => (int)$lowStock,
                'total_value' => (float)$totalValue
            ];
        } catch (Exception $e) {
            throw new Exception("Failed to get inventory stats: " . $e->getMessage());
        }
    }

    public function createInventory($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ecommerce_inventory (
                    tenant_id, product_id, warehouse_id, 
                    quantity_on_hand, quantity_available, quantity_reserved,
                    reorder_point, reorder_quantity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $this->tenantId,
                $data['product_id'],
                $data['warehouse_id'],
                $data['quantity_on_hand'] ?? 0,
                $data['quantity_available'] ?? 0,
                $data['quantity_reserved'] ?? 0,
                $data['reorder_point'] ?? 0,
                $data['reorder_quantity'] ?? 0
            ]);
            
            return ['id' => $this->db->lastInsertId(), 'message' => 'Inventory created successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to create inventory: " . $e->getMessage());
        }
    }

    public function updateInventory($id, $data) {
        try {
            $fields = [];
            $values = [];
            
            $allowedFields = ['quantity_on_hand', 'quantity_available', 'quantity_reserved', 'reorder_point', 'reorder_quantity'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                throw new Exception("No valid fields to update");
            }
            
            $values[] = $id;
            $values[] = $this->tenantId;
            
            $sql = "UPDATE ecommerce_inventory SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);
            
            return ['message' => 'Inventory updated successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to update inventory: " . $e->getMessage());
        }
    }

    public function deleteInventory($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM ecommerce_inventory WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$id, $this->tenantId]);
            return ['message' => 'Inventory deleted successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to delete inventory: " . $e->getMessage());
        }
    }

    // ==================== COUPONS ====================
    
    public function getCoupons() {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM ecommerce_coupons 
                WHERE tenant_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$this->tenantId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Failed to get coupons: " . $e->getMessage());
        }
    }

    public function getCouponStats() {
        try {
            // Active coupons
            $activeStmt = $this->db->prepare("
                SELECT COUNT(*) as count FROM ecommerce_coupons 
                WHERE tenant_id = ? AND is_active = 1
            ");
            $activeStmt->execute([$this->tenantId]);
            $active = $activeStmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Total redemptions
            $redemptionsStmt = $this->db->prepare("
                SELECT COALESCE(SUM(used_count), 0) as count FROM ecommerce_coupons 
                WHERE tenant_id = ?
            ");
            $redemptionsStmt->execute([$this->tenantId]);
            $redemptions = $redemptionsStmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Total savings (approximate - would need order data)
            $savingsStmt = $this->db->prepare("
                SELECT COALESCE(SUM(value * used_count), 0) as savings 
                FROM ecommerce_coupons 
                WHERE tenant_id = ? AND type = 'fixed'
            ");
            $savingsStmt->execute([$this->tenantId]);
            $savings = $savingsStmt->fetch(PDO::FETCH_ASSOC)['savings'];

            return [
                'active_coupons' => (int)$active,
                'total_redemptions' => (int)$redemptions,
                'total_savings' => (float)$savings
            ];
        } catch (Exception $e) {
            throw new Exception("Failed to get coupon stats: " . $e->getMessage());
        }
    }

    public function createCoupon($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ecommerce_coupons (
                    tenant_id, code, name, type, value,
                    min_purchase, max_discount, usage_limit,
                    valid_from, valid_until, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $this->tenantId,
                $data['code'],
                $data['name'],
                $data['type'],
                $data['value'],
                $data['min_purchase'] ?? 0,
                $data['max_discount'] ?? null,
                $data['usage_limit'] ?? null,
                $data['valid_from'] ?? null,
                $data['valid_until'] ?? null,
                $data['is_active'] ?? true
            ]);
            
            return ['id' => $this->db->lastInsertId(), 'message' => 'Coupon created successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to create coupon: " . $e->getMessage());
        }
    }

    public function updateCoupon($id, $data) {
        try {
            $fields = [];
            $values = [];
            
            $allowedFields = ['code', 'name', 'type', 'value', 'min_purchase', 'max_discount', 'usage_limit', 'valid_from', 'valid_until', 'is_active'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                throw new Exception("No valid fields to update");
            }
            
            $values[] = $id;
            $values[] = $this->tenantId;
            
            $sql = "UPDATE ecommerce_coupons SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);
            
            return ['message' => 'Coupon updated successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to update coupon: " . $e->getMessage());
        }
    }

    public function deleteCoupon($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM ecommerce_coupons WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$id, $this->tenantId]);
            return ['message' => 'Coupon deleted successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to delete coupon: " . $e->getMessage());
        }
    }

    public function validateCoupon($data) {
        try {
            $code = $data['code'];
            
            $stmt = $this->db->prepare("
                SELECT * FROM ecommerce_coupons 
                WHERE tenant_id = ? AND code = ? AND is_active = 1
            ");
            $stmt->execute([$this->tenantId, $code]);
            $coupon = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$coupon) {
                return ['valid' => false, 'message' => 'Invalid coupon code'];
            }
            
            // Check expiry
            $now = date('Y-m-d H:i:s');
            if ($coupon['valid_from'] && $coupon['valid_from'] > $now) {
                return ['valid' => false, 'message' => 'Coupon not yet valid'];
            }
            if ($coupon['valid_until'] && $coupon['valid_until'] < $now) {
                return ['valid' => false, 'message' => 'Coupon has expired'];
            }
            
            // Check usage limit
            if ($coupon['usage_limit'] && $coupon['used_count'] >= $coupon['usage_limit']) {
                return ['valid' => false, 'message' => 'Coupon usage limit reached'];
            }
            
            return ['valid' => true, 'coupon' => $coupon];
        } catch (Exception $e) {
            throw new Exception("Failed to validate coupon: " . $e->getMessage());
        }
    }

    // ==================== SHIPPING METHODS ====================
    
    public function getShippingMethods() {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM ecommerce_shipping_methods 
                WHERE tenant_id = ? 
                ORDER BY name ASC
            ");
            $stmt->execute([$this->tenantId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Failed to get shipping methods: " . $e->getMessage());
        }
    }

    public function createShippingMethod($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ecommerce_shipping_methods (
                    tenant_id, name, carrier, rate_type,
                    base_rate, per_item_rate, per_weight_rate,
                    min_delivery_days, max_delivery_days, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $this->tenantId,
                $data['name'],
                $data['carrier'] ?? null,
                $data['rate_type'] ?? 'flat',
                $data['base_rate'] ?? 0,
                $data['per_item_rate'] ?? 0,
                $data['per_weight_rate'] ?? 0,
                $data['min_delivery_days'] ?? 0,
                $data['max_delivery_days'] ?? 0,
                $data['is_active'] ?? true
            ]);
            
            return ['id' => $this->db->lastInsertId(), 'message' => 'Shipping method created successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to create shipping method: " . $e->getMessage());
        }
    }

    public function updateShippingMethod($id, $data) {
        try {
            $fields = [];
            $values = [];
            
            $allowedFields = ['name', 'carrier', 'rate_type', 'base_rate', 'per_item_rate', 'per_weight_rate', 'min_delivery_days', 'max_delivery_days', 'is_active'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                throw new Exception("No valid fields to update");
            }
            
            $values[] = $id;
            $values[] = $this->tenantId;
            
            $sql = "UPDATE ecommerce_shipping_methods SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);
            
            return ['message' => 'Shipping method updated successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to update shipping method: " . $e->getMessage());
        }
    }

    public function deleteShippingMethod($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM ecommerce_shipping_methods WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$id, $this->tenantId]);
            return ['message' => 'Shipping method deleted successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to delete shipping method: " . $e->getMessage());
        }
    }

    // ==================== COLLECTIONS ====================
    
    public function getCollections() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    c.*,
                    COUNT(cp.product_id) as product_count
                FROM ecommerce_collections c
                LEFT JOIN ecommerce_collection_products cp ON c.id = cp.collection_id
                WHERE c.tenant_id = ?
                GROUP BY c.id
                ORDER BY c.sort_order ASC, c.name ASC
            ");
            $stmt->execute([$this->tenantId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Failed to get collections: " . $e->getMessage());
        }
    }

    public function getCollection($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM ecommerce_collections 
                WHERE id = ? AND tenant_id = ?
            ");
            $stmt->execute([$id, $this->tenantId]);
            $collection = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$collection) {
                throw new Exception("Collection not found");
            }
            
            return $collection;
        } catch (Exception $e) {
            throw new Exception("Failed to get collection: " . $e->getMessage());
        }
    }

    public function createCollection($data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ecommerce_collections (
                    tenant_id, name, description, image_url, sort_order, is_active
                ) VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $this->tenantId,
                $data['name'],
                $data['description'] ?? null,
                $data['image_url'] ?? null,
                $data['sort_order'] ?? 0,
                $data['is_active'] ?? true
            ]);
            
            return ['id' => $this->db->lastInsertId(), 'message' => 'Collection created successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to create collection: " . $e->getMessage());
        }
    }

    public function updateCollection($id, $data) {
        try {
            $fields = [];
            $values = [];
            
            $allowedFields = ['name', 'description', 'image_url', 'sort_order', 'is_active'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                throw new Exception("No valid fields to update");
            }
            
            $values[] = $id;
            $values[] = $this->tenantId;
            
            $sql = "UPDATE ecommerce_collections SET " . implode(', ', $fields) . " WHERE id = ? AND tenant_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($values);
            
            return ['message' => 'Collection updated successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to update collection: " . $e->getMessage());
        }
    }

    public function deleteCollection($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM ecommerce_collections WHERE id = ? AND tenant_id = ?");
            $stmt->execute([$id, $this->tenantId]);
            return ['message' => 'Collection deleted successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to delete collection: " . $e->getMessage());
        }
    }

    public function getCollectionProducts($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    cp.*,
                    p.name as product_name,
                    p.price as product_price,
                    p.sku as product_sku
                FROM ecommerce_collection_products cp
                JOIN products p ON cp.product_id = p.id
                JOIN ecommerce_collections c ON cp.collection_id = c.id
                WHERE cp.collection_id = ? AND c.tenant_id = ?
                ORDER BY cp.sort_order ASC
            ");
            $stmt->execute([$id, $this->tenantId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Failed to get collection products: " . $e->getMessage());
        }
    }

    public function addProductToCollection($collectionId, $data) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO ecommerce_collection_products (
                    collection_id, product_id, sort_order
                ) VALUES (?, ?, ?)
            ");
            
            $stmt->execute([
                $collectionId,
                $data['product_id'],
                $data['sort_order'] ?? 0
            ]);
            
            return ['id' => $this->db->lastInsertId(), 'message' => 'Product added to collection'];
        } catch (Exception $e) {
            throw new Exception("Failed to add product to collection: " . $e->getMessage());
        }
    }

    public function removeProductFromCollection($collectionId, $productId) {
        try {
            $stmt = $this->db->prepare("
                DELETE FROM ecommerce_collection_products 
                WHERE collection_id = ? AND product_id = ?
            ");
            $stmt->execute([$collectionId, $productId]);
            return ['message' => 'Product removed from collection'];
        } catch (Exception $e) {
            throw new Exception("Failed to remove product from collection: " . $e->getMessage());
        }
    }

    public function reorderCollectionProducts($collectionId, $data) {
        try {
            $productIds = $data['product_ids'];
            
            foreach ($productIds as $index => $productId) {
                $stmt = $this->db->prepare("
                    UPDATE ecommerce_collection_products 
                    SET sort_order = ? 
                    WHERE collection_id = ? AND product_id = ?
                ");
                $stmt->execute([$index, $collectionId, $productId]);
            }
            
            return ['message' => 'Products reordered successfully'];
        } catch (Exception $e) {
            throw new Exception("Failed to reorder products: " . $e->getMessage());
        }
    }
}
