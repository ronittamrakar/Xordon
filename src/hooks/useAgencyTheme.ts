/**
 * useAgencyTheme hook
 * Resolves and applies agency branding (colors, logo) based on the current domain or agency context
 */

import { useEffect, useState } from 'react';
import type { AgencyBranding } from '@/types/multiTenant';

interface AgencyTheme {
    loading: boolean;
    branding: AgencyBranding | null;
    agencyName: string | null;
    agencyId: number | null;
}

const DEFAULT_BRANDING: AgencyBranding = {
    agency_id: 0,
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    accent_color: '#10B981',
    company_name: 'Xordon',
};

export function useAgencyTheme(): AgencyTheme {
    const [state, setState] = useState<AgencyTheme>({
        loading: true,
        branding: null,
        agencyName: null,
        agencyId: null,
    });

    useEffect(() => {
        async function resolveTheme() {
            try {
                const host = window.location.hostname;

                // Skip for localhost / dev environments
                if (host === 'localhost' || host === '127.0.0.1' || host.includes('.local')) {
                    setState({
                        loading: false,
                        branding: DEFAULT_BRANDING,
                        agencyName: null,
                        agencyId: null,
                    });
                    return;
                }

                // Check if we have cached theme for this domain
                const cacheKey = `agency_theme_${host}`;
                const cachedTheme = sessionStorage.getItem(cacheKey);
                if (cachedTheme) {
                    try {
                        const parsed = JSON.parse(cachedTheme);
                        if (parsed && parsed.branding) {
                            setState({
                                loading: false,
                                branding: parsed.branding,
                                agencyName: parsed.agency_name,
                                agencyId: parsed.agency_id,
                            });
                            applyThemeColors(parsed.branding);
                            return;
                        }
                    } catch {
                        // Invalid cache, continue with fetch
                    }
                }

                // Try to resolve theme from domain
                const res = await fetch(`/api/mt/theme/resolve?host=${encodeURIComponent(host)}`);
                const data = await res.json();

                if (data && data.branding) {
                    // Cache the result
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));

                    setState({
                        loading: false,
                        branding: data.branding,
                        agencyName: data.agency_name,
                        agencyId: data.agency_id,
                    });

                    // Store the agency context for API calls
                    if (data.agency_id) {
                        localStorage.setItem('current_agency_id', String(data.agency_id));
                    }

                    // Apply CSS custom properties for theming
                    applyThemeColors(data.branding);
                } else {
                    setState({
                        loading: false,
                        branding: DEFAULT_BRANDING,
                        agencyName: null,
                        agencyId: null,
                    });
                }
            } catch (err) {
                console.error('Failed to resolve agency theme:', err);
                setState({
                    loading: false,
                    branding: DEFAULT_BRANDING,
                    agencyName: null,
                    agencyId: null,
                });
            }
        }

        resolveTheme();
    }, []);

    return state;
}

/**
 * Apply theme colors as CSS custom properties on the document root
 */
function applyThemeColors(branding: AgencyBranding) {
    const root = document.documentElement;

    if (branding.primary_color) {
        root.style.setProperty('--agency-primary', branding.primary_color);
        root.style.setProperty('--primary', hexToHsl(branding.primary_color));
    }

    if (branding.secondary_color) {
        root.style.setProperty('--agency-secondary', branding.secondary_color);
    }

    if (branding.accent_color) {
        root.style.setProperty('--agency-accent', branding.accent_color);
        root.style.setProperty('--accent', hexToHsl(branding.accent_color));
    }

    // Update favicon if provided
    if (branding.favicon_url) {
        const existingFavicon = document.querySelector('link[rel="icon"]');
        if (existingFavicon) {
            existingFavicon.setAttribute('href', branding.favicon_url);
        } else {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = branding.favicon_url;
            document.head.appendChild(link);
        }
    }

    // Apply Font Family
    if (branding.font_family && branding.font_family !== 'Inter') {
        const fontName = branding.font_family;
        const fontId = `agency-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;

        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
            document.head.appendChild(link);
        }

        root.style.setProperty('--font-sans', `"${fontName}", sans-serif`);
        document.body.style.fontFamily = `"${fontName}", sans-serif`;
    } else {
        // Reset to default
        root.style.removeProperty('--font-sans');
        document.body.style.fontFamily = '';
    }

    // Update page title if company name provided
    if (branding.company_name && !document.title.includes(branding.company_name)) {
        document.title = `${branding.company_name} - ${document.title.replace(/^.* - /, '')}`;
    }

    // Inject custom CSS if provided
    if (branding.custom_css) {
        let styleEl = document.getElementById('agency-custom-css');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'agency-custom-css';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = branding.custom_css;
    }
}

/**
 * Convert hex color to HSL format for CSS variables
 */
function hexToHsl(hex: string): string {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default useAgencyTheme;
