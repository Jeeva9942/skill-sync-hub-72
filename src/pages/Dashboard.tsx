import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, User, LogOut, Settings, BarChart } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  user_role: "client" | "freelancer";
  avatar_url?: string;
}

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="p-2 bg-gradient-hero rounded-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Skill Sync
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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
          <Card className="p-6 hover:shadow-glow transition-shadow cursor-pointer">
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

          <Card className="p-6 hover:shadow-glow transition-shadow cursor-pointer">
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

          <Card className="p-6 hover:shadow-glow transition-shadow cursor-pointer">
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
              <div className="text-center py-12 text-muted-foreground">
                <p>No {profile?.user_role === "client" ? "projects" : "proposals"} yet</p>
                <p className="text-sm mt-2">
                  {profile?.user_role === "client"
                    ? "Post your first project to get started"
                    : "Start browsing projects and submit proposals"}
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Profile Completion</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-primary font-medium">40%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-hero w-[40%] rounded-full" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete your profile to increase visibility
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-hero text-white">
              <h3 className="font-semibold mb-2">Get Verified</h3>
              <p className="text-sm text-white/90 mb-4">
                Boost your credibility and win more projects
              </p>
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 w-full">
                Start Verification
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}