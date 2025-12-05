import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { notifyProfileView } from "@/hooks/useNotifications";
import { 
  MapPin, Briefcase, Award, Globe, MessageSquare, ExternalLink, 
  Star, Clock, CheckCircle, Calendar, Users, TrendingUp, Shield
} from "lucide-react";

const FreelancerProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [projectsCompleted, setProjectsCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchReviews();
      fetchCompletedProjects();
    }
  }, [id]);

  // Track profile view
  useEffect(() => {
    if (currentUser && currentUserProfile && profile && currentUser.id !== id) {
      notifyProfileView(id!, currentUserProfile.full_name || "Someone");
    }
  }, [currentUser, currentUserProfile, profile, id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setCurrentUserProfile(data);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      setProfile(data);
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

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)
      `)
      .eq("reviewee_id", id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (data) setReviews(data);
  };

  const fetchCompletedProjects = async () => {
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("freelancer_id", id)
      .eq("status", "completed");
    
    setProjectsCompleted(count || 0);
  };

  const handleContactFreelancer = async () => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUser.id,
          receiver_id: id,
          content: `Hi ${profile.full_name}! I'd like to discuss a potential project with you.`
        });
      
      if (error) throw error;
      
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

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === id;
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { 
    month: 'long', year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-0">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20" />
      </section>

      <section className="px-4 -mt-16 pb-20">
        <div className="container mx-auto max-w-6xl">
          {/* Profile Header Card */}
          <Card className="mb-8 overflow-hidden shadow-lg border-0">
            <CardContent className="pt-0">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center lg:items-start -mt-16 lg:-mt-12">
                  <Avatar className="h-32 w-32 lg:h-40 lg:w-40 border-4 border-background shadow-xl">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-4xl lg:text-5xl bg-gradient-hero text-white">
                      {profile.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {profile.verification_status === "verified" && (
                    <Badge className="mt-2 bg-green-500/10 text-green-600 border-green-500/20">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                {/* Info Section */}
                <div className="flex-1 pt-4 lg:pt-8 text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold mb-2">{profile.full_name}</h1>
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-muted-foreground mb-4">
                        {profile.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{profile.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Member since {memberSince}</span>
                        </div>
                      </div>
                      {profile.bio && (
                        <p className="text-muted-foreground max-w-2xl">{profile.bio}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {!isOwnProfile && (
                        <Button 
                          onClick={handleContactFreelancer}
                          className="bg-gradient-hero hover:opacity-90 shadow-soft"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      )}
                      {isOwnProfile && (
                        <Button onClick={() => navigate("/my-profile")} variant="outline">
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center lg:text-left">
                      <p className="text-2xl font-bold text-primary">
                        {profile.hourly_rate ? `₹${profile.hourly_rate}` : "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    </div>
                    <div className="text-center lg:text-left">
                      <p className="text-2xl font-bold text-primary">
                        {profile.experience_years || "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">Years Exp.</p>
                    </div>
                    <div className="text-center lg:text-left">
                      <p className="text-2xl font-bold text-primary">{projectsCompleted}</p>
                      <p className="text-sm text-muted-foreground">Projects Done</p>
                    </div>
                    <div className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <p className="text-2xl font-bold">{averageRating || "—"}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reviews.length > 0 ? `${reviews.length} reviews` : "No reviews"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Skills & Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill: string, index: number) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews Section */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Client Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-4 rounded-lg bg-muted/30 border">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.reviewer?.avatar_url} />
                              <AvatarFallback>
                                {review.reviewer?.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{review.reviewer?.full_name || "Anonymous"}</p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < review.rating 
                                          ? "text-yellow-500 fill-yellow-500" 
                                          : "text-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-muted-foreground">{review.comment}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              {profile.certifications && profile.certifications.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5 text-primary" />
                      Certifications & Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profile.certifications.map((cert: string, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border"
                        >
                          <div className="p-2 rounded-full bg-primary/10">
                            <Award className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.portfolio_url && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>Portfolio</span>
                      </div>
                      <a 
                        href={profile.portfolio_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm font-medium"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Response Time</span>
                    </div>
                    <span className="text-sm font-medium">Within 24 hours</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      <span>Availability</span>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Available
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              {profile.languages && profile.languages.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="h-5 w-5 text-primary" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((lang: string, index: number) => (
                        <Badge key={index} variant="outline" className="px-3 py-1">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats Card */}
              <Card className="shadow-soft bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Job Success</span>
                      <span className="text-sm font-medium">
                        {projectsCompleted > 0 ? "100%" : "—"}
                      </span>
                    </div>
                    <Progress value={projectsCompleted > 0 ? 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                      <span className="text-sm font-medium">
                        {projectsCompleted > 0 ? "95%" : "—"}
                      </span>
                    </div>
                    <Progress value={projectsCompleted > 0 ? 95 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Client Satisfaction</span>
                      <span className="text-sm font-medium">
                        {averageRating ? `${((Number(averageRating) / 5) * 100).toFixed(0)}%` : "—"}
                      </span>
                    </div>
                    <Progress 
                      value={averageRating ? (Number(averageRating) / 5) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FreelancerProfile;