import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, LogOut, User, Menu, X } from "lucide-react";

export const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-lg border-b shadow-sm">
      <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl group">
          <div className="p-2 sm:p-2.5 bg-gradient-hero rounded-xl shadow-glow group-hover:scale-110 transition-transform">
            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Skill Sync
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <Link 
            to="/browse-projects" 
            className="text-sm font-medium hover:text-primary transition-colors relative group"
          >
            Browse Projects
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-hero group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link 
            to="/find-freelancers" 
            className="text-sm font-medium hover:text-primary transition-colors relative group"
          >
            Find Freelancers
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-hero group-hover:w-full transition-all duration-300"></span>
          </Link>
          {user && (
            <>
              <Link 
                to="/post-project" 
                className="text-sm font-medium hover:text-primary transition-colors relative group"
              >
                Post Project
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-hero group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/messages" 
                className="text-sm font-medium hover:text-primary transition-colors relative group"
              >
                Messages
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-hero group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                to="/dashboard" 
                className="text-sm font-medium hover:text-primary transition-colors relative group"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-hero group-hover:w-full transition-all duration-300"></span>
              </Link>
            </>
          )}
          <Link 
            to="/help" 
            className="text-sm font-medium hover:text-primary transition-colors relative group"
          >
            Help
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-hero group-hover:w-full transition-all duration-300"></span>
          </Link>
        </div>

        {/* User Actions & Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {profile && (
                <Link to="/my-profile" className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-primary/20">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-gradient-hero text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:inline">{profile.full_name}</span>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="hidden sm:flex text-sm gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth" className="hidden sm:block">
              <Button className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-soft">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[380px] bg-gradient-to-br from-background via-background to-primary/5">
              <div className="flex flex-col gap-8 py-8">
                {/* User Profile Section */}
                {user && profile && (
                  <Link 
                    to="/my-profile" 
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-gradient-card border-2 border-primary/10 hover:border-primary/30 hover:shadow-glow transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Avatar className="h-16 w-16 ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="bg-gradient-hero text-white text-lg">
                        <User className="h-7 w-7" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-lg">{profile.full_name}</p>
                      <p className="text-sm text-primary font-medium">View Profile →</p>
                    </div>
                  </Link>
                )}

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2">
                  <Link 
                    to="/browse-projects" 
                    className="group px-5 py-4 text-base font-semibold hover:bg-gradient-card rounded-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 hover:shadow-soft"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text group-hover:text-transparent transition-all">
                      Browse Projects
                    </span>
                  </Link>
                  <Link 
                    to="/find-freelancers" 
                    className="group px-5 py-4 text-base font-semibold hover:bg-gradient-card rounded-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 hover:shadow-soft"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text group-hover:text-transparent transition-all">
                      Find Freelancers
                    </span>
                  </Link>
                  {user && (
                    <>
                      <Link 
                        to="/post-project" 
                        className="group px-5 py-4 text-base font-semibold hover:bg-gradient-card rounded-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 hover:shadow-soft"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text group-hover:text-transparent transition-all">
                          Post Project
                        </span>
                      </Link>
                      <Link 
                        to="/messages" 
                        className="group px-5 py-4 text-base font-semibold hover:bg-gradient-card rounded-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 hover:shadow-soft"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text group-hover:text-transparent transition-all">
                          Messages
                        </span>
                      </Link>
                      <Link 
                        to="/dashboard" 
                        className="group px-5 py-4 text-base font-semibold hover:bg-gradient-card rounded-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 hover:shadow-soft"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text group-hover:text-transparent transition-all">
                          Dashboard
                        </span>
                      </Link>
                    </>
                  )}
                  <Link 
                    to="/help" 
                    className="group px-5 py-4 text-base font-semibold hover:bg-gradient-card rounded-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 hover:shadow-soft"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text group-hover:text-transparent transition-all">
                      Help
                    </span>
                  </Link>
                </nav>

                {/* Auth Actions */}
                <div className="border-t-2 border-primary/10 pt-6 mt-auto">
                  {user ? (
                    <Button 
                      variant="outline" 
                      className="w-full justify-center gap-3 py-6 text-base font-semibold border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive rounded-xl transition-all"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </Button>
                  ) : (
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-hero hover:opacity-90 hover:scale-105 transition-all py-6 text-base font-bold rounded-xl shadow-glow">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};