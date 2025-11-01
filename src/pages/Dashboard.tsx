import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, User, BarChart, Shield, Trash2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { calculateProfileCompletion, getProfileCompletionTips } from "@/utils/profileCompletion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_role: "client" | "freelancer";
  avatar_url?: string;
  verification_status?: string;
  bio?: string;
  location?: string;
  hourly_rate?: number;
  experience_years?: number;
  portfolio_url?: string;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
}

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface Bid {
  id: string;
  amount: number;
  status: string;
  projects: {
    id: string;
    title: string;
  };
}

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [completionTips, setCompletionTips] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Calculate profile completion
      const completion = calculateProfileCompletion(data);
      setProfileCompletion(completion);
      setCompletionTips(getProfileCompletionTips(data));

      // Fetch projects or bids based on user role
      if (data.user_role === "client") {
        await fetchProjects(userId);
      } else {
        await fetchBids(userId);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (userId: string) => {
    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, title, status, created_at")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    
    setProjects(projectsData || []);
  };

  const fetchBids = async (userId: string) => {
    const { data: bidsData } = await supabase
      .from("bids")
      .select("id, amount, status, projects(title, id)")
      .eq("freelancer_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    
    setBids(bidsData || []);
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      if (session?.user?.id) {
        fetchProjects(session.user.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete project",
      });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Briefcase className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/50">
      <Navbar />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-24 sm:pt-32">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-10 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-2">
            <div className="p-3 sm:p-4 bg-gradient-hero rounded-2xl shadow-glow animate-float">
              <User className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome back, {profile?.full_name}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {profile?.user_role === "client" ? "Ready to post your next project?" : "Let's find your next opportunity"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">
          <Card 
            className="group p-4 sm:p-6 hover:shadow-glow transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 hover:scale-105 bg-gradient-card animate-fade-in"
            onClick={() => navigate(profile?.user_role === "client" ? "/post-project" : "/browse-projects")}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-gradient-to-br from-primary-light to-primary/20 rounded-xl group-hover:shadow-soft transition-all duration-300">
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {profile?.user_role === "client" ? "Post a Project" : "Browse Projects"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Get started now</p>
              </div>
            </div>
          </Card>

          <Card 
            className="group p-4 sm:p-6 hover:shadow-glow transition-all duration-300 cursor-pointer border-2 hover:border-secondary/50 hover:scale-105 bg-gradient-card animate-fade-in"
            onClick={() => navigate("/my-profile")}
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-gradient-to-br from-secondary-light to-secondary/20 rounded-xl group-hover:shadow-soft transition-all duration-300">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">My Profile</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Update your details</p>
              </div>
            </div>
          </Card>

          <Card 
            className="group p-4 sm:p-6 hover:shadow-glow transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 hover:scale-105 bg-gradient-card animate-fade-in sm:col-span-2 lg:col-span-1"
            onClick={() => navigate("/analytics")}
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-gradient-to-br from-primary-light to-primary/20 rounded-xl group-hover:shadow-soft transition-all duration-300">
                <BarChart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">Analytics</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">View your stats</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 shadow-soft border-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-hero rounded-lg">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold">
                  {profile?.user_role === "client" ? "Active Projects" : "My Proposals"}
                </h2>
              </div>
              
              {profile?.user_role === "client" ? (
                projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map((project, index) => (
                      <div 
                        key={project.id}
                        className="group p-4 border-2 rounded-xl hover:border-primary/50 transition-all duration-300 cursor-pointer bg-gradient-card hover:shadow-soft animate-fade-in"
                        onClick={() => navigate(`/project/${project.id}`)}
                        style={{ animationDelay: `${0.1 * index}s` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors truncate">
                              {project.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Status: <span className="capitalize font-medium">{project.status.replace('_', ' ')}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                              project.status === 'open' 
                                ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                                : project.status === 'in_progress' 
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' 
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}>
                              {project.status.replace('_', ' ')}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => handleDeleteProject(project.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16">
                    <div className="inline-block p-4 bg-gradient-hero rounded-full mb-4 animate-float">
                      <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <p className="text-base sm:text-lg font-medium text-foreground mb-2">No projects yet</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">Post your first project to get started</p>
                    <Button 
                      onClick={() => navigate("/post-project")}
                      className="bg-gradient-hero hover:opacity-90 transition-opacity"
                    >
                      Post a Project
                    </Button>
                  </div>
                )
              ) : (
                bids.length > 0 ? (
                  <div className="space-y-3">
                    {bids.map((bid, index) => (
                      <div 
                        key={bid.id}
                        className="group p-4 border-2 rounded-xl hover:border-primary/50 transition-all duration-300 cursor-pointer bg-gradient-card hover:shadow-soft animate-fade-in"
                        onClick={() => navigate(`/project/${bid.projects.id}`)}
                        style={{ animationDelay: `${0.1 * index}s` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors truncate">
                              {bid.projects.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Bid Amount: <span className="font-semibold text-primary">₹{bid.amount}</span>
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap self-start ${
                            bid.status === 'accepted' 
                              ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                              : bid.status === 'pending' 
                              ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' 
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {bid.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16">
                    <div className="inline-block p-4 bg-gradient-hero rounded-full mb-4 animate-float">
                      <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <p className="text-base sm:text-lg font-medium text-foreground mb-2">No proposals yet</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">Start browsing projects and submit proposals</p>
                    <Button 
                      onClick={() => navigate("/browse-projects")}
                      className="bg-gradient-hero hover:opacity-90 transition-opacity"
                    >
                      Browse Projects
                    </Button>
                  </div>
                )
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6 shadow-soft border-2 overflow-hidden relative animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-hero opacity-10 rounded-full blur-3xl"></div>
              <h3 className="font-bold text-base sm:text-lg mb-4 relative z-10">Profile Completion</h3>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-primary font-bold text-base sm:text-lg">{profileCompletion}%</span>
                </div>
                <div className="h-3 sm:h-4 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-hero rounded-full transition-all duration-700 shadow-glow relative overflow-hidden" 
                    style={{ width: `${profileCompletion}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                {completionTips.length > 0 && (
                  <div className="mt-4 space-y-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                      To improve:
                    </p>
                    {completionTips.slice(0, 3).map((tip, index) => (
                      <p key={index} className="text-xs text-muted-foreground pl-3">• {tip}</p>
                    ))}
                  </div>
                )}
                {profileCompletion === 100 && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="p-1 bg-green-500 rounded-full">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-xs text-green-600 font-semibold">
                      Your profile is complete!
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-gradient-hero text-white shadow-glow overflow-hidden relative animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg">Get Verified</h3>
                </div>
                {profile?.verification_status === "verified" ? (
                  <>
                    <p className="text-xs sm:text-sm text-white/90 mb-4 leading-relaxed">
                      ✓ You are verified and trusted!
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-white text-primary hover:bg-white/90 w-full font-semibold shadow-lg"
                      disabled
                    >
                      Verified ✓
                    </Button>
                  </>
                ) : profile?.verification_status === "pending" ? (
                  <>
                    <p className="text-xs sm:text-sm text-white/90 mb-4 leading-relaxed">
                      Your verification is under review. We'll notify you soon!
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-white text-primary hover:bg-white/90 w-full font-semibold shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigate("/verification")}
                    >
                      View Status
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm text-white/90 mb-4 leading-relaxed">
                      Boost your credibility and win more projects with verified status
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-white text-primary hover:bg-white/90 w-full font-semibold shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigate("/verification")}
                    >
                      Start Verification →
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}