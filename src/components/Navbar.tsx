import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, LogOut, User } from "lucide-react";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", userId)
        .single();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
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

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="p-2 bg-gradient-hero rounded-lg">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Skill Sync
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/browse-projects" className="text-sm font-medium hover:text-primary transition-colors">
            Browse Projects
          </Link>
          <Link to="/find-freelancers" className="text-sm font-medium hover:text-primary transition-colors">
            Find Freelancers
          </Link>
          {user && (
            <>
              <Link to="/post-project" className="text-sm font-medium hover:text-primary transition-colors">
                Post Project
              </Link>
              <Link to="/messages" className="text-sm font-medium hover:text-primary transition-colors">
                Messages
              </Link>
              <Link to="/my-profile" className="text-sm font-medium hover:text-primary transition-colors">
                My Profile
              </Link>
            </>
          )}
          <Link to="/help" className="text-sm font-medium hover:text-primary transition-colors">
            Help
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="hidden sm:block">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              {profile && (
                <Link to="/my-profile" className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:inline">{profile.full_name}</span>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button className="bg-gradient-hero hover:opacity-90 transition-opacity text-xs sm:text-sm px-3 sm:px-4 py-2">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};