<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class PageBuilderController {
    
    public static function savePage() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $pageId = $data['page_id'] ?? null;
        $sections = $data['sections'] ?? [];
        $globalStyles = $data['global_styles'] ?? null;
        $customCss = $data['custom_css'] ?? null;
        
        $db = Database::conn();
        
        if ($pageId) {
            // Update existing page
            $stmt = $db->prepare("
                UPDATE landing_pages 
                SET global_styles = ?, custom_css = ?, updated_at = NOW()
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([
                json_encode($globalStyles),
                $customCss,
                $pageId,
                $ctx->workspaceId
            ]);
            
            // Delete existing sections
            $stmt = $db->prepare("DELETE FROM page_sections WHERE page_id = ?");
            $stmt->execute([$pageId]);
        } else {
            // Create new page
            $stmt = $db->prepare("
                INSERT INTO landing_pages 
                (workspace_id, company_id, name, title, builder_version, global_styles, custom_css, status)
                VALUES (?, ?, ?, ?, 'v2', ?, ?, 'draft')
            ");
            $stmt->execute([
                $ctx->workspaceId,
                $ctx->activeCompanyId ?? null,
                $data['name'] ?? 'Untitled Page',
                $data['title'] ?? 'Untitled Page',
                json_encode($globalStyles),
                $customCss
            ]);
            $pageId = $db->lastInsertId();
        }
        
        // Save sections
        foreach ($sections as $index => $section) {
            $stmt = $db->prepare("
                INSERT INTO page_sections 
                (page_id, section_type, section_data, sort_order)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $pageId,
                $section['type'] ?? 'custom',
                json_encode($section),
                $index
            ]);
        }
        
        return Response::success(['page_id' => $pageId]);
    }
    
    public static function getPage($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM landing_pages WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $page = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$page) {
            return Response::error('Page not found', 404);
        }
        
        // Get sections
        $stmt = $db->prepare("
            SELECT * FROM page_sections 
            WHERE page_id = ? 
            ORDER BY sort_order ASC
        ");
        $stmt->execute([$id]);
        $sections = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $page['sections'] = array_map(function($section) {
            $section['section_data'] = json_decode($section['section_data'], true);
            return $section;
        }, $sections);
        
        $page['global_styles'] = json_decode($page['global_styles'], true);
        
        return Response::success($page);
    }
    
    public static function listComponents() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT * FROM page_components 
            WHERE workspace_id = ? OR is_global = 1
            ORDER BY category, name
        ");
        $stmt->execute([$ctx->workspaceId]);
        $components = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($components as &$component) {
            $component['component_data'] = json_decode($component['component_data'], true);
        }
        
        return Response::success($components);
    }
    
    public static function saveComponent() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO page_components 
            (workspace_id, name, category, component_data, thumbnail_url)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $data['name'],
            $data['category'] ?? 'custom',
            json_encode($data['component_data']),
            $data['thumbnail_url'] ?? null
        ]);
        
        return Response::success(['component_id' => $db->lastInsertId()]);
    }
}
