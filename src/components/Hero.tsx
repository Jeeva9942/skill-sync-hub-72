import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, TrendingUp, Shield, Zap } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-radial opacity-50" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      
      <div className="container mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex-1 space-y-6 sm:space-y-8 animate-fade-in text-center lg:text-left">
            <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary-light to-secondary-light rounded-full text-primary text-xs sm:text-sm font-medium shadow-soft animate-pulse-glow">
              ✨ Join 10,000+ Professionals Already Connected
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
              Find the Perfect
              <span className="block bg-gradient-rainbow bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
                Freelance Match
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl">
              Connect with top talent or find your next project. Skill Sync makes freelancing simple, 
              secure, and rewarding for everyone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-hero hover:scale-105 hover:shadow-premium transition-all duration-300 text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto shadow-glow">
                  Start as Freelancer
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-sm sm:text-base px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto border-2 hover:bg-gradient-card hover:border-primary hover:scale-105 transition-all duration-300">
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
            <div className="col-span-2 bg-gradient-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border-2 border-primary/10 hover:border-primary/30 hover:shadow-premium transition-all duration-300 animate-slide-up group">
              <div className="p-2 bg-gradient-hero rounded-lg w-fit mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Smart Matching</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">AI-powered system connects you with perfect opportunities</p>
            </div>
            
            <div className="bg-gradient-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border-2 border-secondary/10 hover:border-secondary/30 hover:shadow-hover transition-all duration-300 animate-slide-up group" style={{ animationDelay: "0.1s" }}>
              <div className="p-2 bg-gradient-to-br from-secondary to-secondary-dark rounded-lg w-fit mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Secure</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Protected payments</p>
            </div>
            
            <div className="bg-gradient-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-soft border-2 border-primary/10 hover:border-primary/30 hover:shadow-hover transition-all duration-300 animate-slide-up group" style={{ animationDelay: "0.2s" }}>
              <div className="p-2 bg-gradient-to-br from-primary to-primary-dark rounded-lg w-fit mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Fast</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Quick setup</p>
            </div>
            
            <div className="col-span-2 bg-gradient-hero p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-premium text-white animate-slide-up hover:scale-105 transition-all duration-300 group" style={{ animationDelay: "0.3s" }}>
              <div className="p-2 bg-white/20 rounded-lg w-fit mb-2 sm:mb-3 group-hover:bg-white/30 transition-colors">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Grow Your Business</h3>
              <p className="text-xs sm:text-sm text-white/90">Access global opportunities and scale your freelance career</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};