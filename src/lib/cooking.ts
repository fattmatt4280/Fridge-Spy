// Shared constants for cooking preferences (client-safe).

export const CUISINE_OPTIONS = [
  "Italian", "Mexican", "Thai", "Indian", "Mediterranean", "Japanese",
  "American comfort", "BBQ", "Middle Eastern", "Chinese", "French",
  "Korean", "Vietnamese", "Spanish", "Greek", "Caribbean",
] as const;

export const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Pescatarian", "Gluten-free", "Dairy-free",
  "Nut-free", "Halal", "Kosher", "Low-carb",
] as const;

export const SKILL_LEVELS = ["beginner", "comfortable", "advanced"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const COOK_TIME_OPTIONS = [15, 30, 45, 60] as const;
