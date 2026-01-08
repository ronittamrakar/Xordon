<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($website['seo_title'] ?? $website['title']) ?></title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="<?= htmlspecialchars($website['seo_description'] ?? $website['description'] ?? '') ?>">
    <?php if (!empty($website['og_image'])): ?>
    <meta property="og:image" content="<?= htmlspecialchars($website['og_image']) ?>">
    <?php endif; ?>
    <meta property="og:title" content="<?= htmlspecialchars($website['seo_title'] ?? $website['title']) ?>">
    <meta property="og:description" content="<?= htmlspecialchars($website['seo_description'] ?? $website['description'] ?? '') ?>">
    <meta property="og:type" content="website">
    
    <!-- Favicon -->
    <?php if (!empty($website['content']['settings']['favicon'])): ?>
    <link rel="icon" href="<?= htmlspecialchars($website['content']['settings']['favicon']) ?>">
    <?php endif; ?>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Base Styles -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: <?= $website['content']['settings']['fontFamily'] ?? 'Inter, sans-serif' ?>;
            background-color: <?= $website['content']['settings']['backgroundColor'] ?? '#ffffff' ?>;
            color: #333;
            line-height: 1.6;
        }
        
        .website-container {
            width: 100%;
            min-height: 100vh;
        }
        
        .section {
            position: relative;
            width: 100%;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Utility Classes */
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        
        /* Button Styles */
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: <?= $website['content']['settings']['accentColor'] ?? '#3b82f6' ?>;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            opacity: 0.9;
            transform: translateY(-2px);
        }
        
        /* Responsive Images */
        img {
            max-width: 100%;
            height: auto;
        }
        
        /* Custom CSS from settings */
        <?= $website['content']['settings']['customCSS'] ?? '' ?>
    </style>
</head>
<body>
    <div class="website-container">
        <?php
        // Render each section
        $sections = $website['content']['sections'] ?? [];
        foreach ($sections as $section):
            if (isset($section['visible']) && !$section['visible']) continue;
            
            $sectionStyles = '';
            if (isset($section['styles'])) {
                $styles = $section['styles'];
                if (isset($styles['backgroundColor'])) $sectionStyles .= "background-color: {$styles['backgroundColor']};";
                if (isset($styles['backgroundImage'])) $sectionStyles .= "background-image: url('{$styles['backgroundImage']}');";
                if (isset($styles['padding'])) $sectionStyles .= "padding: {$styles['padding']};";
                if (isset($styles['margin'])) $sectionStyles .= "margin: {$styles['margin']};";
                if (isset($styles['color'])) $sectionStyles .= "color: {$styles['color']};";
                if (isset($styles['textAlign'])) $sectionStyles .= "text-align: {$styles['textAlign']};";
                if (isset($styles['minHeight'])) $sectionStyles .= "min-height: {$styles['minHeight']};";
            }
        ?>
        
        <section class="section section-<?= htmlspecialchars($section['type']) ?>" style="<?= $sectionStyles ?>">
            <div class="container">
                <?php renderSection($section); ?>
            </div>
        </section>
        
        <?php endforeach; ?>
    </div>
    
    <!-- Analytics -->
    <?php if (!empty($website['content']['settings']['googleAnalytics'])): ?>
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=<?= htmlspecialchars($website['content']['settings']['googleAnalytics']) ?>"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '<?= htmlspecialchars($website['content']['settings']['googleAnalytics']) ?>');
    </script>
    <?php endif; ?>
    
    <?php if (!empty($website['content']['settings']['facebookPixel'])): ?>
    <!-- Facebook Pixel -->
    <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '<?= htmlspecialchars($website['content']['settings']['facebookPixel']) ?>');
        fbq('track', 'PageView');
    </script>
    <?php endif; ?>
    
    <!-- Custom JavaScript -->
    <?php if (!empty($website['content']['settings']['customJS'])): ?>
    <script>
        <?= $website['content']['settings']['customJS'] ?>
    </script>
    <?php endif; ?>
    
    <!-- Track page view -->
    <script>
        fetch('/api/websites/<?= $website['id'] ?>/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_type: 'view',
                event_data: {
                    page: window.location.pathname,
                    referrer: document.referrer
                }
            })
        });
    </script>
</body>
</html>

<?php
/**
 * Render individual section based on type
 */
function renderSection($section) {
    $type = $section['type'];
    $content = $section['content'] ?? [];
    
    switch ($type) {
        case 'hero':
            renderHeroSection($section);
            break;
        case 'heading':
            renderHeading($section);
            break;
        case 'text':
        case 'paragraph':
            renderText($section);
            break;
        case 'button':
            renderButton($section);
            break;
        case 'image':
            renderImage($section);
            break;
        case 'features':
            renderFeatures($section);
            break;
        case 'pricing':
            renderPricing($section);
            break;
        case 'testimonials':
            renderTestimonials($section);
            break;
        case 'form':
            renderForm($section);
            break;
        case 'cta':
            renderCTA($section);
            break;
        default:
            // Generic rendering for unknown types
            if (!empty($section['title'])) {
                echo '<h2>' . htmlspecialchars($section['title']) . '</h2>';
            }
            if (!empty($section['subtitle'])) {
                echo '<p>' . htmlspecialchars($section['subtitle']) . '</p>';
            }
    }
}

function renderHeroSection($section) {
    ?>
    <div class="hero-section" style="padding: 80px 0;">
        <?php if (!empty($section['title'])): ?>
        <h1 style="font-size: 3rem; font-weight: 800; margin-bottom: 1rem;">
            <?= htmlspecialchars($section['title']) ?>
        </h1>
        <?php endif; ?>
        
        <?php if (!empty($section['subtitle'])): ?>
        <p style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9;">
            <?= htmlspecialchars($section['subtitle']) ?>
        </p>
        <?php endif; ?>
        
        <?php if (!empty($section['content']['ctaText'])): ?>
        <a href="<?= htmlspecialchars($section['content']['ctaLink'] ?? '#') ?>" class="btn">
            <?= htmlspecialchars($section['content']['ctaText']) ?>
        </a>
        <?php endif; ?>
    </div>
    <?php
}

function renderHeading($section) {
    $level = $section['content']['level'] ?? 2;
    $tag = 'h' . min(6, max(1, $level));
    echo "<{$tag}>" . htmlspecialchars($section['title'] ?? '') . "</{$tag}>";
}

function renderText($section) {
    echo '<p>' . nl2br(htmlspecialchars($section['content']['text'] ?? $section['title'] ?? '')) . '</p>';
}

function renderButton($section) {
    $text = $section['content']['text'] ?? 'Click Here';
    $link = $section['content']['link'] ?? '#';
    echo '<a href="' . htmlspecialchars($link) . '" class="btn">' . htmlspecialchars($text) . '</a>';
}

function renderImage($section) {
    $src = $section['content']['src'] ?? '';
    $alt = $section['content']['alt'] ?? '';
    if ($src) {
        echo '<img src="' . htmlspecialchars($src) . '" alt="' . htmlspecialchars($alt) . '" style="width: 100%; height: auto;">';
    }
}

function renderFeatures($section) {
    $items = $section['content']['items'] ?? [];
    ?>
    <div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin: 2rem 0;">
        <?php foreach ($items as $item): ?>
        <div class="feature-item" style="text-align: center; padding: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem;"><?= htmlspecialchars($item['title'] ?? '') ?></h3>
            <p><?= htmlspecialchars($item['desc'] ?? '') ?></p>
        </div>
        <?php endforeach; ?>
    </div>
    <?php
}

function renderPricing($section) {
    $plans = $section['content']['plans'] ?? [];
    ?>
    <div class="pricing-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin: 2rem 0;">
        <?php foreach ($plans as $plan): ?>
        <div class="pricing-card" style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 2rem; text-align: center;">
            <h3 style="font-size: 1.5rem; margin-bottom: 1rem;"><?= htmlspecialchars($plan['name'] ?? '') ?></h3>
            <div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem;">
                <?= htmlspecialchars($plan['price'] ?? '') ?>
                <span style="font-size: 1rem; font-weight: 400;"><?= htmlspecialchars($plan['period'] ?? '') ?></span>
            </div>
            <ul style="list-style: none; margin-bottom: 1.5rem;">
                <?php foreach ($plan['features'] ?? [] as $feature): ?>
                <li style="padding: 0.5rem 0;">✓ <?= htmlspecialchars($feature) ?></li>
                <?php endforeach; ?>
            </ul>
            <a href="#" class="btn"><?= htmlspecialchars($plan['ctaText'] ?? 'Get Started') ?></a>
        </div>
        <?php endforeach; ?>
    </div>
    <?php
}

function renderTestimonials($section) {
    $quotes = $section['content']['quotes'] ?? [];
    ?>
    <div class="testimonials-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0;">
        <?php foreach ($quotes as $quote): ?>
        <div class="testimonial-card" style="background: #f9fafb; padding: 2rem; border-radius: 12px;">
            <p style="font-style: italic; margin-bottom: 1rem;">"<?= htmlspecialchars($quote['text'] ?? '') ?>"</p>
            <div style="font-weight: 600;"><?= htmlspecialchars($quote['name'] ?? '') ?></div>
            <div style="font-size: 0.875rem; opacity: 0.7;"><?= htmlspecialchars($quote['role'] ?? '') ?></div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php
}

function renderForm($section) {
    $fields = $section['content']['fields'] ?? [];
    ?>
    <form class="website-form" style="max-width: 600px; margin: 2rem auto;">
        <?php foreach ($fields as $field): ?>
        <div style="margin-bottom: 1rem;">
            <?php if ($field['type'] === 'textarea'): ?>
            <textarea 
                name="<?= htmlspecialchars($field['name']) ?>" 
                placeholder="<?= htmlspecialchars($field['placeholder'] ?? '') ?>"
                <?= ($field['required'] ?? false) ? 'required' : '' ?>
                style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit;"
                rows="4"
            ></textarea>
            <?php else: ?>
            <input 
                type="<?= htmlspecialchars($field['type'] ?? 'text') ?>"
                name="<?= htmlspecialchars($field['name']) ?>"
                placeholder="<?= htmlspecialchars($field['placeholder'] ?? '') ?>"
                <?= ($field['required'] ?? false) ? 'required' : '' ?>
                style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: inherit;"
            >
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
        <button type="submit" class="btn" style="width: 100%; cursor: pointer; border: none;">
            <?= htmlspecialchars($section['content']['button'] ?? 'Submit') ?>
        </button>
    </form>
    <?php
}

function renderCTA($section) {
    ?>
    <div class="cta-section" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 20px; border-radius: 12px; text-align: center;">
        <?php if (!empty($section['title'])): ?>
        <h2 style="font-size: 2.5rem; margin-bottom: 1rem;"><?= htmlspecialchars($section['title']) ?></h2>
        <?php endif; ?>
        
        <?php if (!empty($section['subtitle'])): ?>
        <p style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9;"><?= htmlspecialchars($section['subtitle']) ?></p>
        <?php endif; ?>
        
        <?php if (!empty($section['content']['button'])): ?>
        <a href="<?= htmlspecialchars($section['content']['buttonLink'] ?? '#') ?>" class="btn" style="background: white; color: #667eea;">
            <?= htmlspecialchars($section['content']['button']) ?>
        </a>
        <?php endif; ?>
    </div>
    <?php
}
?>
