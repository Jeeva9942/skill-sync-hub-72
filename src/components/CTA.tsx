import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden bg-gradient-hero rounded-3xl p-12 md:p-16 text-white text-center">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 animate-float" style={{ animationDelay: "1s" }} />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your Freelance Journey?
            </h2>
            <p className="text-xl text-white/90">
              Join thousands of professionals already growing their careers on Skill Sync
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-base">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-base">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};