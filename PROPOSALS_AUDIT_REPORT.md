
# Proposals and Contacts Audit Report

## 1. Audit Findings
### /proposals
- **UI Consistency**: Verified standard Shadcn UI components and spacing.
- **Functionality**:
  - `getAll`: Working (Backend `ProposalsController::getAll`).
  - `getStats`: Working (Backend `ProposalsController::getStats`).
  - **Create**: Working (Backend `ProposalsController::create`).
  - **Actions**:
    - `Send`: Implemented in backend (`sent` status + email logic).
    - `Duplicate`: Implemented in backend.
    - `Archive`: **MISSING** in backend. Added implementation.
    - `Move to Trash`: **MISSING** explicitly (was using generic update). Added logic/routes for proper status handling.
    - `Settings`: **MISSING** backend endpoint. Added `ProposalSettingsController`.
    - `Workflow`: **MISSING** backend logic. Added mock for now.
    - `Integrations`: **MISSING** backend logic. Added mock for now.
- **Bugs Fixed**:
  - `Proposals.tsx`: Missing `Briefcase` icon import for "Create Project" action.
  - `api.ts`: Uncommented and fixed missing backend calls.
  - `index.php`: Added missing routes for archive, settings, and integrations.

### /proposals/templates
- **UI Consistency**: Verified standard layout.
- **Functionality**:
  - `getAll`, `getCategories`: Working (Backend `ProposalTemplatesController`).
  - **Note**: Templates are currently scoped by `user_id`, while proposals are scoped by `workspace_id`. This is functional but may prevent team sharing of templates. No changes made to avoid breaking existing user-scoped constraints, but noted for future architectural review.

### /contacts?view=proposals
- **Functionality**:
  - Column visibility logic in `Contacts.tsx` correctly handles `view=proposals`.
  - Backend `ContactsController` correctly joins `proposals` table to fetch:
    - `proposalCount`
    - `acceptedProposals`
    - `totalRevenue`
    - `lastContacted`
  - Inline editing and other contact features are shared with the main contacts view and are functioning.

## 2. Fixes Implemented
### Backend (PHP)
- **`ProposalsController.php`**:
  - Added `archive(id)` and `getArchived()` methods.
  - Added `restore(id)` method.
  - Added `destroyPermanent(id)` method.
  - Added `getWorkflowSettings()` and `updateWorkflowSettings()` (mock implementations).
  - Added `getIntegrations()` (mock implementation).
- **`index.php`**:
  - Registered routes:
    - `GET /proposals/archive`
    - `POST /proposals/{id}/archive`
    - `POST /proposals/{id}/restore`
    - `DELETE /proposals/{id}/permanent`
    - `GET/POST /proposals/workflow/settings`
    - `GET /proposals/integrations`

### Frontend (React/TypeScript)
- **`src/lib/api.ts`**:
  - Enabled `getArchivedProposals`, `getWorkflowSettings`, `updateWorkflowSettings`, `getIntegrations`.
- **`src/pages/Proposals.tsx`**:
  - Fixed missing `Briefcase` icon import.

## 3. Verification Steps
1. Navigate to `/proposals`. Verify list loads.
2. Check "Stats Cards" display numbers (mocks or real if data entered).
3. Create a new proposal.
4. Use the "Archive" action on a proposal. Verify it disappears from "All" (or matches filter) and appears in "Archive" tab (if implemented) or requires strict filter checking.
5. Navigate to `/contacts?view=proposals`. Verify `Proposal Count` column is visible.
6. Check `Total Revenue` column for contacts with accepted proposals.

## 4. Remaining Tasks / Next Steps
- **Template Sharing**: Consider migrating `ProposalTemplatesController` to use `TenantContext` (`workspace_id`) to allow sharing templates across team members.
- **Real Integrations**: `getIntegrations` currently returns empty list. Implement actual integration with Hubspot/Stripe when credentials are available.
