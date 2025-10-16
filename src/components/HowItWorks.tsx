import { UserPlus, FileText, Handshake, Star } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up in minutes and showcase your skills or project requirements.",
    color: "primary",
  },
  {
    icon: FileText,
    title: "Post or Browse Projects",
    description: "Clients post projects, freelancers browse and submit proposals.",
    color: "secondary",
  },
  {
    icon: Handshake,
    title: "Connect & Collaborate",
    description: "Match with the right talent or client and start working together.",
    color: "primary",
  },
  {
    icon: Star,
    title: "Complete & Review",
    description: "Finish the project, receive payment, and leave reviews to build reputation.",
    color: "secondary",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in four simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-30" />
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative bg-card p-6 rounded-xl border shadow-soft hover:shadow-glow transition-all text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative z-10 mb-4 flex justify-center">
                  <div className={`p-4 bg-${step.color}-light rounded-full`}>
                    <Icon className={`h-8 w-8 text-${step.color}`} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};