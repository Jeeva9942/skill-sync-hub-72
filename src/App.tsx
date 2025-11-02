import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import BrowseProjects from "./pages/BrowseProjects";
import FindFreelancers from "./pages/FindFreelancers";
import MyProfile from "./pages/MyProfile";
import PostProject from "./pages/PostProject";
import Messages from "./pages/Messages";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import ProjectDetails from "./pages/ProjectDetails";
import FreelancerProfile from "./pages/FreelancerProfile";
import Verification from "./pages/Verification";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";

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
          <Route path="/browse-projects" element={<BrowseProjects />} />
          <Route path="/find-freelancers" element={<FindFreelancers />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/post-project" element={<PostProject />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/help" element={<Help />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/profile/:id" element={<FreelancerProfile />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<Pricing />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
