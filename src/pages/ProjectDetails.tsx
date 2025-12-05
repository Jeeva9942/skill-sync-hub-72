import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { notifyNewBid, notifyProjectStatusChange, notifyMessageReceived } from "@/hooks/useNotifications";
import { DollarSign, Calendar, User, Briefcase, MessageSquare, CheckCircle } from "lucide-react";

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bidForm, setBidForm] = useState({
    amount: "",
    delivery_days: "",
    proposal: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchBids();
    }
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(data);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          profiles:client_id (id, full_name, avatar_url, user_role)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          profiles:freelancer_id (id, full_name, avatar_url)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setBids(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a bid",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (userProfile?.user_role !== "freelancer") {
      toast({
        title: "Access denied",
        description: "Only freelancers can submit bids",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: insertedBid, error } = await supabase
        .from("bids")
        .insert({
          project_id: id,
          freelancer_id: currentUser.id,
          amount: parseFloat(bidForm.amount),
          delivery_days: parseInt(bidForm.delivery_days),
          proposal: bidForm.proposal,
          status: "pending"
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Send notification to project owner
      if (project?.client_id && userProfile?.full_name) {
        await notifyNewBid(
          project.client_id,
          userProfile.full_name,
          project.title,
          parseFloat(bidForm.amount),
          id!
        );
      }
      
      // Sync bid to MongoDB
      try {
        await supabase.functions.invoke('sync-mongodb', {
          body: {
            action: 'sync-bid',
            data: { bid_id: insertedBid.id, project_id: id }
          }
        });
        console.log('Bid synced to MongoDB');
      } catch (syncError) {
        console.error('MongoDB sync error:', syncError);
      }
      
      toast({
        title: "Success",
        description: "Bid submitted successfully!",
      });
      
      setBidForm({ amount: "", delivery_days: "", proposal: "" });
      fetchBids();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async (bid: any) => {
    try {
      // Update bid status
      const { error: bidError } = await supabase
        .from("bids")
        .update({ status: "accepted" })
        .eq("id", bid.id);

      if (bidError) throw bidError;

      // Update project with freelancer and status
      const { error: projectError } = await supabase
        .from("projects")
        .update({ 
          freelancer_id: bid.freelancer_id,
          status: "in_progress"
        })
        .eq("id", id);

      if (projectError) throw projectError;

      // Send hire notification email
      try {
        await supabase.functions.invoke('send-hire-notification', {
          body: {
            clientEmail: userProfile.email,
            clientName: userProfile.full_name,
            freelancerName: bid.profiles?.full_name,
            projectTitle: project.title,
            bidAmount: bid.amount,
            deliveryDays: bid.delivery_days,
          },
        });
      } catch (emailError) {
        console.error('Error sending hire notification:', emailError);
      }

      // Notify freelancer about project status change
      if (bid.freelancer_id) {
        await notifyProjectStatusChange(
          bid.freelancer_id,
          project.title,
          "In Progress - You've been hired!"
        );
      }

      // Sync to MongoDB after bid accepted
      try {
        await supabase.functions.invoke('sync-mongodb', {
          body: {
            action: 'sync-project',
            data: { project_id: id }
          }
        });
        console.log('Project synced to MongoDB after bid acceptance');
      } catch (syncError) {
        console.error('MongoDB sync error:', syncError);
      }

      toast({
        title: "Success!",
        description: "Freelancer hired successfully! Notification email sent.",
      });

      fetchProjectDetails();
      fetchBids();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleContactClient = async () => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    try {
      // Create initial message
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: project.client_id,
          content: `Hi! I'm interested in your project: ${project.title}`,
          project_id: id
        });
      
      if (error) throw error;
      
      // Notify the client about the message
      if (userProfile?.full_name) {
        await notifyMessageReceived(
          project.client_id,
          userProfile.full_name,
          `Hi! I'm interested in your project: ${project.title}`
        );
      }
      
      toast({
        title: "Success",
        description: "Message sent! Redirecting to messages...",
      });
      
      setTimeout(() => navigate("/messages"), 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p>Loading project...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p>Project not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isProjectOwner = currentUser?.id === project.client_id;
  const hasAlreadyBid = bids.some(bid => bid.freelancer_id === currentUser?.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary">{project.category.replace(/_/g, ' ')}</Badge>
                    <Badge>{project.status}</Badge>
                  </div>
                  <CardTitle className="text-3xl">{project.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-base mt-2">
                    <User className="h-4 w-4" />
                    Posted by {project.profiles?.full_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{project.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-semibold">₹{project.budget_min} - ₹{project.budget_max}</p>
                      </div>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Deadline</p>
                          <p className="font-semibold">{new Date(project.deadline).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bids Section */}
              {isProjectOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle>Received Bids ({bids.length})</CardTitle>
                    <CardDescription>Review proposals from freelancers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bids.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No bids yet</p>
                    ) : (
                      <div className="space-y-4">
                        {bids.map((bid) => (
                          <Card key={bid.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={bid.profiles?.avatar_url} />
                                    <AvatarFallback>{bid.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold">{bid.profiles?.full_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      ₹{bid.amount} • {bid.delivery_days} days
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={bid.status === 'accepted' ? 'default' : 'secondary'}>
                                  {bid.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-4">{bid.proposal}</p>
                              {bid.status === 'pending' && project.status === 'open' && (
                                <Button 
                                  onClick={() => handleAcceptBid(bid)}
                                  className="w-full bg-gradient-hero"
                                  size="sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept & Hire
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Client Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={project.profiles?.avatar_url} />
                      <AvatarFallback>{project.profiles?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{project.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">Client</p>
                    </div>
                  </div>
                  {!isProjectOwner && (
                    <Button onClick={handleContactClient} className="w-full" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Client
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Bid Form - Only for freelancers */}
              {!isProjectOwner && userProfile?.user_role === "freelancer" && project.status === "open" && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Briefcase className="h-5 w-5 inline mr-2" />
                      Submit Your Bid
                    </CardTitle>
                    {hasAlreadyBid && (
                      <CardDescription className="text-yellow-600">
                        You have already submitted a bid for this project
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitBid} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Bid Amount (₹) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={bidForm.amount}
                          onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                          placeholder="500"
                          required
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery_days">Delivery Time (days) *</Label>
                        <Input
                          id="delivery_days"
                          type="number"
                          value={bidForm.delivery_days}
                          onChange={(e) => setBidForm({ ...bidForm, delivery_days: e.target.value })}
                          placeholder="7"
                          required
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proposal">Proposal *</Label>
                        <Textarea
                          id="proposal"
                          value={bidForm.proposal}
                          onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                          placeholder="Explain why you're the best fit for this project..."
                          rows={5}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={submitting || hasAlreadyBid} className="w-full">
                        {submitting ? "Submitting..." : hasAlreadyBid ? "Already Submitted" : "Submit Bid"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProjectDetails;
