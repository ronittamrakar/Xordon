---
description: Competitor Citation Analysis and Bulk Listing Import Implementation
---

# Competitor Analysis & Bulk Listing Import

This workflow describes the implementation of the Competitor Citation Analysis features and the Bulk Listing Import functionality in the Business Listings page.

## 1. Backend Implementation

### `ListingsController.php`

-   **`checkCompetitorCitations`**:
    -   Endpoint: `POST /seo/competitors/citations/check`
    -   Functionality: Simulates finding competitor citations across various directories. Returns status (listed/potential), authority, and listing URLs.
    -   Currently uses simulated data for demo purposes.

-   **`searchCompetitorsByKeyword`**:
    -   Endpoint: `POST /seo/competitors/search`
    -   Functionality: Simulates searching for top-ranking businesses by keyword and location.
    -   Returns a list of competitors with ratings, reviews, and website info.
    -   Currently uses simulated data.

### Routes (`index.php`)

-   Added routes for the above controller methods under `/seo/competitors/*`.

## 2. Frontend Implementation

### `listingsApi.ts`

-   Added `checkCompetitorCitations` method to call the citation check API.
-   Added `searchCompetitorsByKeyword` method to call the competitor search API.

### `ListingsEnhanced.tsx`

-   **Competitors Tab**:
    -   Added a new "Competitors" tab to the main tabs layout.
    -   **Direct Lookup**: Input for Competitor Name and URL to check citations.
    -   **Keyword Search**: Input for Keyword and Location to find top competitors.
    -   **Results Display**: Shows simulated competitors. Clicking "Analyze Citations" runs the citation check.
    -   **Citation Table**: detailed table of competitor citations with "Your Listing" status check.
    -   **Export CSV**: Allows exporting the analysis results.

-   **Bulk Listings Import**:
    -   **Selection Checkboxes**: Added checkboxes to the citation results table.
    -   **"Add Selected" Button**: Allows bulk selecting "potential opportunities".
    -   **Logic**:
        -   Filters out platforms where the user is already listed.
        -   Matches competitor platforms to the internal `directories` catalog.
        -   Pre-fills the "Add Listing" wizard with the selected platforms.
        -   Opens the Wizard at Step 4 (Platform Selection) for review.

-   **Wizard Refinements**:
    -   Fixed Steps navigation.
    -   Cleaned up Step 4 (Platforms) UI and logic.
    -   Ensured bulk submission works with the pre-filled selections.

## 3. Usage Guide

1.  Navigate to **Business Listings** -> **Competitors** tab.
2.  Choose **Find Top Ranking** mode.
3.  Enter a keyword (e.g., "Plumber") and location (e.g., "New York").
4.  Click **Find Top Ranking Businesses**.
5.  Select a competitor from the results and click **Analyze Citations**.
6.  Review the "Competitor Citation Results".
7.  Check the boxes for the platforms you want to be listed on (where you are currently "Not Listed").
8.  Click **Add Selected**.
9.  The "Add Business Listings" wizard will open with those platforms selected.
10. Review and click **Next** -> **Submit**.

