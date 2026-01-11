import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ProposalStatusBadge } from "@/components/ProposalStatusBadge";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import {
  Star,
  Calendar,
  MessageSquare,
  Check,
  X,
  Eye,
  Clock,
  ArrowLeft,
  UserPlus,
  Briefcase,
} from "lucide-react";

interface Bid {
  id: string;
  amount: number;
  delivery_days: number;
  proposal: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
    skills: string[];
    hourly_rate: number;
    experience_years: number;
    availability_status: string;
  };
}

interface Shortlist {
  id: string;
  freelancer_id: string;
  notes: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
    skills: string[];
    hourly_rate: number;
    experience_years: number;
    availability_status: string;
  };
}

interface Interview {
  id: string;
  freelancer_id: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  notes: string;
  status: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export default function ManageCandidates() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<any>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal states
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLink, setInterviewLink] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [candidateNotes, setCandidateNotes] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (projectId && currentUser) {
      fetchData();
    }
  }, [projectId, currentUser]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUser(user);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch project
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      setProject(projectData);

      // Fetch bids with freelancer profiles
      const { data: bidsData } = await supabase
        .from("bids")
        .select(`
          *,
          profiles:freelancer_id (
            id, full_name, avatar_url, skills, hourly_rate, experience_years, availability_status
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setBids(bidsData || []);

      // Fetch shortlists
      const { data: shortlistsData } = await supabase
        .from("shortlists")
        .select(`
          *,
          profiles:freelancer_id (
            id, full_name, avatar_url, skills, hourly_rate, experience_years, availability_status
          )
        `)
        .eq("project_id", projectId)
        .eq("client_id", currentUser.id)
        .order("created_at", { ascending: false });
      setShortlists(shortlistsData || []);

      // Fetch interviews
      const { data: interviewsData } = await supabase
        .from("interviews")
        .select(`
          *,
          profiles:freelancer_id (id, full_name, avatar_url)
        `)
        .eq("project_id", projectId)
        .eq("client_id", currentUser.id)
        .order("scheduled_at", { ascending: true });
      setInterviews(interviewsData || []);
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

  const handleMarkAsViewed = async (bidId: string) => {
    try {
      await supabase
        .from("bids")
        .update({ status: "viewed" })
        .eq("id", bidId);
      fetchData();
      toast({ title: "Marked as viewed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleShortlist = async (bid: Bid) => {
    try {
      // Update bid status
      await supabase
        .from("bids")
        .update({ status: "shortlisted" })
        .eq("id", bid.id);

      // Add to shortlists table
      await supabase.from("shortlists").insert({
        client_id: currentUser.id,
        freelancer_id: bid.profiles.id,
        project_id: projectId,
        status: "shortlisted",
      });

      fetchData();
      toast({ title: "Freelancer shortlisted!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedFreelancer || !interviewDate || !interviewTime) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      const scheduledAt = new Date(`${interviewDate}T${interviewTime}`).toISOString();
      
      await supabase.from("interviews").insert({
        client_id: currentUser.id,
        freelancer_id: selectedFreelancer.id,
        project_id: projectId,
        scheduled_at: scheduledAt,
        meeting_link: interviewLink,
        notes: interviewNotes,
      });

      setShowInterviewModal(false);
      setInterviewDate("");
      setInterviewTime("");
      setInterviewLink("");
      setInterviewNotes("");
      setSelectedFreelancer(null);
      fetchData();
      toast({ title: "Interview scheduled successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedFreelancer) return;

    try {
      await supabase
        .from("shortlists")
        .update({ notes: candidateNotes })
        .eq("freelancer_id", selectedFreelancer.id)
        .eq("project_id", projectId)
        .eq("client_id", currentUser.id);

      setShowNotesModal(false);
      setCandidateNotes("");
      setSelectedFreelancer(null);
      fetchData();
      toast({ title: "Notes updated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleHire = async (freelancerId: string, bidId?: string) => {
    try {
      // Update shortlist status
      await supabase
        .from("shortlists")
        .update({ status: "hired" })
        .eq("freelancer_id", freelancerId)
        .eq("project_id", projectId);

      // Update bid status if exists
      if (bidId) {
        await supabase
          .from("bids")
          .update({ status: "accepted" })
          .eq("id", bidId);
      }

      // Update project
      await supabase
        .from("projects")
        .update({ freelancer_id: freelancerId, status: "in_progress" })
        .eq("id", projectId);

      fetchData();
      toast({ title: "Freelancer hired successfully!" });
      navigate(`/project/${projectId}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReject = async (freelancerId: string, bidId?: string) => {
    try {
      if (bidId) {
        await supabase
          .from("bids")
          .update({ status: "rejected" })
          .eq("id", bidId);
      }

      await supabase
        .from("shortlists")
        .update({ status: "rejected" })
        .eq("freelancer_id", freelancerId)
        .eq("project_id", projectId);

      fetchData();
      toast({ title: "Candidate rejected" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(`/project/${projectId}`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <h1 className="text-3xl font-bold mb-2">
              Manage <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Candidates</span>
            </h1>
            <p className="text-muted-foreground">{project?.title}</p>
          </div>

          <Tabs defaultValue="proposals" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="proposals" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Proposals ({bids.length})
              </TabsTrigger>
              <TabsTrigger value="shortlisted" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Shortlisted ({shortlists.length})
              </TabsTrigger>
              <TabsTrigger value="interviews" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Interviews ({interviews.length})
              </TabsTrigger>
            </TabsList>

            {/* Proposals Tab */}
            <TabsContent value="proposals">
              <div className="space-y-4">
                {bids.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No proposals received yet</p>
                  </Card>
                ) : (
                  bids.map((bid) => (
                    <Card key={bid.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={bid.profiles?.avatar_url} />
                            <AvatarFallback>{bid.profiles?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{bid.profiles?.full_name}</h3>
                                  <AvailabilityBadge status={bid.profiles?.availability_status} size="sm" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  ₹{bid.profiles?.hourly_rate}/hr • {bid.profiles?.experience_years} years exp.
                                </p>
                              </div>
                              <ProposalStatusBadge status={bid.status} />
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {bid.profiles?.skills?.slice(0, 5).map((skill: string) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>

                            <div className="bg-muted/50 p-3 rounded-lg mb-4">
                              <p className="text-sm">{bid.proposal}</p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-semibold text-primary">₹{bid.amount}</span>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {bid.delivery_days} days
                                </span>
                              </div>

                              <div className="flex gap-2">
                                {bid.status === "sent" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsViewed(bid.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Mark Viewed
                                  </Button>
                                )}
                                {(bid.status === "sent" || bid.status === "viewed" || bid.status === "pending") && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleShortlist(bid)}
                                    >
                                      <Star className="h-4 w-4 mr-1" />
                                      Shortlist
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleHire(bid.profiles.id, bid.id)}
                                      className="bg-gradient-hero"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Hire
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleReject(bid.profiles.id, bid.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Shortlisted Tab */}
            <TabsContent value="shortlisted">
              <div className="space-y-4">
                {shortlists.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No candidates shortlisted yet</p>
                  </Card>
                ) : (
                  shortlists.map((shortlist) => (
                    <Card key={shortlist.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={shortlist.profiles?.avatar_url} />
                            <AvatarFallback>{shortlist.profiles?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{shortlist.profiles?.full_name}</h3>
                                  <AvailabilityBadge status={shortlist.profiles?.availability_status} size="sm" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  ₹{shortlist.profiles?.hourly_rate}/hr • {shortlist.profiles?.experience_years} years exp.
                                </p>
                              </div>
                              <Badge variant={shortlist.status === "hired" ? "default" : shortlist.status === "rejected" ? "destructive" : "secondary"}>
                                {shortlist.status}
                              </Badge>
                            </div>

                            {shortlist.notes && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg mb-4">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  <strong>Notes:</strong> {shortlist.notes}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedFreelancer(shortlist.profiles);
                                  setCandidateNotes(shortlist.notes || "");
                                  setShowNotesModal(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Notes
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedFreelancer(shortlist.profiles);
                                  setShowInterviewModal(true);
                                }}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Schedule Interview
                              </Button>
                              {shortlist.status === "shortlisted" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleHire(shortlist.freelancer_id)}
                                    className="bg-gradient-hero"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Hire
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleReject(shortlist.freelancer_id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Interviews Tab */}
            <TabsContent value="interviews">
              <div className="space-y-4">
                {interviews.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No interviews scheduled yet</p>
                  </Card>
                ) : (
                  interviews.map((interview) => (
                    <Card key={interview.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={interview.profiles?.avatar_url} />
                            <AvatarFallback>{interview.profiles?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{interview.profiles?.full_name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {new Date(interview.scheduled_at).toLocaleDateString()} at{" "}
                                  {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <Badge variant={interview.status === "completed" ? "default" : interview.status === "cancelled" ? "destructive" : "secondary"}>
                                {interview.status}
                              </Badge>
                            </div>

                            {interview.meeting_link && (
                              <a
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                Join Meeting Link
                              </a>
                            )}

                            {interview.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{interview.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Schedule Interview Modal */}
      <Dialog open={showInterviewModal} onOpenChange={setShowInterviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {selectedFreelancer?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meeting Link (optional)</Label>
              <Input
                placeholder="https://meet.google.com/..."
                value={interviewLink}
                onChange={(e) => setInterviewLink(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Interview agenda, topics to discuss..."
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInterviewModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleInterview} className="bg-gradient-hero">
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidate Notes</DialogTitle>
            <DialogDescription>
              Add private notes for {selectedFreelancer?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add your private notes about this candidate..."
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
