import { Sparkles, Users, DollarSign, MessageSquare, Award, Clock } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description: "Our smart algorithm connects you with the most relevant projects or freelancers based on skills and requirements.",
  },
  {
    icon: Users,
    title: "Verified Professionals",
    description: "All freelancers go through verification to ensure quality and trustworthiness for your projects.",
  },
  {
    icon: DollarSign,
    title: "Secure Payments",
    description: "Escrow system protects both clients and freelancers, releasing funds only when milestones are met.",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Communication",
    description: "Built-in messaging and collaboration tools keep everyone on the same page throughout the project.",
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description: "Review system and dispute resolution ensure high-quality work and fair treatment for all parties.",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Built-in tools to track hours, manage deadlines, and ensure timely project completion.",
  },
];

export const Features = () => {
  return (
    <section className="relative py-20 px-4 bg-gradient-subtle overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial opacity-30" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Why Choose <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Skill Sync</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to succeed in the freelance economy
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const gradients = [
              "from-primary to-primary-dark",
              "from-secondary to-secondary-dark",
              "from-primary to-secondary",
              "from-secondary to-primary",
              "from-primary-dark to-secondary",
              "from-secondary-dark to-primary"
            ];
            return (
              <div
                key={index}
                className="group bg-card p-6 rounded-2xl border-2 border-border hover:border-primary/30 shadow-soft hover:shadow-premium transition-all duration-300 animate-slide-up hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`p-3 bg-gradient-to-br ${gradients[index]} rounded-xl w-fit mb-4 shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};