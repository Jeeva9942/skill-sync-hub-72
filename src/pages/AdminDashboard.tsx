import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Users, FolderKanban, DollarSign, LogOut, ArrowLeft } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeBids: 0,
    totalRevenue: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setSession(session);

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin privileges",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      fetchStats();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch project count
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      // Fetch bid count
      const { count: bidCount } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: userCount || 0,
        totalProjects: projectCount || 0,
        activeBids: bidCount || 0,
        totalRevenue: 0, // Would calculate from completed projects
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-gradient-hero text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
              <p className="text-white/80">Manage your platform</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-light rounded-lg">
                <FolderKanban className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Bids</p>
                <p className="text-2xl font-bold">{stats.activeBids}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-light rounded-lg">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
            <div className="text-center py-12 text-muted-foreground">
              <p>User management coming soon</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
            <div className="text-center py-12 text-muted-foreground">
              <p>Project management coming soon</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Platform Activity</h2>
            <div className="text-center py-12 text-muted-foreground">
              <p>Activity logs coming soon</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Manage Categories
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Payment Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Email Templates
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Platform Fees
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}