import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, ArrowLeft, TrendingUp, Users, DollarSign, Star } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface Profile {
  user_role: "client" | "freelancer";
}

interface Stats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBids: number;
  avgRating: number;
  totalEarnings: number;
}

export default function Analytics() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBids: 0,
    avgRating: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchData(session.user.id);
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

  const fetchData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_role")
        .eq("id", userId)
        .single();

      setProfile(profileData);

      if (profileData?.user_role === "client") {
        const { data: projects } = await supabase
          .from("projects")
          .select("*")
          .eq("client_id", userId);

        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("reviewee_id", userId);

        setStats({
          totalProjects: projects?.length || 0,
          activeProjects: projects?.filter(p => p.status === "in_progress").length || 0,
          completedProjects: projects?.filter(p => p.status === "completed").length || 0,
          totalBids: 0,
          avgRating: reviews?.length ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0,
          totalEarnings: 0,
        });
      } else {
        const { data: bids } = await supabase
          .from("bids")
          .select("*, projects!inner(*)")
          .eq("freelancer_id", userId);

        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("reviewee_id", userId);

        const acceptedBids = bids?.filter(b => b.status === "accepted") || [];
        const totalEarnings = acceptedBids.reduce((acc, b) => acc + Number(b.amount), 0);

        setStats({
          totalProjects: acceptedBids.length,
          activeProjects: acceptedBids.filter(b => b.projects.status === "in_progress").length,
          completedProjects: acceptedBids.filter(b => b.projects.status === "completed").length,
          totalBids: bids?.length || 0,
          avgRating: reviews?.length ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0,
          totalEarnings,
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
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
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {profile?.user_role === "client" ? "Total Projects" : "Total Bids"}
                </p>
                <p className="text-2xl font-bold">
                  {profile?.user_role === "client" ? stats.totalProjects : stats.totalBids}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-light rounded-lg">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Projects</p>
                <p className="text-2xl font-bold">{stats.completedProjects}</p>
              </div>
            </div>
          </Card>

          {profile?.user_role === "freelancer" && (
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary-light rounded-lg">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-lg">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)} ⭐</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
