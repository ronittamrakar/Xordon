# Proposal Builder: Classic & Visual Editor Compatibility

## ⚠️ IMPORTANT DISTINCTION

**Proposals ≠ Websites**

While we're using the `VisualWebsiteBuilder` component to provide a visual drag-and-drop editing experience for proposals, **proposals and websites are completely separate entities**:

- **Proposals**: Business documents sent to clients for approval (stored in `proposals` table)
- **Websites**: Public-facing web pages and sites (stored in `websites` table)

The visual builder component is simply being **reused as a UI tool** to provide a better editing experience for proposals. The data structures, storage, and purposes remain distinct.

## Overview
Implemented bidirectional data conversion between the Classic Editor and Visual Editor in the Proposal Builder, ensuring that proposals maintain all their content, sections, styling, and pricing information when switching between editing modes.

## Key Changes

### 1. Data Conversion Functions

#### `convertProposalToVisual()`
Converts Classic Editor format to Visual Editor format:
- **Main Content** → Hero Section with HTML content
- **Proposal Sections** → Visual Content Sections
- **Pricing Items** → Visual Pricing Section
- **Styling** → Visual Settings (colors, fonts, etc.)

#### `convertVisualToProposal()`
Converts Visual Editor format back to Classic Editor format:
- **Hero Section** → Main Content
- **Visual Content Sections** → Proposal Sections
- **Visual Pricing Section** → Pricing Items
- **Visual Settings** → Proposal Styling

### 2. Mode Switching Handler

#### `handleModeSwitch()`
Manages the transition between editors:
- When switching **Classic → Visual**: Converts proposal data to visual sections
- When switching **Visual → Classic**: Converts visual sections back to proposal data
- Displays toast notification confirming the switch
- Preserves all data during the transition

### 3. Enhanced Save Functionality

#### Updated `handleSave()`
Now saves data in both formats simultaneously:
- **Visual Mode**: Converts visual data to classic format, then stores both
- **Classic Mode**: Converts classic data to visual format, then stores both
- Ensures proposals can be opened in either editor regardless of which was used to save

### 4. Data Structure Mapping

| Classic Editor | Visual Editor |
|---------------|---------------|
| `proposal.content` (HTML) | Hero section with `content.html` |
| `proposal.sections[]` | Visual sections with `type: 'content'` |
| `proposal.items[]` | Pricing section with `content.items` |
| `proposal.styling` | `visualSettings` (accentColor, fontFamily) |

## Benefits

1. **Seamless Switching**: Users can switch between editors without losing any data
2. **Backward Compatibility**: Existing proposals work in both editors
3. **Forward Compatibility**: New proposals created in either editor work in both
4. **Data Integrity**: All content, sections, pricing, and styling are preserved
5. **Flexible Workflow**: Users can use whichever editor suits their needs at any time

## Usage

1. **Create a proposal** in Classic Editor with sections and pricing
2. **Click "Visual Builder"** button - all content appears in visual editor
3. **Edit in Visual Editor** - add/modify sections visually
4. **Click "Classic Editor"** button - all changes appear in classic editor
5. **Save** - data is stored in both formats for future compatibility

## Technical Details

- Conversion functions use `useCallback` for performance optimization
- Data is stored in `proposal.settings.visual_builder_data` for persistence
- Both formats are maintained in the database for maximum flexibility
- Toast notifications provide user feedback during mode switches
