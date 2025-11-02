import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userRole, setUserRole] = useState<"client" | "freelancer">("client");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAndRedirect = async (session: Session) => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (roles) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdminAndRedirect(session);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdminAndRedirect(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_role: userRole,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      // Send welcome email
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email,
            fullName,
          },
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }

      toast({
        title: "Success!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email address first.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed Google OAuth to enforce email/password only


  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-light via-background to-secondary-light">
      <Card className="w-full max-w-md p-8 shadow-glow">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-gradient-hero rounded-xl">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">
          Welcome to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Skill Sync</span>
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Your gateway to freelance success
        </p>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-hero hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full text-sm text-muted-foreground hover:text-primary"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>I want to</Label>
                <RadioGroup value={userRole} onValueChange={(value: any) => setUserRole(value)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="client" id="client" />
                    <Label htmlFor="client" className="cursor-pointer flex-1">
                      <div className="font-medium">Hire Freelancers</div>
                      <div className="text-xs text-muted-foreground">Post projects and find talent</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="freelancer" id="freelancer" />
                    <Label htmlFor="freelancer" className="cursor-pointer flex-1">
                      <div className="font-medium">Work as Freelancer</div>
                      <div className="text-xs text-muted-foreground">Browse projects and earn money</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-hero hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}