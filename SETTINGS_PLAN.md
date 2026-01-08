# Master Implementation Plan: Settings Audit & Completion

## 1. Consolidate Outreach (Messaging Channels)
- [ ] Merge `OmniChannelIntegrations.tsx` into `ChannelSettings.tsx`.
    - [ ] Add Instagram DM connection & management.
    - [ ] Add Google My Business (GMB) connection & management.
    - [ ] Clean up redundant Messenger logic (if any).
- [ ] Update `UnifiedSettings.tsx` to use the enhanced `ChannelSettings`.

## 2. Branding & Appearance (Centralized)
- [ ] Create/Enhance `BrandingSettings.tsx` (or update `AgencySettings.tsx` logic).
- [ ] Add Typography settings (Font family presets).
- [ ] Ensure Logo/Favicon settings propagate to public pages.
- [ ] Add "Global CSS" injection settings (for white-labeling).

## 3. Security & Compliance (Enhanced)
- [ ] Update `SecuritySettings.tsx`.
- [ ] Add 2FA Enrollment/Enforcement settings.
- [ ] Add IP Whitelisting configuration.
- [ ] Add Session Timeout management.
- [ ] Add Audit Log export functionality (trigger).

## 4. Public Assets & SEO
- [ ] Create `PublicAssetsSettings.tsx`.
- [ ] Add Global Tracking Scripts (GTM, Meta Pixel, Custom Scripts).
- [ ] Add Global SEO Meta (Title template, OG Image, Twitter Card).
- [ ] Add Cookie Consent Global Config.

## 5. Intelligence (AI Guardrails)
- [ ] Update `AISettings.tsx`.
- [ ] Add Global Guardrails (Topic restriction, Response limits).
- [ ] Add Tone of Voice Presets (Professional, Friendly, etc.).

## 6. Helpdesk & Service
- [ ] Update `HelpdeskSettings.tsx`.
- [ ] Add Knowledge Base portal settings (Domain, Visibility, Branding).
- [ ] Add SLA Definition settings (Response/Resolution times).

## 7. Sales & Growth (Marketing Module)
- [ ] Add A/B Testing global defaults to `MarketingSettings`.
- [ ] Add UTM Mapping/Attribution settings to `CRMSettings`.

## 8. Verification & Testing
- [ ] Verify all new settings persist via API.
- [ ] Verify UI consistency across all new modules.
- [ ] Test navigation on `UnifiedSettings.tsx`.
