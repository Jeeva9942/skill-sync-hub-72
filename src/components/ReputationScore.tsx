import { Star, Trophy, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReputationScoreProps {
  averageRating: number;
  totalReviews: number;
  completedProjects: number;
  size?: "sm" | "md" | "lg";
}

export function ReputationScore({
  averageRating,
  totalReviews,
  completedProjects,
  size = "md",
}: ReputationScoreProps) {
  // Calculate reputation score (0-100)
  // Weighted: 50% average rating, 30% review count, 20% completed projects
  const normalizedRating = (averageRating / 5) * 50;
  const normalizedReviews = Math.min(totalReviews / 20, 1) * 30; // Max at 20 reviews
  const normalizedProjects = Math.min(completedProjects / 15, 1) * 20; // Max at 15 projects
  const reputationScore = Math.round(normalizedRating + normalizedReviews + normalizedProjects);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "New";
  };

  const sizeClasses = {
    sm: {
      container: "gap-2",
      score: "text-xl font-bold",
      badge: "px-2 py-0.5 text-xs",
      stats: "text-xs gap-3",
      icon: "h-3 w-3",
    },
    md: {
      container: "gap-3",
      score: "text-3xl font-bold",
      badge: "px-3 py-1 text-sm",
      stats: "text-sm gap-4",
      icon: "h-4 w-4",
    },
    lg: {
      container: "gap-4",
      score: "text-4xl font-bold",
      badge: "px-4 py-1.5 text-base",
      stats: "text-base gap-5",
      icon: "h-5 w-5",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col items-center", classes.container)}>
      {/* Score Circle */}
      <div className="relative">
        <div
          className={cn(
            "rounded-full flex items-center justify-center",
            getScoreColor(reputationScore),
            size === "sm" ? "h-14 w-14" : size === "md" ? "h-20 w-20" : "h-24 w-24"
          )}
        >
          <span className={classes.score}>{reputationScore}</span>
        </div>
        <div className="absolute -top-1 -right-1">
          <Trophy className={cn("text-yellow-500", classes.icon)} />
        </div>
      </div>

      {/* Label */}
      <span
        className={cn(
          "rounded-full font-medium",
          classes.badge,
          getScoreColor(reputationScore)
        )}
      >
        {getScoreLabel(reputationScore)}
      </span>

      {/* Stats */}
      <div className={cn("flex items-center text-muted-foreground", classes.stats)}>
        <div className="flex items-center gap-1">
          <Star className={cn("text-yellow-500", classes.icon)} />
          <span>{averageRating.toFixed(1)}</span>
          <span className="text-muted-foreground/60">({totalReviews})</span>
        </div>
        <div className="flex items-center gap-1">
          <Briefcase className={cn("text-primary", classes.icon)} />
          <span>{completedProjects} projects</span>
        </div>
      </div>
    </div>
  );
}
