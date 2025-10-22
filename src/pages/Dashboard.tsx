import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, User, BarChart, Shield } from "lucide-react";
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
        const { data: projectsData } = await supabase
          .from("projects")
          .select("id, title, status, created_at")
          .eq("client_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        setProjects(projectsData || []);
      } else {
        const { data: bidsData } = await supabase
          .from("bids")
          .select("id, amount, status, projects(title)")
          .eq("freelancer_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        
        setBids(bidsData || []);
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
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pt-32">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-hero rounded-full">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}!</h1>
              <p className="text-muted-foreground">
                {profile?.user_role === "client" ? "Ready to post your next project?" : "Let's find your next opportunity"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card 
            className="p-6 hover:shadow-glow transition-shadow cursor-pointer"
            onClick={() => navigate(profile?.user_role === "client" ? "/post-project" : "/browse-projects")}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-lg">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">
                  {profile?.user_role === "client" ? "Post a Project" : "Browse Projects"}
                </h3>
                <p className="text-sm text-muted-foreground">Get started now</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 hover:shadow-glow transition-shadow cursor-pointer"
            onClick={() => navigate("/my-profile")}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-light rounded-lg">
                <User className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">My Profile</h3>
                <p className="text-sm text-muted-foreground">Update your details</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 hover:shadow-glow transition-shadow cursor-pointer"
            onClick={() => navigate("/analytics")}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-lg">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">View your stats</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {profile?.user_role === "client" ? "Active Projects" : "My Proposals"}
              </h2>
              
              {profile?.user_role === "client" ? (
                projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div 
                        key={project.id}
                        className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                        onClick={() => navigate(`/browse-projects`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{project.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Status: <span className="capitalize">{project.status}</span>
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'open' ? 'bg-green-100 text-green-700' :
                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No projects yet</p>
                    <p className="text-sm mt-2">Post your first project to get started</p>
                  </div>
                )
              ) : (
                bids.length > 0 ? (
                  <div className="space-y-3">
                    {bids.map((bid) => (
                      <div 
                        key={bid.id}
                        className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                        onClick={() => navigate(`/browse-projects`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{bid.projects.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Bid Amount: ${bid.amount}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            bid.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {bid.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No proposals yet</p>
                    <p className="text-sm mt-2">Start browsing projects and submit proposals</p>
                  </div>
                )
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Profile Completion</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-primary font-medium">{profileCompletion}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-hero rounded-full transition-all duration-500" 
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {completionTips.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">To improve:</p>
                    {completionTips.slice(0, 3).map((tip, index) => (
                      <p key={index} className="text-xs text-muted-foreground">• {tip}</p>
                    ))}
                  </div>
                )}
                {profileCompletion === 100 && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    ✓ Your profile is complete!
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-hero text-white">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5" />
                <h3 className="font-semibold">Get Verified</h3>
              </div>
              {profile?.verification_status === "verified" ? (
                <>
                  <p className="text-sm text-white/90 mb-4">
                    ✓ You are verified!
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-white text-primary hover:bg-white/90 w-full"
                    disabled
                  >
                    Verified
                  </Button>
                </>
              ) : profile?.verification_status === "pending" ? (
                <>
                  <p className="text-sm text-white/90 mb-4">
                    Your verification is pending review
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-white text-primary hover:bg-white/90 w-full"
                    onClick={() => navigate("/verification")}
                  >
                    View Status
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/90 mb-4">
                    Boost your credibility and win more projects
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-white text-primary hover:bg-white/90 w-full"
                    onClick={() => navigate("/verification")}
                  >
                    Start Verification
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}