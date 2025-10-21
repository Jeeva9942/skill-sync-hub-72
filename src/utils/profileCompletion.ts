interface Profile {
  full_name?: string;
  bio?: string;
  location?: string;
  hourly_rate?: number;
  experience_years?: number;
  portfolio_url?: string;
  avatar_url?: string;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
}

export const calculateProfileCompletion = (profile: Profile): number => {
  if (!profile) return 0;

  const checks = [
    { field: profile.full_name, weight: 10 },
    { field: profile.bio, weight: 15 },
    { field: profile.location, weight: 10 },
    { field: profile.hourly_rate, weight: 10 },
    { field: profile.experience_years, weight: 10 },
    { field: profile.portfolio_url, weight: 10 },
    { field: profile.avatar_url, weight: 10 },
    { field: profile.skills && profile.skills.length > 0, weight: 10 },
    { field: profile.languages && profile.languages.length > 0, weight: 10 },
    { field: profile.certifications && profile.certifications.length > 0, weight: 5 },
  ];

  let completedWeight = 0;
  let totalWeight = 0;

  checks.forEach(({ field, weight }) => {
    totalWeight += weight;
    if (field && (typeof field === 'string' ? field.trim() !== '' : true)) {
      completedWeight += weight;
    }
  });

  return Math.round((completedWeight / totalWeight) * 100);
};

export const getProfileCompletionTips = (profile: Profile): string[] => {
  const tips: string[] = [];

  if (!profile.bio || profile.bio.trim() === '') {
    tips.push('Add a compelling bio to introduce yourself');
  }
  if (!profile.location || profile.location.trim() === '') {
    tips.push('Add your location');
  }
  if (!profile.hourly_rate) {
    tips.push('Set your hourly rate');
  }
  if (!profile.experience_years) {
    tips.push('Add your years of experience');
  }
  if (!profile.portfolio_url || profile.portfolio_url.trim() === '') {
    tips.push('Add your portfolio URL');
  }
  if (!profile.skills || profile.skills.length === 0) {
    tips.push('Add your skills');
  }
  if (!profile.languages || profile.languages.length === 0) {
    tips.push('Add languages you speak');
  }
  if (!profile.certifications || profile.certifications.length === 0) {
    tips.push('Add your certifications');
  }

  return tips;
};
