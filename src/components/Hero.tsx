import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, TrendingUp, Shield, Zap } from "lucide-react";

export const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex-1 space-y-8 animate-fade-in">
            <div className="inline-block px-4 py-2 bg-primary-light rounded-full text-primary text-sm font-medium">
              🎉 Join 10,000+ Professionals Already Connected
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Find the Perfect
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Freelance Match
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              Connect with top talent or find your next project. Skill Sync makes freelancing simple, 
              secure, and rewarding for everyone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity text-base px-8 py-6">
                  Start as Freelancer
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-base px-8 py-6">
                  Hire Talent
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary">5K+</div>
                <div className="text-sm text-muted-foreground">Projects Done</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="col-span-2 bg-gradient-card p-6 rounded-2xl shadow-soft border hover:shadow-glow transition-shadow animate-slide-up">
              <Search className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2">Smart Matching</h3>
              <p className="text-sm text-muted-foreground">AI-powered system connects you with perfect opportunities</p>
            </div>
            
            <div className="bg-gradient-card p-6 rounded-2xl shadow-soft border hover:shadow-glow transition-shadow animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <Shield className="h-8 w-8 text-secondary mb-3" />
              <h3 className="font-semibold mb-2">Secure</h3>
              <p className="text-sm text-muted-foreground">Protected payments & data</p>
            </div>
            
            <div className="bg-gradient-card p-6 rounded-2xl shadow-soft border hover:shadow-glow transition-shadow animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Zap className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Fast</h3>
              <p className="text-sm text-muted-foreground">Quick project setup</p>
            </div>
            
            <div className="col-span-2 bg-gradient-hero p-6 rounded-2xl shadow-soft text-white animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <TrendingUp className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Grow Your Business</h3>
              <p className="text-sm text-white/90">Access global opportunities and scale your freelance career</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};