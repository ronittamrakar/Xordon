<?php
/**
 * SEO Controller
 * Keyword research, rank tracking, backlinks, and site audits
 * Ahrefs/SEMRush-style SEO tools
 * 
 * SCOPING: Company-scoped (requires active company)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class SeoController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getCompanyId(): int {
        return Permissions::requireActiveCompany();
    }

    // ==================== DASHBOARD & OVERVIEW ====================

    public static function getDashboardData() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // 1. Get Summary Stats (Mock combined with some real counts if available)
            $keywordsCount = $db->prepare("SELECT COUNT(*) FROM seo_keywords WHERE workspace_id = ? AND company_id = ?");
            $keywordsCount->execute([$workspaceId, $companyId]);
            $totalKeywords = (int)$keywordsCount->fetchColumn();

            $backlinksCount = $db->prepare("SELECT COUNT(*) FROM seo_backlinks WHERE workspace_id = ? AND company_id = ?");
            $backlinksCount->execute([$workspaceId, $companyId]);
            $totalBacklinks = (int)$backlinksCount->fetchColumn();

            // Latest audit for health score
            $auditStmt = $db->prepare("SELECT seo_score FROM seo_audits WHERE workspace_id = ? AND company_id = ? ORDER BY created_at DESC LIMIT 1");
            $auditStmt->execute([$workspaceId, $companyId]);
            $latestHealth = (int)$auditStmt->fetchColumn() ?: 72; // Default if no audit

            $stats = [
                'visibility' => rand(45, 85),
                'keywords_top3' => max(0, round($totalKeywords * 0.15)),
                'keywords_top10' => max(0, round($totalKeywords * 0.45)),
                'backlinks' => $totalBacklinks ?: 1240, // fallback for demo
                'health_score' => $latestHealth,
                'visibility_change' => rand(-5, 12),
                'keywords_change' => rand(2, 20),
                'backlinks_change' => rand(-10, 50),
                'health_change' => rand(-2, 5)
            ];

            // 2. Visibility Trend (Last 30 days)
            $visibilityTrend = [];
            for ($i = 30; $i >= 0; $i--) {
                $visibilityTrend[] = [
                    'date' => date('Y-m-d', strtotime("-$i days")),
                    'value' => 50 + rand(-5, 15) + ($i < 15 ? (15 - $i) * 0.5 : 0) // slow upward trend
                ];
            }

            // 3. Keyword Distribution
            $keywordDistribution = [
                ['range' => 'Top 3', 'count' => $stats['keywords_top3']],
                ['range' => 'Top 4-10', 'count' => $stats['keywords_top10']],
                ['range' => 'Top 11-50', 'count' => round($totalKeywords * 0.3) ?: 150],
                ['range' => 'Top 51-100', 'count' => round($totalKeywords * 0.1) ?: 80]
            ];

            // 4. Backlink Growth (Last 6 months)
            $backlinkGrowth = [];
            $months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            foreach ($months as $m) {
                $backlinkGrowth[] = [
                    'month' => $m,
                    'new' => rand(20, 100),
                    'lost' => rand(5, 30)
                ];
            }

            // 5. Top Technical Issues
            $topIssues = [
                [
                    'title' => 'Missing Meta Descriptions',
                    'description' => 'Pages with missing meta descriptions may not rank as well in SERPs.',
                    'count' => rand(15, 80),
                    'severity' => 'critical'
                ],
                [
                    'title' => 'Slow Page Load Time',
                    'description' => 'Pages taking more than 3 seconds to load negatively impact UX.',
                    'count' => rand(10, 45),
                    'severity' => 'critical'
                ],
                [
                    'title' => 'Missing Alt Tags',
                    'description' => 'Images without alt tags are invisible to search engines.',
                    'count' => rand(50, 200),
                    'severity' => 'warning'
                ],
                [
                    'title' => 'Duplicate H1 Tags',
                    'description' => 'Multiple H1 tags can confuse search engines about page priority.',
                    'count' => rand(5, 20),
                    'severity' => 'warning'
                ]
            ];

            return Response::json([
                'data' => [
                    'stats' => $stats,
                    'visibility_trend' => $visibilityTrend,
                    'keyword_distribution' => $keywordDistribution,
                    'backlink_growth' => $backlinkGrowth,
                    'top_issues' => $topIssues
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch SEO dashboard: ' . $e->getMessage());
        }
    }

    // ==================== KEYWORD EXPLORER ====================

    public static function exploreKeywords() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $seed = $data['keyword'] ?? $data['seed'] ?? '';
            if (empty($seed)) {
                return Response::error('keyword required', 400);
            }

            // Mock Data Enhanced with Trends & Difficulty
            $suggestions = [
                [
                    'keyword' => $seed,
                    'search_volume' => rand(1000, 50000),
                    'keyword_difficulty' => rand(20, 80),
                    'cpc' => round(rand(50, 500) / 100, 2),
                    'competition' => ['low', 'medium', 'high'][rand(0, 2)],
                    'serp_features' => ['Featured Snippet', 'People Also Ask', 'Local Pack'][rand(0, 2)],
                    'trend_data' => array_map(function() { return rand(1000, 5000); }, range(1, 12)), // 12 months trend
                    'intent' => ['Informational', 'Commercial', 'Transactional'][rand(0, 2)]
                ],
                [
                    'keyword' => $seed . ' near me',
                    'search_volume' => rand(500, 10000),
                    'keyword_difficulty' => rand(15, 60),
                    'cpc' => round(rand(30, 400) / 100, 2),
                    'competition' => 'medium',
                    'serp_features' => 'Local Pack',
                    'trend_data' => array_map(function() { return rand(500, 2000); }, range(1, 12)),
                    'intent' => 'Transactional'
                ],
                [
                    'keyword' => 'best ' . $seed,
                    'search_volume' => rand(800, 15000),
                    'keyword_difficulty' => rand(25, 75),
                    'cpc' => round(rand(40, 450) / 100, 2),
                    'competition' => 'high',
                    'serp_features' => 'Featured Snippet',
                    'trend_data' => array_map(function() { return rand(800, 3000); }, range(1, 12)),
                    'intent' => 'Commercial'
                ],
                [
                    'keyword' => $seed . ' services',
                    'search_volume' => rand(600, 12000),
                    'keyword_difficulty' => rand(20, 70),
                    'cpc' => round(rand(45, 480) / 100, 2),
                    'competition' => 'medium',
                    'serp_features' => null,
                    'trend_data' => array_map(function() { return rand(600, 2500); }, range(1, 12)),
                    'intent' => 'Commercial'
                ],
                [
                    'keyword' => $seed . ' cost',
                    'search_volume' => rand(400, 8000),
                    'keyword_difficulty' => rand(18, 65),
                    'cpc' => round(rand(35, 420) / 100, 2),
                    'competition' => 'low',
                    'serp_features' => 'People Also Ask',
                    'trend_data' => array_map(function() { return rand(400, 1500); }, range(1, 12)),
                    'intent' => 'Informational'
                ]
            ];

            return Response::json(['data' => $suggestions]);
        } catch (Exception $e) {
            return Response::error('Failed to explore keywords: ' . $e->getMessage());
        }
    }

    public static function getKeywords() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM seo_keywords
                WHERE workspace_id = ? AND company_id = ?
                ORDER BY created_at DESC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $keywords = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $keywords]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch keywords: ' . $e->getMessage());
        }
    }

    public static function addKeyword() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $keyword = $data['keyword'] ?? '';
            if (empty($keyword)) {
                return Response::error('keyword required', 400);
            }

            // Check if already exists
            $checkStmt = $db->prepare("SELECT id FROM seo_keywords WHERE workspace_id = ? AND company_id = ? AND keyword = ?");
            $checkStmt->execute([$workspaceId, $companyId, $keyword]);
            if ($checkStmt->fetch()) {
                return Response::error('Keyword already tracked', 409);
            }

            // Generate mock metrics for the new keyword
            $volume = rand(100, 50000);
            $difficulty = rand(10, 90);
            $currentRank = rand(1, 100); // Random rank for start
            $previousRank = $currentRank + rand(-5, 5);
            if ($previousRank < 1) $previousRank = null;

            $stmt = $db->prepare("
                INSERT INTO seo_keywords 
                (workspace_id, company_id, keyword, search_volume, difficulty, current_rank, previous_rank, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $workspaceId, 
                $companyId, 
                $keyword, 
                $volume, 
                $difficulty, 
                $currentRank, 
                $previousRank
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add keyword: ' . $e->getMessage());
        }
    }

    public static function deleteKeyword($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM seo_keywords WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete keyword: ' . $e->getMessage());
        }
    }

    public static function keywordGapAnalysis() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $myDomain = $data['my_domain'] ?? '';
            $competitors = $data['competitors'] ?? []; // Array of domains

            if (empty($myDomain) || empty($competitors)) {
                return Response::error('my_domain and competitors required', 400);
            }

            // Mock Data for Gap Analysis
            $gaps = [];
            $mockKeywords = ['seo services', 'digital marketing', 'content writing', 'link building', 'local seo'];
            
            foreach ($mockKeywords as $kw) {
                $myRank = rand(0, 1) ? rand(1, 100) : null; // 50% chance to rank
                $compRanks = [];
                foreach ($competitors as $comp) {
                    $compRanks[$comp] = rand(1, 100);
                }
                
                // Gap conditions: 
                // 1. Missing: Competitors rank, I don't
                // 2. Weak: Competitors rank better
                // 3. Strong: I rank better
                
                $type = 'shared';
                if ($myRank === null) $type = 'missing';
                elseif ($myRank > min($compRanks)) $type = 'weak';
                else $type = 'strong';

                $gaps[] = [
                    'keyword' => $kw,
                    'volume' => rand(500, 5000),
                    'difficulty' => rand(30, 80),
                    'my_rank' => $myRank,
                    'competitor_ranks' => $compRanks,
                    'type' => $type
                ];
            }

            return Response::json(['data' => $gaps]);
        } catch (Exception $e) {
            return Response::error('Failed to perform keyword gap analysis: ' . $e->getMessage());
        }
    }

    public static function keywordClustering() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $keywords = $data['keywords'] ?? [];
            if (empty($keywords)) {
                return Response::error('keywords list required', 400);
            }

            // Mock Clustering
            $clusters = [
                'Commercial Intent' => [],
                'Informational' => [],
                'Local SEO' => []
            ];

            foreach ($keywords as $kw) {
                if (strpos($kw, 'service') !== false || strpos($kw, 'buy') !== false) {
                    $clusters['Commercial Intent'][] = $kw;
                } elseif (strpos($kw, 'how') !== false || strpos($kw, 'what') !== false) {
                    $clusters['Informational'][] = $kw;
                } else {
                    $clusters['Local SEO'][] = $kw; // Fallback mock
                }
            }

            return Response::json(['data' => $clusters]);
        } catch (Exception $e) {
            return Response::error('Failed to cluster keywords: ' . $e->getMessage());
        }
    }

    public static function runDeepCrawl() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $url = $data['url'] ?? null;
            $save = $data['save'] ?? false;

            if (!$url) return Response::error('URL required', 400);

            // Mock Deep Crawl Results
            $pages = [];
            $paths = ['/', '/about', '/services', '/contact', '/blog', '/pricing', '/products', '/shop', '/terms', '/privacy', '/faq'];
            
            $issues_found = 0;
            $warnings_found = 0;

            foreach ($paths as $path) {
                $status = (rand(1, 20) === 1) ? 404 : 200;
                if ($status === 404) $issues_found++;
                
                $h1_count = rand(0, 2);
                if ($h1_count !== 1) $warnings_found++;

                $pages[] = [
                    'url' => rtrim($url, '/') . $path,
                    'status_code' => $status,
                    'title' => "Page Title for $path",
                    'meta_description' => (rand(1, 10) === 1) ? null : "Description for $path",
                    'h1_count' => $h1_count,
                    'load_time_ms' => rand(100, 1500),
                    'word_count' => rand(300, 2000),
                    'issues' => $status === 404 ? ['Broken Link'] : ($h1_count !== 1 ? ['Invalid H1 count'] : [])
                ];
            }

            if ($save) {
                // Create an actual audit record from this deep crawl
                $stmt = $db->prepare("
                    INSERT INTO seo_audits 
                    (workspace_id, company_id, url, audit_type, status, started_at, finished_at, seo_score, technical_score, content_score, issues_count, warnings_count, report_data)
                    VALUES (?, ?, ?, 'deep', 'completed', NOW(), NOW(), ?, ?, ?, ?, ?, ?)
                ");
                
                $seo_score = rand(70, 90);
                $report_data = json_encode(['pages' => $pages, 'crawl_depth' => 2]);

                $stmt->execute([
                    $workspaceId, 
                    $companyId, 
                    $url, 
                    $seo_score, 
                    rand(70, 95), 
                    rand(70, 95),
                    $issues_found,
                    $warnings_found,
                    $report_data
                ]);

                return Response::json(['data' => ['pages' => $pages, 'total_crawled' => count($pages), 'audit_id' => $db->lastInsertId()]]);
            }

            return Response::json(['data' => ['pages' => $pages, 'total_crawled' => count($pages)]]);
        } catch (Exception $e) {
            return Response::error('Failed to run deep crawl: ' . $e->getMessage());
        }
    }

    public static function getCoreWebVitals($auditId) {
        try {
            $workspaceId = self::getWorkspaceId();
            
            // Mock CWV Data
            $cwv = [
                'mobile' => [
                    'lcp' => rand(10, 40) / 10, // 1.0 - 4.0s
                    'fid' => rand(50, 300), // ms
                    'cls' => rand(0, 50) / 100, // 0.0 - 0.5
                    'score' => rand(40, 95)
                ],
                'desktop' => [
                    'lcp' => rand(8, 25) / 10, // 0.8 - 2.5s
                    'fid' => rand(20, 150),
                    'cls' => rand(0, 20) / 100,
                    'score' => rand(60, 99)
                ]
            ];

            return Response::json(['data' => $cwv]);
        } catch (Exception $e) {
            return Response::error('Failed to get Core Web Vitals: ' . $e->getMessage());
        }
    }

    public static function getStructuredData($auditId) {
        try {
            $workspaceId = self::getWorkspaceId();

            // Mock Schema Validation
            $schemas = [
                ['type' => 'Organization', 'status' => 'valid', 'errors' => []],
                ['type' => 'WebSite', 'status' => 'valid', 'errors' => []],
                ['type' => 'BreadcrumbList', 'status' => 'warning', 'errors' => ['Missing item property']],
            ];
            
            if (rand(0,1)) {
                 $schemas[] = ['type' => 'LocalBusiness', 'status' => 'error', 'errors' => ['Missing "image" field', 'Invalid "priceRange"']];
            }

            return Response::json(['data' => $schemas]);
        } catch (Exception $e) {
            return Response::error('Failed to get structured data: ' . $e->getMessage());
        }
    }

    public static function analyzeContent() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $content = $data['content'] ?? '';
            $targetKeyword = $data['keyword'] ?? '';

            if (!$content) return Response::error('Content required', 400);

            // Mock Content Analysis
            $wordCount = str_word_count(strip_tags($content));
            $readabilityScore = rand(30, 90); // Flesch-Kincaid mock
            $keywordDensity = $wordCount > 0 ? (substr_count(strtolower($content), strtolower($targetKeyword)) / $wordCount) * 100 : 0;
            
            $suggestions = [];
            if ($wordCount < 300) $suggestions[] = "Content is too short ($wordCount words). Aim for 600+ words.";
            if ($readabilityScore < 50) $suggestions[] = "Text is hard to read. Use shorter sentences.";
            if ($targetKeyword && $keywordDensity < 0.5) $suggestions[] = "Keyword density is low ($keywordDensity%). Mention '$targetKeyword' more often.";
            if ($targetKeyword && $keywordDensity > 3) $suggestions[] = "Keyword stuffing detected ($keywordDensity%). Reduce usage of '$targetKeyword'.";

            return Response::json(['data' => [
                'score' => rand(50, 95),
                'readability' => $readabilityScore,
                'word_count' => $wordCount,
                'keyword_density' => round($keywordDensity, 2),
                'sentiment' => ['Positive', 'Neutral', 'Negative'][rand(0, 2)],
                'suggestions' => $suggestions
            ]]);
        } catch (Exception $e) {
            return Response::error('Failed to analyze content: ' . $e->getMessage());
        }
    }

    public static function topicResearch() {
        try {
            $workspaceId = self::getWorkspaceId();
            $keyword = $_GET['keyword'] ?? '';

            // Mock Topic Research
            $topics = [];
            $baseTopics = ['Strategy', 'Tools', 'Trends', 'Examples', 'Guide', 'Benefits', 'Mistakes'];
            
            foreach ($baseTopics as $t) {
                $topics[] = [
                    'topic' => "$keyword $t",
                    'volume' => rand(100, 10000),
                    'difficulty' => rand(30, 80),
                    'subtopics' => [
                        "How to use $keyword $t",
                        "Best $keyword $t 2024",
                        "Free $keyword $t"
                    ]
                ];
            }

            return Response::json(['data' => $topics]);
        } catch (Exception $e) {
            return Response::error('Failed to perform topic research: ' . $e->getMessage());
        }
    }

    public static function getReports() {
        try {
            $workspaceId = self::getWorkspaceId();
            // Mock Reports List
            $reports = [
                ['id' => 1, 'title' => 'Monthly SEO Report - Jan', 'created_at' => date('Y-m-d', strtotime('-1 month')), 'status' => 'ready', 'modules' => ['Keywords', 'Backlinks']],
                ['id' => 2, 'title' => 'Technical Audit Summary', 'created_at' => date('Y-m-d', strtotime('-1 week')), 'status' => 'ready', 'modules' => ['Audit']],
            ];
            return Response::json(['data' => $reports]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch reports: ' . $e->getMessage());
        }
    }

    public static function generateReport() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $modules = $data['modules'] ?? [];
            $title = $data['title'] ?? 'New Report';

            // Mock Report Generation
            $report = [
                'id' => rand(100, 999),
                'title' => $title,
                'created_at' => date('Y-m-d H:i:s'),
                'status' => 'processing',
                'download_url' => '/api/seo/reports/download/' . rand(100, 999) // Mock URL
            ];

            return Response::json(['data' => $report, 'message' => 'Report generation started']);
        } catch (Exception $e) {
            return Response::error('Failed to generate report: ' . $e->getMessage());
        }
    }

    public static function scheduleReport() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $frequency = $data['frequency'] ?? 'monthly';
            $email = $data['email'] ?? '';

            return Response::json(['message' => "Report scheduled $frequency to $email"]);
        } catch (Exception $e) {
            return Response::error('Failed to schedule report: ' . $e->getMessage());
        }
    }



    public static function serpAnalysis() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $keyword = $_GET['keyword'] ?? '';

            if (empty($keyword)) {
                return Response::error('keyword required', 400);
            }

            // Mock SERP Data
            $serp = [];
            for ($i = 1; $i <= 10; $i++) {
                $serp[] = [
                    'position' => $i,
                    'title' => "Result Title $i for $keyword",
                    'url' => "https://competitor-$i.com/page-$i",
                    'domain_authority' => rand(20, 90),
                    'referring_domains' => rand(50, 5000),
                    'traffic' => rand(100, 50000)
                ];
            }

            return Response::json(['data' => $serp]);

        } catch (Exception $e) {
            return Response::error('Failed to analyze SERP: ' . $e->getMessage());
        }
    }

    public static function getRelatedQuestions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $keyword = $_GET['keyword'] ?? '';

            if (empty($keyword)) {
                return Response::error('keyword required', 400);
            }

            // Mock "People Also Ask"
            $questions = [
                "What is the best $keyword?",
                "How much does $keyword cost?",
                "Is $keyword worth it?",
                "How to do $keyword yourself?",
                "$keyword vs Competitor"
            ];

            return Response::json(['data' => $questions]);

        } catch (Exception $e) {
            return Response::error('Failed to get related questions: ' . $e->getMessage());
        }
    }

    // ==================== BACKLINKS ====================

    public static function getBacklinks() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $status = $_GET['status'] ?? 'active';

            $stmt = $db->prepare("
                SELECT * FROM seo_backlinks
                WHERE workspace_id = ? AND company_id = ? AND status = ?
                ORDER BY domain_authority DESC, first_seen_at DESC
                LIMIT ?
            ");
            $stmt->execute([$workspaceId, $companyId, $status, $limit]);
            $backlinks = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get summary stats
            $statsStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN link_type = 'dofollow' THEN 1 ELSE 0 END) as dofollow,
                    SUM(CASE WHEN link_type = 'nofollow' THEN 1 ELSE 0 END) as nofollow,
                    AVG(domain_authority) as avg_da,
                    COUNT(DISTINCT source_domain) as referring_domains
                FROM seo_backlinks
                WHERE workspace_id = ? AND company_id = ? AND status = 'active'
            ");
            $statsStmt->execute([$workspaceId, $companyId]);
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

            return Response::json([
                'backlinks' => $backlinks,
                'stats' => $stats
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch backlinks: ' . $e->getMessage());
        }
    }

    public static function addBacklink() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['source_url']) || empty($data['target_url'])) {
                return Response::error('source_url and target_url required', 400);
            }

            $sourceDomain = parse_url($data['source_url'], PHP_URL_HOST);

            $stmt = $db->prepare("
                INSERT INTO seo_backlinks 
                (workspace_id, company_id, source_url, source_domain, target_url, anchor_text, link_type, domain_authority, page_authority)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['source_url'],
                $sourceDomain,
                $data['target_url'],
                $data['anchor_text'] ?? null,
                $data['link_type'] ?? 'dofollow',
                $data['domain_authority'] ?? null,
                $data['page_authority'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add backlink: ' . $e->getMessage());
        }
    }

    public static function getBacklinksByDomain() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT 
                    source_domain,
                    COUNT(*) as backlink_count,
                    MAX(domain_authority) as domain_authority,
                    SUM(CASE WHEN link_type = 'dofollow' THEN 1 ELSE 0 END) as dofollow_count
                FROM seo_backlinks
                WHERE workspace_id = ? AND company_id = ? AND status = 'active'
                GROUP BY source_domain
                ORDER BY backlink_count DESC, domain_authority DESC
                LIMIT 50
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $domains = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $domains]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch backlinks by domain: ' . $e->getMessage());
        }
    }

    public static function backlinkGapAnalysis() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $competitors = $data['competitors'] ?? []; // Array of domains
            if (empty($competitors)) {
                return Response::error('competitors list required', 400);
            }

            // Mock Gap Analysis
            $opportunities = [];
            for ($i = 0; $i < 10; $i++) {
                $domain = "opportunity-" . rand(1, 100) . ".com";
                $matches = [];
                foreach ($competitors as $comp) {
                    if (rand(0, 1)) $matches[] = $comp;
                }
                
                if (!empty($matches)) {
                    $opportunities[] = [
                        'domain' => $domain,
                        'da' => rand(20, 90),
                        'traffic' => rand(100, 50000),
                        'matches' => $matches
                    ];
                }
            }

            return Response::json(['data' => $opportunities]);
        } catch (Exception $e) {
            return Response::error('Failed to perform backlink gap analysis: ' . $e->getMessage());
        }
    }

    public static function getAnchorTextDistribution() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();

            // Mock Anchor Data
            $anchors = [
                ['text' => 'Brand Name', 'count' => rand(50, 200), 'percent' => 45],
                ['text' => 'click here', 'count' => rand(10, 50), 'percent' => 15],
                ['text' => 'website', 'count' => rand(5, 30), 'percent' => 10],
                ['text' => 'Exact Match Keyword', 'count' => rand(5, 20), 'percent' => 5],
                ['text' => 'Other', 'count' => rand(20, 80), 'percent' => 25],
            ];

            return Response::json(['data' => $anchors]);
        } catch (Exception $e) {
            return Response::error('Failed to get anchor text: ' . $e->getMessage());
        }
    }

    public static function getLinkVelocity() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();

            // Mock Velocity (Last 12 months)
            $velocity = [];
            for ($i = 11; $i >= 0; $i--) {
                $month = date('M Y', strtotime("-$i months"));
                $velocity[] = [
                    'month' => $month,
                    'new_links' => rand(5, 50),
                    'lost_links' => rand(0, 10)
                ];
            }

            return Response::json(['data' => $velocity]);
        } catch (Exception $e) {
            return Response::error('Failed to get link velocity: ' . $e->getMessage());
        }
    }

    public static function detectToxicLinks() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();

            // Mock Toxic Links
            $toxic = [];
            for ($i = 0; $i < 5; $i++) {
                $toxic[] = [
                    'url' => "http://spammy-site-" . rand(1, 99) . ".xyz/link",
                    'domain' => "spammy-site-" . rand(1, 99) . ".xyz",
                    'toxicity_score' => rand(60, 100),
                    'reason' => ['Link Farm', 'Spammy TLD', 'Irrelevant Content'][rand(0, 2)]
                ];
            }

            return Response::json(['data' => $toxic]);
        } catch (Exception $e) {
            return Response::error('Failed to detect toxic links: ' . $e->getMessage());
        }
    }

    public static function getSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT setting_key, setting_value FROM seo_settings WHERE workspace_id = ? AND company_id = ?");
            $stmt->execute([$workspaceId, $companyId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $settings = [];
            foreach ($rows as $row) {
                // setting_value is stored as JSON, so decode it. If it's just a string in JSON, it comes out as string.
                $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
            }

            return Response::json(['data' => $settings]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch settings: ' . $e->getMessage());
        }
    }

    public static function updateSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            
            // Expecting key-value pairs in root of data or under 'settings'
            $settings = $data['settings'] ?? $data;

            foreach ($settings as $key => $value) {
                $stmt = $db->prepare("
                    INSERT INTO seo_settings (workspace_id, company_id, setting_key, setting_value, updated_at)
                    VALUES (?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()
                ");
                $jsonValue = json_encode($value);
                $stmt->execute([$workspaceId, $companyId, $key, $jsonValue, $jsonValue]);
            }

            return Response::json(['message' => 'Settings updated successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to update settings: ' . $e->getMessage());
        }
    }

    // ==================== SITE AUDITS ====================

    public static function getAudits() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM seo_audits
                WHERE workspace_id = ? AND company_id = ?
                ORDER BY created_at DESC
                LIMIT 50
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $audits = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($audits as &$audit) {
                $audit['report_data'] = $audit['report_data'] ? json_decode($audit['report_data'], true) : null;
            }

            return Response::json(['data' => $audits]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch audits: ' . $e->getMessage());
        }
    }

    public static function createAudit() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['url'])) {
                return Response::error('url required', 400);
            }

            $auditType = $data['audit_type'] ?? 'full';

            // Create audit record
            $stmt = $db->prepare("
                INSERT INTO seo_audits 
                (workspace_id, company_id, url, audit_type, status, started_at)
                VALUES (?, ?, ?, ?, 'pending', NOW())
            ");
            $stmt->execute([$workspaceId, $companyId, $data['url'], $auditType]);
            $auditId = (int)$db->lastInsertId();

            // In production, queue background job to perform audit
            // For now, simulate immediate completion
            self::completeAudit($auditId);

            // Fetch the completed audit to return
            return self::getAudit($auditId);
        } catch (Exception $e) {
            return Response::error('Failed to create audit: ' . $e->getMessage());
        }
    }

    private static function completeAudit($auditId) {
        $db = Database::conn();

        // Simulate audit results
        $pages = [];
        $paths = ['/', '/about', '/services', '/contact', '/blog', '/pricing', '/products', '/sitemap.xml'];
        
        foreach ($paths as $path) {
            $status = (rand(1, 20) === 1) ? 404 : 200;
            $pages[] = [
                'url' => "https://example.com" . $path, // Simplified for mock, ideally use actual URL from audit
                'status_code' => $status,
                'title' => "Page Title for $path",
                'meta_description' => (rand(1, 10) === 1) ? null : "Description for $path",
                'h1_count' => rand(0, 2),
                'load_time_ms' => rand(100, 1500),
                'word_count' => rand(300, 2000),
                'issues' => $status === 404 ? ['Broken Link'] : []
            ];
        }

        $reportData = [
            'technical' => [
                ['type' => 'error', 'message' => 'Missing canonical tag', 'impact' => 'high'],
                ['type' => 'warning', 'message' => 'Slow server response time', 'impact' => 'medium'],
                ['type' => 'info', 'message' => 'Multiple H1 tags found', 'impact' => 'low']
            ],
            'content' => [
                ['type' => 'error', 'message' => 'Thin content detected', 'impact' => 'high'],
                ['type' => 'warning', 'message' => 'Low keyword density', 'impact' => 'medium']
            ],
            'performance' => [
                ['type' => 'warning', 'message' => 'Large image sizes', 'impact' => 'medium'],
                ['type' => 'info', 'message' => 'Enable text compression', 'impact' => 'low']
            ],
            'pages' => $pages
        ];

        $issuesCount = 2;
        $warningsCount = 3;
        $seoScore = rand(60, 95);
        $technicalScore = rand(60, 90);
        $contentScore = rand(50, 85);
        $performanceScore = rand(65, 90);
        $accessibilityScore = rand(70, 95);

        $db->prepare("
            UPDATE seo_audits
            SET status = 'completed',
                seo_score = ?,
                technical_score = ?,
                content_score = ?,
                performance_score = ?,
                accessibility_score = ?,
                report_data = ?,
                issues_count = ?,
                warnings_count = ?,
                finished_at = NOW()
            WHERE id = ?
        ")->execute([
            $seoScore,
            $technicalScore,
            $contentScore,
            $performanceScore,
            $accessibilityScore,
            json_encode($reportData),
            $issuesCount,
            $warningsCount,
            $auditId
        ]);
    }

    public static function getAudit($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM seo_audits
                WHERE id = ? AND workspace_id = ? AND company_id = ?
            ");
            $stmt->execute([$id, $workspaceId, $companyId]);
            $audit = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$audit) {
                return Response::error('Audit not found', 404);
            }

            $audit['report_data'] = $audit['report_data'] ? json_decode($audit['report_data'], true) : null;

            return Response::json(['data' => $audit]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch audit: ' . $e->getMessage());
        }
    }

    // ==================== COMPETITOR BACKLINKS ====================

    public static function getCompetitorBacklinks($competitorId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Verify competitor ownership
            $checkStmt = $db->prepare("SELECT domain FROM seo_competitors WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $checkStmt->execute([$competitorId, $workspaceId, $companyId]);
            $competitor = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$competitor) {
                return Response::error('Competitor not found', 404);
            }

            // In production, this would fetch competitor backlinks from external API
            // For now, return mock data
            $mockBacklinks = [
                [
                    'source_url' => 'https://example.com/article',
                    'source_domain' => 'example.com',
                    'anchor_text' => 'great service',
                    'domain_authority' => 65,
                    'link_type' => 'dofollow'
                ]
            ];

            return Response::json(['data' => $mockBacklinks]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch competitor backlinks: ' . $e->getMessage());
        }
    }

    public static function getCompetitors() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM seo_competitors
                WHERE workspace_id = ? AND company_id = ?
                ORDER BY created_at DESC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $competitors = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $competitors]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch competitors: ' . $e->getMessage());
        }
    }

    public static function addCompetitor() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $domain = $data['domain'] ?? '';
            if (empty($domain)) {
                return Response::error('domain required', 400);
            }

            // Check duplicate
            $check = $db->prepare("SELECT id FROM seo_competitors WHERE workspace_id = ? AND company_id = ? AND domain = ?");
            $check->execute([$workspaceId, $companyId, $domain]);
            if ($check->fetch()) {
                return Response::error('Competitor already tracked', 409);
            }

            $stmt = $db->prepare("
                INSERT INTO seo_competitors (workspace_id, company_id, domain, type, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$workspaceId, $companyId, $domain, $data['type'] ?? 'direct']);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add competitor: ' . $e->getMessage());
        }
    }
}
