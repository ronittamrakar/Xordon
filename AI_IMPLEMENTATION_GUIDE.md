# AI Agents Module - Complete Implementation Guide

## ✅ COMPLETED

### Pages Created
- ✅ `src/pages/ai/AgentStudio.tsx` - Central hub for creating AI agents
- ✅ `src/pages/ai/VoiceAIPage.tsx` - Voice AI management
- ✅ `src/pages/ai/ConversationAIPage.tsx` - Conversation AI management
- ✅ `src/pages/ai/KnowledgeBase.tsx` - Knowledge base management
- ✅ `src/pages/ai/AgentTemplatesPage.tsx` - Agent marketplace
- ✅ `src/pages/ai/ContentAIPage.tsx` - Content generation

### Components Updated
- ✅ `src/pages/ai/components/VoiceAi.tsx` - Fixed props interface
- ✅ `src/pages/ai/components/ConversationAi.tsx` - Already functional
- ✅ `src/pages/ai/components/CreateBotWizard.tsx` - Already functional
- ✅ `src/pages/ai/components/AgentConfig.tsx` - Already functional
- ✅ `src/pages/ai/components/AgentTemplates.tsx` - Marketplace with filters
- ✅ `src/pages/ai/components/ContentAi.tsx` - Text/Image generation

### App.tsx Updates
- ✅ Added lazy imports for all AI pages (lines 138-143)

## ⚠️ TODO - CRITICAL FOR FUNCTIONALITY

### 1. Add Routes in App.tsx

Find the `<Routes>` section in `src/App.tsx` (likely around line 300-900) and add these routes inside the `<AuthenticatedLayout>` section:

```tsx
{/* AI Module Routes */}
<Route path="/ai/agent-studio" element={<AgentStudio />} />
<Route path="/ai/voice-ai" element={<VoiceAIPage />} />
<Route path="/ai/conversation-ai" element={<ConversationAIPage />} />
<Route path="/ai/knowledge-base" element={<KnowledgeBase />} />
<Route path="/ai/agent-templates" element={<AgentTemplatesPage />} />
<Route path="/ai/content-ai" element={<ContentAIPage />} />
```

### 2. Update features.ts

#### Step 2a: Add 'ai' to FeatureGroup type

In `src/config/features.ts`, find the `FeatureGroup` type (around line 93-110) and add 'ai':

```tsx
export type FeatureGroup =
  | 'dashboard'
  | 'email'
  | 'sms'
  | 'calls'
  | 'engagement'
  | 'automation'
  | 'crm'
  | 'contacts'
  | 'operations'
  | 'helpdesk'
  | 'growth'
  | 'hr'
  | 'sales_enablement'
  | 'sales'
  | 'reputation'
  | 'finance'
  | 'admin'
  | 'ai';  // ADD THIS LINE
```

#### Step 2b: Add AI features to FEATURES array

In `src/config/features.ts`, find the `FEATURES` array (around line 130) and add these entries. You'll need to import the icons first:

```tsx
// At the top with other imports, add:
import { Layout, Mic, MessageSquare, BookOpen, Store, Sparkles } from 'lucide-react';
```

Then add these features to the FEATURES array (add them in a logical place, perhaps after the 'admin' features):

```tsx
  // ============================================
  // AI FEATURES
  // ============================================
  {
    id: 'ai_agent_studio',
    path: '/ai/agent-studio',
    label: 'Agent Studio',
    icon: Layout,
    status: 'core',
    group: 'ai',
    description: 'Build and deploy AI agents for your business',
  },
  {
    id: 'ai_voice_ai',
    path: '/ai/voice-ai',
    label: 'Voice AI',
    icon: Mic,
    status: 'core',
    group: 'ai',
    description: 'Voice agents and phone automation',
  },
  {
    id: 'ai_conversation_ai',
    path: '/ai/conversation-ai',
    label: 'Conversation AI',
    icon: MessageSquare,
    status: 'core',
    group: 'ai',
    description: 'Chat bots and messaging automation',
  },
  {
    id: 'ai_knowledge_base',
    path: '/ai/knowledge-base',
    label: 'Knowledge Base',
    icon: BookOpen,
    status: 'core',
    group: 'ai',
    description: 'AI training data and knowledge sources',
  },
  {
    id: 'ai_agent_templates',
    path: '/ai/agent-templates',
    label: 'Agent Templates',
    icon: Store,
    status: 'core',
    group: 'ai',
    description: 'Pre-built AI agent marketplace',
  },
  {
    id: 'ai_content_ai',
    path: '/ai/content-ai',
    label: 'Content AI',
    icon: Sparkles,
    status: 'core',
    group: 'ai',
    description: 'AI content generation and management',
  },
```

### 3. Update Sidebar Navigation (AppSidebar.tsx)

The sidebar should automatically pick up the AI features from the features.ts file. However, you may want to add a custom "AI Features" section header.

Find the sidebar rendering section in `src/components/layout/AppSidebar.tsx` and add:

```tsx
{/* AI Features Section */}
<SidebarGroup>
  <SidebarGroupLabel>AI Features</SidebarGroupLabel>
  <SidebarGroupContent>
    <SidebarMenu>
      {/* The sidebar will automatically render items from the 'ai' group */}
      {/* based on the FEATURES array in features.ts */}
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>
```

### 4. Remove or Update Old AI Agents Page

The old `src/pages/ai/Agents.tsx` file with tabs can either be:
- **Option A**: Deleted (recommended) since we now have separate pages
- **Option B**: Kept as a legacy route but hidden from navigation

If keeping it, make sure the route `/ai/agents` still works or redirect it to `/ai/agent-studio`.

## Testing Checklist

After completing the above steps, test each page:

- [ ] Navigate to `/ai/agent-studio` - Should show agent type selection
- [ ] Navigate to `/ai/voice-ai` - Should show voice agents list
- [ ] Navigate to `/ai/conversation-ai` - Should show conversation bots
- [ ] Navigate to `/ai/knowledge-base` - Should show knowledge sources
- [ ] Navigate to `/ai/agent-templates` - Should show marketplace
- [ ] Navigate to `/ai/content-ai` - Should show content generation
- [ ] Check sidebar - Should show all AI menu items under "AI Features"
- [ ] Test navigation between pages - Links should work
- [ ] Test creating a bot in Conversation AI - Wizard should open
- [ ] Test editing a bot - Config page should open

## UI Consistency Verification

All pages should have:
- ✅ Consistent header with icon, title, and description
- ✅ Rounded corners (rounded-[32px] for cards)
- ✅ Font weights (font-black for titles)
- ✅ Hover effects (shadow-xl)
- ✅ Empty states with helpful messaging
- ✅ Breadcrumb navigation
- ✅ Responsive design

## Data Flow Verification

- ✅ All pages use `useAiAgents` hook for data fetching
- ✅ CRUD operations use proper mutations
- ✅ Toast notifications on success/error
- ✅ Loading states handled
- ✅ Error states handled

## Known Issues & Solutions

### Issue: Routes not working
**Solution**: Make sure you added the routes in App.tsx inside the `<AuthenticatedLayout>` wrapper

### Issue: Sidebar items not showing
**Solution**: Verify you added the features to features.ts and added 'ai' to the FeatureGroup type

### Issue: TypeScript errors
**Solution**: Run `npm run type-check` to see specific errors. Most likely missing imports.

### Issue: Components not found
**Solution**: Verify all component files exist in `src/pages/ai/` and `src/pages/ai/components/`

## File Structure

```
src/pages/ai/
├── Agents.tsx (old tabbed page - can be removed)
├── AgentStudio.tsx ✅
├── VoiceAIPage.tsx ✅
├── ConversationAIPage.tsx ✅
├── KnowledgeBase.tsx ✅
├── AgentTemplatesPage.tsx ✅
├── ContentAIPage.tsx ✅
└── components/
    ├── GettingStarted.tsx
    ├── VoiceAi.tsx ✅ (updated)
    ├── AgentTemplates.tsx ✅
    ├── ConversationAi.tsx ✅
    ├── CreateBotWizard.tsx ✅
    ├── AgentConfig.tsx ✅
    └── ContentAi.tsx ✅
```

## Next Steps After Implementation

1. **Backend Integration**: Connect to actual AI agent APIs
2. **Knowledge Base Storage**: Implement document upload and processing
3. **Template Installation**: Add template installation workflow
4. **Content Generation**: Integrate with AI content generation APIs
5. **Analytics**: Add usage tracking and analytics
6. **Permissions**: Add RBAC for AI features
7. **Billing**: Add usage-based billing for AI features

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all imports are correct
3. Ensure all files are in the correct locations
4. Check that routes are properly nested in App.tsx
5. Verify features.ts has the correct structure
