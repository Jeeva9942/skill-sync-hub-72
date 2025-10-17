import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import BrowseProjects from "./pages/BrowseProjects";
import FindFreelancers from "./pages/FindFreelancers";
import MyProfile from "./pages/MyProfile";
import PostProject from "./pages/PostProject";
import Messages from "./pages/Messages";
import Help from "./pages/Help";
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/browse-projects" element={<BrowseProjects />} />
          <Route path="/find-freelancers" element={<FindFreelancers />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/post-project" element={<PostProject />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/help" element={<Help />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
