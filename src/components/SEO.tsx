import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogType?: string;
    twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
    twitterSite?: string;
    twitterCreator?: string;
    jsonLd?: Record<string, any>;
    noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    ogType = 'website',
    twitterCard = 'summary_large_image',
    twitterSite,
    twitterCreator,
    jsonLd,
    noindex = true // Default to true for authenticated pages
}) => {
    const siteName = 'Xordon';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;

    return (
        <Helmet>
            {/* Basic Metadata */}
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Robots */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow" />
            )}

            {/* Open Graph */}
            <meta property="og:title" content={ogTitle || fullTitle} />
            {description && <meta property="og:description" content={ogDescription || description} />}
            <meta property="og:type" content={ogType} />
            {canonical && <meta property="og:url" content={canonical} />}
            {ogImage && <meta property="og:image" content={ogImage} />}
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:title" content={ogTitle || fullTitle} />
            {description && <meta name="twitter:description" content={ogDescription || description} />}
            {ogImage && <meta name="twitter:image" content={ogImage} />}
            {twitterSite && <meta name="twitter:site" content={twitterSite} />}
            {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}

            {/* JSON-LD */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
