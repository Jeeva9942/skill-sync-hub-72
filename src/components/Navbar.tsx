import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

export const Navbar = () => {
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
          <Link to="/freelancers" className="text-sm font-medium hover:text-primary transition-colors">
            Find Talent
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
            How it Works
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-hero hover:opacity-90 transition-opacity">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};