import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PREDEFINED_SKILLS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java",
  "HTML/CSS", "Tailwind CSS", "Next.js", "Vue.js", "Angular",
  "MongoDB", "PostgreSQL", "MySQL", "Firebase", "AWS",
  "Docker", "Git", "REST API", "GraphQL", "UI/UX Design",
  "Figma", "Adobe XD", "Photoshop", "Illustrator",
  "Content Writing", "Copywriting", "SEO", "Digital Marketing",
  "Video Editing", "Motion Graphics", "3D Modeling", "Animation",
  "Data Analysis", "Machine Learning", "AI", "Blockchain",
];

interface SkillsMultiSelectProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
}

export function SkillsMultiSelect({
  value = [],
  onChange,
  placeholder = "Add skills...",
  maxSkills = 10,
}: SkillsMultiSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = PREDEFINED_SKILLS.filter(
    (skill) =>
      skill.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(skill)
  ).slice(0, 8);

  const handleAddSkill = (skill: string) => {
    if (skill && !value.includes(skill) && value.length < maxSkills) {
      onChange([...value, skill]);
      setInputValue("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(value.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddSkill(inputValue.trim());
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Skills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="px-3 py-1 text-sm flex items-center gap-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      {value.length < maxSkills && (
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => handleAddSkill(inputValue.trim())}
            disabled={!inputValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
              {filteredSuggestions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                  onMouseDown={() => handleAddSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxSkills} skills selected. Type and press Enter or select from suggestions.
      </p>
    </div>
  );
}
