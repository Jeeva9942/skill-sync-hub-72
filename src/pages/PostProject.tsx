import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Briefcase, Clock } from "lucide-react";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";

const PostProject = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    deadline: "",
    duration: "",
    required_skills: [] as string[],
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    
    // Fetch user profile to determine role
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setUserProfile(profile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project.title || !project.description || !project.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Clients post projects looking for freelancers
      // Freelancers post projects as service offerings
      const projectData: any = {
        title: project.title,
        description: project.description,
        category: project.category,
        budget_min: project.budget_min ? parseFloat(project.budget_min) : null,
        budget_max: project.budget_max ? parseFloat(project.budget_max) : null,
        deadline: project.deadline || null,
        duration: project.duration || null,
        required_skills: project.required_skills,
        status: "open"
      };

      if (userProfile?.user_role === "freelancer") {
        // Freelancer proposing their services
        projectData.freelancer_id = user.id;
        projectData.client_id = user.id; // Required field, set to self
      } else {
        // Client posting a project
        projectData.client_id = user.id;
      }

      const { data: insertedProject, error } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Sync to MongoDB
      try {
        await supabase.functions.invoke('sync-mongodb', {
          body: {
            action: 'sync-project',
            data: { project_id: insertedProject.id }
          }
        });
        console.log('Project synced to MongoDB');
      } catch (syncError) {
        console.error('MongoDB sync error:', syncError);
      }
      
      const message = userProfile?.user_role === "freelancer" 
        ? "Service proposal posted successfully!" 
        : "Project posted successfully!";
      
      toast({
        title: "Success",
        description: message,
      });
      navigate("/browse-projects");
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              {userProfile?.user_role === "freelancer" ? "Propose Your " : "Post a "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {userProfile?.user_role === "freelancer" ? "Services" : "Job"}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              {userProfile?.user_role === "freelancer" 
                ? "Share your expertise and attract clients" 
                : "Find the perfect freelancer for your project"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>
                    {userProfile?.user_role === "freelancer" ? "Service Details" : "Job Details"}
                  </CardTitle>
                  <CardDescription>
                    {userProfile?.user_role === "freelancer"
                      ? "Describe the services you offer"
                      : "Provide information about your project"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {userProfile?.user_role === "freelancer" ? "Service Title" : "Job Title"} *
                  </Label>
                  <Input
                    id="title"
                    value={project.title}
                    onChange={(e) => setProject({ ...project, title: e.target.value })}
                    placeholder={
                      userProfile?.user_role === "freelancer"
                        ? "e.g., Professional Web Development Services"
                        : "e.g., Build a responsive website"
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {userProfile?.user_role === "freelancer" ? "Service Description" : "Job Description"} *
                  </Label>
                  <Textarea
                    id="description"
                    value={project.description}
                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                    placeholder={
                      userProfile?.user_role === "freelancer"
                        ? "Describe your skills, experience, and what you can offer..."
                        : "Describe your project requirements in detail..."
                    }
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Required Skills *</Label>
                  <SkillsMultiSelect
                    value={project.required_skills}
                    onChange={(skills) => setProject({ ...project, required_skills: skills })}
                    placeholder="Add required skills..."
                    maxSkills={8}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={project.category}
                      onValueChange={(value) => setProject({ ...project, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web_development">Web Development</SelectItem>
                        <SelectItem value="mobile_development">Mobile Development</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="data_science">Data Science</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Project Duration</Label>
                    <Select
                      value={project.duration}
                      onValueChange={(value) => setProject({ ...project, duration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="less_than_week">Less than a week</SelectItem>
                        <SelectItem value="1_2_weeks">1-2 weeks</SelectItem>
                        <SelectItem value="2_4_weeks">2-4 weeks</SelectItem>
                        <SelectItem value="1_3_months">1-3 months</SelectItem>
                        <SelectItem value="3_6_months">3-6 months</SelectItem>
                        <SelectItem value="more_than_6_months">More than 6 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_min">
                      {userProfile?.user_role === "freelancer" ? "Minimum Rate (₹)" : "Minimum Budget (₹)"}
                    </Label>
                    <Input
                      id="budget_min"
                      type="number"
                      value={project.budget_min}
                      onChange={(e) => setProject({ ...project, budget_min: e.target.value })}
                      placeholder="500"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_max">
                      {userProfile?.user_role === "freelancer" ? "Maximum Rate (₹)" : "Maximum Budget (₹)"}
                    </Label>
                    <Input
                      id="budget_max"
                      type="number"
                      value={project.budget_max}
                      onChange={(e) => setProject({ ...project, budget_max: e.target.value })}
                      placeholder="2000"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={project.deadline}
                    onChange={(e) => setProject({ ...project, deadline: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-gradient-hero">
                    {loading 
                      ? "Posting..." 
                      : userProfile?.user_role === "freelancer" 
                        ? "Post Service" 
                        : "Post Job"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PostProject;
