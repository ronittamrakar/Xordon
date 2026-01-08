<?php
/**
 * Semantic Matching Engine
 * Matches dispositions and triggers using semantic similarity
 */

class SemanticCategory {
    public string $category;
    public int $confidence;
    public bool $isAmbiguous;
    public array $suggestedCategories;
    
    public function __construct(
        string $category = 'unknown',
        int $confidence = 0,
        bool $isAmbiguous = false,
        array $suggestedCategories = []
    ) {
        $this->category = $category;
        $this->confidence = max(0, min(100, $confidence));
        $this->isAmbiguous = $isAmbiguous;
        $this->suggestedCategories = $suggestedCategories;
    }
    
    public function toArray(): array {
        return [
            'category' => $this->category,
            'confidence' => $this->confidence,
            'is_ambiguous' => $this->isAmbiguous,
            'suggested_categories' => $this->suggestedCategories,
        ];
    }
}

class MatchResult {
    public bool $matches;
    public int $confidence;
    public string $reason;
    
    public function __construct(bool $matches = false, int $confidence = 0, string $reason = '') {
        $this->matches = $matches;
        $this->confidence = $confidence;
        $this->reason = $reason;
    }
}

class SemanticMatcher {
    
    // Category keywords for semantic analysis
    private array $categoryKeywords = [
        'positive_outcome' => [
            'interested', 'sale', 'sold', 'appointment', 'scheduled', 'booked',
            'agreed', 'yes', 'confirmed', 'qualified', 'hot lead', 'ready',
            'signed', 'purchased', 'bought', 'converted', 'won', 'success'
        ],
        'negative_outcome' => [
            'not interested', 'declined', 'refused', 'rejected', 'no',
            'wrong number', 'do not call', 'dnc', 'unqualified', 'lost',
            'cancelled', 'dead', 'cold', 'removed', 'blocked'
        ],
        'needs_followup' => [
            'callback', 'call back', 'follow up', 'followup', 'busy',
            'voicemail', 'no answer', 'try again', 'reschedule', 'pending',
            'thinking', 'considering', 'maybe', 'later', 'next week'
        ],
        'qualified_lead' => [
            'qualified', 'interested', 'hot', 'warm', 'ready to buy',
            'decision maker', 'budget approved', 'timeline set', 'priority',
            'engaged', 'responsive', 'active'
        ],
        'unqualified_lead' => [
            'unqualified', 'not a fit', 'wrong person', 'no budget',
            'no authority', 'no need', 'competitor', 'already have',
            'not applicable', 'irrelevant', 'mismatch'
        ]
    ];
    
    // Disposition name patterns for quick matching
    private array $dispositionPatterns = [
        'positive_outcome' => [
            '/interested/i', '/sale/i', '/sold/i', '/appointment/i', 
            '/scheduled/i', '/booked/i', '/qualified/i', '/converted/i'
        ],
        'negative_outcome' => [
            '/not.?interested/i', '/declined/i', '/refused/i', '/wrong.?number/i',
            '/do.?not.?call/i', '/dnc/i', '/unqualified/i', '/removed/i'
        ],
        'needs_followup' => [
            '/callback/i', '/call.?back/i', '/follow.?up/i', '/busy/i',
            '/voicemail/i', '/no.?answer/i', '/try.?again/i', '/pending/i'
        ],
        'qualified_lead' => [
            '/qualified/i', '/hot.?lead/i', '/warm/i', '/ready/i',
            '/decision.?maker/i', '/priority/i'
        ],
        'unqualified_lead' => [
            '/unqualified/i', '/not.?a.?fit/i', '/wrong.?person/i',
            '/no.?budget/i', '/no.?need/i', '/competitor/i'
        ]
    ];
    
    /**
     * Categorize a disposition semantically
     */
    public function categorizeDisposition(string $name, ?string $description = null): SemanticCategory {
        $combinedText = strtolower($name . ' ' . ($description ?? ''));
        
        $scores = [];
        
        // Score each category
        foreach ($this->categoryKeywords as $category => $keywords) {
            $score = 0;
            $matchedKeywords = [];
            
            // Check keywords
            foreach ($keywords as $keyword) {
                if (strpos($combinedText, strtolower($keyword)) !== false) {
                    $score += 10;
                    $matchedKeywords[] = $keyword;
                }
            }
            
            // Check patterns
            if (isset($this->dispositionPatterns[$category])) {
                foreach ($this->dispositionPatterns[$category] as $pattern) {
                    if (preg_match($pattern, $combinedText)) {
                        $score += 15;
                    }
                }
            }
            
            if ($score > 0) {
                $scores[$category] = $score;
            }
        }
        
        // No matches found
        if (empty($scores)) {
            return new SemanticCategory('unknown', 30, true, array_keys($this->categoryKeywords));
        }
        
        // Sort by score descending
        arsort($scores);
        $categories = array_keys($scores);
        $topCategory = $categories[0];
        $topScore = $scores[$topCategory];
        
        // Calculate confidence
        $confidence = min(95, $topScore * 2);
        
        // Check for ambiguity (multiple categories with similar scores)
        $isAmbiguous = false;
        $suggestedCategories = [];
        
        if (count($scores) > 1) {
            $secondScore = $scores[$categories[1]] ?? 0;
            if ($secondScore >= $topScore * 0.7) {
                $isAmbiguous = true;
                $suggestedCategories = array_slice($categories, 0, 3);
                $confidence = min($confidence, 60); // Reduce confidence for ambiguous
            }
        }
        
        return new SemanticCategory($topCategory, $confidence, $isAmbiguous, $suggestedCategories);
    }
    
    /**
     * Check if a disposition matches a trigger semantically
     */
    public function matchesCategory(string $dispositionName, string $triggerCategory): MatchResult {
        $dispositionCategory = $this->categorizeDisposition($dispositionName);
        
        // Direct match
        if ($dispositionCategory->category === $triggerCategory) {
            return new MatchResult(
                true, 
                $dispositionCategory->confidence,
                "Direct semantic match: disposition '{$dispositionName}' categorized as '{$triggerCategory}'"
            );
        }
        
        // Check if trigger category is in suggested categories (for ambiguous cases)
        if ($dispositionCategory->isAmbiguous && 
            in_array($triggerCategory, $dispositionCategory->suggestedCategories)) {
            return new MatchResult(
                true,
                (int)($dispositionCategory->confidence * 0.7),
                "Partial match: disposition '{$dispositionName}' may be '{$triggerCategory}' (ambiguous)"
            );
        }
        
        // Check for related categories
        $relatedCategories = $this->getRelatedCategories($triggerCategory);
        if (in_array($dispositionCategory->category, $relatedCategories)) {
            return new MatchResult(
                true,
                (int)($dispositionCategory->confidence * 0.6),
                "Related category match: '{$dispositionCategory->category}' is related to '{$triggerCategory}'"
            );
        }
        
        return new MatchResult(
            false,
            0,
            "No match: disposition '{$dispositionName}' ({$dispositionCategory->category}) does not match '{$triggerCategory}'"
        );
    }
    
    /**
     * Get related categories for broader matching
     */
    private function getRelatedCategories(string $category): array {
        $relations = [
            'positive_outcome' => ['qualified_lead'],
            'negative_outcome' => ['unqualified_lead'],
            'qualified_lead' => ['positive_outcome'],
            'unqualified_lead' => ['negative_outcome'],
            'needs_followup' => [], // Unique category
        ];
        
        return $relations[$category] ?? [];
    }
    
    /**
     * Get all valid categories
     */
    public function getValidCategories(): array {
        return array_keys($this->categoryKeywords);
    }
    
    /**
     * Batch categorize multiple dispositions
     */
    public function categorizeMultiple(array $dispositions): array {
        $results = [];
        
        foreach ($dispositions as $disposition) {
            $name = $disposition['name'] ?? '';
            $description = $disposition['description'] ?? null;
            $results[] = [
                'name' => $name,
                'category' => $this->categorizeDisposition($name, $description)->toArray()
            ];
        }
        
        return $results;
    }
    
    /**
     * Find all dispositions matching a category
     */
    public function findMatchingDispositions(array $dispositions, string $targetCategory): array {
        $matches = [];
        
        foreach ($dispositions as $disposition) {
            $name = $disposition['name'] ?? '';
            $result = $this->matchesCategory($name, $targetCategory);
            
            if ($result->matches) {
                $matches[] = [
                    'disposition' => $disposition,
                    'confidence' => $result->confidence,
                    'reason' => $result->reason
                ];
            }
        }
        
        // Sort by confidence descending
        usort($matches, function($a, $b) {
            return $b['confidence'] - $a['confidence'];
        });
        
        return $matches;
    }
}
