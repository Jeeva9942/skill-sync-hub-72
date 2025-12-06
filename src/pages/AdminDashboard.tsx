import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Briefcase, Users, FolderKanban, DollarSign, LogOut, ArrowLeft, 
  LifeBuoy, RefreshCw, Database, TrendingUp, CheckCircle, Clock,
  AlertCircle, Star, Activity, BarChart3, PieChart
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { UserManagement } from "@/components/admin/UserManagement";
import { ProjectsOverview } from "@/components/admin/ProjectsOverview";
import { SupportTickets } from "@/components/admin/SupportTickets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    activeBids: 0,
    totalTickets: 0,
    openProjects: 0,
    completedProjects: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    freelancers: 0,
    clients: 0,
    totalReviews: 0,
    avgRating: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
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
      fetchRecentActivity();
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

      // Fetch freelancer count
      const { count: freelancerCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_role", "freelancer");

      // Fetch client count
      const { count: clientCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_role", "client");

      // Fetch project counts
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      const { count: openProjectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const { count: completedProjectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Fetch bid count
      const { count: bidCount } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true });

      // Fetch support tickets counts
      const { count: ticketCount } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true });

      const { count: pendingTicketCount } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const { count: resolvedTicketCount } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved");

      // Fetch reviews and avg rating
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating");

      const totalReviews = reviews?.length || 0;
      const avgRating = totalReviews > 0 
        ? (reviews?.reduce((acc, r) => acc + r.rating, 0) || 0) / totalReviews 
        : 0;

      setStats({
        totalUsers: userCount || 0,
        totalProjects: projectCount || 0,
        activeBids: bidCount || 0,
        totalTickets: ticketCount || 0,
        openProjects: openProjectCount || 0,
        completedProjects: completedProjectCount || 0,
        pendingTickets: pendingTicketCount || 0,
        resolvedTickets: resolvedTicketCount || 0,
        freelancers: freelancerCount || 0,
        clients: clientCount || 0,
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent projects
      const { data: recentProjects } = await supabase
        .from("projects")
        .select("id, title, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent tickets
      const { data: recentTickets } = await supabase
        .from("support_tickets")
        .select("id, subject, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5);

      const activities = [
        ...(recentProjects?.map(p => ({
          type: 'project',
          title: p.title,
          status: p.status,
          created_at: p.created_at,
          icon: FolderKanban,
        })) || []),
        ...(recentTickets?.map(t => ({
          type: 'ticket',
          title: t.subject,
          status: t.status,
          created_at: t.created_at,
          icon: LifeBuoy,
        })) || []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, 8);

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const [syncing, setSyncing] = useState(false);

  const handleMongoSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-mongodb', {
        body: { action: 'sync-projects' }
      });

      if (error) throw error;

      toast({
        title: "MongoDB Sync Complete",
        description: `Successfully synced ${data?.result?.synced || 0} projects. Failed: ${data?.result?.failed || 0}`,
      });
    } catch (error: any) {
      console.error('MongoDB sync error:', error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message || "Failed to sync with MongoDB",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'in_progress': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'completed': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'resolved': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Briefcase className="h-12 w-12 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const projectCompletionRate = stats.totalProjects > 0 
    ? Math.round((stats.completedProjects / stats.totalProjects) * 100) 
    : 0;

  const ticketResolutionRate = stats.totalTickets > 0 
    ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-primary/90 to-secondary text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <Briefcase className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-white/70 text-sm">Skill Sync Platform Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" 
                onClick={handleMongoSync}
                disabled={syncing}
              >
                {syncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                {syncing ? "Syncing..." : "Sync DB"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" 
                onClick={() => fetchStats()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" 
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" 
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Primary Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {stats.freelancers} Freelancers
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                      {stats.clients} Clients
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Projects</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalProjects}</p>
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {stats.openProjects} Open
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      {stats.completedProjects} Completed
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <FolderKanban className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active Bids</p>
                  <p className="text-3xl font-bold mt-1">{stats.activeBids}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.totalProjects > 0 
                      ? `~${Math.round(stats.activeBids / stats.totalProjects)} bids/project` 
                      : "No projects yet"}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Briefcase className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Support Tickets</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalTickets}</p>
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      {stats.pendingTickets} Pending
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {stats.resolvedTickets} Resolved
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <LifeBuoy className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics and Activity */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Metrics */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Platform Performance
              </CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Project Completion Rate</span>
                    <span className="font-semibold">{projectCompletionRate}%</span>
                  </div>
                  <Progress value={projectCompletionRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats.completedProjects} of {stats.totalProjects} projects completed
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ticket Resolution Rate</span>
                    <span className="font-semibold">{ticketResolutionRate}%</span>
                  </div>
                  <Progress value={ticketResolutionRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stats.resolvedTickets} of {stats.totalTickets} tickets resolved
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Star className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.avgRating || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.totalReviews}</p>
                  <p className="text-xs text-muted-foreground">Total Reviews</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Activity className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.openProjects}</p>
                  <p className="text-xs text-muted-foreground">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest platform updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={`p-2 rounded-lg ${activity.type === 'project' ? 'bg-primary/10' : 'bg-orange-500/10'}`}>
                        <activity.icon className={`h-4 w-4 ${activity.type === 'project' ? 'text-primary' : 'text-orange-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(activity.status)}`}>
                            {activity.status?.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-green-500/5 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-lg font-bold text-green-700">{stats.completedProjects}</p>
                <p className="text-xs text-green-600">Completed Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/5 border-yellow-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-lg font-bold text-yellow-700">{stats.pendingTickets}</p>
                <p className="text-xs text-yellow-600">Pending Tickets</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-blue-700">{stats.freelancers}</p>
                <p className="text-xs text-blue-600">Active Freelancers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/5 border-purple-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-lg font-bold text-purple-700">{stats.clients}</p>
                <p className="text-xs text-purple-600">Active Clients</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users ({stats.totalUsers})
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects ({stats.totalProjects})
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2">
                <LifeBuoy className="h-4 w-4" />
                Support ({stats.pendingTickets} pending)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">User Management</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage users and grant admin privileges. <strong className="text-destructive">Passwords are encrypted.</strong>
                    </p>
                  </div>
                  <Badge variant="outline" className="text-primary">
                    {stats.totalUsers} Total Users
                  </Badge>
                </div>
                <UserManagement />
              </div>
            </TabsContent>

            <TabsContent value="projects" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Projects Overview</h2>
                    <p className="text-sm text-muted-foreground">
                      View and monitor all projects on the platform
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {stats.openProjects} Open
                    </Badge>
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      {stats.completedProjects} Completed
                    </Badge>
                  </div>
                </div>
                <ProjectsOverview />
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Support Tickets</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage and resolve user support requests
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                      {stats.pendingTickets} Pending
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {stats.resolvedTickets} Resolved
                    </Badge>
                  </div>
                </div>
                <SupportTickets />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}