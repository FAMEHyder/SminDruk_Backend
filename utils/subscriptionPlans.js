const UNLIMITED = 999999;

const MANAGEMENT_PLANS = {
  free: {
    name: "Free",
    monthlyPrice: 0,
    limits: { socialAccounts: 3, postsPerMonth: 30, teamMembers: 1, storageGB: 1 },
    platformPostLimits: { facebook: 30, instagram: 30, linkedin: 0, x: 0, tiktok: 0, youtube: 0, pinterest: 0 },
  },
  basic: {
    name: "Basic",
    monthlyPrice: 3,
    limits: { socialAccounts: UNLIMITED, postsPerMonth: 580, teamMembers: 1, storageGB: 25 },
    platformPostLimits: { facebook: 200, instagram: 200, linkedin: 150, x: 30, tiktok: 0, youtube: 0, pinterest: 0 },
  },
  standard: {
    name: "Standard",
    monthlyPrice: 7,
    limits: { socialAccounts: UNLIMITED, postsPerMonth: 1750, teamMembers: 3, storageGB: 100 },
    platformPostLimits: { facebook: 500, instagram: 500, linkedin: 400, x: 150, tiktok: 100, youtube: 100, pinterest: 100 },
  },
  premium: {
    name: "Premium",
    monthlyPrice: 15,
    limits: { socialAccounts: UNLIMITED, postsPerMonth: 5000, teamMembers: 10, storageGB: 500 },
    platformPostLimits: { facebook: 1500, instagram: 1500, linkedin: 1000, x: 500, tiktok: 500, youtube: 500, pinterest: 500 },
  },
};

const LEGACY_PLAN_ALIASES = {
  starter: "basic",
  professional: "standard",
  agency: "premium",
  enterprise: "premium",
};

const getPlan = (plan) => MANAGEMENT_PLANS[plan] || MANAGEMENT_PLANS[LEGACY_PLAN_ALIASES[plan]] || MANAGEMENT_PLANS.free;

export { MANAGEMENT_PLANS, UNLIMITED, getPlan };
