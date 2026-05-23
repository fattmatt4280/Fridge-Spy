export const FREE_ITEM_CAP = 25;
export const FREE_RECIPE_PER_DAY = 3;
export const PREMIUM_HOUSEHOLD_MAX = 5;

export const PREMIUM_FEATURES = [
  "Unlimited inventory items",
  "Unlimited recipe generation",
  "Receipt scanning with AI",
  "Fridge photo scanning",
  "Household sharing (up to 5)",
  "Weekly waste report",
  "Priority expiry alerts",
] as const;

export type LimitReason =
  | "item-cap"
  | "recipe-daily"
  | "fridge-scan"
  | "receipt-scan"
  | "household";

export const REASON_COPY: Record<LimitReason, { title: string; sub: string }> = {
  "item-cap": {
    title: "You've hit the free 25-item limit",
    sub: "Upgrade to track unlimited groceries across your whole kitchen.",
  },
  "recipe-daily": {
    title: "You've used your 3 free recipes today",
    sub: "Pro unlocks unlimited Tonight's Cook generations.",
  },
  "fridge-scan": {
    title: "Fridge Scan is a Pro feature",
    sub: "Snap a single photo and let FridgeSpy log everything inside.",
  },
  "receipt-scan": {
    title: "Receipt Scan is a Pro feature",
    sub: "Add 20+ items from a single receipt photo in seconds.",
  },
  household: {
    title: "Household sharing is a Pro feature",
    sub: "Share one inventory with up to 5 housemates in real time.",
  },
};
