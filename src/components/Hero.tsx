import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, TrendingUp, Shield, Zap } from "lucide-react";

export const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex-1 space-y-6 sm:space-y-8 animate-fade-in text-center lg:text-left">
            <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-light rounded-full text-primary text-xs sm:text-sm font-medium">
              🎉 Join 10,000+ Professionals Already Connected
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
              Find the Perfect
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Freelance Match
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl">
              Connect with top talent or find your next project. Skill Sync makes freelancing simple, 
              secure, and rewarding for everyone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
                  Start as Freelancer
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto">
                  Hire Talent
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 sm:gap-8 pt-4 justify-center sm:justify-start">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">10K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-secondary">5K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Projects Done</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">98%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="col-span-2 bg-gradient-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border hover:shadow-glow transition-shadow animate-slide-up">
              <Search className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Smart Matching</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">AI-powered system connects you with perfect opportunities</p>
            </div>
            
            <div className="bg-gradient-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border hover:shadow-glow transition-shadow animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-secondary mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Secure</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Protected payments & data</p>
            </div>
            
            <div className="bg-gradient-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border hover:shadow-glow transition-shadow animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Fast</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Quick project setup</p>
            </div>
            
            <div className="col-span-2 bg-gradient-hero p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft text-white animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mb-2 sm:mb-3" />
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Grow Your Business</h3>
              <p className="text-xs sm:text-sm text-white/90">Access global opportunities and scale your freelance career</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};