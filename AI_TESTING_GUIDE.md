# AI Agents Module - Testing Guide

## Quick Test URLs

Open these URLs in your browser to test each page:

1. **Agent Studio**: http://localhost:5173/ai/agent-studio
2. **Voice AI**: http://localhost:5173/ai/voice-ai
3. **Conversation AI**: http://localhost:5173/ai/conversation-ai
4. **Knowledge Base**: http://localhost:5173/ai/knowledge-base
5. **Agent Templates**: http://localhost:5173/ai/agent-templates
6. **Content AI**: http://localhost:5173/ai/content-ai

## What to Check

### 1. Page Loading
- [ ] All 6 pages load without errors
- [ ] No console errors in browser DevTools
- [ ] Breadcrumbs display correctly
- [ ] Page headers show with icons

### 2. Sidebar Navigation
- [ ] "AI Features" section appears in sidebar
- [ ] All 6 menu items are visible:
  - Agent Studio
  - Voice AI
  - Conversation AI
  - Knowledge Base
  - Agent Templates
  - Content AI
- [ ] Clicking each item navigates correctly
- [ ] Active state highlights current page

### 3. Agent Studio Page
- [ ] Shows 4 agent type cards (Voice, Chat, Workflow, Hybrid)
- [ ] Stats cards display (Total Agents, Active Agents, etc.)
- [ ] "Create New Agent" button visible
- [ ] Cards have hover effects
- [ ] "Getting Started" section displays

### 4. Voice AI Page
- [ ] Page header displays correctly
- [ ] "Create Voice Agent" button visible
- [ ] Dashboard and Agent List tabs work
- [ ] Empty state shows if no agents
- [ ] If agents exist, they display in grid

### 5. Conversation AI Page
- [ ] Page header displays correctly
- [ ] Bot list or dashboard shows
- [ ] "Create Bot" button opens wizard
- [ ] Wizard has 3 bot types (Guided, Prompt, Flow)
- [ ] Selecting a type works
- [ ] Config page opens when editing a bot

### 6. Knowledge Base Page
- [ ] Page header displays correctly
- [ ] "Add Knowledge Source" button visible
- [ ] Stats cards display
- [ ] Knowledge bases table shows
- [ ] Dialog opens when clicking "Add Knowledge Source"
- [ ] Tabs work (Documents, Website, Custom Text)

### 7. Agent Templates Page
- [ ] Page header displays correctly
- [ ] Marketplace layout with sidebar filters
- [ ] Template cards display in grid
- [ ] Clicking a template opens details dialog
- [ ] Search and sort controls visible
- [ ] Filter sidebar has all sections

### 8. Content AI Page
- [ ] Page header displays correctly
- [ ] Text and Image tabs work
- [ ] Stats cards display
- [ ] Category filters visible
- [ ] Empty state shows for content table
- [ ] Image tab shows generation interface

## Common Issues & Solutions

### Issue: Page shows 404 Not Found
**Solution**: Routes may not be properly added. Check App.tsx lines 659-664.

### Issue: Sidebar doesn't show AI Features
**Solution**: Check features.ts has the AI features and 'ai' group type.

### Issue: TypeScript errors in console
**Solution**: Check all imports are correct and components exist.

### Issue: Components not found
**Solution**: Verify all files exist in `src/pages/ai/` directory.

### Issue: Wizard doesn't open
**Solution**: Check CreateBotWizard uses `onOpenChange` prop, not `onClose`.

### Issue: Data doesn't load
**Solution**: Check useAiAgents hook is properly configured.

## Browser Console Checks

Open DevTools (F12) and check:

1. **Console Tab**: Should have no red errors
2. **Network Tab**: Check API calls are being made
3. **React DevTools**: Verify components are rendering

## Expected Behavior

### Navigation Flow
1. Click "Agent Studio" → Shows agent type selection
2. Click "Voice AI" → Shows voice agents list
3. Click "Conversation AI" → Shows bot management
4. Click "Knowledge Base" → Shows knowledge sources
5. Click "Agent Templates" → Shows marketplace
6. Click "Content AI" → Shows content generation

### Data Flow
1. Pages load → Call useAiAgents hook
2. Hook fetches data → Updates UI
3. User creates agent → Calls mutation
4. Mutation succeeds → Shows toast notification
5. Data refreshes → UI updates

## Performance Checks

- [ ] Pages load in < 1 second
- [ ] No layout shifts on load
- [ ] Smooth animations and transitions
- [ ] Responsive on mobile/tablet
- [ ] No memory leaks (check DevTools Memory tab)

## Accessibility Checks

- [ ] All buttons have labels
- [ ] Icons have aria-labels
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast sufficient

## Final Verification

If all checks pass:
✅ Implementation is complete and working
✅ Ready for production deployment
✅ Can proceed with backend integration

If issues found:
1. Check browser console for errors
2. Verify all files are in correct locations
3. Check routes in App.tsx
4. Verify features in features.ts
5. Review component imports

## Success Criteria

- ✅ All 6 pages accessible via URL
- ✅ All 6 pages in sidebar navigation
- ✅ No console errors
- ✅ All UI elements render correctly
- ✅ Navigation works smoothly
- ✅ Data integration functional
- ✅ Consistent design across all pages

**If all criteria met: IMPLEMENTATION SUCCESSFUL** 🎉
