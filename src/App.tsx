import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SendingAccounts from "./pages/SendingAccounts";
import Campaigns from "./pages/Campaigns";
import CampaignWizard from "./pages/CampaignWizard";
import Analytics from "./pages/Analytics";
import Sequences from "./pages/Sequences";
import Recipients from "./pages/Recipients";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/new" element={<CampaignWizard />} />
          <Route path="/campaigns/edit/:id" element={<CampaignWizard />} />
          <Route path="/sequences" element={<Sequences />} />
          <Route path="/recipients" element={<Recipients />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/sending-accounts" element={<SendingAccounts />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
