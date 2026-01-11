import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, MapPin, DollarSign, Star, Filter, X, Clock, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { ReputationScore } from "@/components/ReputationScore";

const SKILL_OPTIONS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java",
  "HTML/CSS", "Tailwind CSS", "Next.js", "Vue.js", "Angular",
  "MongoDB", "PostgreSQL", "MySQL", "Firebase", "AWS",
  "Docker", "Git", "REST API", "GraphQL", "UI/UX Design",
  "Figma", "Content Writing", "SEO", "Digital Marketing",
  "Video Editing", "Data Analysis", "Machine Learning",
];

const FindFreelancers = () => {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Record<string, { avgRating: number; count: number }>>({});
  const [completedProjects, setCompletedProjects] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Filter states
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceRange, setExperienceRange] = useState<[number, number]>([0, 20]);
  const [rateRange, setRateRange] = useState<[number, number]>([0, 10000]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("recently_active");

  useEffect(() => {
    fetchFreelancers();
    fetchReviewStats();
    fetchCompletedProjects();
  }, []);

  const fetchFreelancers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_role", "freelancer")
        .order("last_active_at", { ascending: false });
      
      if (error) throw error;
      setFreelancers(data || []);
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

  const fetchReviewStats = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("reviewee_id, rating");
      
      if (error) throw error;
      
      const stats: Record<string, { total: number; count: number }> = {};
      (data || []).forEach((review) => {
        if (!stats[review.reviewee_id]) {
          stats[review.reviewee_id] = { total: 0, count: 0 };
        }
        stats[review.reviewee_id].total += review.rating;
        stats[review.reviewee_id].count += 1;
      });

      const reviewData: Record<string, { avgRating: number; count: number }> = {};
      Object.entries(stats).forEach(([id, data]) => {
        reviewData[id] = {
          avgRating: data.total / data.count,
          count: data.count,
        };
      });
      setReviews(reviewData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchCompletedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("freelancer_id")
        .eq("status", "completed")
        .not("freelancer_id", "is", null);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      (data || []).forEach((project) => {
        if (project.freelancer_id) {
          counts[project.freelancer_id] = (counts[project.freelancer_id] || 0) + 1;
        }
      });
      setCompletedProjects(counts);
    } catch (error) {
      console.error("Error fetching completed projects:", error);
    }
  };

  const filteredFreelancers = useMemo(() => {
    let result = freelancers.filter((freelancer) => {
      // Text search
      const matchesSearch = 
        freelancer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.skills?.some((skill: string) => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      if (!matchesSearch) return false;

      // Skills filter
      if (selectedSkills.length > 0) {
        const hasAllSkills = selectedSkills.every((skill) =>
          freelancer.skills?.some((s: string) => 
            s.toLowerCase() === skill.toLowerCase()
          )
        );
        if (!hasAllSkills) return false;
      }

      // Experience filter
      const exp = freelancer.experience_years || 0;
      if (exp < experienceRange[0] || exp > experienceRange[1]) return false;

      // Rate filter
      const rate = freelancer.hourly_rate || 0;
      if (rate < rateRange[0] || rate > rateRange[1]) return false;

      // Availability filter
      if (availabilityFilter !== "all" && freelancer.availability_status !== availabilityFilter) {
        return false;
      }

      // Rating filter
      const reviewData = reviews[freelancer.id];
      const avgRating = reviewData?.avgRating || 0;
      if (minRating > 0 && avgRating < minRating) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "recently_active":
          return new Date(b.last_active_at || 0).getTime() - new Date(a.last_active_at || 0).getTime();
        case "rating":
          return (reviews[b.id]?.avgRating || 0) - (reviews[a.id]?.avgRating || 0);
        case "experience":
          return (b.experience_years || 0) - (a.experience_years || 0);
        case "rate_low":
          return (a.hourly_rate || 0) - (b.hourly_rate || 0);
        case "rate_high":
          return (b.hourly_rate || 0) - (a.hourly_rate || 0);
        case "completed_projects":
          return (completedProjects[b.id] || 0) - (completedProjects[a.id] || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [freelancers, searchTerm, selectedSkills, experienceRange, rateRange, availabilityFilter, minRating, sortBy, reviews, completedProjects]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSelectedSkills([]);
    setExperienceRange([0, 20]);
    setRateRange([0, 10000]);
    setAvailabilityFilter("all");
    setMinRating(0);
    setSortBy("recently_active");
    setSearchTerm("");
  };

  const hasActiveFilters = 
    selectedSkills.length > 0 || 
    experienceRange[0] > 0 || 
    experienceRange[1] < 20 ||
    rateRange[0] > 0 ||
    rateRange[1] < 10000 ||
    availabilityFilter !== "all" ||
    minRating > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Find <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Freelancers</span>
            </h1>
            <p className="text-xl text-muted-foreground">Discover talented professionals for your projects</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, skills, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recently_active">Recently Active</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="experience">Most Experienced</SelectItem>
                  <SelectItem value="completed_projects">Most Projects</SelectItem>
                  <SelectItem value="rate_low">Rate: Low to High</SelectItem>
                  <SelectItem value="rate_high">Rate: High to Low</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    !
                  </Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Skills Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Skills</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {SKILL_OPTIONS.map((skill) => (
                        <Badge
                          key={skill}
                          variant={selectedSkills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleSkill(skill)}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experience Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Experience: {experienceRange[0]} - {experienceRange[1]}+ years
                    </Label>
                    <Slider
                      value={experienceRange}
                      onValueChange={(value) => setExperienceRange(value as [number, number])}
                      max={20}
                      step={1}
                      className="mt-4"
                    />
                  </div>

                  {/* Rate Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Hourly Rate: ₹{rateRange[0]} - ₹{rateRange[1]}
                    </Label>
                    <Slider
                      value={rateRange}
                      onValueChange={(value) => setRateRange(value as [number, number])}
                      max={10000}
                      step={100}
                      className="mt-4"
                    />
                  </div>

                  {/* Availability & Rating */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Availability</Label>
                      <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="available">🟢 Available</SelectItem>
                          <SelectItem value="busy">🟡 Busy</SelectItem>
                          <SelectItem value="offline">🔴 Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Minimum Rating</Label>
                      <Select value={minRating.toString()} onValueChange={(v) => setMinRating(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any rating</SelectItem>
                          <SelectItem value="3">⭐ 3+ stars</SelectItem>
                          <SelectItem value="4">⭐ 4+ stars</SelectItem>
                          <SelectItem value="5">⭐ 5 stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredFreelancers.length} of {freelancers.length} freelancers
            </p>
          </div>

          {/* Freelancers Grid */}
          {loading ? (
            <div className="text-center py-12">Loading freelancers...</div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No freelancers found matching your criteria</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFreelancers.map((freelancer) => {
                const reviewData = reviews[freelancer.id];
                const projectCount = completedProjects[freelancer.id] || 0;
                
                return (
                  <Card key={freelancer.id} className="hover:shadow-glow transition-shadow relative">
                    {/* Availability indicator */}
                    <div className="absolute top-4 right-4">
                      <AvailabilityBadge status={freelancer.availability_status} size="sm" />
                    </div>
                    
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={freelancer.avatar_url} />
                            <AvatarFallback className="bg-gradient-hero text-white">
                              {freelancer.full_name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span 
                            className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${
                              freelancer.availability_status === 'available' ? 'bg-green-500' :
                              freelancer.availability_status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{freelancer.full_name}</CardTitle>
                          {freelancer.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {freelancer.location}
                            </div>
                          )}
                          {/* Rating display */}
                          {reviewData && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{reviewData.avgRating.toFixed(1)}</span>
                              <span className="text-muted-foreground text-sm">({reviewData.count})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-4">
                        {freelancer.bio || "No bio available"}
                      </CardDescription>
                      
                      {freelancer.skills && freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {freelancer.skills.slice(0, 4).map((skill: string, index: number) => (
                            <Badge key={index} variant="outline">{skill}</Badge>
                          ))}
                          {freelancer.skills.length > 4 && (
                            <Badge variant="outline">+{freelancer.skills.length - 4} more</Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        {freelancer.hourly_rate && (
                          <div className="flex items-center gap-1 text-primary font-semibold">
                            <DollarSign className="h-4 w-4" />
                            ₹{freelancer.hourly_rate}/hr
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-muted-foreground">
                          {freelancer.experience_years && (
                            <span>{freelancer.experience_years}y exp</span>
                          )}
                          {projectCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {projectCount} done
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/profile/${freelancer.id}`)}
                      >
                        View Profile
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FindFreelancers;
