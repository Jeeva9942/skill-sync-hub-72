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
import { Briefcase } from "lucide-react";

const PostProject = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    deadline: ""
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
      const { error } = await supabase
        .from("projects")
        .insert({
          client_id: user.id,
          title: project.title,
          description: project.description,
          category: project.category as any,
          budget_min: project.budget_min ? parseFloat(project.budget_min) : null,
          budget_max: project.budget_max ? parseFloat(project.budget_max) : null,
          deadline: project.deadline || null,
          status: "open"
        } as any);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Project posted successfully!",
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
              Post a <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Project</span>
            </h1>
            <p className="text-xl text-muted-foreground">Find the perfect freelancer for your project</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>Provide information about your project</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={project.title}
                    onChange={(e) => setProject({ ...project, title: e.target.value })}
                    placeholder="e.g., Build a responsive website"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    value={project.description}
                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                    placeholder="Describe your project requirements in detail..."
                    rows={6}
                    required
                  />
                </div>

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
                      <SelectItem value="video_editing">Video Editing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_min">Minimum Budget ($)</Label>
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
                    <Label htmlFor="budget_max">Maximum Budget ($)</Label>
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
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Posting..." : "Post Project"}
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
