# Contact Lists Folder Structure Migration

## Overview
This document describes the database changes needed to support folder/subfolder structure for contact lists.

## Required Database Changes

Run the following SQL commands to add folder structure support to the `contact_lists` table:

```sql
-- Add folder structure support to contact_lists table
ALTER TABLE contact_lists 
ADD COLUMN IF NOT EXISTS parent_id INT NULL AFTER workspace_id,
ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT FALSE AFTER is_default,
ADD COLUMN IF NOT EXISTS campaign_type ENUM('email', 'sms', 'call') NULL AFTER is_folder,
ADD COLUMN IF NOT EXISTS folder_path VARCHAR(500) NULL AFTER campaign_type,
ADD COLUMN IF NOT EXISTS child_count INT DEFAULT 0 AFTER contact_count;

-- Add index for parent_id for faster tree queries
ALTER TABLE contact_lists 
ADD INDEX IF NOT EXISTS idx_parent_id (parent_id);

-- Add index for campaign_type filtering
ALTER TABLE contact_lists 
ADD INDEX IF NOT EXISTS idx_campaign_type (campaign_type);

-- Add foreign key constraint for parent_id (self-referencing)
ALTER TABLE contact_lists 
ADD CONSTRAINT fk_contact_lists_parent 
FOREIGN KEY (parent_id) REFERENCES contact_lists(id) ON DELETE CASCADE;
```

## Column Descriptions

- **parent_id**: References the parent list/folder ID. NULL means root level.
- **is_folder**: Boolean flag indicating if this is a folder (true) or a list (false).
- **campaign_type**: Enum indicating the type of campaign this list is for (email, sms, call, or NULL for general).
- **folder_path**: Full path of the folder hierarchy (e.g., "Marketing/Email Campaigns/Q1").
- **child_count**: Cached count of child lists/folders for performance.

## Features Enabled

1. **Hierarchical Organization**: Lists can be organized in folders and subfolders
2. **Campaign Type Filtering**: Lists can be tagged with campaign types (email, sms, call)
3. **Bulk Operations**: Upload contacts to specific lists
4. **Cross-List Movement**: Move contacts between lists
5. **Tree and Grid Views**: View lists in hierarchical tree or flat grid layout
6. **Breadcrumb Navigation**: Navigate through folder hierarchy

## Integration with Contacts Page

The Lists page is fully integrated with the Contacts page:
- Contacts uploaded to lists are automatically added to the main Contacts database
- Contacts can be moved between lists from the Contacts page
- Lists can be filtered by campaign type to show only relevant lists
